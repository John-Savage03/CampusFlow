/*
    assignments.js

    Handles the Assignment & Exam Tracker,
    filtering, creation, and status updates.
*/


import {
    getTasks,
    getCourses,
    getCourseById,
    addTask,
    updateTaskStatus
}
from "./state.js";


import {
    createId,
    formatDate
}
from "./utils.js";


import {
    cleanText,
    cleanMultilineText,
    validateTask,
    VALID_STATUSES
}
from "./validation.js";


import {
    openDetails
}
from "./details.js";


import {
    showMessage
}
from "./feedback.js";



function createOption(
    value,
    label
) {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        value;


    option.textContent =
        label;


    return option;

}



function populateCourseSelectors() {

    const courses =
        getCourses();


    const taskCourse =
        document.getElementById(
            "taskCourse"
        );


    const courseFilter =
        document.getElementById(
            "taskCourseFilter"
        );


    const previousFilter =
        courseFilter.value;


    taskCourse.replaceChildren();


    courseFilter.replaceChildren(
        createOption(
            "all",
            "All Courses"
        )
    );


    courses.forEach(
        course => {

            const label =
                `${course.code} - ${course.name}`;


            taskCourse.appendChild(
                createOption(
                    course.id,
                    label
                )
            );


            courseFilter.appendChild(
                createOption(
                    course.id,
                    label
                )
            );

        }
    );


    const filterStillExists =
        courses.some(
            course =>
                course.id ===
                previousFilter
        );


    courseFilter.value =
        filterStillExists
            ? previousFilter
            : "all";

}



function createTextCell(
    value
) {

    const cell =
        document.createElement(
            "td"
        );


    cell.textContent =
        value;


    return cell;

}



function createBadgeCell(
    text,
    classes
) {

    const cell =
        document.createElement(
            "td"
        );


    const badge =
        document.createElement(
            "span"
        );


    classes.forEach(
        className => {

            badge.classList.add(
                className
            );

        }
    );


    badge.textContent =
        text;


    cell.appendChild(
        badge
    );


    return cell;

}



function openTaskDetails(
    task
) {

    const course =
        getCourseById(
            task.courseId
        );


    openDetails({

        id:
            task.id,

        source:
            "task",

        type:
            task.type,

        topic:
            task.title,

        date:
            task.dueDate,

        description:
            task.description,

        priority:
            task.priority,

        status:
            task.status,

        courseName:
            course
                ? `${course.code} - ${course.name}`
                : "Unknown Course"

    });

}



export function renderTasks() {

    populateCourseSelectors();


    const body =
        document.getElementById(
            "taskTableBody"
        );


    const courseFilter =
        document.getElementById(
            "taskCourseFilter"
        ).value;


    const typeFilter =
        document.getElementById(
            "taskTypeFilter"
        ).value;


    const statusFilter =
        document.getElementById(
            "taskStatusFilter"
        ).value;


    body.replaceChildren();


    let tasks =
        getTasks();


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


    tasks.sort(
        (firstTask, secondTask) =>
            firstTask.dueDate.localeCompare(
                secondTask.dueDate
            )
    );


    if (
        tasks.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan =
            6;


        cell.textContent =
            "No assignments or exams match the current filters.";


        row.appendChild(
            cell
        );


        body.appendChild(
            row
        );


        return;

    }


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


            row.classList.add(
                "table-row-clickable"
            );


            row.appendChild(
                createBadgeCell(

                    task.type === "exam"
                        ? "Exam"
                        : "Assignment",

                    [
                        "badge",
                        task.type
                    ]

                )
            );


            row.appendChild(
                createTextCell(
                    task.title
                )
            );


            row.appendChild(
                createTextCell(
                    course
                        ? course.code
                        : "Unknown Course"
                )
            );


            row.appendChild(
                createTextCell(
                    formatDate(
                        task.dueDate
                    )
                )
            );


            row.appendChild(
                createBadgeCell(

                    task.priority,

                    [
                        "priority",
                        task.priority
                            .toLowerCase()
                    ]

                )
            );


            const statusCell =
                document.createElement(
                    "td"
                );


            const statusSelect =
                document.createElement(
                    "select"
                );


            statusSelect.classList.add(
                "status-select"
            );


            VALID_STATUSES.forEach(
                status => {

                    const option =
                        createOption(
                            status,
                            status
                        );


                    statusSelect.appendChild(
                        option
                    );

                }
            );


            statusSelect.value =
                task.status;


            statusSelect.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                }
            );


            statusSelect.addEventListener(
                "change",
                event => {

                    event.stopPropagation();


                    const success =
                        updateTaskStatus(

                            task.id,

                            statusSelect.value

                        );


                    if (!success) {

                        showMessage(
                            "Unable to update task status.",
                            "error"
                        );


                        return;

                    }


                    showMessage(
                        "Status updated.",
                        "success"
                    );


                    renderTasks();

                }
            );


            statusCell.appendChild(
                statusSelect
            );


            row.appendChild(
                statusCell
            );


            row.addEventListener(
                "click",
                () => {

                    openTaskDetails(
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



function openTaskModal() {

    populateCourseSelectors();


    if (
        getCourses().length === 0
    ) {

        showMessage(
            "Create a course before adding an assignment or exam.",
            "warning"
        );


        return;

    }


    const modal =
        document.getElementById(
            "taskModal"
        );


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.getElementById(
        "taskTitle"
    ).focus();

}



function closeTaskModal() {

    const modal =
        document.getElementById(
            "taskModal"
        );


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.getElementById(
        "taskForm"
    ).reset();

}



export function setupAssignments(
    refreshApplication
) {

    const modal =
        document.getElementById(
            "taskModal"
        );


    document.getElementById(
        "openTaskModalButton"
    ).addEventListener(
        "click",
        openTaskModal
    );


    document.getElementById(
        "closeTaskModalButton"
    ).addEventListener(
        "click",
        closeTaskModal
    );


    document.getElementById(
        "cancelTaskButton"
    ).addEventListener(
        "click",
        closeTaskModal
    );


    document.getElementById(
        "taskForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const newTask = {

                id:
                    createId(
                        "task"
                    ),

                type:
                    document.getElementById(
                        "taskType"
                    ).value,

                courseId:
                    document.getElementById(
                        "taskCourse"
                    ).value,

                title:
                    cleanText(
                        document.getElementById(
                            "taskTitle"
                        ).value,
                        80
                    ),

                dueDate:
                    document.getElementById(
                        "taskDueDate"
                    ).value,

                priority:
                    document.getElementById(
                        "taskPriority"
                    ).value,

                status:
                    document.getElementById(
                        "taskStatus"
                    ).value,

                description:
                    cleanMultilineText(
                        document.getElementById(
                            "taskDescription"
                        ).value,
                        500
                    )

            };


            const errors =
                validateTask(
                    newTask
                );


            if (
                !getCourseById(
                    newTask.courseId
                )
            ) {

                errors.push(
                    "The selected course does not exist."
                );

            }


            if (
                errors.length > 0
            ) {

                showMessage(
                    errors[0],
                    "error"
                );


                return;

            }


            const persisted =
                addTask(
                    newTask
                );


            closeTaskModal();


            refreshApplication();


            showMessage(
                persisted
                    ? "Assignment or exam added."
                    : "Item added, but browser storage was unavailable.",
                persisted
                    ? "success"
                    : "warning"
            );

        }
    );


    document.getElementById(
        "taskCourseFilter"
    ).addEventListener(
        "change",
        renderTasks
    );


    document.getElementById(
        "taskTypeFilter"
    ).addEventListener(
        "change",
        renderTasks
    );


    document.getElementById(
        "taskStatusFilter"
    ).addEventListener(
        "change",
        renderTasks
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeTaskModal();

            }

        }
    );

}