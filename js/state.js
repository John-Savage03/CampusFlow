/*
    state.js

    Central CampusFlow application data layer.

    Sprint 3 update:

    Academic data is now stored separately for each
    logged-in account.

    This prevents different accounts on the same
    browser from seeing one another's courses,
    assignments, events, and grades.
*/


import {
    loadData,
    saveData
}
from "./storage.js";


import {
    isValidDateString
}
from "./utils.js";


import {
    getScopedStorageKey
}
from "./account-storage.js";



/* ================================================= */
/* STORAGE KEYS */
/* ================================================= */

/*
    Role remains a normal application setting because
    auth-guard.js sets it from the logged-in account.

    Academic data uses account-specific keys.
*/

const KEYS = {

    role:
        "campusflow-v2-role",

    courses:
        getScopedStorageKey(
            "campusflow-v2-courses",
            {
                migrateLegacy: true
            }
        ),

    tasks:
        getScopedStorageKey(
            "campusflow-v2-tasks",
            {
                migrateLegacy: true
            }
        ),

    events:
        getScopedStorageKey(
            "campusflow-v2-events",
            {
                migrateLegacy: true
            }
        ),

    grades:
        getScopedStorageKey(
            "campusflow-v2-grades",
            {
                migrateLegacy: true
            }
        )

};



/* ================================================= */
/* VALID VALUES */
/* ================================================= */

export const GRADE_CATEGORIES = [
    "Homework",
    "Quiz",
    "Exam",
    "Project",
    "Lab",
    "Participation",
    "Other"
];


export const TASK_STATUSES = [
    "Not Started",
    "In Progress",
    "Completed"
];


export const TASK_PRIORITIES = [
    "Low",
    "Medium",
    "High"
];


const VALID_ROLES = [
    "student",
    "professor"
];



/* ================================================= */
/* COPY HELPER */
/* ================================================= */

function copy(
    items
) {

    return items.map(
        item => ({
            ...item
        })
    );

}



/* ================================================= */
/* DATA VALIDATION */
/* ================================================= */

function validCourse(
    course
) {

    return Boolean(

        course &&

        typeof course.id ===
            "string" &&

        typeof course.code ===
            "string" &&

        typeof course.name ===
            "string" &&

        typeof course.instructor ===
            "string" &&

        typeof course.days ===
            "string" &&

        typeof course.time ===
            "string"

    );

}



function validTask(
    task
) {

    return Boolean(

        task &&

        [
            "assignment",
            "exam"
        ].includes(
            task.type
        ) &&

        typeof task.id ===
            "string" &&

        typeof task.title ===
            "string" &&

        typeof task.courseId ===
            "string" &&

        isValidDateString(
            task.dueDate
        ) &&

        TASK_PRIORITIES.includes(
            task.priority
        ) &&

        TASK_STATUSES.includes(
            task.status
        )

    );

}



function validEvent(
    event
) {

    return Boolean(

        event &&

        typeof event.id ===
            "string" &&

        typeof event.topic ===
            "string" &&

        isValidDateString(
            event.date
        )

    );

}



function validGrade(
    grade
) {

    return Boolean(

        grade &&

        typeof grade.id ===
            "string" &&

        typeof grade.courseId ===
            "string" &&

        typeof grade.title ===
            "string" &&

        GRADE_CATEGORIES.includes(
            grade.category
        ) &&

        Number.isFinite(
            grade.pointsEarned
        ) &&

        grade.pointsEarned >= 0 &&

        Number.isFinite(
            grade.pointsPossible
        ) &&

        grade.pointsPossible > 0

    );

}



/* ================================================= */
/* SAFE COLLECTION LOADER */
/* ================================================= */

function loadCollection(
    key,
    validator
) {

    const loaded =
        loadData(
            key,
            []
        );


    if (
        !Array.isArray(
            loaded
        )
    ) {

        return [];

    }


    return loaded.filter(
        validator
    );

}



/* ================================================= */
/* APPLICATION STATE */
/* ================================================= */

/*
    New accounts intentionally start empty.

    The first existing account to use this version
    automatically receives the old shared data.
*/

let courses =
    loadCollection(
        KEYS.courses,
        validCourse
    );


let tasks =
    loadCollection(
        KEYS.tasks,
        validTask
    );


let events =
    loadCollection(
        KEYS.events,
        validEvent
    );


let grades =
    loadCollection(
        KEYS.grades,
        validGrade
    );


let activeRole =
    loadData(
        KEYS.role,
        "student"
    );


if (
    !VALID_ROLES.includes(
        activeRole
    )
) {

    activeRole =
        "student";

}



/* ================================================= */
/* ROLE */
/* ================================================= */

export function getActiveRole() {

    return activeRole;

}



export function setActiveRole(
    role
) {

    if (
        !VALID_ROLES.includes(
            role
        )
    ) {

        return false;

    }


    activeRole =
        role;


    return saveData(
        KEYS.role,
        role
    );

}



/* ================================================= */
/* COURSES */
/* ================================================= */

export function getCourses() {

    return copy(
        courses
    );

}



export function getCourseById(
    id
) {

    const course =
        courses.find(
            item =>
                item.id === id
        );


    return course
        ? {
            ...course
        }
        : null;

}



export function addCourse(
    course
) {

    courses.push({
        ...course
    });


    return saveData(
        KEYS.courses,
        courses
    );

}



/* ================================================= */
/* TASKS */ 
/* ================================================= */

export function getTasks() {

    return copy(
        tasks
    );

}



export function getTasksForCourse(
    courseId
) {

    return copy(
        tasks.filter(
            task =>
                task.courseId ===
                courseId
        )
    );

}



export function addTask(
    task
) {

    tasks.push({
        ...task
    });


    return saveData(
        KEYS.tasks,
        tasks
    );

}



export function updateTaskStatus(
    taskId,
    status
) {

    if (
        !TASK_STATUSES.includes(
            status
        )
    ) {

        return false;

    }


    const task =
        tasks.find(
            item =>
                item.id ===
                taskId
        );


    if (!task) {

        return false;

    }


    task.status =
        status;


    return saveData(
        KEYS.tasks,
        tasks
    );

}



/* ================================================= */
/* EVENTS */
/* ================================================= */

export function getEvents() {

    return copy(
        events
    );

}



export function addEvent(
    event
) {

    events.push({
        ...event
    });


    return saveData(
        KEYS.events,
        events
    );

}



/* ================================================= */
/* GRADES */
/* ================================================= */

export function getGrades() {

    return copy(
        grades
    );

}



export function getGradesForCourse(
    courseId
) {

    return copy(
        grades.filter(
            grade =>
                grade.courseId ===
                courseId
        )
    );

}



export function addGrade(
    grade
) {

    grades.push({
        ...grade
    });


    return saveData(
        KEYS.grades,
        grades
    );

}



export function deleteGrade(
    gradeId
) {

    const index =
        grades.findIndex(
            grade =>
                grade.id ===
                gradeId
        );


    if (
        index < 0
    ) {

        return false;

    }


    grades.splice(
        index,
        1
    );


    return saveData(
        KEYS.grades,
        grades
    );

}



/* ================================================= */
/* CALENDAR ITEMS */
/* ================================================= */

export function getCalendarItemsForDate(
    dateString
) {

    const eventItems =
        events
            .filter(
                event =>
                    event.date ===
                    dateString
            )
            .map(
                event => ({

                    id:
                        event.id,

                    source:
                        "event",

                    type:
                        "event",

                    topic:
                        event.topic,

                    title:
                        event.topic,

                    date:
                        event.date,

                    description:
                        event.description ||
                        "",

                    courseName:
                        "Personal / General"

                })
            );


    const taskItems =
        tasks
            .filter(
                task =>
                    task.dueDate ===
                    dateString
            )
            .map(
                task => {

                    const course =
                        courses.find(
                            item =>
                                item.id ===
                                task.courseId
                        );


                    return {

                        id:
                            task.id,

                        source:
                            "task",

                        type:
                            task.type,

                        topic:
                            task.title,

                        title:
                            task.title,

                        date:
                            task.dueDate,

                        description:
                            `${task.description || "No description provided."}\n\nPriority: ${task.priority}\nStatus: ${task.status}`,

                        courseName:
                            course
                                ? `${course.code} - ${course.name}`
                                : "Unknown Course"

                    };

                }
            );


    return [
        ...eventItems,
        ...taskItems
    ];

}