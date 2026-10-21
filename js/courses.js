/* courses.js - course management */

import {
    getCourses,
    getTasksForCourse,
    addCourse
}
from "./state.js";


import {
    createId,
    cleanText,
    formatTime
}
from "./utils.js";


import {
    openModal,
    closeModal,
    openDetails,
    showMessage
}
from "./ui.js";


function scheduleText(
    course
) {

    return course.days === "Online"
        ? "Online"
        : `${course.days} • ${formatTime(course.time)}`;

}


export function renderCourses() {

    const grid =
        document.getElementById(
            "courseGrid"
        );


    if (!grid) {

        return;

    }


    grid.replaceChildren();


    const courses =
        getCourses();


    courses.forEach(
        course => {

            const tasks =
                getTasksForCourse(
                    course.id
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "course-card";


            const accent =
                document.createElement(
                    "div"
                );


            accent.className =
                "course-accent";


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
                scheduleText(
                    course
                );


            const footer =
                document.createElement(
                    "div"
                );


            footer.className =
                "course-footer";


            const count =
                document.createElement(
                    "span"
                );


            count.textContent =
                `${tasks.length} coursework item${
                    tasks.length === 1
                        ? ""
                        : "s"
                }`;


            const view =
                document.createElement(
                    "button"
                );


            view.type =
                "button";


            view.textContent =
                "View Course";


            view.addEventListener(
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
                            scheduleText(
                                course
                            ),

                        instructor:
                            course.instructor,

                        description:
                            `${tasks.length} coursework items are currently linked to this course.`

                    });

                }
            );


            footer.append(
                count,
                view
            );


            card.append(
                accent,
                code,
                name,
                instructor,
                schedule,
                footer
            );


            grid.appendChild(
                card
            );

        }
    );

}


function updateTimeRequirement() {

    const days =
        document.getElementById(
            "courseDays"
        )?.value;


    const time =
        document.getElementById(
            "courseTime"
        );


    if (!time) {

        return;

    }


    const online =
        days === "Online";


    time.disabled =
        online;


    time.required =
        !online;


    if (online) {

        time.value =
            "";

    }

}


export function setupCourses(
    refreshApplication
) {

    document
        .getElementById(
            "courseDays"
        )
        ?.addEventListener(
            "change",
            updateTimeRequirement
        );


    updateTimeRequirement();


    document
        .getElementById(
            "openCourseModalButton"
        )
        ?.addEventListener(
            "click",
            () => {

                openModal(
                    "courseModal"
                );

            }
        );


    document
        .getElementById(
            "courseForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const code =
                    cleanText(
                        document.getElementById(
                            "courseCode"
                        )?.value,
                        20
                    ).toUpperCase();


                const name =
                    cleanText(
                        document.getElementById(
                            "courseName"
                        )?.value,
                        80
                    );


                const instructor =
                    cleanText(
                        document.getElementById(
                            "courseInstructor"
                        )?.value,
                        80
                    );


                const days =
                    document.getElementById(
                        "courseDays"
                    )?.value || "";


                const time =
                    days === "Online"
                        ? ""
                        : (
                            document.getElementById(
                                "courseTime"
                            )?.value || ""
                        );


                if (
                    !code ||
                    !name ||
                    !instructor
                ) {

                    return showMessage(
                        "Complete all required course fields.",
                        "error"
                    );

                }


                if (
                    days !== "Online" &&
                    !/^([01]\d|2[0-3]):[0-5]\d$/.test(
                        time
                    )
                ) {

                    return showMessage(
                        "Choose a valid meeting time.",
                        "error"
                    );

                }


                if (
                    getCourses().some(
                        course =>
                            course.code.toLowerCase() ===
                            code.toLowerCase()
                    )
                ) {

                    return showMessage(
                        "That course code already exists.",
                        "warning"
                    );

                }


                addCourse({

                    id:
                        createId(
                            "course"
                        ),

                    code,

                    name,

                    instructor,

                    days,

                    time

                });


                document
                    .getElementById(
                        "courseForm"
                    )
                    .reset();


                updateTimeRequirement();


                closeModal(
                    "courseModal"
                );


                refreshApplication();


                showMessage(
                    "Course added."
                );

            }
        );

}