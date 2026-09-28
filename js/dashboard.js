/*
    dashboard.js

    Builds the Dashboard and Weekly Overview
    from the same data used by the other features.
*/


import {
    getTasks,
    getCourses,
    getCourseById,
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

                const dueDate =
                    parseDateString(
                        task.dueDate
                    );


                return (

                    dueDate >= today &&

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



function renderSummaryCards() {

    const tasks =
        getTasks();


    const upcoming =
        getUpcomingTasks();


    const completed =
        tasks.filter(
            task =>
                task.status ===
                "Completed"
        );


    document.getElementById(
        "dashboardUpcomingCount"
    ).textContent =
        upcoming.length;


    document.getElementById(
        "dashboardCourseCount"
    ).textContent =
        getCourses().length;


    document.getElementById(
        "dashboardCompletedCount"
    ).textContent =
        completed.length;


    const nextDeadline =
        upcoming[0];


    if (
        nextDeadline
    ) {

        document.getElementById(
            "dashboardNextDeadline"
        ).textContent =
            nextDeadline.title;


        document.getElementById(
            "dashboardNextDeadlineDate"
        ).textContent =
            formatDate(
                nextDeadline.dueDate
            );

    }

    else {

        document.getElementById(
            "dashboardNextDeadline"
        ).textContent =
            "None";


        document.getElementById(
            "dashboardNextDeadlineDate"
        ).textContent =
            "No upcoming work";

    }

}



function renderUpcomingList() {

    const container =
        document.getElementById(
            "dashboardUpcomingList"
        );


    container.replaceChildren();


    const upcoming =
        getUpcomingTasks()
            .slice(
                0,
                4
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
            "Nothing due soon.";


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



function renderTodaySchedule() {

    const container =
        document.getElementById(
            "dashboardTodaySchedule"
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
                (firstCourse, secondCourse) =>

                    firstCourse.time
                        .localeCompare(
                            secondCourse.time
                        )

            );


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
            "No classes scheduled today.";


        container.appendChild(
            message
        );


        return;

    }


    courses.forEach(
        course => {

            const item =
                document.createElement(
                    "div"
                );


            item.classList.add(
                "schedule-item"
            );


            const time =
                document.createElement(
                    "span"
                );


            time.classList.add(
                "schedule-time"
            );


            time.textContent =
                formatTime(
                    course.time
                );


            const details =
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


            details.append(
                name,
                code
            );


            item.append(
                time,
                details
            );


            container.appendChild(
                item
            );

        }
    );

}



function renderWeeklyOverview() {

    const container =
        document.getElementById(
            "weeklyOverview"
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


        const dateString =
            dateToString(
                date
            );


        const items =
            getCalendarItemsForDate(
                dateString
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


        if (
            items.length === 0
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


        else {

            items
                .slice(
                    0,
                    3
                )
                .forEach(
                    item => {

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


                        card.appendChild(
                            button
                        );

                    }
                );

        }


        container.appendChild(
            card
        );

    }

}



export function renderDashboard() {

    renderSummaryCards();

    renderUpcomingList();

    renderTodaySchedule();

    renderWeeklyOverview();

}