/*
    server.mjs

    CampusFlow public web server.

    Sprint 3 - ACFT-22

    This server:

    - Hosts the CampusFlow website
    - Serves login/signup pages
    - Serves JavaScript and CSS
    - Connects to the SQLite database
    - Provides API health checks
    - Works locally and on Railway
*/


import express
from "express";


import path
from "node:path";


import {
    fileURLToPath
}
from "node:url";


import {
    existsSync
}
from "node:fs";


import {
    getDatabase,
    closeDatabase
}
from "./database.mjs";



/* ================================================= */
/* FILE PATHS */
/* ================================================= */

const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


/*
    server.mjs lives inside:

    CampusFlow/server/

    So going up one folder gives us the main
    CampusFlow project directory.
*/

const PROJECT_ROOT =
    path.resolve(
        __dirname,
        ".."
    );



/* ================================================= */
/* EXPRESS APPLICATION */
/* ================================================= */

const app =
    express();


/*
    Railway automatically supplies PORT.

    When running locally, CampusFlow uses port 3000.
*/

const PORT =
    Number(
        process.env.PORT
    ) || 3000;


const HOST =
    "0.0.0.0";



/* ================================================= */
/* DATABASE */
/* ================================================= */

/*
    Importing database.mjs automatically opens the
    SQLite database and creates any missing tables.
*/

const database =
    getDatabase();



/* ================================================= */
/* EXPRESS SETTINGS */
/* ================================================= */

/*
    Hide the default Express identification header.
*/

app.disable(
    "x-powered-by"
);


/*
    Allow JSON request bodies for future API routes.
*/

app.use(
    express.json({
        limit: "1mb"
    })
);


/*
    Allow traditional HTML form bodies.
*/

app.use(
    express.urlencoded({
        extended: false
    })
);



/* ================================================= */
/* BASIC SECURITY HEADERS */
/* ================================================= */

app.use(
    (
        request,
        response,
        next
    ) => {

        response.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );


        response.setHeader(
            "X-Frame-Options",
            "SAMEORIGIN"
        );


        response.setHeader(
            "Referrer-Policy",
            "strict-origin-when-cross-origin"
        );


        next();

    }
);



/* ================================================= */
/* API HEALTH CHECK */
/* ================================================= */

/*
    Visiting:

    /api/health

    proves the public Node server is running.
*/

app.get(
    "/api/health",

    (
        request,
        response
    ) => {

        response.json({

            status:
                "ok",

            application:
                "CampusFlow",

            server:
                "online",

            time:
                new Date()
                    .toISOString()

        });

    }
);



/* ================================================= */
/* DATABASE HEALTH CHECK */
/* ================================================= */

/*
    Visiting:

    /api/database

    proves the server can communicate with SQLite.
*/

app.get(
    "/api/database",

    (
        request,
        response
    ) => {

        try {

            const rows =
                database.prepare(`

                    SELECT name

                    FROM sqlite_master

                    WHERE
                        type = 'table'
                        AND
                        name NOT LIKE 'sqlite_%'

                    ORDER BY name

                `).all();


            response.json({

                status:
                    "connected",

                database:
                    "SQLite",

                tables:
                    rows.map(
                        row =>
                            row.name
                    ),

                tableCount:
                    rows.length

            });

        }

        catch (error) {

            console.error(
                "Database health check failed:",
                error
            );


            response.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Database connection failed."

            });

        }

    }
);



/* ================================================= */
/* STATIC CSS */
/* ================================================= */

app.use(

    "/css",

    express.static(
        path.join(
            PROJECT_ROOT,
            "css"
        ),
        {
            dotfiles:
                "deny"
        }
    )

);



/* ================================================= */
/* STATIC JAVASCRIPT */
/* ================================================= */

app.use(

    "/js",

    express.static(
        path.join(
            PROJECT_ROOT,
            "js"
        ),
        {
            dotfiles:
                "deny"
        }
    )

);



/* ================================================= */
/* OPTIONAL ASSET DIRECTORIES */
/* ================================================= */

/*
    If you later create an assets/ or images/
    directory, the server automatically exposes it.
*/

const optionalDirectories = [

    "assets",

    "images"

];


optionalDirectories.forEach(
    directoryName => {

        const directory =
            path.join(
                PROJECT_ROOT,
                directoryName
            );


        if (
            existsSync(
                directory
            )
        ) {

            app.use(

                `/${directoryName}`,

                express.static(
                    directory,
                    {
                        dotfiles:
                            "deny"
                    }
                )

            );

        }

    }
);



/* ================================================= */
/* MAIN WEBSITE */
/* ================================================= */

app.get(
    [
        "/",
        "/index.html"
    ],

    (
        request,
        response
    ) => {

        response.sendFile(
            path.join(
                PROJECT_ROOT,
                "index.html"
            )
        );

    }
);



/* ================================================= */
/* LOGIN PAGE */
/* ================================================= */

app.get(
    [
        "/login",
        "/login.html"
    ],

    (
        request,
        response
    ) => {

        response.sendFile(
            path.join(
                PROJECT_ROOT,
                "login.html"
            )
        );

    }
);



/* ================================================= */
/* SIGNUP PAGE */
/* ================================================= */

app.get(
    [
        "/signup",
        "/signup.html"
    ],

    (
        request,
        response
    ) => {

        response.sendFile(
            path.join(
                PROJECT_ROOT,
                "signup.html"
            )
        );

    }
);



/* ================================================= */
/* API INFORMATION */
/* ================================================= */

app.get(
    "/api",

    (
        request,
        response
    ) => {

        response.json({

            application:
                "CampusFlow",

            version:
                "Sprint 3",

            endpoints: [

                "/api/health",

                "/api/database"

            ]

        });

    }
);



/* ================================================= */
/* 404 PAGE */
/* ================================================= */

app.use(
    (
        request,
        response
    ) => {

        response
            .status(
                404
            )
            .send(`

                <!DOCTYPE html>

                <html lang="en">

                <head>

                    <meta charset="UTF-8">

                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    >

                    <title>
                        CampusFlow - Page Not Found
                    </title>

                </head>

                <body
                    style="
                        font-family: Arial, sans-serif;
                        padding: 40px;
                    "
                >

                    <h1>
                        CampusFlow
                    </h1>

                    <h2>
                        Page Not Found
                    </h2>

                    <p>
                        The requested page does not exist.
                    </p>

                    <a href="/">
                        Return to CampusFlow
                    </a>

                </body>

                </html>

            `);

    }
);



/* ================================================= */
/* START SERVER */
/* ================================================= */

const server =
    app.listen(
        PORT,
        HOST,
        () => {

            console.log(
                "\nCampusFlow server is running."
            );


            console.log(
                `Local address: http://localhost:${PORT}`
            );


            console.log(
                `Health check: http://localhost:${PORT}/api/health`
            );


            console.log(
                `Database check: http://localhost:${PORT}/api/database\n`
            );

        }
    );



/* ================================================= */
/* GRACEFUL SHUTDOWN */
/* ================================================= */

function shutdown(
    signal
) {

    console.log(
        `\n${signal} received. Closing CampusFlow...`
    );


    server.close(
        () => {

            try {

                closeDatabase();

            }

            catch (error) {

                console.error(
                    "Database shutdown error:",
                    error
                );

            }


            process.exit(
                0
            );

        }
    );

}



process.on(
    "SIGTERM",
    () =>
        shutdown(
            "SIGTERM"
        )
);


process.on(
    "SIGINT",
    () =>
        shutdown(
            "SIGINT"
        )
);