/*
    cloud-routes.mjs

    CampusFlow cloud proxy.

    The privileged cloud logic runs in Supabase Edge Functions.
    Render keeps the user's custom session token in an HttpOnly
    cookie and proxies requests without storing Supabase secrets.
*/

const COOKIE_NAME =
    "campusflow_session";


const CLOUD_API_URL =
    process.env.CAMPUSFLOW_CLOUD_API_URL ||
    "https://gpjkrmokhypzjqzovmfo.supabase.co/functions/v1/campusflow-api";


function readCookies(
    request
) {

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

    return (
        readCookies(
            request
        )[COOKIE_NAME] ||
        ""
    );

}



function secureCookie(
    request
) {

    return (
        request.secure ||
        request.headers[
            "x-forwarded-proto"
        ] === "https" ||
        process.env.RENDER ===
            "true" ||
        process.env.NODE_ENV ===
            "production"
    );

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
            httpOnly:
                true,

            secure:
                secureCookie(
                    request
                ),

            sameSite:
                "lax",

            expires:
                new Date(
                    expiresAt
                ),

            path:
                "/"
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
            httpOnly:
                true,

            secure:
                secureCookie(
                    request
                ),

            sameSite:
                "lax",

            path:
                "/"
        }

    );

}



async function callCloud(
    action,
    payload = {},
    token = ""
) {

    const headers = {
        "content-type":
            "application/json"
    };


    if (token) {

        headers.authorization =
            `Bearer ${token}`;

    }


    const cloudResponse =
        await fetch(
            CLOUD_API_URL,
            {
                method:
                    "POST",

                headers,

                body:
                    JSON.stringify({
                        action,
                        ...payload
                    })
            }
        );


    let body =
        {};


    try {

        body =
            await cloudResponse.json();

    }

    catch {

        body = {
            status:
                "error",

            message:
                "Cloud service returned an invalid response."
        };

    }


    return {
        status:
            cloudResponse.status,

        ok:
            cloudResponse.ok,

        body
    };

}



function sendCloudResult(
    response,
    result
) {

    response
        .status(
            result.status
        )
        .json(
            result.body
        );

}



async function safelyCallCloud(
    response,
    work
) {

    try {

        return await work();

    }

    catch (error) {

        console.error(
            "CampusFlow cloud proxy error:",
            error
        );


        response
            .status(503)
            .json({
                status:
                    "cloud-unavailable",

                message:
                    "CampusFlow cloud service is temporarily unavailable."
            });


        return null;

    }

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
                    true,

                fileStorageConfigured:
                    true,

                backend:
                    "supabase-edge"
            });

        }
    );


    app.post(
        "/api/auth/signup",
        async (
            request,
            response
        ) => {

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
                                    request.body?.role
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
        async (
            request,
            response
        ) => {

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
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
                        await callCloud(
                            "logout",
                            {},
                            sessionToken(
                                request
                            )
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
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
                        await callCloud(
                            "me",
                            {},
                            sessionToken(
                                request
                            )
                        );


                    if (
                        result.status ===
                        401
                    ) {

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
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
                        await callCloud(
                            "getSnapshot",
                            {},
                            sessionToken(
                                request
                            )
                        );


                    sendCloudResult(
                        response,
                        result
                    );

                }
            );

        }
    );


    app.put(
        "/api/cloud/snapshot",
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
                        await callCloud(
                            "saveSnapshot",
                            {
                                data:
                                    request.body?.data
                            },
                            sessionToken(
                                request
                            )
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
        "/api/cloud/files",
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
                        await callCloud(
                            "listFiles",
                            {
                                courseId:
                                    String(
                                        request.query.courseId ||
                                        ""
                                    )
                            },
                            sessionToken(
                                request
                            )
                        );


                    sendCloudResult(
                        response,
                        result
                    );

                }
            );

        }
    );


    app.post(
        "/api/cloud/files/upload-url",
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
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
                            sessionToken(
                                request
                            )
                        );


                    sendCloudResult(
                        response,
                        result
                    );

                }
            );

        }
    );


    app.post(
        "/api/cloud/files/confirm",
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
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
                            sessionToken(
                                request
                            )
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
        "/api/cloud/files/:id/url",
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
                        await callCloud(
                            "fileUrl",
                            {
                                fileId:
                                    request.params.id,

                                download:
                                    request.query.download ===
                                    "1"
                            },
                            sessionToken(
                                request
                            )
                        );


                    sendCloudResult(
                        response,
                        result
                    );

                }
            );

        }
    );


    app.delete(
        "/api/cloud/files/:id",
        async (
            request,
            response
        ) => {

            await safelyCallCloud(
                response,
                async () => {

                    const result =
                        await callCloud(
                            "deleteFile",
                            {
                                fileId:
                                    request.params.id
                            },
                            sessionToken(
                                request
                            )
                        );


                    sendCloudResult(
                        response,
                        result
                    );

                }
            );

        }
    );

}
