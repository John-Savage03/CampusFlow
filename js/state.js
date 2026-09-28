/*
    state.js

    Central data layer for CampusFlow.

    UI modules use this file instead of
    accessing localStorage directly.
*/


import {
    loadData,
    saveData
}
from "./storage.js";


import {
    VALID_PRIORITIES,
    VALID_STATUSES,
    VALID_TASK_TYPES,
    VALID_COURSE_SCHEDULES,
    isValidDateString
}
from "./validation.js";



const COURSE_KEY =
    "campusflow-sprint1-courses-v1";


const TASK_KEY =
    "campusflow-sprint1-tasks-v1";


const EVENT_KEY =
    "campusflow-sprint1-events-v1";


const ROLE_KEY =
    "campusflow-active-role-v1";



const VALID_ROLES = [
    "student",
    "professor"
];



const defaultCourses = [

    {
        id: "course-1",
        code: "CSCI 3410",
        name: "Database Systems",
        instructor: "Professor Name",
        days: "M/W/F",
        time: "09:00"
    },

    {
        id: "course-2",
        code: "CSCI 3000",
        name: "Software Engineering",
        instructor: "Professor Name",
        days: "M/W",
        time: "11:00"
    },

    {
        id: "course-3",
        code: "POLS 3000",
        name: "International Relations",
        instructor: "Professor Name",
        days: "T/Th",
        time: "13:00"
    }

];



const defaultTasks = [

    {
        id: "task-1",
        type: "assignment",
        title: "Database Homework 4",
        courseId: "course-1",
        dueDate: "2026-09-26",
        priority: "High",
        status: "In Progress",
        description:
            "Complete Database Homework 4 before the deadline."
    },

    {
        id: "task-2",
        type: "exam",
        title: "Database Exam",
        courseId: "course-1",
        dueDate: "2026-09-29",
        priority: "High",
        status: "Not Started",
        description:
            "Review ER diagrams, relational mapping, and database concepts."
    },

    {
        id: "task-3",
        type: "assignment",
        title: "CampusFlow Sprint 1",
        courseId: "course-2",
        dueDate: "2026-10-02",
        priority: "High",
        status: "In Progress",
        description:
            "Complete and test the Sprint 1 CampusFlow prototype."
    }

];



const defaultEvents = [

    {
        id: "event-1",
        topic: "Study Session",
        date: "2026-09-27",
        description:
            "Review class material and upcoming assignments."
    }

];



function cloneCollection(
    collection
) {

    return collection.map(
        item => ({
            ...item
        })
    );

}



function isValidCourseRecord(
    course
) {

    return (

        course !== null &&

        typeof course === "object" &&

        typeof course.id === "string" &&

        typeof course.code === "string" &&

        typeof course.name === "string" &&

        typeof course.instructor ===
            "string" &&

        VALID_COURSE_SCHEDULES.includes(
            course.days
        ) &&

        typeof course.time === "string"

    );

}



function isValidTaskRecord(
    task
) {

    return (

        task !== null &&

        typeof task === "object" &&

        typeof task.id === "string" &&

        VALID_TASK_TYPES.includes(
            task.type
        ) &&

        typeof task.title === "string" &&

        typeof task.courseId === "string" &&

        isValidDateString(
            task.dueDate
        ) &&

        VALID_PRIORITIES.includes(
            task.priority
        ) &&

        VALID_STATUSES.includes(
            task.status
        ) &&

        typeof task.description ===
            "string"

    );

}



function isValidEventRecord(
    event
) {

    return (

        event !== null &&

        typeof event === "object" &&

        typeof event.id === "string" &&

        typeof event.topic === "string" &&

        isValidDateString(
            event.date
        ) &&

        typeof event.description ===
            "string"

    );

}



function loadSafeCollection(
    key,
    defaults,
    validator
) {

    const loaded =
        loadData(
            key,
            null
        );


    if (
        !Array.isArray(
            loaded
        )
    ) {

        return cloneCollection(
            defaults
        );

    }


    const validItems =
        loaded.filter(
            validator
        );


    if (
        validItems.length !==
        loaded.length
    ) {

        console.warn(
            `${key} contained invalid records.`
        );

    }


    return validItems;

}



let courses =
    loadSafeCollection(
        COURSE_KEY,
        defaultCourses,
        isValidCourseRecord
    );


let tasks =
    loadSafeCollection(
        TASK_KEY,
        defaultTasks,
        isValidTaskRecord
    );


let events =
    loadSafeCollection(
        EVENT_KEY,
        defaultEvents,
        isValidEventRecord
    );


let activeRole =
    loadData(
        ROLE_KEY,
        "student"
    );



if (
    courses.length === 0
) {

    courses =
        cloneCollection(
            defaultCourses
        );

}



if (
    !VALID_ROLES.includes(
        activeRole
    )
) {

    activeRole =
        "student";

}



/* ================================================= */
/* ROLE STATE */
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
        ROLE_KEY,
        activeRole
    );

}



/* ================================================= */
/* COURSES */
/* ================================================= */

export function getCourses() {

    return courses.map(
        course => ({
            ...course
        })
    );

}



export function getCourseById(
    courseId
) {

    const course =
        courses.find(
            item =>
                item.id === courseId
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
        COURSE_KEY,
        courses
    );

}



/* ================================================= */
/* TASKS */
/* ================================================= */

export function getTasks() {

    return tasks.map(
        task => ({
            ...task
        })
    );

}



export function getTaskById(
    taskId
) {

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );


    return task
        ? {
            ...task
        }
        : null;

}



export function addTask(
    task
) {

    tasks.push({
        ...task
    });


    return saveData(
        TASK_KEY,
        tasks
    );

}



export function updateTaskStatus(
    taskId,
    newStatus
) {

    if (
        !VALID_STATUSES.includes(
            newStatus
        )
    ) {

        return false;

    }


    const task =
        tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) {

        return false;

    }


    task.status =
        newStatus;


    saveData(
        TASK_KEY,
        tasks
    );


    return true;

}



export function getTasksForCourse(
    courseId
) {

    return tasks
        .filter(
            task =>
                task.courseId ===
                courseId
        )
        .map(
            task => ({
                ...task
            })
        );

}



/* ================================================= */
/* EVENTS */
/* ================================================= */

export function getEvents() {

    return events.map(
        event => ({
            ...event
        })
    );

}



export function getEventById(
    eventId
) {

    const event =
        events.find(
            item =>
                item.id === eventId
        );


    return event
        ? {
            ...event
        }
        : null;

}



export function addEvent(
    event
) {

    events.push({
        ...event
    });


    return saveData(
        EVENT_KEY,
        events
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

                    description:
                        event.description,

                    date:
                        event.date,

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

                        description:
                            task.description,

                        date:
                            task.dueDate,

                        priority:
                            task.priority,

                        status:
                            task.status,

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