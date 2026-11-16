/*
    bulk-materials.js

    Bulk course-material uploads.

    Cloud mode:
    - private Supabase Storage through server-signed URLs
    - files follow the account across devices

    Local fallback:
    - IndexedDB keeps the existing offline/browser behavior
*/

import {
    getCourses
}
from "./state.js";


import {
    getCurrentAccountId
}
from "./account-storage.js";


import {
    showMessage
}
from "./ui.js";


const LOCAL_DB_NAME =
    "campusflow-bulk-materials-v1";


const LOCAL_STORE =
    "files";


const MAX_FILES =
    20;


const MAX_FILE_SIZE =
    20 * 1024 * 1024;


const MAX_TOTAL_SIZE =
    75 * 1024 * 1024;


let pendingFiles =
    [];


let setupDone =
    false;


let cloudFileMode =
    false;



function makeId() {

    if (
        crypto.randomUUID
    ) {

        return (
            "bulk-" +
            crypto.randomUUID()
        );

    }


    return (
        "bulk-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2)
    );

}



function formatBytes(
    bytes
) {

    if (!bytes) {

        return "0 KB";

    }


    if (
        bytes <
        1024 * 1024
    ) {

        return (
            (
                bytes /
                1024
            )
                .toFixed(1) +
            " KB"
        );

    }


    return (
        (
            bytes /
            (
                1024 *
                1024
            )
        )
            .toFixed(1) +
        " MB"
    );

}



async function jsonApi(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                credentials:
                    "same-origin",

                ...options,

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );


    let body =
        {};


    try {

        body =
            await response.json();

    }

    catch {

        body =
            {};

    }


    return {
        response,
        body
    };

}



async function detectCloudFileMode() {

    try {

        const result =
            await jsonApi(
                "/api/cloud/status"
            );


        cloudFileMode =
            result.response.ok &&
            result.body.configured &&
            result.body.fileStorageConfigured;

    }

    catch {

        cloudFileMode =
            false;

    }

}



/* ================================================= */
/* LOCAL INDEXEDDB FALLBACK */
/* ================================================= */

function openLocalDb() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const request =
                indexedDB.open(
                    LOCAL_DB_NAME,
                    1
                );


            request.onupgradeneeded =
                () => {

                    const db =
                        request.result;


                    if (
                        db.objectStoreNames
                            .contains(
                                LOCAL_STORE
                            )
                    ) {

                        return;

                    }


                    const store =
                        db.createObjectStore(
                            LOCAL_STORE,
                            {
                                keyPath:
                                    "id"
                            }
                        );


                    store.createIndex(
                        "ownerCourse",
                        [
                            "ownerId",
                            "courseId"
                        ],
                        {
                            unique:
                                false
                        }
                    );

                };


            request.onsuccess =
                () =>
                    resolve(
                        request.result
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }
    );

}



async function localSaveRecords(
    records
) {

    const db =
        await openLocalDb();


    return new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    LOCAL_STORE,
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    LOCAL_STORE
                );


            records.forEach(
                record => {

                    store.put(
                        record
                    );

                }
            );


            transaction.oncomplete =
                () => {

                    db.close();


                    resolve();

                };


            transaction.onerror =
                () => {

                    const error =
                        transaction.error;


                    db.close();


                    reject(
                        error
                    );

                };

        }
    );

}



async function localFilesFor(
    ownerId,
    courseId
) {

    const db =
        await openLocalDb();


    return new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    LOCAL_STORE,
                    "readonly"
                );


            const index =
                transaction
                    .objectStore(
                        LOCAL_STORE
                    )
                    .index(
                        "ownerCourse"
                    );


            const request =
                index.getAll(
                    IDBKeyRange.only([
                        ownerId,
                        courseId
                    ])
                );


            request.onsuccess =
                () => {

                    const rows =
                        request.result ||
                        [];


                    rows.sort(
                        (
                            first,
                            second
                        ) =>
                            second.uploadedAt -
                            first.uploadedAt
                    );


                    db.close();


                    resolve(
                        rows
                    );

                };


            request.onerror =
                () => {

                    const error =
                        request.error;


                    db.close();


                    reject(
                        error
                    );

                };

        }
    );

}



async function localGetRecord(
    id
) {

    const db =
        await openLocalDb();


    return new Promise(
        (
            resolve,
            reject
        ) => {

            const request =
                db
                    .transaction(
                        LOCAL_STORE,
                        "readonly"
                    )
                    .objectStore(
                        LOCAL_STORE
                    )
                    .get(
                        id
                    );


            request.onsuccess =
                () => {

                    db.close();


                    resolve(
                        request.result ||
                        null
                    );

                };


            request.onerror =
                () => {

                    const error =
                        request.error;


                    db.close();


                    reject(
                        error
                    );

                };

        }
    );

}



async function localDeleteRecord(
    id
) {

    const db =
        await openLocalDb();


    return new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    LOCAL_STORE,
                    "readwrite"
                );


            transaction
                .objectStore(
                    LOCAL_STORE
                )
                .delete(
                    id
                );


            transaction.oncomplete =
                () => {

                    db.close();


                    resolve();

                };


            transaction.onerror =
                () => {

                    const error =
                        transaction.error;


                    db.close();


                    reject(
                        error
                    );

                };

        }
    );

}



/* ================================================= */
/* UI */
/* ================================================= */

function activeCourseId() {

    return (
        document.getElementById(
            "courseHubCourseSelect"
        )?.value ||
        getCourses()[0]?.id ||
        ""
    );

}



function addStyles() {

    if (
        document.getElementById(
            "bulkUploadStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "bulkUploadStyles";


    style.textContent =
        `
            .bulk-list {
                display: grid;
                gap: 10px;
            }

            .bulk-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: #f9fafb;
            }

            .bulk-meta {
                margin-top: 4px;
                color: var(--muted);
                font-size: 12px;
            }

            .bulk-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 7px;
            }

            .bulk-action {
                padding: 7px 10px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: white;
            }

            .bulk-delete {
                border-color: #fecaca;
                color: var(--danger);
            }

            .bulk-picker {
                padding: 18px;
                border: 2px dashed #93c5fd;
                border-radius: 10px;
                background: #eff6ff;
                text-align: center;
            }

            .bulk-cloud-label {
                display: inline-block;
                margin-left: 8px;
                color: var(--success);
                font-size: 11px;
                font-weight: 700;
            }

            @media (max-width: 620px) {
                .bulk-row {
                    align-items: flex-start;
                    flex-direction: column;
                }
            }
        `;


    document.head.appendChild(
        style
    );

}



function injectUi() {

    const hub =
        document.getElementById(
            "courseHub"
        );


    if (!hub) {

        return false;

    }


    const actions =
        hub.querySelector(
            ".course-hub-actions"
        );


    if (
        actions &&
        !document.getElementById(
            "openBulkUploadButton"
        )
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.id =
            "openBulkUploadButton";


        button.type =
            "button";


        button.className =
            "secondary-button";


        button.textContent =
            "Bulk Upload Files";


        actions.appendChild(
            button
        );

    }


    const materialPanel =
        document
            .getElementById(
                "courseMaterialList"
            )
            ?.closest(
                ".panel"
            );


    if (
        materialPanel &&
        !document.getElementById(
            "bulkFilePanel"
        )
    ) {

        const panel =
            document.createElement(
                "div"
            );


        panel.id =
            "bulkFilePanel";


        panel.className =
            "panel";


        panel.innerHTML =
            `
                <div class="panel-header">
                    <div>
                        <h2>
                            Uploaded Files
                            <span
                                id="bulkStorageLabel"
                                class="bulk-cloud-label"
                            ></span>
                        </h2>

                        <p class="panel-subtitle">
                            Bulk-uploaded files for the selected course.
                        </p>
                    </div>

                    <span
                        id="bulkFileCount"
                        class="panel-subtitle"
                    >
                        0 files
                    </span>
                </div>

                <div
                    id="bulkFileList"
                    class="bulk-list"
                ></div>
            `;


        materialPanel
            .insertAdjacentElement(
                "afterend",
                panel
            );

    }


    if (
        !document.getElementById(
            "bulkUploadModal"
        )
    ) {

        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "bulkUploadModal";


        modal.className =
            "modal-overlay";


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        modal.innerHTML =
            `
                <div class="modal">

                    <div class="modal-header">

                        <div>
                            <h2>
                                Bulk Upload Course Materials
                            </h2>

                            <p>
                                Select multiple files for one course.
                            </p>
                        </div>

                        <button
                            type="button"
                            class="close-button"
                            id="closeBulkUploadButton"
                        >
                            ×
                        </button>

                    </div>


                    <form id="bulkUploadForm">

                        <div class="form-group">

                            <label for="bulkUploadCourse">
                                Course
                            </label>

                            <select
                                id="bulkUploadCourse"
                                required
                            ></select>

                        </div>


                        <div class="bulk-picker">

                            <input
                                id="bulkFileInput"
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,.png,.jpg,.jpeg,.webp,.gif,.zip"
                            >

                            <p
                                class="panel-subtitle"
                                style="margin-top: 8px"
                            >
                                Up to 20 files, 20 MB each,
                                75 MB total per batch.
                            </p>

                        </div>


                        <div
                            id="bulkPendingList"
                            class="bulk-list"
                            style="margin-top: 16px"
                        ></div>


                        <div class="modal-actions">

                            <button
                                type="button"
                                class="secondary-button"
                                id="cancelBulkUploadButton"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="primary-button"
                                id="saveBulkUploadButton"
                            >
                                Upload All
                            </button>

                        </div>

                    </form>

                </div>
            `;


        document.body.appendChild(
            modal
        );

    }


    return true;

}



function populateCourses() {

    const select =
        document.getElementById(
            "bulkUploadCourse"
        );


    if (!select) {

        return;

    }


    const courses =
        getCourses();


    const current =
        activeCourseId();


    select.replaceChildren();


    courses.forEach(
        course => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                course.id;


            option.textContent =
                `${course.code} - ${course.name}`;


            select.appendChild(
                option
            );

        }
    );


    if (
        courses.some(
            course =>
                course.id ===
                current
        )
    ) {

        select.value =
            current;

    }

}



function renderPending() {

    const list =
        document.getElementById(
            "bulkPendingList"
        );


    const save =
        document.getElementById(
            "saveBulkUploadButton"
        );


    if (!list) {

        return;

    }


    list.replaceChildren();


    if (
        pendingFiles.length ===
        0
    ) {

        const message =
            document.createElement(
                "p"
            );


        message.className =
            "empty-message";


        message.textContent =
            "No files selected yet.";


        list.appendChild(
            message
        );


        if (save) {

            save.disabled =
                true;

        }


        return;

    }


    if (save) {

        save.disabled =
            false;

    }


    pendingFiles.forEach(
        (
            file,
            index
        ) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "bulk-row";


            const info =
                document.createElement(
                    "div"
                );


            const name =
                document.createElement(
                    "strong"
                );


            name.textContent =
                file.name;


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "bulk-meta";


            meta.textContent =
                formatBytes(
                    file.size
                );


            info.append(
                name,
                meta
            );


            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.className =
                "bulk-action bulk-delete";


            remove.dataset.index =
                String(
                    index
                );


            remove.textContent =
                "Remove";


            row.append(
                info,
                remove
            );


            list.appendChild(
                row
            );

        }
    );

}



function openModal() {

    if (
        getCourses().length ===
        0
    ) {

        showMessage(
            "Create a course before uploading materials.",
            "warning"
        );


        return;

    }


    populateCourses();


    pendingFiles =
        [];


    renderPending();


    const input =
        document.getElementById(
            "bulkFileInput"
        );


    if (input) {

        input.value =
            "";

    }


    const modal =
        document.getElementById(
            "bulkUploadModal"
        );


    modal?.classList.add(
        "show"
    );


    modal?.setAttribute(
        "aria-hidden",
        "false"
    );

}



function closeModal() {

    const modal =
        document.getElementById(
            "bulkUploadModal"
        );


    modal?.classList.remove(
        "show"
    );


    modal?.setAttribute(
        "aria-hidden",
        "true"
    );


    pendingFiles =
        [];

}



/* ================================================= */
/* CLOUD FILE OPERATIONS */
/* ================================================= */

async function cloudListFiles(
    courseId
) {

    const result =
        await jsonApi(
            "/api/cloud/files?courseId=" +
            encodeURIComponent(
                courseId
            )
        );


    if (!result.response.ok) {

        throw new Error(
            result.body.message ||
            "Unable to load cloud files."
        );

    }


    return result.body.files ||
        [];

}



async function cloudUploadFile(
    courseId,
    file
) {

    const prepared =
        await jsonApi(
            "/api/cloud/files/upload-url",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        courseId,

                        fileName:
                            file.name,

                        mimeType:
                            file.type ||
                            "application/octet-stream",

                        fileSize:
                            file.size
                    })
            }
        );


    if (
        !prepared.response.ok
    ) {

        throw new Error(
            prepared.body.message ||
            "Unable to prepare file upload."
        );

    }


    /*
        Supabase signed uploads use multipart FormData
        even though the signed endpoint itself is a PUT.
        Do not set Content-Type manually because the
        browser must add the multipart boundary.
    */

    const formData =
        new FormData();


    formData.append(
        "cacheControl",
        "3600"
    );


    formData.append(
        "",
        file
    );


    const uploadResponse =
        await fetch(
            prepared.body.signedUrl,
            {
                method:
                    "PUT",

                headers: {
                    "x-upsert":
                        "false"
                },

                body:
                    formData
            }
        );


    if (
        !uploadResponse.ok
    ) {

        throw new Error(
            `Upload failed for ${file.name}.`
        );

    }


    const confirmed =
        await jsonApi(
            "/api/cloud/files/confirm",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        id:
                            prepared.body.id,

                        path:
                            prepared.body.path,

                        courseId,

                        fileName:
                            file.name,

                        mimeType:
                            file.type ||
                            "application/octet-stream",

                        fileSize:
                            file.size
                    })
            }
        );


    if (
        !confirmed.response.ok
    ) {

        throw new Error(
            confirmed.body.message ||
            `Unable to register ${file.name} in CampusFlow.`
        );

    }

}


async function cloudOpenFile(
    id,
    download
) {

    const result =
        await jsonApi(
            "/api/cloud/files/" +
            encodeURIComponent(
                id
            ) +
            "/url?download=" +
            (
                download
                    ? "1"
                    : "0"
            )
        );


    if (
        !result.response.ok ||
        !result.body.signedUrl
    ) {

        throw new Error(
            result.body.message ||
            "Unable to open that file."
        );

    }


    if (download) {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            result.body.signedUrl;


        link.download =
            result.body.file?.file_name ||
            "";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

    }

    else {

        window.open(
            result.body.signedUrl,
            "_blank",
            "noopener,noreferrer"
        );

    }

}



async function cloudDeleteFile(
    id
) {

    const result =
        await jsonApi(
            "/api/cloud/files/" +
            encodeURIComponent(
                id
            ),
            {
                method:
                    "DELETE"
            }
        );


    if (!result.response.ok) {

        throw new Error(
            result.body.message ||
            "Unable to delete that file."
        );

    }

}




async function migrateLocalFilesToCloud() {

    if (!cloudFileMode) {

        return;

    }


    const ownerId =
        getCurrentAccountId();


    if (!ownerId) {

        return;

    }


    for (
        const course of
        getCourses()
    ) {

        let localRecords;


        try {

            localRecords =
                await localFilesFor(
                    ownerId,
                    course.id
                );

        }

        catch {

            continue;

        }


        if (
            localRecords.length ===
            0
        ) {

            continue;

        }


        let cloudRecords =
            [];


        try {

            cloudRecords =
                await cloudListFiles(
                    course.id
                );

        }

        catch {

            continue;

        }


        const existing =
            new Set(
                cloudRecords.map(
                    record =>
                        `${record.file_name}::${record.file_size}`
                )
            );


        for (
            const record of
            localRecords
        ) {

            const key =
                `${record.name}::${record.size}`;


            if (
                existing.has(
                    key
                )
            ) {

                await localDeleteRecord(
                    record.id
                );


                continue;

            }


            try {

                const file =
                    new File(
                        [
                            record.blob
                        ],
                        record.name,
                        {
                            type:
                                record.type ||
                                record.blob?.type ||
                                "application/octet-stream"
                        }
                    );


                await cloudUploadFile(
                    course.id,
                    file
                );


                await localDeleteRecord(
                    record.id
                );


                existing.add(
                    key
                );

            }

            catch (error) {

                console.error(
                    "Existing local file could not be migrated:",
                    record.name,
                    error
                );

            }

        }

    }

}


/* ================================================= */
/* RENDER */
/* ================================================= */

export async function renderBulkMaterials() {

    addStyles();


    if (
        !injectUi()
    ) {

        return;

    }


    const list =
        document.getElementById(
            "bulkFileList"
        );


    const count =
        document.getElementById(
            "bulkFileCount"
        );


    const label =
        document.getElementById(
            "bulkStorageLabel"
        );


    if (
        !list ||
        !count
    ) {

        return;

    }


    list.replaceChildren();


    if (label) {

        label.textContent =
            cloudFileMode
                ? "CLOUD"
                : "THIS DEVICE";

    }


    const ownerId =
        getCurrentAccountId();


    const courseId =
        activeCourseId();


    if (
        !ownerId ||
        !courseId
    ) {

        count.textContent =
            "0 files";


        return;

    }


    let records;


    try {

        records =
            cloudFileMode
                ? await cloudListFiles(
                    courseId
                )
                : await localFilesFor(
                    ownerId,
                    courseId
                );

    }

    catch (error) {

        console.error(
            "Unable to load uploaded files:",
            error
        );


        const message =
            document.createElement(
                "p"
            );


        message.className =
            "empty-message";


        message.textContent =
            "Uploaded files could not be loaded.";


        list.appendChild(
            message
        );


        return;

    }


    count.textContent =
        `${records.length} file${records.length === 1 ? "" : "s"}`;


    if (
        records.length ===
        0
    ) {

        const message =
            document.createElement(
                "p"
            );


        message.className =
            "empty-message";


        message.textContent =
            "No uploaded files for this course yet.";


        list.appendChild(
            message
        );


        return;

    }


    records.forEach(
        record => {

            const id =
                record.id;


            const name =
                record.file_name ||
                record.name;


            const size =
                Number(
                    record.file_size ??
                    record.size ??
                    0
                );


            const created =
                record.created_at
                    ? new Date(
                        record.created_at
                    )
                    : new Date(
                        record.uploadedAt
                    );


            const row =
                document.createElement(
                    "article"
                );


            row.className =
                "bulk-row";


            row.dataset.fileId =
                id;


            const info =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                name;


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "bulk-meta";


            meta.textContent =
                `${formatBytes(size)} • Uploaded ${created.toLocaleDateString()}`;


            info.append(
                title,
                meta
            );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "bulk-actions";


            [
                [
                    "open",
                    "Open"
                ],
                [
                    "download",
                    "Download"
                ],
                [
                    "delete",
                    "Delete"
                ]
            ].forEach(
                ([
                    action,
                    text
                ]) => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "bulk-action" +
                        (
                            action ===
                            "delete"
                                ? " bulk-delete"
                                : ""
                        );


                    button.dataset.action =
                        action;


                    button.textContent =
                        text;


                    actions.appendChild(
                        button
                    );

                }
            );


            row.append(
                info,
                actions
            );


            list.appendChild(
                row
            );

        }
    );

}



/* ================================================= */
/* SETUP */
/* ================================================= */

export async function setupBulkMaterials() {

    if (setupDone) {

        return renderBulkMaterials();

    }


    await detectCloudFileMode();


    if (
        cloudFileMode
    ) {

        await migrateLocalFilesToCloud();

    }


    addStyles();


    if (
        !injectUi()
    ) {

        return;

    }


    setupDone =
        true;


    document
        .getElementById(
            "openBulkUploadButton"
        )
        ?.addEventListener(
            "click",
            openModal
        );


    document
        .getElementById(
            "closeBulkUploadButton"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "cancelBulkUploadButton"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "bulkFileInput"
        )
        ?.addEventListener(
            "change",
            event => {

                const original =
                    Array.from(
                        event.target.files ||
                        []
                    );


                const selected =
                    original
                        .slice(
                            0,
                            MAX_FILES
                        )
                        .filter(
                            file =>
                                file.size <=
                                MAX_FILE_SIZE
                        );


                pendingFiles =
                    selected;


                renderPending();


                if (
                    selected.length !==
                    original.length
                ) {

                    showMessage(
                        "Some files were skipped because of the 20-file or 20 MB limit.",
                        "warning"
                    );

                }

            }
        );


    document
        .getElementById(
            "bulkPendingList"
        )
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-index]"
                    );


                if (!button) {

                    return;

                }


                pendingFiles.splice(
                    Number(
                        button.dataset.index
                    ),
                    1
                );


                renderPending();

            }
        );


    document
        .getElementById(
            "bulkUploadForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const ownerId =
                    getCurrentAccountId();


                const courseId =
                    document.getElementById(
                        "bulkUploadCourse"
                    )?.value ||
                    "";


                if (!ownerId) {

                    return showMessage(
                        "Log in before uploading files.",
                        "error"
                    );

                }


                if (
                    !getCourses()
                        .some(
                            course =>
                                course.id ===
                                courseId
                        )
                ) {

                    return showMessage(
                        "Choose a valid course.",
                        "error"
                    );

                }


                if (
                    pendingFiles.length ===
                    0
                ) {

                    return showMessage(
                        "Choose at least one file.",
                        "warning"
                    );

                }


                const total =
                    pendingFiles
                        .reduce(
                            (
                                sum,
                                file
                            ) =>
                                sum +
                                file.size,
                            0
                        );


                if (
                    total >
                    MAX_TOTAL_SIZE
                ) {

                    return showMessage(
                        "This batch is larger than the 75 MB total limit.",
                        "error"
                    );

                }


                const button =
                    document.getElementById(
                        "saveBulkUploadButton"
                    );


                if (button) {

                    button.disabled =
                        true;


                    button.textContent =
                        "Uploading...";

                }


                try {

                    if (
                        cloudFileMode
                    ) {

                        for (
                            const file of
                            pendingFiles
                        ) {

                            await cloudUploadFile(
                                courseId,
                                file
                            );

                        }

                    }

                    else {

                        const uploadedAt =
                            Date.now();


                        await localSaveRecords(
                            pendingFiles.map(
                                file => ({
                                    id:
                                        makeId(),

                                    ownerId,

                                    courseId,

                                    name:
                                        file.name,

                                    type:
                                        file.type ||
                                        "application/octet-stream",

                                    size:
                                        file.size,

                                    uploadedAt,

                                    blob:
                                        file
                                })
                            )
                        );

                    }


                    const totalFiles =
                        pendingFiles.length;


                    const hubSelect =
                        document.getElementById(
                            "courseHubCourseSelect"
                        );


                    if (hubSelect) {

                        hubSelect.value =
                            courseId;

                    }


                    closeModal();


                    await renderBulkMaterials();


                    showMessage(
                        `${totalFiles} file${totalFiles === 1 ? "" : "s"} uploaded.`,
                        "success"
                    );

                }

                catch (error) {

                    console.error(
                        "Bulk upload failed:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "The files could not be uploaded.",
                        "error"
                    );

                }

                finally {

                    if (button) {

                        button.disabled =
                            false;


                        button.textContent =
                            "Upload All";

                    }

                }

            }
        );


    document
        .getElementById(
            "bulkFileList"
        )
        ?.addEventListener(
            "click",
            async event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                const row =
                    button?.closest(
                        "[data-file-id]"
                    );


                if (
                    !button ||
                    !row
                ) {

                    return;

                }


                const id =
                    row.dataset.fileId;


                try {

                    if (
                        cloudFileMode
                    ) {

                        if (
                            button.dataset.action ===
                            "open"
                        ) {

                            await cloudOpenFile(
                                id,
                                false
                            );

                        }


                        if (
                            button.dataset.action ===
                            "download"
                        ) {

                            await cloudOpenFile(
                                id,
                                true
                            );

                        }


                        if (
                            button.dataset.action ===
                            "delete"
                        ) {

                            if (
                                !window.confirm(
                                    "Delete this uploaded file?"
                                )
                            ) {

                                return;

                            }


                            await cloudDeleteFile(
                                id
                            );


                            await renderBulkMaterials();


                            showMessage(
                                "Uploaded file deleted.",
                                "success"
                            );

                        }


                        return;

                    }


                    const record =
                        await localGetRecord(
                            id
                        );


                    if (
                        !record ||
                        record.ownerId !==
                            getCurrentAccountId()
                    ) {

                        return;

                    }


                    if (
                        button.dataset.action ===
                        "delete"
                    ) {

                        if (
                            !window.confirm(
                                `Delete ${record.name}?`
                            )
                        ) {

                            return;

                        }


                        await localDeleteRecord(
                            record.id
                        );


                        await renderBulkMaterials();


                        showMessage(
                            "Uploaded file deleted.",
                            "success"
                        );


                        return;

                    }


                    const url =
                        URL.createObjectURL(
                            record.blob
                        );


                    if (
                        button.dataset.action ===
                        "download"
                    ) {

                        const link =
                            document.createElement(
                                "a"
                            );


                        link.href =
                            url;


                        link.download =
                            record.name;


                        document.body.appendChild(
                            link
                        );


                        link.click();


                        link.remove();


                        window.setTimeout(
                            () =>
                                URL.revokeObjectURL(
                                    url
                                ),
                            1000
                        );

                    }

                    else {

                        window.open(
                            url,
                            "_blank",
                            "noopener,noreferrer"
                        );


                        window.setTimeout(
                            () =>
                                URL.revokeObjectURL(
                                    url
                                ),
                            60000
                        );

                    }

                }

                catch (error) {

                    console.error(
                        "Uploaded file action failed:",
                        error
                    );


                    showMessage(
                        "That file action could not be completed.",
                        "error"
                    );

                }

            }
        );


    document
        .getElementById(
            "courseHubCourseSelect"
        )
        ?.addEventListener(
            "change",
            () => {

                renderBulkMaterials()
                    .catch(
                        error =>
                            console.error(
                                error
                            )
                    );

            }
        );


    document
        .getElementById(
            "bulkUploadModal"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "bulkUploadModal"
                ) {

                    closeModal();

                }

            }
        );


    await renderBulkMaterials();

}
