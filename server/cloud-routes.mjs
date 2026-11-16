/*
    cloud-routes.mjs

    Cloud authentication, account sync, and
    private course-file endpoints for CampusFlow.
*/

import {
    createCloudUser,
    createCloudSession,
    getCloudUserFromSession,
    deleteCloudSession,
    verifyCloudUser,
    getCloudSnapshot,
    saveCloudSnapshot,
    createCloudFileUpload,
    listCloudFiles,
    createCloudFileDownloadUrl,
    deleteCloudFile,
    isCloudConfigured,
    isCloudFileStorageConfigured
} from "./cloud-database.mjs";


const COOKIE_NAME =
    "campusflow_session";


function readCookies(request) {

    const header =
        request.headers.cookie || "";


    return Object.fromEntries(
        header
            .split(";")
            .map(
                pair =>
                    pair.trim()
            )
            .filter(Boolean)
            .map(
                pair => {

                    const index =
                        pair.indexOf("=");


                    const key =
                        index >= 0
                            ? pair.slice(0, index)
                            : pair;


                    const value =
                        index >= 0
                            ? pair.slice(index + 1)
                            : "";


                    return [
                        decodeURIComponent(key),
                        decodeURIComponent(value)
                    ];

                }
            )
    );

}



function sessionToken(
    request
) {

    return readCookies(
        request
    )[COOKIE_NAME] || "";

}



function setSessionCookie(
    response,
    token,
    expiresAt
) {

    const secure =
        process.env.NODE_ENV ===
        "production";


    response.cookie(

        COOKIE_NAME,

        token,

        {
            httpOnly:
                true,

            secure,

            sameSite:
                "lax",

            expires:
                expiresAt,

            path:
                "/"
        }

    );

}



function clearSessionCookie(
    response
) {

    response.clearCookie(

        COOKIE_NAME,

        {
            httpOnly:
                true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite:
                "lax",

            path:
                "/"
        }

    );

}



async function requireCloudUser(
    request,
    response,
    next
) {

    if (!isCloudConfigured()) {

        response
            .status(503)
            .json({
                status:
                    "cloud-not-configured",

                message:
                    "CampusFlow cloud accounts are not configured on this server."
            });


        return;

    }


    try {

        const user =
            await getCloudUserFromSession(
                sessionToken(
                    request
                )
            );


        if (!user) {

            response
                .status(401)
                .json({
                    status:
                        "unauthorized"
                });


            return;

        }


        request.cloudUser =
            user;


        next();

    }

    catch (error) {

        console.error(
            "Cloud authentication check failed:",
            error
        );


        response
            .status(500)
            .json({
                status:
                    "error",

                message:
                    "Unable to verify the login session."
            });

    }

}



function publicUser(
    user
) {

    return {
        username:
            user.username,

        role:
            user.role
    };

}



export function registerCloudRoutes(
    app
) {

    app.get(
        "/api/cloud/status",
        (
            request,
            response
        ) => {

            response.json({
                configured:
                    isCloudConfigured(),

                fileStorageConfigured:
                    isCloudFileStorageConfigured()
            });

        }
    );


    app.post(
        "/api/auth/signup",
        async (
            request,
            response
        ) => {

            if (!isCloudConfigured()) {

                return response
                    .status(503)
                    .json({
                        status:
                            "cloud-not-configured"
                    });

            }


            try {

                const user =
                    await createCloudUser({
                        username:
                            request.body?.username,

                        password:
                            request.body?.password,

                        role:
                            request.body?.role
                    });


                const session =
                    await createCloudSession(
                        user.id
                    );


                setSessionCookie(
                    response,
                    session.token,
                    session.expiresAt
                );


                response
                    .status(201)
                    .json({
                        status:
                            "ok",

                        user:
                            publicUser(
                                user
                            )
                    });

            }

            catch (error) {

                const known =
                    [
                        "USERNAME_TAKEN",
                        "INVALID_USERNAME",
                        "INVALID_PASSWORD",
                        "INVALID_ROLE"
                    ].includes(
                        error?.code
                    );


                response
                    .status(
                        known
                            ? 400
                            : 500
                    )
                    .json({
                        status:
                            "error",

                        code:
                            error?.code ||
                            "SIGNUP_FAILED",

                        message:
                            known
                                ? error.message
                                : "Unable to create the cloud account."
                    });

            }

        }
    );


    app.post(
        "/api/auth/login",
        async (
            request,
            response
        ) => {

            if (!isCloudConfigured()) {

                return response
                    .status(503)
                    .json({
                        status:
                            "cloud-not-configured"
                    });

            }


            try {

                const user =
                    await verifyCloudUser({
                        username:
                            request.body?.username,

                        password:
                            request.body?.password
                    });


                if (!user) {

                    return response
                        .status(401)
                        .json({
                            status:
                                "invalid-login",

                            message:
                                "Wrong username or password."
                        });

                }


                const session =
                    await createCloudSession(
                        user.id
                    );


                setSessionCookie(
                    response,
                    session.token,
                    session.expiresAt
                );


                response.json({
                    status:
                        "ok",

                    user:
                        publicUser(
                            user
                        )
                });

            }

            catch (error) {

                console.error(
                    "Cloud login failed:",
                    error
                );


                response
                    .status(500)
                    .json({
                        status:
                            "error",

                        message:
                            "Unable to log in."
                    });

            }

        }
    );


    app.post(
        "/api/auth/logout",
        async (
            request,
            response
        ) => {

            try {

                await deleteCloudSession(
                    sessionToken(
                        request
                    )
                );

            }

            catch (error) {

                console.error(
                    "Cloud logout cleanup failed:",
                    error
                );

            }


            clearSessionCookie(
                response
            );


            response.json({
                status:
                    "ok"
            });

        }
    );


    app.get(
        "/api/auth/me",
        requireCloudUser,
        (
            request,
            response
        ) => {

            response.json({
                status:
                    "ok",

                user:
                    publicUser(
                        request.cloudUser
                    )
            });

        }
    );


    app.get(
        "/api/cloud/snapshot",
        requireCloudUser,
        async (
            request,
            response
        ) => {

            try {

                const snapshot =
                    await getCloudSnapshot(
                        request.cloudUser.id
                    );


                response.json({
                    status:
                        "ok",

                    data:
                        snapshot.data,

                    updatedAt:
                        snapshot.updatedAt
                });

            }

            catch (error) {

                console.error(
                    "Cloud snapshot read failed:",
                    error
                );


                response
                    .status(500)
                    .json({
                        status:
                            "error",

                        message:
                            "Unable to load cloud data."
                    });

            }

        }
    );


    app.put(
        "/api/cloud/snapshot",
        requireCloudUser,
        async (
            request,
            response
        ) => {

            try {

                const data =
                    request.body?.data;


                if (
                    !data ||
                    typeof data !==
                        "object" ||
                    Array.isArray(
                        data
                    )
                ) {

                    return response
                        .status(400)
                        .json({
                            status:
                                "error",

                            message:
                                "Cloud data must be an object."
                        });

                }


                const updatedAt =
                    await saveCloudSnapshot(
                        request.cloudUser.id,
                        data
                    );


                response.json({
                    status:
                        "ok",

                    updatedAt
                });

            }

            catch (error) {

                console.error(
                    "Cloud snapshot save failed:",
                    error
                );


                response
                    .status(500)
                    .json({
                        status:
                            "error",

                        message:
                            "Unable to save cloud data."
                    });

            }

        }
    );


    app.get(
        "/api/cloud/files",
        requireCloudUser,
        async (
            request,
            response
        ) => {

            try {

                const courseId =
                    String(
                        request.query.courseId ||
                        ""
                    );


                if (!courseId) {

                    return response
                        .status(400)
                        .json({
                            status:
                                "error",

                            message:
                                "courseId is required."
                        });

                }


                const files =
                    await listCloudFiles(
                        request.cloudUser.id,
                        courseId
                    );


                response.json({
                    status:
                        "ok",

                    files
                });

            }

            catch (error) {

                console.error(
                    "Cloud file list failed:",
                    error
                );


                response
                    .status(500)
                    .json({
                        status:
                            "error",

                        message:
                            "Unable to list cloud files."
                    });

            }

        }
    );


    app.post(
        "/api/cloud/files/upload-url",
        requireCloudUser,
        async (
            request,
            response
        ) => {

            if (
                !isCloudFileStorageConfigured()
            ) {

                return response
                    .status(503)
                    .json({
                        status:
                            "storage-not-configured"
                    });

            }


            try {

                const upload =
                    await createCloudFileUpload({
                        userId:
                            request.cloudUser.id,

                        courseId:
                            request.body?.courseId,

                        fileName:
                            request.body?.fileName,

                        mimeType:
                            request.body?.mimeType,

                        fileSize:
                            request.body?.fileSize
                    });


                response
                    .status(201)
                    .json({
                        status:
                            "ok",

                        ...upload
                    });

            }

            catch (error) {

                console.error(
                    "Cloud upload URL creation failed:",
                    error
                );


                response
                    .status(400)
                    .json({
                        status:
                            "error",

                        code:
                            error?.code ||
                            "UPLOAD_URL_FAILED",

                        message:
                            error?.message ||
                            "Unable to prepare the upload."
                    });

            }

        }
    );


    app.get(
        "/api/cloud/files/:id/url",
        requireCloudUser,
        async (
            request,
            response
        ) => {

            try {

                const result =
                    await createCloudFileDownloadUrl({
                        userId:
                            request.cloudUser.id,

                        fileId:
                            request.params.id,

                        download:
                            request.query.download ===
                            "1"
                    });


                if (!result) {

                    return response
                        .status(404)
                        .json({
                            status:
                                "not-found"
                        });

                }


                response.json({
                    status:
                        "ok",

                    file:
                        result.file,

                    signedUrl:
                        result.signedUrl
                });

            }

            catch (error) {

                console.error(
                    "Cloud file URL failed:",
                    error
                );


                response
                    .status(500)
                    .json({
                        status:
                            "error",

                        message:
                            "Unable to open that file."
                    });

            }

        }
    );


    app.delete(
        "/api/cloud/files/:id",
        requireCloudUser,
        async (
            request,
            response
        ) => {

            try {

                const deleted =
                    await deleteCloudFile({
                        userId:
                            request.cloudUser.id,

                        fileId:
                            request.params.id
                    });


                response
                    .status(
                        deleted
                            ? 200
                            : 404
                    )
                    .json({
                        status:
                            deleted
                                ? "ok"
                                : "not-found"
                    });

            }

            catch (error) {

                console.error(
                    "Cloud file delete failed:",
                    error
                );


                response
                    .status(500)
                    .json({
                        status:
                            "error",

                        message:
                            "Unable to delete that file."
                    });

            }

        }
    );

}
