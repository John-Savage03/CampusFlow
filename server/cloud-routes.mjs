/*
    cloud-routes.mjs

    CampusFlow proxy for the Supabase Edge Function.
    The browser never receives the CampusFlow cloud session token.
*/

const COOKIE_NAME = "campusflow_session";

const CLOUD_API_URL =
    process.env.CAMPUSFLOW_CLOUD_API_URL ||
    "https://gpjkrmokhypzjqzovmfo.supabase.co/functions/v1/campusflow-api";


function readCookies(request) {
    const header = request.headers.cookie || "";

    return Object.fromEntries(
        header
            .split(";")
            .map(pair => pair.trim())
            .filter(Boolean)
            .map(pair => {
                const index = pair.indexOf("=");

                return [
                    decodeURIComponent(
                        index >= 0
                            ? pair.slice(0, index)
                            : pair
                    ),
                    decodeURIComponent(
                        index >= 0
                            ? pair.slice(index + 1)
                            : ""
                    )
                ];
            })
    );
}


function sessionToken(request) {
    return readCookies(request)[COOKIE_NAME] || "";
}


function secureCookie(request) {
    return (
        request.secure ||
        request.headers["x-forwarded-proto"] === "https" ||
        process.env.RENDER === "true" ||
        process.env.NODE_ENV === "production"
    );
}


function appBaseUrl(request) {
    const protocol =
        request.headers["x-forwarded-proto"] ||
        request.protocol ||
        "http";

    const host = request.get("host");

    return `${protocol}://${host}`;
}


function setSessionCookie(
    request,
    response,
    token,
    expiresAt
) {
    response.cookie(
        COOKIE_NAME,
        token,
        {
            httpOnly: true,
            secure: secureCookie(request),
            sameSite: "lax",
            expires: new Date(expiresAt),
            path: "/"
        }
    );
}


function clearSessionCookie(
    request,
    response
) {
    response.clearCookie(
        COOKIE_NAME,
        {
            httpOnly: true,
            secure: secureCookie(request),
            sameSite: "lax",
            path: "/"
        }
    );
}


async function callCloud(
    action,
    payload = {},
    token = ""
) {
    const headers = {
        "content-type": "application/json"
    };

    if (token) {
        headers.authorization =
            `Bearer ${token}`;
    }

    const cloudResponse =
        await fetch(
            CLOUD_API_URL,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    action,
                    ...payload
                })
            }
        );

    let body = {};

    try {
        body =
            await cloudResponse.json();
    } catch {
        body = {
            status: "error",
            message:
                "Cloud service returned an invalid response."
        };
    }

    return {
        status: cloudResponse.status,
        ok: cloudResponse.ok,
        body
    };
}


function sendCloudResult(
    response,
    result
) {
    response
        .status(result.status)
        .json(result.body);
}


async function safelyCallCloud(
    response,
    work
) {
    try {
        return await work();
    } catch (error) {
        console.error(
            "CampusFlow cloud proxy error:",
            error
        );

        response
            .status(503)
            .json({
                status: "cloud-unavailable",
                message:
                    "CampusFlow cloud service is temporarily unavailable."
            });

        return null;
    }
}


export function registerCloudRoutes(app) {

    app.get(
        "/api/cloud/status",
        (request, response) => {
            response.json({
                configured: true,
                fileStorageConfigured: true,
                passwordRecoveryConfigured: true,
                backend: "supabase-edge"
            });
        }
    );


    app.post(
        "/api/auth/signup",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    const result =
                        await callCloud(
                            "signup",
                            {
                                username:
                                    request.body?.username,

                                password:
                                    request.body?.password,

                                role:
                                    request.body?.role,

                                recoveryEmail:
                                    request.body?.recoveryEmail,

                                appBaseUrl:
                                    appBaseUrl(request)
                            }
                        );

                    if (
                        result.ok &&
                        result.body?.sessionToken &&
                        result.body?.expiresAt
                    ) {
                        setSessionCookie(
                            request,
                            response,
                            result.body.sessionToken,
                            result.body.expiresAt
                        );

                        delete result.body.sessionToken;
                        delete result.body.expiresAt;
                    }

                    sendCloudResult(
                        response,
                        result
                    );
                }
            );
        }
    );


    app.post(
        "/api/auth/login",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    const result =
                        await callCloud(
                            "login",
                            {
                                username:
                                    request.body?.username,

                                password:
                                    request.body?.password
                            }
                        );

                    if (
                        result.ok &&
                        result.body?.sessionToken &&
                        result.body?.expiresAt
                    ) {
                        setSessionCookie(
                            request,
                            response,
                            result.body.sessionToken,
                            result.body.expiresAt
                        );

                        delete result.body.sessionToken;
                        delete result.body.expiresAt;
                    }

                    sendCloudResult(
                        response,
                        result
                    );
                }
            );
        }
    );


    app.post(
        "/api/auth/logout",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    const result =
                        await callCloud(
                            "logout",
                            {},
                            sessionToken(request)
                        );

                    clearSessionCookie(
                        request,
                        response
                    );

                    sendCloudResult(
                        response,
                        result
                    );
                }
            );
        }
    );


    app.get(
        "/api/auth/me",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    const result =
                        await callCloud(
                            "me",
                            {},
                            sessionToken(request)
                        );

                    if (result.status === 401) {
                        clearSessionCookie(
                            request,
                            response
                        );
                    }

                    sendCloudResult(
                        response,
                        result
                    );
                }
            );
        }
    );


    app.get(
        "/api/auth/recovery-email",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "recoveryEmailStatus",
                            {},
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );


    app.post(
        "/api/auth/recovery-email",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "setRecoveryEmail",
                            {
                                email:
                                    request.body?.email,

                                appBaseUrl:
                                    appBaseUrl(request)
                            },
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );


    app.post(
        "/api/auth/verify-recovery-email",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "verifyRecoveryEmail",
                            {
                                token:
                                    request.body?.token
                            }
                        )
                    );
                }
            );
        }
    );


    app.post(
        "/api/auth/forgot-password",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "forgotPassword",
                            {
                                email:
                                    request.body?.email,

                                appBaseUrl:
                                    appBaseUrl(request)
                            }
                        )
                    );
                }
            );
        }
    );


    app.post(
        "/api/auth/reset-password",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    const result =
                        await callCloud(
                            "resetPassword",
                            {
                                token:
                                    request.body?.token,

                                password:
                                    request.body?.password
                            }
                        );

                    if (result.ok) {
                        clearSessionCookie(
                            request,
                            response
                        );
                    }

                    sendCloudResult(
                        response,
                        result
                    );
                }
            );
        }
    );


    app.get(
        "/api/cloud/snapshot",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "getSnapshot",
                            {},
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );


    app.put(
        "/api/cloud/snapshot",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "saveSnapshot",
                            {
                                data:
                                    request.body?.data
                            },
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );


    app.get(
        "/api/cloud/files",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "listFiles",
                            {
                                courseId:
                                    String(
                                        request.query.courseId ||
                                        ""
                                    )
                            },
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );


    app.post(
        "/api/cloud/files/upload-url",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "createUpload",
                            {
                                courseId:
                                    request.body?.courseId,

                                fileName:
                                    request.body?.fileName,

                                mimeType:
                                    request.body?.mimeType,

                                fileSize:
                                    request.body?.fileSize
                            },
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );


    app.post(
        "/api/cloud/files/confirm",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "confirmUpload",
                            {
                                id:
                                    request.body?.id,

                                path:
                                    request.body?.path,

                                courseId:
                                    request.body?.courseId,

                                fileName:
                                    request.body?.fileName,

                                mimeType:
                                    request.body?.mimeType,

                                fileSize:
                                    request.body?.fileSize
                            },
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );


    app.get(
        "/api/cloud/files/:id/url",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "fileUrl",
                            {
                                fileId:
                                    request.params.id,

                                download:
                                    request.query.download ===
                                    "1"
                            },
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );


    app.delete(
        "/api/cloud/files/:id",
        async (request, response) => {
            await safelyCallCloud(
                response,
                async () => {
                    sendCloudResult(
                        response,
                        await callCloud(
                            "deleteFile",
                            {
                                fileId:
                                    request.params.id
                            },
                            sessionToken(request)
                        )
                    );
                }
            );
        }
    );

}
