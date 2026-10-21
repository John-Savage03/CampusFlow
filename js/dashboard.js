/* dashboard.js - renders both role dashboards */

import {
    getCourses,
    getTasks,
    getGrades,
    getCourseById,
    getTasksForCourse,
    getCalendarItemsForDate
}
from "./state.js";


import {
    parseDateString,
    formatDate,
    formatTime,
    dateToString,
    courseMeetsOnDate
}
from "./utils.js";


import {
    openDetails
}
from "./ui.js";


function upcomingTasks() {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return getTasks()
        .filter(
            task =>
                parseDateString(
                    task.dueDate
                ) >= today &&
                task.status !==
                    "Completed"
        )
        .sort(
            (
                first,
                second
            ) =>
                first.dueDate.localeCompare(
                    second.dueDate
                )
        );

}


function empty(
    container,
    text
) {

    const p =
        document.createElement(
            "p"
        );


    p.className =
        "empty-message";


    p.textContent =
        text;


    container.appendChild(
        p
    );

}


function createTaskButton(
    task
) {

    const course =
        getCourseById(
            task.courseId
        );


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "assignment-preview";


    const left =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        task.title;


    const sub =
        document.createElement(
            "p"
        );


    sub.textContent =
        `${
            task.type === "exam"
                ? "Exam"
                : "Assignment"
        } • ${
            course
                ? course.code
                : "Unknown Course"
        }`;


    left.append(
        title,
        sub
    );


    const date =
        document.createElement(
            "span"
        );


    date.className =
        "task-date";


    date.textContent =
        formatDate(
            task.dueDate
        );


    button.append(
        left,
        date
    );


    button.addEventListener(
        "click",
        () => {

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
    );


    return button;

}


/* ================================================= */
/* STUDENT DASHBOARD */
/* ================================================= */

function renderStudentSummary() {

    const upcoming =
        upcomingTasks();


    const tasks =
        getTasks();


    document.getElementById(
        "studentUpcomingCount"
    ).textContent =
        upcoming.length;


    document.getElementById(
        "studentCourseCount"
    ).textContent =
        getCourses().length;


    document.getElementById(
        "studentCompletedCount"
    ).textContent =
        tasks.filter(
            task =>
                task.status ===
                "Completed"
        ).length;


    const next =
        upcoming[0];


    document.getElementById(
        "studentNextDeadline"
    ).textContent =
        next
            ? next.title
            : "None";


    document.getElementById(
        "studentNextDeadlineDate"
    ).textContent =
        next
            ? formatDate(
                next.dueDate
            )
            : "No upcoming work";

}


function renderStudentUpcoming() {

    const container =
        document.getElementById(
            "studentUpcomingList"
        );


    container.replaceChildren();


    const items =
        upcomingTasks()
            .slice(
                0,
                5
            );


    if (
        !items.length
    ) {

        return empty(
            container,
            "No upcoming assignments or exams."
        );

    }


    items.forEach(
        task => {

            container.appendChild(
                createTaskButton(
                    task
                )
            );

        }
    );

}


function renderTodaySchedule() {

    const container =
        document.getElementById(
            "studentTodaySchedule"
        );


    container.replaceChildren();


    const today =
        new Date();


    const courses =
        getCourses()
            .filter(
                course =>
                    courseMeetsOnDate(
                        course.days,
                        today
                    )
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    first.time.localeCompare(
                        second.time
                    )
            );


    if (
        !courses.length
    ) {

        return empty(
            container,
            "No classes scheduled today."
        );

    }


    courses.forEach(
        course => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "schedule-item";


            const time =
                document.createElement(
                    "span"
                );


            time.className =
                "schedule-time";


            time.textContent =
                formatTime(
                    course.time
                );


            const info =
                document.createElement(
                    "div"
                );


            const name =
                document.createElement(
                    "strong"
                );


            name.textContent =
                course.name;


            const code =
                document.createElement(
                    "p"
                );


            code.textContent =
                course.code;


            info.append(
                name,
                code
            );


            row.append(
                time,
                info
            );


            container.appendChild(
                row
            );

        }
    );

}


/* ================================================= */
/* SHARED WEEK VIEW */
/* ================================================= */

function renderWeek(
    containerId,
    includeClasses
) {

    const container =
        document.getElementById(
            containerId
        );


    container.replaceChildren();


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const courses =
        getCourses();


    for (
        let offset = 0;
        offset < 7;
        offset++
    ) {

        const date =
            new Date(
                today
            );


        date.setDate(
            today.getDate() +
            offset
        );


        const card =
            document.createElement(
                "div"
            );


        card.className =
            `week-day-card${
                offset === 0
                    ? " today"
                    : ""
            }`;


        const dayName =
            document.createElement(
                "div"
            );


        dayName.className =
            "week-day-name";


        dayName.textContent =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            );


        const dayDate =
            document.createElement(
                "div"
            );


        dayDate.className =
            "week-day-date";


        dayDate.textContent =
            date.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            );


        card.append(
            dayName,
            dayDate
        );


        let count =
            0;


        if (
            includeClasses
        ) {

            courses
                .filter(
                    course =>
                        courseMeetsOnDate(
                            course.days,
                            date
                        )
                )
                .slice(
                    0,
                    2
                )
                .forEach(
                    course => {

                        const item =
                            document.createElement(
                                "button"
                            );


                        item.type =
                            "button";


                        item.className =
                            "week-item";


                        item.textContent =
                            `${course.code} ${formatTime(course.time)}`;


                        item.addEventListener(
                            "click",
                            () => {

                                openDetails({

                                    source:
                                        "course",

                                    type:
                                        "course",

                                    title:
                                        `${course.code} - ${course.name}`,

                                    schedule:
                                        `${course.days} • ${formatTime(course.time)}`,

                                    instructor:
                                        course.instructor,

                                    description:
                                        `${getTasksForCourse(course.id).length} coursework items tracked.`

                                });

                            }
                        );


                        card.appendChild(
                            item
                        );


                        count++;

                    }
                );

        }


        getCalendarItemsForDate(
            dateToString(
                date
            )
        )
            .slice(
                0,
                Math.max(
                    0,
                    3 - count
                )
            )
            .forEach(
                calendarItem => {

                    const item =
                        document.createElement(
                            "button"
                        );


                    item.type =
                        "button";


                    item.className =
                        `week-item ${
                            calendarItem.type === "assignment" ||
                            calendarItem.type === "exam"
                                ? calendarItem.type
                                : ""
                        }`;


                    item.textContent =
                        calendarItem.title;


                    item.addEventListener(
                        "click",
                        () => {

                            openDetails(
                                calendarItem
                            );

                        }
                    );


                    card.appendChild(
                        item
                    );


                    count++;

                }
            );


        if (
            !count
        ) {

            const clear =
                document.createElement(
                    "span"
                );


            clear.className =
                "empty-message";


            clear.textContent =
                "Clear";


            card.appendChild(
                clear
            );

        }


        container.appendChild(
            card
        );

    }

}


/* ================================================= */
/* PROFESSOR DASHBOARD */
/* ================================================= */

function renderProfessorSummary() {

    document.getElementById(
        "professorCourseCount"
    ).textContent =
        getCourses().length;


    document.getElementById(
        "professorCourseworkCount"
    ).textContent =
        getTasks().length;


    document.getElementById(
        "professorGradeCount"
    ).textContent =
        getGrades().length;


    document.getElementById(
        "professorUpcomingCount"
    ).textContent =
        upcomingTasks().length;

}


function renderProfessorCourses() {

    const container =
        document.getElementById(
            "professorCourseOverview"
        );


    container.replaceChildren();


    const courses =
        getCourses();


    if (
        !courses.length
    ) {

        return empty(
            container,
            "No courses have been created."
        );

    }


    courses.forEach(
        course => {

            const tasks =
                getTasksForCourse(
                    course.id
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "professor-course-item";


            const left =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                `${course.code} - ${course.name}`;


            const schedule =
                document.createElement(
                    "p"
                );


            schedule.textContent =
                course.days === "Online"
                    ? "Online"
                    : `${course.days} • ${formatTime(course.time)}`;


            left.append(
                title,
                schedule
            );


            const count =
                document.createElement(
                    "span"
                );


            count.className =
                "professor-course-count";


            count.textContent =
                `${tasks.length} coursework item${
                    tasks.length === 1
                        ? ""
                        : "s"
                }`;


            button.append(
                left,
                count
            );


            button.addEventListener(
                "click",
                () => {

                    openDetails({

                        source:
                            "course",

                        type:
                            "course",

                        title:
                            `${course.code} - ${course.name}`,

                        schedule:
                            course.days === "Online"
                                ? "Online"
                                : `${course.days} • ${formatTime(course.time)}`,

                        instructor:
                            course.instructor,

                        description:
                            `${tasks.length} coursework items tracked.`

                    });

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


function renderProfessorUpcoming() {

    const container =
        document.getElementById(
            "professorUpcomingList"
        );


    container.replaceChildren();


    const items =
        upcomingTasks()
            .slice(
                0,
                5
            );


    if (
        !items.length
    ) {

        return empty(
            container,
            "No upcoming coursework."
        );

    }


    items.forEach(
        task => {

            container.appendChild(
                createTaskButton(
                    task
                )
            );

        }
    );

}


/* ================================================= */
/* PUBLIC RENDER */
/* ================================================= */

export function renderDashboards() {

    renderStudentSummary();

    renderStudentUpcoming();

    renderTodaySchedule();

    renderWeek(
        "studentWeeklyOverview",
        false
    );


    renderProfessorSummary();

    renderProfessorCourses();

    renderProfessorUpcoming();

    renderWeek(
        "professorWeeklyOverview",
        true
    );

}
