/*
    professor.js

    Responsible only for the Professor Dashboard.

    The professor dashboard uses the same shared
    CampusFlow state as the other application features.
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
            (firstTask, secondTask) =>

                firstTask.dueDate
                    .localeCompare(
                        secondTask.dueDate
                    )

        );

}



function renderProfessorSummary() {

    const courses =
        getCourses();


    const tasks =
        getTasks();


    const events =
        getEvents();


    const upcoming =
        getUpcomingTasks();


    document.getElementById(
        "professorCourseCount"
    ).textContent =
        courses.length;


    document.getElementById(
        "professorCourseworkCount"
    ).textContent =
        tasks.length;


    document.getElementById(
        "professorUpcomingCount"
    ).textContent =
        upcoming.length;


    document.getElementById(
        "professorEventCount"
    ).textContent =
        events.length;

}



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



function renderCourseOverview() {

    const container =
        document.getElementById(
            "professorCourseOverview"
        );


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



function renderUpcomingCoursework() {

    const container =
        document.getElementById(
            "professorUpcomingWork"
        );


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



function renderProfessorWeek() {

    const container =
        document.getElementById(
            "professorWeeklyOverview"
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
            Add scheduled course meetings.
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

                        const courseTasks =
                            getTasksForCourse(
                                course.id
                            );


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
                                `${courseTasks.length} coursework items currently tracked.`

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
            Add deadlines and calendar events.
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

            const message =
                document.createElement(
                    "span"
                );


            message.classList.add(
                "empty-message"
            );


            message.textContent =
                "Clear";


            card.appendChild(
                message
            );

        }


        container.appendChild(
            card
        );

    }

}



export function renderProfessorDashboard() {

    renderProfessorSummary();

    renderCourseOverview();

    renderUpcomingCoursework();

    renderProfessorWeek();

}



export function setupProfessorDashboard() {

    document.getElementById(
        "professorManageCoursesButton"
    ).addEventListener(
        "click",
        () => {

            openPage(
                "courses"
            );

        }
    );


    document.getElementById(
        "professorCourseworkButton"
    ).addEventListener(
        "click",
        () => {

            openPage(
                "assignments"
            );

        }
    );


    document.getElementById(
        "professorCalendarButton"
    ).addEventListener(
        "click",
        () => {

            openPage(
                "calendar"
            );

        }
    );

}