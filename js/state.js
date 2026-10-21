/* state.js - central application data layer */

import {
    loadData,
    saveData
}
from "./storage.js";


import {
    isValidDateString
}
from "./utils.js";


const KEYS = {

    role:
        "campusflow-v2-role",

    courses:
        "campusflow-v2-courses",

    tasks:
        "campusflow-v2-tasks",

    events:
        "campusflow-v2-events",

    grades:
        "campusflow-v2-grades"

};


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
        title: "Database Homework",
        courseId: "course-1",
        dueDate: "2026-10-21",
        priority: "High",
        status: "In Progress",
        description:
            "Complete the current database homework."
    },

    {
        id: "task-2",
        type: "exam",
        title: "Database Exam",
        courseId: "course-1",
        dueDate: "2026-10-24",
        priority: "High",
        status: "Not Started",
        description:
            "Review relational design and SQL concepts."
    },

    {
        id: "task-3",
        type: "assignment",
        title: "CampusFlow Sprint 2",
        courseId: "course-2",
        dueDate: "2026-10-28",
        priority: "High",
        status: "In Progress",
        description:
            "Complete Sprint 2 CampusFlow features."
    }

];


const defaultEvents = [

    {
        id: "event-1",
        topic: "Study Session",
        date: "2026-10-22",
        description:
            "Review upcoming coursework."
    }

];


function copy(
    items
) {

    return items.map(
        item => ({
            ...item
        })
    );

}


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


function loadCollection(
    key,
    fallback,
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

        return copy(
            fallback
        );

    }


    return loaded.filter(
        validator
    );

}


let activeRole =
    loadData(
        KEYS.role,
        "student"
    );


if (
    ![
        "student",
        "professor"
    ].includes(
        activeRole
    )
) {

    activeRole =
        "student";

}


let courses =
    loadCollection(
        KEYS.courses,
        defaultCourses,
        validCourse
    );


if (
    courses.length === 0
) {

    courses =
        copy(
            defaultCourses
        );

}


let tasks =
    loadCollection(
        KEYS.tasks,
        defaultTasks,
        validTask
    );


let events =
    loadCollection(
        KEYS.events,
        defaultEvents,
        validEvent
    );


let grades =
    loadCollection(
        KEYS.grades,
        [],
        validGrade
    );


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
        ![
            "student",
            "professor"
        ].includes(
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
                        event.description,

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
