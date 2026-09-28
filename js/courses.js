/*
    courses.js

    Handles course creation and
    course management rendering.
*/


import {
    getCourses,
    getTasksForCourse,
    addCourse
}
from "./state.js";


import {
    createId,
    formatTime
}
from "./utils.js";


import {
    cleanText,
    validateCourse
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



function getScheduleText(
    course
) {

    if (
        course.days === "Online"
    ) {

        return "Online";

    }


    return (
        `${course.days} • ${formatTime(course.time)}`
    );

}



function createCourseCard(
    course
) {

    const tasks =
        getTasksForCourse(
            course.id
        );


    const card =
        document.createElement(
            "article"
        );


    card.classList.add(
        "course-card"
    );


    const colorBar =
        document.createElement(
            "div"
        );


    colorBar.classList.add(
        "course-color"
    );


    const code =
        document.createElement(
            "h2"
        );


    code.textContent =
        course.code;


    const name =
        document.createElement(
            "h3"
        );


    name.textContent =
        course.name;


    const instructor =
        document.createElement(
            "p"
        );


    instructor.textContent =
        `Instructor: ${course.instructor}`;


    const schedule =
        document.createElement(
            "p"
        );


    schedule.textContent =
        getScheduleText(
            course
        );


    const footer =
        document.createElement(
            "div"
        );


    footer.classList.add(
        "course-footer"
    );


    const itemCount =
        document.createElement(
            "span"
        );


    itemCount.textContent =
        `${tasks.length} ${
            tasks.length === 1
                ? "Item"
                : "Items"
        }`;


    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";


    viewButton.textContent =
        "View Course";


    viewButton.addEventListener(
        "click",
        () => {

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
                    getScheduleText(
                        course
                    ),

                instructor:
                    course.instructor,

                description:
                    `Assignments: ${assignmentCount}\nExams: ${examCount}`

            });

        }
    );


    footer.append(
        itemCount,
        viewButton
    );


    card.append(
        colorBar,
        code,
        name,
        instructor,
        schedule,
        footer
    );


    return card;

}



export function renderCourses() {

    const grid =
        document.getElementById(
            "courseGrid"
        );


    grid.replaceChildren();


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


        grid.appendChild(
            message
        );


        return;

    }


    courses.forEach(
        course => {

            grid.appendChild(
                createCourseCard(
                    course
                )
            );

        }
    );

}



function updateCourseTimeInput() {

    const schedule =
        document.getElementById(
            "courseDays"
        ).value;


    const timeInput =
        document.getElementById(
            "courseTime"
        );


    const isOnline =
        schedule === "Online";


    timeInput.disabled =
        isOnline;


    timeInput.required =
        !isOnline;


    if (
        isOnline
    ) {

        timeInput.value =
            "";

    }

}



function openCourseModal() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    updateCourseTimeInput();


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.getElementById(
        "courseCode"
    ).focus();

}



function closeCourseModal() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.getElementById(
        "courseForm"
    ).reset();


    updateCourseTimeInput();

}



export function setupCourses(
    refreshApplication
) {

    const modal =
        document.getElementById(
            "courseModal"
        );


    document.getElementById(
        "courseDays"
    ).addEventListener(
        "change",
        updateCourseTimeInput
    );


    document.getElementById(
        "openCourseModalButton"
    ).addEventListener(
        "click",
        openCourseModal
    );


    document.getElementById(
        "closeCourseModalButton"
    ).addEventListener(
        "click",
        closeCourseModal
    );


    document.getElementById(
        "cancelCourseButton"
    ).addEventListener(
        "click",
        closeCourseModal
    );


    document.getElementById(
        "courseForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const schedule =
                document.getElementById(
                    "courseDays"
                ).value;


            const course = {

                id:
                    createId(
                        "course"
                    ),

                code:
                    cleanText(
                        document.getElementById(
                            "courseCode"
                        ).value,
                        20
                    ).toUpperCase(),

                name:
                    cleanText(
                        document.getElementById(
                            "courseName"
                        ).value,
                        80
                    ),

                instructor:
                    cleanText(
                        document.getElementById(
                            "courseInstructor"
                        ).value,
                        80
                    ),

                days:
                    schedule,

                time:
                    schedule === "Online"
                        ? ""
                        : document.getElementById(
                            "courseTime"
                        ).value

            };


            const errors =
                validateCourse(
                    course
                );


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
                addCourse(
                    course
                );


            closeCourseModal();


            refreshApplication();


            showMessage(
                persisted
                    ? "Course added."
                    : "Course added, but browser storage was unavailable.",
                persisted
                    ? "success"
                    : "warning"
            );

        }
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeCourseModal();

            }

        }
    );


    updateCourseTimeInput();

}