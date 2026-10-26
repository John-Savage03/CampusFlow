/* assignments.js - assignment/exam tracker */

import {
    getCourses,
    getTasks,
    getCourseById,
    addTask,
    updateTaskStatus,
    TASK_STATUSES,
    getEvents,
    addEvent,
    getActiveRole
}
from "./state.js";


import {
    createId,
    cleanText,
    cleanMultilineText,
    isValidDateString,
    formatDate,
    formatTime,
    dateToString,
    parseDateString
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
            7;


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

            /* Study planner button */
            const studyCell = document.createElement("td");

            if (getActiveRole() === "student" && task.status !== "Completed") {

                const studyButton = document.createElement("button");
                studyButton.type = "button";
                studyButton.className = "secondary-button";
                studyButton.textContent = "Schedule Study";

                studyButton.addEventListener("click", event => {
                    event.stopPropagation();
                    openStudyModal(task);
                });

                studyCell.appendChild(studyButton);

            }

            row.appendChild(studyCell);

            /* end of button*/

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
/* STUDY PLANNER */
/* ================================================= */

let studyTask = null;


function openStudyModal(task) {

    const list = document.getElementById("studyDayList");

    if (!list) {
        return;
    }

    list.replaceChildren();

    studyTask = task;

    document.getElementById("studyTaskName").textContent =
        `${task.title} - due ${formatDate(task.dueDate)}`;

    /* Offer today through the due date (at most 14 days). */
    const due = parseDateString(task.dueDate);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const earliest = new Date(due);
    earliest.setDate(earliest.getDate() - 13);

    if (earliest > start) {
        start.setTime(earliest.getTime());
    }

    for (const day = new Date(start); day <= due; day.setDate(day.getDate() + 1)) {

        const row = document.createElement("div");
        row.className = "study-day";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = dateToString(day);

        const label = document.createElement("span");
        label.textContent = day.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });

        const time = document.createElement("input");
        time.type = "time";
        time.value = "16:00";

        row.append(checkbox, label, time);
        list.appendChild(row);

    }

    if (!list.children.length) {
        return showMessage("This deadline has already passed.", "warning");
    }

    openModal("studyModal");

}


function setupStudyPlanner(refreshApplication) {

    document.getElementById("studyForm")?.addEventListener("submit", event => {

        event.preventDefault();

        const minutes = Number(document.getElementById("studyLength").value);
        const existing = getEvents();
        let added = 0;

        document.querySelectorAll("#studyDayList .study-day").forEach(row => {

            const checkbox = row.querySelector("input[type=checkbox]");
            const startTime = row.querySelector("input[type=time]").value;

            if (!checkbox.checked || !startTime) {
                return;
            }

            /* Work out the end time. */
            const [hour, minute] = startTime.split(":").map(Number);
            const end = new Date(2000, 0, 1, hour, minute + minutes);
            const endTime =
                `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

            const topic =
                `Study: ${cleanText(studyTask.title, 30)} (${formatTime(startTime)})`;

            /* Skip a block that is already scheduled. */
            if (existing.some(item => item.date === checkbox.value && item.topic === topic)) {
                return;
            }

            addEvent({
                id: createId("event"),
                topic,
                date: checkbox.value,
                description:
                    `Study session for ${studyTask.title}\n${formatTime(startTime)} - ${formatTime(endTime)}\nDue ${formatDate(studyTask.dueDate)}`
            });

            added++;

        });

        if (!added) {
            return showMessage("Check at least one new day and time.", "error");
        }

        closeModal("studyModal");
        refreshApplication();
        showMessage(`${added} study block${added === 1 ? "" : "s"} added to your calendar.`);

    });

}

/*end of study planner*/

export function setupAssignments(
    refreshApplication
) {

    /*one line below for study plan*/
    setupStudyPlanner(refreshApplication);

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