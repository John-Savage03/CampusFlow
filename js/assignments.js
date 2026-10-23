/*
    assignments.js

    Assignment and Exam Tracker.

    Supports:

    - Adding assignments/exams
    - Filtering coursework
    - Updating status
    - Viewing details
    - Removing coursework
    - Refreshing Dashboard statistics automatically
*/


import {
    getCourses,
    getTasks,
    getCourseById,
    addTask,
    updateTaskStatus,
    deleteTask,
    TASK_STATUSES
}
from "./state.js";


import {
    createId,
    cleanText,
    cleanMultilineText,
    isValidDateString,
    formatDate
}
from "./utils.js";


import {
    openModal,
    closeModal,
    openDetails,
    showMessage
}
from "./ui.js";



/* ================================================= */
/* APPLICATION REFRESH */
/* ================================================= */

/*
    setupAssignments receives refreshApplication()
    from app.js.

    Saving it here lets status changes and deletes
    refresh the entire CampusFlow interface.
*/

let refreshApplicationCallback =
    null;



function refreshEverything() {

    if (
        typeof refreshApplicationCallback ===
        "function"
    ) {

        refreshApplicationCallback();

    }

    else {

        renderAssignments();

    }

}



/* ================================================= */
/* OPTION HELPER */
/* ================================================= */

function option(
    value,
    label
) {

    const item =
        document.createElement(
            "option"
        );


    item.value =
        value;


    item.textContent =
        label;


    return item;

}



/* ================================================= */
/* COURSE SELECTORS */
/* ================================================= */

function populateCourseSelectors() {

    const courses =
        getCourses();


    const taskCourse =
        document.getElementById(
            "taskCourse"
        );


    const filter =
        document.getElementById(
            "taskCourseFilter"
        );


    if (
        !taskCourse ||
        !filter
    ) {

        return;

    }


    const previous =
        filter.value;


    taskCourse.replaceChildren();


    filter.replaceChildren(
        option(
            "all",
            "All Courses"
        )
    );


    courses.forEach(
        course => {

            const label =
                `${course.code} - ${course.name}`;


            taskCourse.appendChild(
                option(
                    course.id,
                    label
                )
            );


            filter.appendChild(
                option(
                    course.id,
                    label
                )
            );

        }
    );


    filter.value =
        courses.some(
            course =>
                course.id === previous
        )
            ? previous
            : "all";

}



/* ================================================= */
/* TABLE CELL */
/* ================================================= */

function cell(
    text
) {

    const td =
        document.createElement(
            "td"
        );


    td.textContent =
        text;


    return td;

}



/* ================================================= */
/* TASK DETAILS */
/* ================================================= */

function taskDetails(
    task
) {

    const course =
        getCourseById(
            task.courseId
        );


    openDetails({

        source:
            "task",

        type:
            task.type,

        title:
            task.title,

        date:
            task.dueDate,

        courseName:
            course
                ? `${course.code} - ${course.name}`
                : "Unknown Course",

        description:
            `${task.description || "No description provided."}\n\nPriority: ${task.priority}\nStatus: ${task.status}`

    });

}



/* ================================================= */
/* REMOVE TASK */
/* ================================================= */

function removeTask(
    task
) {

    const typeName =
        task.type === "exam"
            ? "exam"
            : "assignment";


    const confirmed =
        window.confirm(
            `Remove "${task.title}" from CampusFlow?`
        );


    if (!confirmed) {

        return;

    }


    const removed =
        deleteTask(
            task.id
        );


    if (!removed) {

        showMessage(
            `Unable to remove the ${typeName}.`,
            "error"
        );


        return;

    }


    refreshEverything();


    showMessage(
        `${
            task.type === "exam"
                ? "Exam"
                : "Assignment"
        } removed.`,
        "success"
    );

}



/* ================================================= */
/* RENDER ASSIGNMENTS */
/* ================================================= */

export function renderAssignments() {

    populateCourseSelectors();


    const body =
        document.getElementById(
            "taskTableBody"
        );


    if (!body) {

        return;

    }


    body.replaceChildren();


    const courseFilter =
        document.getElementById(
            "taskCourseFilter"
        )?.value || "all";


    const typeFilter =
        document.getElementById(
            "taskTypeFilter"
        )?.value || "all";


    const statusFilter =
        document.getElementById(
            "taskStatusFilter"
        )?.value || "all";


    let tasks =
        getTasks();


    /* ---------------- COURSE FILTER ---------------- */

    if (
        courseFilter !== "all"
    ) {

        tasks =
            tasks.filter(
                task =>
                    task.courseId ===
                    courseFilter
            );

    }


    /* ---------------- TYPE FILTER ---------------- */

    if (
        typeFilter !== "all"
    ) {

        tasks =
            tasks.filter(
                task =>
                    task.type ===
                    typeFilter
            );

    }


    /* ---------------- STATUS FILTER ---------------- */

    if (
        statusFilter !== "all"
    ) {

        tasks =
            tasks.filter(
                task =>
                    task.status ===
                    statusFilter
            );

    }


    /* ---------------- SORT BY DATE ---------------- */

    tasks.sort(
        (
            first,
            second
        ) =>
            first.dueDate.localeCompare(
                second.dueDate
            )
    );


    /* ---------------- EMPTY TABLE ---------------- */

    if (
        !tasks.length
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const td =
            cell(
                "No assignments or exams match the current filters."
            );


        td.colSpan =
            6;


        row.appendChild(
            td
        );


        body.appendChild(
            row
        );


        return;

    }



    /* ================================================= */
    /* CREATE ROWS */
    /* ================================================= */

    tasks.forEach(
        task => {

            const course =
                getCourseById(
                    task.courseId
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.className =
                "clickable-row";



            /* ---------------- TYPE ---------------- */

            const typeCell =
                document.createElement(
                    "td"
                );


            const badge =
                document.createElement(
                    "span"
                );


            badge.className =
                `badge ${task.type}`;


            badge.textContent =
                task.type === "exam"
                    ? "Exam"
                    : "Assignment";


            typeCell.appendChild(
                badge
            );



            /* ---------------- BASIC CELLS ---------------- */

            row.append(
                typeCell,

                cell(
                    task.title
                ),

                cell(
                    course
                        ? course.code
                        : "Unknown Course"
                ),

                cell(
                    formatDate(
                        task.dueDate
                    )
                ),

                cell(
                    task.priority
                )
            );



            /* ================================================= */
            /* STATUS + REMOVE BUTTON */
            /* ================================================= */

            const statusCell =
                document.createElement(
                    "td"
                );


            const controls =
                document.createElement(
                    "div"
                );


            controls.style.display =
                "flex";


            controls.style.alignItems =
                "center";


            controls.style.gap =
                "8px";


            controls.style.flexWrap =
                "wrap";



            /* ---------------- STATUS SELECT ---------------- */

            const select =
                document.createElement(
                    "select"
                );


            select.className =
                "status-select";


            TASK_STATUSES.forEach(
                status => {

                    select.appendChild(
                        option(
                            status,
                            status
                        )
                    );

                }
            );


            select.value =
                task.status;


            select.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                }
            );


            select.addEventListener(
                "change",
                event => {

                    event.stopPropagation();


                    const updated =
                        updateTaskStatus(
                            task.id,
                            select.value
                        );


                    if (!updated) {

                        showMessage(
                            "Unable to update task status.",
                            "error"
                        );


                        return;

                    }


                    /*
                        Refresh EVERYTHING instead of
                        only the Assignments table.

                        This keeps Dashboard numbers
                        synchronized.
                    */

                    refreshEverything();


                    showMessage(
                        "Task status updated.",
                        "success"
                    );

                }
            );



            /* ---------------- REMOVE BUTTON ---------------- */

            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            /*
                delete-button already exists in your
                CampusFlow CSS because Grades uses it.
            */

            removeButton.className =
                "delete-button";


            removeButton.textContent =
                "Remove";


            removeButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    removeTask(
                        task
                    );

                }
            );


            controls.append(
                select,
                removeButton
            );


            statusCell.appendChild(
                controls
            );


            row.appendChild(
                statusCell
            );



            /* ---------------- VIEW DETAILS ---------------- */

            row.addEventListener(
                "click",
                () => {

                    taskDetails(
                        task
                    );

                }
            );


            body.appendChild(
                row
            );

        }
    );

}



/* ================================================= */
/* SETUP */
/* ================================================= */

export function setupAssignments(
    refreshApplication
) {

    /*
        Save the global CampusFlow refresh function.
    */

    refreshApplicationCallback =
        refreshApplication;



    /* ================================================= */
    /* FILTERS */
    /* ================================================= */

    [
        "taskCourseFilter",
        "taskTypeFilter",
        "taskStatusFilter"
    ].forEach(
        id => {

            document
                .getElementById(
                    id
                )
                ?.addEventListener(
                    "change",
                    renderAssignments
                );

        }
    );



    /* ================================================= */
    /* OPEN MODAL */
    /* ================================================= */

    document
        .getElementById(
            "openTaskModalButton"
        )
        ?.addEventListener(
            "click",
            () => {

                populateCourseSelectors();


                if (
                    !getCourses().length
                ) {

                    return showMessage(
                        "Create a course before adding coursework.",
                        "warning"
                    );

                }


                openModal(
                    "taskModal"
                );

            }
        );



    /* ================================================= */
    /* ADD TASK */
    /* ================================================= */

    document
        .getElementById(
            "taskForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();



                const type =
                    document.getElementById(
                        "taskType"
                    )?.value;


                const courseId =
                    document.getElementById(
                        "taskCourse"
                    )?.value;


                const title =
                    cleanText(
                        document.getElementById(
                            "taskTitle"
                        )?.value,
                        80
                    );


                const dueDate =
                    document.getElementById(
                        "taskDueDate"
                    )?.value || "";


                const priority =
                    document.getElementById(
                        "taskPriority"
                    )?.value;


                const status =
                    document.getElementById(
                        "taskStatus"
                    )?.value;


                const description =
                    cleanMultilineText(
                        document.getElementById(
                            "taskDescription"
                        )?.value,
                        500
                    );



                /* ---------------- VALIDATE TYPE ---------------- */

                if (
                    ![
                        "assignment",
                        "exam"
                    ].includes(
                        type
                    )
                ) {

                    return showMessage(
                        "Choose a valid coursework type.",
                        "error"
                    );

                }



                /* ---------------- VALIDATE COURSE ---------------- */

                if (
                    !getCourseById(
                        courseId
                    )
                ) {

                    return showMessage(
                        "Choose a valid course.",
                        "error"
                    );

                }



                /* ---------------- VALIDATE TITLE ---------------- */

                if (!title) {

                    return showMessage(
                        "Title is required.",
                        "error"
                    );

                }



                /* ---------------- VALIDATE DATE ---------------- */

                if (
                    !isValidDateString(
                        dueDate
                    )
                ) {

                    return showMessage(
                        "Choose a valid due date.",
                        "error"
                    );

                }



                /* ================================================= */
                /* ADD TASK */
                /* ================================================= */

                const saved =
                    addTask({

                        id:
                            createId(
                                "task"
                            ),

                        type,

                        courseId,

                        title,

                        dueDate,

                        priority,

                        status,

                        description

                    });


                if (!saved) {

                    return showMessage(
                        "Unable to save coursework.",
                        "error"
                    );

                }



                document
                    .getElementById(
                        "taskForm"
                    )
                    .reset();


                closeModal(
                    "taskModal"
                );


                /*
                    Refresh Assignments, Dashboard,
                    Calendar, Course Hub, etc.
                */

                refreshEverything();


                showMessage(
                    "Coursework added.",
                    "success"
                );

            }
        );

}