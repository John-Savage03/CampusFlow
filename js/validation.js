/*
    validation.js

    Centralizes validation rules so that
    forms do not duplicate validation logic.
*/


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


export const VALID_COURSE_SCHEDULES = [
    "M/W/F",
    "T/Th",
    "M/W",
    "T/Th/F",
    "Online"
];



export function cleanText(
    value,
    maxLength = 100
) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


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



export function isValidDateString(
    value
) {

    if (
        typeof value !== "string"
    ) {

        return false;

    }


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