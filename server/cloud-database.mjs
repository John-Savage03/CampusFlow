/*
    cloud-database.mjs

    Durable cloud storage for CampusFlow.
    PostgreSQL stores users, sessions, snapshots, and file metadata.
    Supabase Storage stores private uploaded course files.
*/

import {
    createHash,
    randomBytes,
    randomUUID,
    scrypt as scryptCallback,
    timingSafeEqual
} from "node:crypto";

import { promisify } from "node:util";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const { Pool } = pg;
const scrypt = promisify(scryptCallback);

const DATABASE_URL = process.env.DATABASE_URL || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";
const STORAGE_BUCKET =
    process.env.SUPABASE_STORAGE_BUCKET || "campusflow-materials";

let pool = null;
let storageClient = null;

export function isCloudConfigured() {
    return Boolean(DATABASE_URL);
}

export function isCloudFileStorageConfigured() {
    return Boolean(
        SUPABASE_URL &&
        SUPABASE_SECRET_KEY
    );
}

function getPool() {
    if (!pool) {
        if (!DATABASE_URL) {
            throw new Error("DATABASE_URL is not configured.");
        }

        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: DATABASE_URL.includes("localhost")
                ? false
                : { rejectUnauthorized: false },
            max: 5,
            idleTimeoutMillis: 30000
        });
    }

    return pool;
}

function getStorageClient() {
    if (!storageClient) {
        if (!isCloudFileStorageConfigured()) {
            throw new Error(
                "Supabase file storage is not configured."
            );
        }

        storageClient = createClient(
            SUPABASE_URL,
            SUPABASE_SECRET_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        );
    }

    return storageClient;
}

export async function initializeCloudDatabase() {
    if (!isCloudConfigured()) {
        console.log(
            "CampusFlow cloud database is not configured. Local mode remains available."
        );
        return false;
    }

    await getPool().query(`
        CREATE TABLE IF NOT EXISTS cloud_users (
            id BIGSERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            role TEXT NOT NULL
                CHECK (role IN ('student', 'professor')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS
            idx_cloud_users_username_lower
        ON cloud_users (LOWER(username));

        CREATE TABLE IF NOT EXISTS cloud_sessions (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL
                REFERENCES cloud_users(id)
                ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_cloud_sessions_user
        ON cloud_sessions (user_id);

        CREATE INDEX IF NOT EXISTS idx_cloud_sessions_expiry
        ON cloud_sessions (expires_at);

        CREATE TABLE IF NOT EXISTS cloud_snapshots (
            user_id BIGINT PRIMARY KEY
                REFERENCES cloud_users(id)
                ON DELETE CASCADE,
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS cloud_files (
            id TEXT PRIMARY KEY,
            user_id BIGINT NOT NULL
                REFERENCES cloud_users(id)
                ON DELETE CASCADE,
            course_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            storage_path TEXT NOT NULL UNIQUE,
            mime_type TEXT NOT NULL
                DEFAULT 'application/octet-stream',
            file_size BIGINT NOT NULL
                CHECK (file_size >= 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_cloud_files_user_course
        ON cloud_files (user_id, course_id);
    `);

    await getPool().query(
        "DELETE FROM cloud_sessions WHERE expires_at <= NOW()"
    );


    if (
        isCloudFileStorageConfigured()
    ) {

        const {
            error
        } =
            await getStorageClient()
                .storage
                .createBucket(
                    STORAGE_BUCKET,
                    {
                        public:
                            false,

                        fileSizeLimit:
                            "20MB"
                    }
                );


        if (
            error &&
            !/already exists|duplicate/i.test(
                error.message || ""
            )
        ) {

            throw error;

        }

    }


    console.log("CampusFlow cloud database connected.");
    return true;
}

function normalizeUsername(username) {
    return String(username || "")
        .trim()
        .toLowerCase();
}

async function hashPassword(password, saltHex) {
    const salt = Buffer.from(saltHex, "hex");
    const derived = await scrypt(
        String(password),
        salt,
        64
    );

    return Buffer.from(derived).toString("hex");
}

export async function createCloudUser({
    username,
    password,
    role
}) {
    const normalizedUsername =
        normalizeUsername(username);

    if (
        normalizedUsername.length < 3 ||
        normalizedUsername.length > 40
    ) {
        const error = new Error(
            "Username must be between 3 and 40 characters."
        );
        error.code = "INVALID_USERNAME";
        throw error;
    }

    if (String(password || "").length < 8) {
        const error = new Error(
            "Password must be at least 8 characters."
        );
        error.code = "INVALID_PASSWORD";
        throw error;
    }

    if (!["student", "professor"].includes(role)) {
        const error = new Error(
            "Choose a valid account role."
        );
        error.code = "INVALID_ROLE";
        throw error;
    }

    const salt = randomBytes(16).toString("hex");
    const passwordHash =
        await hashPassword(password, salt);

    try {
        const result = await getPool().query(
            `
                INSERT INTO cloud_users (
                    username,
                    password_hash,
                    password_salt,
                    role
                )
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    username,
                    role,
                    created_at
            `,
            [
                normalizedUsername,
                passwordHash,
                salt,
                role
            ]
        );

        return result.rows[0];
    } catch (error) {
        if (error?.code === "23505") {
            const duplicate = new Error(
                "That username is already taken."
            );
            duplicate.code = "USERNAME_TAKEN";
            throw duplicate;
        }

        throw error;
    }
}

export async function verifyCloudUser({
    username,
    password
}) {
    const result = await getPool().query(
        `
            SELECT
                id,
                username,
                password_hash,
                password_salt,
                role
            FROM cloud_users
            WHERE LOWER(username) = $1
            LIMIT 1
        `,
        [normalizeUsername(username)]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const user = result.rows[0];
    const attemptHash = await hashPassword(
        password,
        user.password_salt
    );

    const expected = Buffer.from(
        user.password_hash,
        "hex"
    );
    const attempted = Buffer.from(
        attemptHash,
        "hex"
    );

    if (
        expected.length !== attempted.length ||
        !timingSafeEqual(expected, attempted)
    ) {
        return null;
    }

    return {
        id: user.id,
        username: user.username,
        role: user.role
    };
}

function sessionTokenHash(token) {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}

export async function createCloudSession(userId) {
    const token =
        randomBytes(32).toString("base64url");

    const expiresAt =
        new Date(
            Date.now() +
            14 * 24 * 60 * 60 * 1000
        );

    await getPool().query(
        `
            INSERT INTO cloud_sessions (
                user_id,
                token_hash,
                expires_at
            )
            VALUES ($1, $2, $3)
        `,
        [
            userId,
            sessionTokenHash(token),
            expiresAt
        ]
    );

    return {
        token,
        expiresAt
    };
}

export async function getCloudUserFromSession(token) {
    if (!token) return null;

    const result = await getPool().query(
        `
            SELECT
                cloud_users.id,
                cloud_users.username,
                cloud_users.role
            FROM cloud_sessions
            JOIN cloud_users
                ON cloud_users.id =
                   cloud_sessions.user_id
            WHERE
                cloud_sessions.token_hash = $1
                AND cloud_sessions.expires_at > NOW()
            LIMIT 1
        `,
        [sessionTokenHash(token)]
    );

    return result.rows[0] || null;
}

export async function deleteCloudSession(token) {
    if (!token) return;

    await getPool().query(
        "DELETE FROM cloud_sessions WHERE token_hash = $1",
        [sessionTokenHash(token)]
    );
}

export async function getCloudSnapshot(userId) {
    const result = await getPool().query(
        `
            SELECT data, updated_at
            FROM cloud_snapshots
            WHERE user_id = $1
            LIMIT 1
        `,
        [userId]
    );

    if (result.rows.length === 0) {
        return {
            data: {},
            updatedAt: null
        };
    }

    return {
        data: result.rows[0].data || {},
        updatedAt: result.rows[0].updated_at
    };
}

export async function saveCloudSnapshot(
    userId,
    data
) {
    const result = await getPool().query(
        `
            INSERT INTO cloud_snapshots (
                user_id,
                data,
                updated_at
            )
            VALUES (
                $1,
                $2::jsonb,
                NOW()
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                data = EXCLUDED.data,
                updated_at = NOW()
            RETURNING updated_at
        `,
        [
            userId,
            JSON.stringify(data || {})
        ]
    );

    return result.rows[0].updated_at;
}

function safeFileName(fileName) {
    const cleaned = String(
        fileName || "file"
    )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )
        .slice(0, 120);

    return cleaned || "file";
}

export async function createCloudFileUpload({
    userId,
    courseId,
    fileName,
    mimeType,
    fileSize
}) {
    if (!isCloudFileStorageConfigured()) {
        throw new Error(
            "Cloud file storage is not configured."
        );
    }

    const numericSize = Number(fileSize);

    if (
        !Number.isFinite(numericSize) ||
        numericSize < 0 ||
        numericSize > 20 * 1024 * 1024
    ) {
        const error = new Error(
            "Files must be 20 MB or smaller."
        );
        error.code = "INVALID_FILE_SIZE";
        throw error;
    }

    const fileId = randomUUID();
    const storagePath =
        String(userId) + "/" +
        String(courseId) + "/" +
        fileId + "-" +
        safeFileName(fileName);

    const client = getStorageClient();

    const { data, error } =
        await client.storage
            .from(STORAGE_BUCKET)
            .createSignedUploadUrl(
                storagePath
            );

    if (error) throw error;

    await getPool().query(
        `
            INSERT INTO cloud_files (
                id,
                user_id,
                course_id,
                file_name,
                storage_path,
                mime_type,
                file_size
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
        `,
        [
            fileId,
            userId,
            String(courseId),
            String(fileName),
            storagePath,
            String(
                mimeType ||
                "application/octet-stream"
            ),
            numericSize
        ]
    );

    return {
        id: fileId,
        path: storagePath,
        signedUrl:
            data?.signedUrl ||
            data?.signedURL ||
            "",
        token:
            data?.token ||
            ""
    };
}

export async function listCloudFiles(
    userId,
    courseId
) {
    const result = await getPool().query(
        `
            SELECT
                id,
                course_id,
                file_name,
                mime_type,
                file_size,
                created_at
            FROM cloud_files
            WHERE
                user_id = $1
                AND course_id = $2
            ORDER BY created_at DESC
        `,
        [
            userId,
            String(courseId)
        ]
    );

    return result.rows;
}

export async function getCloudFile(
    userId,
    fileId
) {
    const result = await getPool().query(
        `
            SELECT
                id,
                course_id,
                file_name,
                storage_path,
                mime_type,
                file_size,
                created_at
            FROM cloud_files
            WHERE
                id = $1
                AND user_id = $2
            LIMIT 1
        `,
        [
            String(fileId),
            userId
        ]
    );

    return result.rows[0] || null;
}

export async function createCloudFileDownloadUrl({
    userId,
    fileId,
    download
}) {
    const file =
        await getCloudFile(
            userId,
            fileId
        );

    if (!file) return null;

    const options = download
        ? { download: file.file_name }
        : {};

    const { data, error } =
        await getStorageClient()
            .storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(
                file.storage_path,
                300,
                options
            );

    if (error) throw error;

    return {
        file,
        signedUrl:
            data?.signedUrl ||
            data?.signedURL ||
            ""
    };
}

export async function deleteCloudFile({
    userId,
    fileId
}) {
    const file =
        await getCloudFile(
            userId,
            fileId
        );

    if (!file) return false;

    if (isCloudFileStorageConfigured()) {
        const { error } =
            await getStorageClient()
                .storage
                .from(STORAGE_BUCKET)
                .remove([
                    file.storage_path
                ]);

        if (error) throw error;
    }

    await getPool().query(
        `
            DELETE FROM cloud_files
            WHERE
                id = $1
                AND user_id = $2
        `,
        [
            file.id,
            userId
        ]
    );

    return true;
}

export async function closeCloudDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
