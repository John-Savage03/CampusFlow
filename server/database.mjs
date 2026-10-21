/*
    database.mjs

    Central SQLite database for CampusFlow.

    Sprint 3 - ACFT-20

    This database is designed to support:

    - User accounts
    - Courses
    - Assignments and exams
    - Calendar events
    - Grades
    - Course materials
    - Course notes
    - Study Planner
    - Office Hours / Meetings

    Future server/API code will import this file
    instead of creating separate databases.
*/


import {
    DatabaseSync
}
from "node:sqlite";


import fs
from "node:fs";


import path
from "node:path";


import {
    fileURLToPath
}
from "node:url";



/* ================================================= */
/* FILE PATH SETUP */
/* ================================================= */

/*
    ES modules do not automatically provide
    __dirname, so we create it here.
*/

const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


/*
    Store the actual database file inside:

    server/data/campusflow.db
*/

const DATA_DIRECTORY =
    path.join(
        __dirname,
        "data"
    );


const DATABASE_PATH =
    path.join(
        DATA_DIRECTORY,
        "campusflow.db"
    );



/* ================================================= */
/* CREATE DATA DIRECTORY */
/* ================================================= */

/*
    If server/data does not exist yet,
    Node will create it automatically.
*/

fs.mkdirSync(
    DATA_DIRECTORY,
    {
        recursive: true
    }
);



/* ================================================= */
/* OPEN DATABASE */
/* ================================================= */

const database =
    new DatabaseSync(
        DATABASE_PATH,
        {
            timeout: 5000
        }
    );



/* ================================================= */
/* SQLITE SETTINGS */
/* ================================================= */

/*
    Foreign keys enforce relationships between tables.

    Example:

    A grade cannot belong to a course that does
    not exist.
*/

database.exec(
    "PRAGMA foreign_keys = ON;"
);


/*
    WAL mode improves reliability when multiple
    database operations happen close together.
*/

database.exec(
    "PRAGMA journal_mode = WAL;"
);



/* ================================================= */
/* CREATE DATABASE TABLES */
/* ================================================= */

database.exec(`


/* ================================================= */
/* USERS */
/* ================================================= */

CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT
        NOT NULL
        UNIQUE
        COLLATE NOCASE,

    password_hash TEXT
        NOT NULL,

    salt TEXT
        NOT NULL,

    role TEXT
        NOT NULL
        CHECK (
            role IN (
                'student',
                'professor'
            )
        ),

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP

) STRICT;



/* ================================================= */
/* COURSES */
/* ================================================= */

CREATE TABLE IF NOT EXISTS courses (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER
        NOT NULL,

    code TEXT
        NOT NULL,

    name TEXT
        NOT NULL,

    instructor TEXT
        NOT NULL
        DEFAULT '',

    meeting_days TEXT
        NOT NULL
        DEFAULT '',

    meeting_time TEXT
        NOT NULL
        DEFAULT '',

    location TEXT
        NOT NULL
        DEFAULT '',

    credit_hours INTEGER
        CHECK (
            credit_hours IS NULL
            OR
            (
                credit_hours >= 0
                AND
                credit_hours <= 12
            )
        ),

    office_hours TEXT
        NOT NULL
        DEFAULT '',

    instructor_contact TEXT
        NOT NULL
        DEFAULT '',

    syllabus_url TEXT
        NOT NULL
        DEFAULT '',

    goals TEXT
        NOT NULL
        DEFAULT '',

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users (
        id
    )
    ON DELETE CASCADE,

    UNIQUE (
        user_id,
        code
    )

) STRICT;



/* ================================================= */
/* ASSIGNMENTS / EXAMS */
/* ================================================= */

CREATE TABLE IF NOT EXISTS tasks (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER
        NOT NULL,

    course_id INTEGER
        NOT NULL,

    type TEXT
        NOT NULL
        CHECK (
            type IN (
                'assignment',
                'exam'
            )
        ),

    title TEXT
        NOT NULL,

    due_date TEXT
        NOT NULL,

    priority TEXT
        NOT NULL
        DEFAULT 'Medium'
        CHECK (
            priority IN (
                'Low',
                'Medium',
                'High'
            )
        ),

    status TEXT
        NOT NULL
        DEFAULT 'Not Started'
        CHECK (
            status IN (
                'Not Started',
                'In Progress',
                'Completed'
            )
        ),

    description TEXT
        NOT NULL
        DEFAULT '',

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users (
        id
    )
    ON DELETE CASCADE,

    FOREIGN KEY (
        course_id
    )
    REFERENCES courses (
        id
    )
    ON DELETE CASCADE

) STRICT;



/* ================================================= */
/* CALENDAR EVENTS */
/* ================================================= */

CREATE TABLE IF NOT EXISTS events (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER
        NOT NULL,

    course_id INTEGER,

    topic TEXT
        NOT NULL,

    event_date TEXT
        NOT NULL,

    description TEXT
        NOT NULL
        DEFAULT '',

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users (
        id
    )
    ON DELETE CASCADE,

    FOREIGN KEY (
        course_id
    )
    REFERENCES courses (
        id
    )
    ON DELETE SET NULL

) STRICT;



/* ================================================= */
/* GRADES */
/* ================================================= */

CREATE TABLE IF NOT EXISTS grades (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER
        NOT NULL,

    course_id INTEGER
        NOT NULL,

    title TEXT
        NOT NULL,

    category TEXT
        NOT NULL,

    points_earned REAL
        NOT NULL
        CHECK (
            points_earned >= 0
        ),

    points_possible REAL
        NOT NULL
        CHECK (
            points_possible > 0
        ),

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users (
        id
    )
    ON DELETE CASCADE,

    FOREIGN KEY (
        course_id
    )
    REFERENCES courses (
        id
    )
    ON DELETE CASCADE

) STRICT;



/* ================================================= */
/* COURSE MATERIALS */
/* ================================================= */

/*
    This table is also designed for ACFT-9
    Bulk Course Material Upload.

    Files themselves can later be stored by the
    server while this table stores their metadata.
*/

CREATE TABLE IF NOT EXISTS materials (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER
        NOT NULL,

    course_id INTEGER
        NOT NULL,

    title TEXT
        NOT NULL,

    material_type TEXT
        NOT NULL
        DEFAULT 'Other',

    description TEXT
        NOT NULL
        DEFAULT '',

    url TEXT
        NOT NULL
        DEFAULT '',

    file_name TEXT
        NOT NULL
        DEFAULT '',

    stored_name TEXT
        NOT NULL
        DEFAULT '',

    mime_type TEXT
        NOT NULL
        DEFAULT '',

    file_size INTEGER
        CHECK (
            file_size IS NULL
            OR
            file_size >= 0
        ),

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users (
        id
    )
    ON DELETE CASCADE,

    FOREIGN KEY (
        course_id
    )
    REFERENCES courses (
        id
    )
    ON DELETE CASCADE

) STRICT;



/* ================================================= */
/* COURSE NOTES */
/* ================================================= */

CREATE TABLE IF NOT EXISTS notes (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER
        NOT NULL,

    course_id INTEGER
        NOT NULL,

    title TEXT
        NOT NULL,

    body TEXT
        NOT NULL,

    pinned INTEGER
        NOT NULL
        DEFAULT 0
        CHECK (
            pinned IN (
                0,
                1
            )
        ),

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users (
        id
    )
    ON DELETE CASCADE,

    FOREIGN KEY (
        course_id
    )
    REFERENCES courses (
        id
    )
    ON DELETE CASCADE

) STRICT;



/* ================================================= */
/* STUDY PLANNER */
/* ================================================= */

/*
    This prepares the database for:

    ACFT-4 Study Planner
*/

CREATE TABLE IF NOT EXISTS study_sessions (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER
        NOT NULL,

    course_id INTEGER,

    title TEXT
        NOT NULL,

    session_date TEXT
        NOT NULL,

    start_time TEXT
        NOT NULL
        DEFAULT '',

    duration_minutes INTEGER
        NOT NULL
        DEFAULT 60
        CHECK (
            duration_minutes > 0
        ),

    status TEXT
        NOT NULL
        DEFAULT 'Planned'
        CHECK (
            status IN (
                'Planned',
                'Completed',
                'Skipped'
            )
        ),

    notes TEXT
        NOT NULL
        DEFAULT '',

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users (
        id
    )
    ON DELETE CASCADE,

    FOREIGN KEY (
        course_id
    )
    REFERENCES courses (
        id
    )
    ON DELETE SET NULL

) STRICT;



/* ================================================= */
/* OFFICE HOURS / MEETINGS */
/* ================================================= */

/*
    This prepares the database for:

    ACFT-12 Office Hours and Meeting Scheduler
*/

CREATE TABLE IF NOT EXISTS meetings (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER
        NOT NULL,

    course_id INTEGER,

    title TEXT
        NOT NULL,

    meeting_date TEXT
        NOT NULL,

    start_time TEXT
        NOT NULL,

    end_time TEXT
        NOT NULL,

    location TEXT
        NOT NULL
        DEFAULT '',

    meeting_type TEXT
        NOT NULL
        DEFAULT 'Office Hours',

    notes TEXT
        NOT NULL
        DEFAULT '',

    created_at TEXT
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (
        user_id
    )
    REFERENCES users (
        id
    )
    ON DELETE CASCADE,

    FOREIGN KEY (
        course_id
    )
    REFERENCES courses (
        id
    )
    ON DELETE SET NULL

) STRICT;



/* ================================================= */
/* DATABASE INDEXES */
/* ================================================= */

/*
    Indexes make commonly used searches faster.
*/

CREATE INDEX IF NOT EXISTS idx_courses_user
ON courses (
    user_id
);


CREATE INDEX IF NOT EXISTS idx_tasks_user
ON tasks (
    user_id
);


CREATE INDEX IF NOT EXISTS idx_tasks_course
ON tasks (
    course_id
);


CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks (
    due_date
);


CREATE INDEX IF NOT EXISTS idx_events_user
ON events (
    user_id
);


CREATE INDEX IF NOT EXISTS idx_events_date
ON events (
    event_date
);


CREATE INDEX IF NOT EXISTS idx_grades_course
ON grades (
    course_id
);


CREATE INDEX IF NOT EXISTS idx_materials_course
ON materials (
    course_id
);


CREATE INDEX IF NOT EXISTS idx_notes_course
ON notes (
    course_id
);


CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date
ON study_sessions (
    user_id,
    session_date
);


CREATE INDEX IF NOT EXISTS idx_meetings_user_date
ON meetings (
    user_id,
    meeting_date
);


`);



/* ================================================= */
/* EXPORT DATABASE */
/* ================================================= */

export function getDatabase() {

    return database;

}



export function getDatabasePath() {

    return DATABASE_PATH;

}



export function closeDatabase() {

    database.close();

}