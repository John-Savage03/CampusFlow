/* assignments.js - assignment/exam tracker */

import {
    getCourses,
    getTasks,
    getCourseById,
    addTask,
    updateTaskStatus,
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
                course.id ===
                previous
        )
            ? previous
            : "all";

}


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
        (
            first,
            second
        ) =>
            first.dueDate.localeCompare(
                second.dueDate
            )
    );


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


            const statusCell =
                document.createElement(
                    "td"
                );


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


                    updateTaskStatus(
                        task.id,
                        select.value
                    );


                    showMessage(
                        "Task status updated."
                    );


                    renderAssignments();

                }
            );


            statusCell.appendChild(
                select
            );


            row.appendChild(
                statusCell
            );


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


export function setupAssignments(
    refreshApplication
) {

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


                if (!title) {

                    return showMessage(
                        "Title is required.",
                        "error"
                    );

                }


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


                document
                    .getElementById(
                        "taskForm"
                    )
                    .reset();


                closeModal(
                    "taskModal"
                );


                refreshApplication();


                showMessage(
                    "Coursework added."
                );

            }
        );

}