/*
    validation.js

    Centralizes input validation for CampusFlow.

    This prevents each feature from creating its
    own duplicate validation rules and makes future
    changes easier to maintain.
*/


/* ================================================= */
/* TASK CONSTANTS */
/* ================================================= */

export const VALID_TASK_TYPES = [
    "assignment",
    "exam"
];


export const VALID_PRIORITIES = [
    "Low",
    "Medium",
    "High"
];


export const VALID_STATUSES = [
    "Not Started",
    "In Progress",
    "Completed"
];


/* ================================================= */
/* COURSE CONSTANTS */
/* ================================================= */

export const VALID_COURSE_SCHEDULES = [
    "M/W/F",
    "T/Th",
    "M/W",
    "T/Th/F",
    "Online"
];


/* ================================================= */
/* GRADE CONSTANTS */
/* ================================================= */

/*
    Grade categories are shared between the Grade
    modal and the Grade Tracker filter.
*/

export const VALID_GRADE_CATEGORIES = [
    "Homework",
    "Quiz",
    "Exam",
    "Project",
    "Participation",
    "Lab",
    "Other"
];


/* ================================================= */
/* TEXT CLEANING */
/* ================================================= */

export function cleanText(
    value,
    maxLength = 100
) {

    /*
        Reject non-string values instead of allowing
        unexpected data into application state.
    */

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    /*
        Remove unnecessary extra whitespace and limit
        the maximum amount of stored text.
    */

    return value
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .slice(
            0,
            maxLength
        );

}



export function cleanMultilineText(
    value,
    maxLength = 500
) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    return value
        .replace(
            /\r\n/g,
            "\n"
        )
        .trim()
        .slice(
            0,
            maxLength
        );

}


/* ================================================= */
/* DATE VALIDATION */
/* ================================================= */

export function isValidDateString(
    value
) {

    if (
        typeof value !== "string"
    ) {

        return false;

    }


    /*
        Require the expected YYYY-MM-DD format.
    */

    const match =
        /^(\d{4})-(\d{2})-(\d{2})$/
            .exec(
                value
            );


    if (!match) {

        return false;

    }


    const year =
        Number(
            match[1]
        );


    const month =
        Number(
            match[2]
        );


    const day =
        Number(
            match[3]
        );


    /*
        JavaScript can automatically roll invalid dates
        forward. For example, February 31 could become a
        March date. These comparisons prevent that.
    */

    const date =
        new Date(
            year,
            month - 1,
            day
        );


    return (

        date.getFullYear() === year &&

        date.getMonth() ===
            month - 1 &&

        date.getDate() === day

    );

}


/* ================================================= */
/* TIME VALIDATION */
/* ================================================= */

export function isValidTime(
    value
) {

    if (
        typeof value !== "string"
    ) {

        return false;

    }


    return (
        /^([01]\d|2[0-3]):[0-5]\d$/
            .test(
                value
            )
    );

}


/* ================================================= */
/* EVENT VALIDATION */
/* ================================================= */

export function validateEvent(
    event
) {

    const errors =
        [];


    if (!event.topic) {

        errors.push(
            "Event topic is required."
        );

    }


    if (
        event.topic.length > 60
    ) {

        errors.push(
            "Event topic must be 60 characters or less."
        );

    }


    if (
        !isValidDateString(
            event.date
        )
    ) {

        errors.push(
            "A valid event date is required."
        );

    }


    if (!event.description) {

        errors.push(
            "Event description is required."
        );

    }


    return errors;

}


/* ================================================= */
/* TASK VALIDATION */
/* ================================================= */

export function validateTask(
    task
) {

    const errors =
        [];


    if (
        !VALID_TASK_TYPES.includes(
            task.type
        )
    ) {

        errors.push(
            "Invalid assignment or exam type."
        );

    }


    if (!task.title) {

        errors.push(
            "A title is required."
        );

    }


    if (!task.courseId) {

        errors.push(
            "A course must be selected."
        );

    }


    if (
        !isValidDateString(
            task.dueDate
        )
    ) {

        errors.push(
            "A valid due date is required."
        );

    }


    if (
        !VALID_PRIORITIES.includes(
            task.priority
        )
    ) {

        errors.push(
            "Invalid priority."
        );

    }


    if (
        !VALID_STATUSES.includes(
            task.status
        )
    ) {

        errors.push(
            "Invalid status."
        );

    }


    return errors;

}


/* ================================================= */
/* COURSE VALIDATION */
/* ================================================= */

export function validateCourse(
    course
) {

    const errors =
        [];


    if (!course.code) {

        errors.push(
            "Course code is required."
        );

    }


    if (!course.name) {

        errors.push(
            "Course name is required."
        );

    }


    if (!course.instructor) {

        errors.push(
            "Instructor name is required."
        );

    }


    if (
        !VALID_COURSE_SCHEDULES.includes(
            course.days
        )
    ) {

        errors.push(
            "Invalid course schedule."
        );

    }


    /*
        Online courses do not require a meeting time.
    */

    if (
        course.days !== "Online" &&
        !isValidTime(
            course.time
        )
    ) {

        errors.push(
            "A valid meeting time is required."
        );

    }


    return errors;

}


/* ================================================= */
/* GRADE VALIDATION */
/* ================================================= */

export function validateGrade(
    grade
) {

    const errors =
        [];


    if (!grade.courseId) {

        errors.push(
            "A course must be selected."
        );

    }


    if (!grade.title) {

        errors.push(
            "A graded item title is required."
        );

    }


    if (
        !VALID_GRADE_CATEGORIES.includes(
            grade.category
        )
    ) {

        errors.push(
            "A valid grade category is required."
        );

    }


    /*
        Number.isFinite prevents values such as NaN
        and Infinity from entering the grade tracker.
    */

    if (
        !Number.isFinite(
            grade.pointsEarned
        ) ||
        grade.pointsEarned < 0 ||
        grade.pointsEarned > 10000
    ) {

        errors.push(
            "Points earned must be a valid positive number."
        );

    }


    if (
        !Number.isFinite(
            grade.pointsPossible
        ) ||
        grade.pointsPossible <= 0 ||
        grade.pointsPossible > 10000
    ) {

        errors.push(
            "Points possible must be greater than zero."
        );

    }


    /*
        Points earned are allowed to exceed points possible.

        This intentionally supports extra credit.
    */


    return errors;

}