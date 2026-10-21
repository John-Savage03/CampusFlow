/*
    init-db.mjs

    Creates the CampusFlow SQLite database
    and prints the tables that were created.
*/


import {
    getDatabase,
    getDatabasePath,
    closeDatabase
}
from "./database.mjs";



const database =
    getDatabase();



/* ================================================= */
/* FIND CREATED TABLES */
/* ================================================= */

const tables =
    database.prepare(`

        SELECT name

        FROM sqlite_master

        WHERE
            type = 'table'
            AND
            name NOT LIKE 'sqlite_%'

        ORDER BY name

    `).all();



/* ================================================= */
/* PRINT DATABASE INFORMATION */
/* ================================================= */

console.log(
    "\nCampusFlow database created successfully."
);


console.log(
    `Database file: ${getDatabasePath()}\n`
);


console.log(
    "Tables:"
);


for (
    const table of tables
) {

    console.log(
        ` - ${table.name}`
    );

}


console.log(
    `\nTotal application tables: ${tables.length}\n`
);



/* ================================================= */
/* CLOSE DATABASE */
/* ================================================= */

closeDatabase();