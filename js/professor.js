/*
    professor.js

    Controls the Professor Dashboard.

    Sprint 2 adds an optional Gradebook shortcut.

    Missing optional dashboard buttons are ignored
    instead of stopping CampusFlow startup.
*/


import {
    getCourses,
    getTasks,
    getEvents,
    getCourseById,
    getTasksForCourse,
    getCalendarItemsForDate
}
from "./state.js";


import {
    dateToString,
    formatDate,
    formatTime,
    parseDateString,
    courseMeetsOnDate
}
from "./utils.js";


import {
    openDetails
}
from "./details.js";


import {
    openPage
}
from "./navigation.js";



/* ================================================= */
/* OPTIONAL BUTTON HELPER */
/* ================================================= */

/*
    Only attaches an event if the requested button
    actually exists in index.html.

    This prevents:

        Cannot read properties of null
        (reading 'addEventListener')

    from stopping the entire application.
*/

function setupOptionalButton(
    elementId,
    pageName
) {

    const button =
        document.getElementById(
            elementId
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            openPage(
                pageName
            );

        }
    );

}



/* ================================================= */
/* UPCOMING TASKS */
/* ================================================= */

function getUpcomingTasks() {

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
            task => {

                const date =
                    parseDateString(
                        task.dueDate
                    );


                return (

                    date >= today &&

                    task.status !==
                        "Completed"

                );

            }
        )
        .sort(
            (
                firstTask,
                secondTask
            ) =>

                firstTask.dueDate
                    .localeCompare(
                        secondTask.dueDate
                    )

        );

}



/* ================================================= */
/* SUMMARY CARDS */
/* ================================================= */

function renderProfessorSummary() {

    const courseCount =
        document.getElementById(
            "professorCourseCount"
        );


    const courseworkCount =
        document.getElementById(
            "professorCourseworkCount"
        );


    const upcomingCount =
        document.getElementById(
            "professorUpcomingCount"
        );


    const eventCount =
        document.getElementById(
            "professorEventCount"
        );


    /*
        The entire professor dashboard might not be
        present in some builds.

        If so, rendering safely stops here.
    */

    if (
        !courseCount ||
        !courseworkCount ||
        !upcomingCount ||
        !eventCount
    ) {

        return;

    }


    courseCount.textContent =
        getCourses().length;


    courseworkCount.textContent =
        getTasks().length;


    upcomingCount.textContent =
        getUpcomingTasks().length;


    eventCount.textContent =
        getEvents().length;

}



/* ================================================= */
/* COURSE OVERVIEW ITEM */
/* ================================================= */

function createCourseOverviewItem(
    course
) {

    const tasks =
        getTasksForCourse(
            course.id
        );


    const assignmentCount =
        tasks.filter(
            task =>
                task.type ===
                "assignment"
        ).length;


    const examCount =
        tasks.filter(
            task =>
                task.type ===
                "exam"
        ).length;


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.classList.add(
        "professor-course-item"
    );


    const left =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "h3"
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


    const counts =
        document.createElement(
            "div"
        );


    counts.classList.add(
        "professor-course-counts"
    );


    counts.textContent =
        `${assignmentCount} Assignments • ${examCount} Exams`;


    button.append(
        left,
        counts
    );


    button.addEventListener(
        "click",
        () => {

            openDetails({

                id:
                    course.id,

                source:
                    "course",

                type:
                    "course",

                topic:
                    `${course.code} - ${course.name}`,

                schedule:
                    course.days === "Online"
                        ? "Online"
                        : `${course.days} • ${formatTime(course.time)}`,

                instructor:
                    course.instructor,

                description:
                    `Assignments: ${assignmentCount}\nExams: ${examCount}`

            });

        }
    );


    return button;

}



/* ================================================= */
/* COURSE OVERVIEW */
/* ================================================= */

function renderCourseOverview() {

    const container =
        document.getElementById(
            "professorCourseOverview"
        );


    if (!container) {

        return;

    }


    container.replaceChildren();


    const courses =
        getCourses();


    if (
        courses.length === 0
    ) {

        const message =
            document.createElement(
                "p"
            );


        message.classList.add(
            "empty-message"
        );


        message.textContent =
            "No courses have been created.";


        container.appendChild(
            message
        );


        return;

    }


    courses.forEach(
        course => {

            container.appendChild(
                createCourseOverviewItem(
                    course
                )
            );

        }
    );

}



/* ================================================= */
/* UPCOMING COURSEWORK */
/* ================================================= */

function renderUpcomingCoursework() {

    const container =
        document.getElementById(
            "professorUpcomingWork"
        );


    if (!container) {

        return;

    }


    container.replaceChildren();


    const upcoming =
        getUpcomingTasks()
            .slice(
                0,
                5
            );


    if (
        upcoming.length === 0
    ) {

        const message =
            document.createElement(
                "p"
            );


        message.classList.add(
            "empty-message"
        );


        message.textContent =
            "No upcoming coursework.";


        container.appendChild(
            message
        );


        return;

    }


    upcoming.forEach(
        task => {

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


            button.classList.add(
                "assignment-preview"
            );


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


            const subtitle =
                document.createElement(
                    "p"
                );


            subtitle.textContent =
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
                subtitle
            );


            const date =
                document.createElement(
                    "span"
                );


            date.classList.add(
                "task-date"
            );


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
            );


            container.appendChild(
                button
            );

        }
    );

}



/* ================================================= */
/* WEEK ITEM */
/* ================================================= */

function createWeekItemButton(
    item
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.classList.add(
        "week-item"
    );


    if (
        item.type ===
        "assignment"
    ) {

        button.classList.add(
            "assignment"
        );

    }


    if (
        item.type ===
        "exam"
    ) {

        button.classList.add(
            "exam"
        );

    }


    button.textContent =
        item.topic;


    button.addEventListener(
        "click",
        () => {

            openDetails(
                item
            );

        }
    );


    return button;

}



/* ================================================= */
/* PROFESSOR WEEK */
/* ================================================= */

function renderProfessorWeek() {

    const container =
        document.getElementById(
            "professorWeeklyOverview"
        );


    if (!container) {

        return;

    }


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


        card.classList.add(
            "week-day-card"
        );


        if (
            offset === 0
        ) {

            card.classList.add(
                "today"
            );

        }


        const weekday =
            document.createElement(
                "div"
            );


        weekday.classList.add(
            "week-day-name"
        );


        weekday.textContent =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            );


        const dateLabel =
            document.createElement(
                "div"
            );


        dateLabel.classList.add(
            "week-day-date"
        );


        dateLabel.textContent =
            date.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            );


        card.append(
            weekday,
            dateLabel
        );


        let itemCount =
            0;


        /*
            Display scheduled course meetings.
        */

        courses.forEach(
            course => {

                if (
                    !courseMeetsOnDate(
                        course.days,
                        date
                    )
                ) {

                    return;

                }


                if (
                    itemCount >= 4
                ) {

                    return;

                }


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.classList.add(
                    "week-item"
                );


                button.textContent =
                    `${course.code} ${formatTime(course.time)}`;


                button.addEventListener(
                    "click",
                    () => {

                        openDetails({

                            id:
                                course.id,

                            source:
                                "course",

                            type:
                                "course",

                            topic:
                                `${course.code} - ${course.name}`,

                            schedule:
                                `${course.days} • ${formatTime(course.time)}`,

                            instructor:
                                course.instructor,

                            description:
                                `${getTasksForCourse(course.id).length} coursework items currently tracked.`

                        });

                    }
                );


                card.appendChild(
                    button
                );


                itemCount++;

            }
        );


        /*
            Add events and coursework due on
            the same date.
        */

        const calendarItems =
            getCalendarItemsForDate(
                dateToString(
                    date
                )
            );


        calendarItems.forEach(
            item => {

                if (
                    itemCount >= 4
                ) {

                    return;

                }


                card.appendChild(
                    createWeekItemButton(
                        item
                    )
                );


                itemCount++;

            }
        );


        if (
            itemCount === 0
        ) {

            const empty =
                document.createElement(
                    "span"
                );


            empty.classList.add(
                "empty-message"
            );


            empty.textContent =
                "Clear";


            card.appendChild(
                empty
            );

        }


        container.appendChild(
            card
        );

    }

}



/* ================================================= */
/* PUBLIC PROFESSOR RENDER */
/* ================================================= */

export function renderProfessorDashboard() {

    /*
        If Professor Dashboard is not present,
        no work is necessary.
    */

    if (
        !document.getElementById(
            "professorDashboard"
        )
    ) {

        return;

    }


    renderProfessorSummary();

    renderCourseOverview();

    renderUpcomingCoursework();

    renderProfessorWeek();

}



/* ================================================= */
/* PROFESSOR SETUP */
/* ================================================= */

export function setupProfessorDashboard() {

    setupOptionalButton(
        "professorManageCoursesButton",
        "courses"
    );


    setupOptionalButton(
        "professorCourseworkButton",
        "assignments"
    );


    /*
        Sprint 2 button.

        If it is missing, Professor Dashboard still
        works normally.
    */

    setupOptionalButton(
        "professorGradesButton",
        "grades"
    );


    setupOptionalButton(
        "professorCalendarButton",
        "calendar"
    );

}
