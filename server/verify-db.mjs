/*
    verify-db.mjs

    Simple database test.

    This verifies that every table CampusFlow
    expects was actually created.
*/


import {
    getDatabase,
    getDatabasePath,
    closeDatabase
}
from "./database.mjs";



/* ================================================= */
/* TABLES CAMPUSFLOW EXPECTS */
/* ================================================= */

const expectedTables = [

    "courses",

    "events",

    "grades",

    "materials",

    "meetings",

    "notes",

    "study_sessions",

    "tasks",

    "users"

];



const database =
    getDatabase();



/* ================================================= */
/* READ ACTUAL TABLES */
/* ================================================= */

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



const actualTables =
    rows.map(
        row =>
            row.name
    );



/* ================================================= */
/* CHECK FOR MISSING TABLES */
/* ================================================= */

const missingTables =
    expectedTables.filter(
        table =>
            !actualTables.includes(
                table
            )
    );



console.log(
    `\nChecking database: ${getDatabasePath()}\n`
);



if (
    missingTables.length > 0
) {

    console.error(
        "Database verification FAILED."
    );


    console.error(
        `Missing tables: ${missingTables.join(", ")}`
    );


    closeDatabase();


    process.exit(
        1
    );

}



/* ================================================= */
/* CHECK FOREIGN KEYS */
/* ================================================= */

const foreignKeys =
    database.prepare(
        "PRAGMA foreign_keys"
    ).get();



console.log(
    `Foreign keys: ${
        foreignKeys.foreign_keys === 1
            ? "ON"
            : "OFF"
    }`
);


console.log(
    `Tables found: ${actualTables.join(", ")}`
);


console.log(
    "\nDatabase verification passed.\n"
);



closeDatabase();