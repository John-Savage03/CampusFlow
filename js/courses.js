/*
    courses.js

    Handles:

    - displaying courses
    - adding courses
    - viewing course details
    - deleting courses
*/


import {
    getCourses,
    getCourseById,
    getTasksForCourse,
    addCourse,
    deleteCourse
}
from "./state.js";


import {
    createId,
    formatTime
}
from "./utils.js";


import {
    openDetails
}
from "./details.js";


import {
    showMessage
}
from "./feedback.js";



/* ================================================= */
/* REFRESH CALLBACK */
/* ================================================= */

let refreshApplicationCallback =
    null;



/* ================================================= */
/* CLEAN TEXT */
/* ================================================= */

function cleanText(
    value,
    maxLength
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .slice(
            0,
            maxLength
        );

}



/* ================================================= */
/* COURSE DETAILS */
/* ================================================= */

function openCourseDetails(
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


    openDetails({

        id:
            course.id,

        source:
            "course",

        type:
            "course",

        topic:
            `${course.code} - ${course.name}`,

        title:
            `${course.code} - ${course.name}`,

        instructor:
            course.instructor,

        schedule:
            course.days === "Online"
                ? "Online"
                : `${course.days} • ${formatTime(course.time)}`,

        description:
            `Instructor: ${course.instructor}\n\nAssignments: ${assignmentCount}\nExams: ${examCount}`

    });

}



/* ================================================= */
/* DELETE COURSE */
/* ================================================= */

function removeCourse(
    course
) {

    const coursework =
        getTasksForCourse(
            course.id
        );


    /*
        Do not allow a course to be deleted while
        assignments or exams are still attached.

        Otherwise those tasks would point to a
        course that no longer exists.
    */

    if (
        coursework.length > 0
    ) {

        showMessage(
            `This course still has ${coursework.length} assignment/exam item(s). Remove those first before deleting the course.`,
            "warning"
        );


        return;

    }


    const confirmed =
        window.confirm(
            `Are you sure you want to delete ${course.code} - ${course.name}?`
        );


    if (!confirmed) {

        return;

    }


    const success =
        deleteCourse(
            course.id
        );


    if (!success) {

        showMessage(
            "Unable to delete the course.",
            "error"
        );


        return;

    }


    /*
        Refresh every area of CampusFlow so the
        Dashboard, Assignments, Materials, etc.
        immediately know the course is gone.
    */

    if (
        typeof refreshApplicationCallback ===
        "function"
    ) {

        refreshApplicationCallback();

    }

    else {

        renderCourses();

    }


    showMessage(
        `${course.code} deleted.`,
        "success"
    );

}



/* ================================================= */
/* EMPTY COURSE MESSAGE */
/* ================================================= */

function createEmptyMessage() {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        "empty-message";


    message.textContent =
        "No courses have been added yet.";


    return message;

}



/* ================================================= */
/* RENDER COURSES */
/* ================================================= */

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



    /* ================================================= */
    /* NO COURSES */
    /* ================================================= */

    if (
        courses.length === 0
    ) {

        grid.appendChild(
            createEmptyMessage()
        );


        return;

    }



    /* ================================================= */
    /* COURSE CARDS */
    /* ================================================= */

    courses.forEach(
        course => {

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



            /* ---------------- CARD ---------------- */

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "course-card";



            /* ---------------- HEADER ---------------- */

            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "course-card-header";



            const titleArea =
                document.createElement(
                    "div"
                );


            const code =
                document.createElement(
                    "span"
                );


            code.className =
                "course-code";


            code.textContent =
                course.code;



            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                course.name;


            titleArea.append(
                code,
                name
            );


            header.appendChild(
                titleArea
            );



            /* ---------------- DETAILS ---------------- */

            const details =
                document.createElement(
                    "div"
                );


            details.className =
                "course-card-details";



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
                course.days === "Online"
                    ? "Schedule: Online"
                    : `Schedule: ${course.days} • ${formatTime(course.time)}`;



            const coursework =
                document.createElement(
                    "p"
                );


            coursework.textContent =
                `${assignmentCount} assignment${
                    assignmentCount === 1
                        ? ""
                        : "s"
                } • ${examCount} exam${
                    examCount === 1
                        ? ""
                        : "s"
                }`;


            details.append(
                instructor,
                schedule,
                coursework
            );



            /* ================================================= */
            /* BUTTON AREA */
            /* ================================================= */

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "course-card-actions";


            /*
                Inline layout is used so you do not
                have to change existing CSS just to
                make the feature work.
            */

            actions.style.display =
                "flex";


            actions.style.alignItems =
                "center";


            actions.style.gap =
                "10px";


            actions.style.flexWrap =
                "wrap";


            actions.style.marginTop =
                "16px";



            /* ---------------- VIEW BUTTON ---------------- */

            const viewButton =
                document.createElement(
                    "button"
                );


            viewButton.type =
                "button";


            viewButton.className =
                "secondary-button";


            viewButton.textContent =
                "View Course";


            viewButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    openCourseDetails(
                        course
                    );

                }
            );



            /* ---------------- DELETE BUTTON ---------------- */

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "course-delete-button";


            deleteButton.textContent =
                "Delete Course";


            /*
                Style here so the button works even
                before adding anything to main.css.
            */

            deleteButton.style.padding =
                "8px 14px";


            deleteButton.style.border =
                "1px solid #dc2626";


            deleteButton.style.borderRadius =
                "6px";


            deleteButton.style.background =
                "transparent";


            deleteButton.style.color =
                "#dc2626";


            deleteButton.style.fontWeight =
                "600";


            deleteButton.style.cursor =
                "pointer";


            deleteButton.addEventListener(
                "mouseenter",
                () => {

                    deleteButton.style.background =
                        "#dc2626";


                    deleteButton.style.color =
                        "white";

                }
            );


            deleteButton.addEventListener(
                "mouseleave",
                () => {

                    deleteButton.style.background =
                        "transparent";


                    deleteButton.style.color =
                        "#dc2626";

                }
            );


            deleteButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    removeCourse(
                        course
                    );

                }
            );


            actions.append(
                viewButton,
                deleteButton
            );



            /* ================================================= */
            /* BUILD CARD */
            /* ================================================= */

            card.append(
                header,
                details,
                actions
            );



            /*
                Clicking somewhere else on the card
                opens the course details.
            */

            card.addEventListener(
                "click",
                () => {

                    openCourseDetails(
                        course
                    );

                }
            );


            grid.appendChild(
                card
            );

        }
    );

}



/* ================================================= */
/* OPEN COURSE MODAL */
/* ================================================= */

function openCourseModal() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.getElementById(
        "courseCode"
    )?.focus();

}



/* ================================================= */
/* CLOSE COURSE MODAL */
/* ================================================= */

function closeCourseModal() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.getElementById(
        "courseForm"
    )?.reset();

}



/* ================================================= */
/* SETUP COURSE SYSTEM */
/* ================================================= */

export function setupCourses(
    refreshApplication
) {

    /*
        Save app.js refreshApplication so course
        deletion and creation can refresh everything.
    */

    refreshApplicationCallback =
        refreshApplication;



    const modal =
        document.getElementById(
            "courseModal"
        );


    const form =
        document.getElementById(
            "courseForm"
        );



    /* ================================================= */
    /* OPEN MODAL */
    /* ================================================= */

    document.getElementById(
        "openCourseModalButton"
    )?.addEventListener(
        "click",
        openCourseModal
    );



    /* ================================================= */
    /* CLOSE MODAL BUTTON */
    /* ================================================= */

    document.getElementById(
        "closeCourseModalButton"
    )?.addEventListener(
        "click",
        closeCourseModal
    );



    /* ================================================= */
    /* CANCEL BUTTON */
    /* ================================================= */

    document.getElementById(
        "cancelCourseButton"
    )?.addEventListener(
        "click",
        closeCourseModal
    );



    /* ================================================= */
    /* ADD COURSE */
    /* ================================================= */

    form?.addEventListener(
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
                document.getElementById(
                    "courseTime"
                )?.value || "";



            /* ---------------- VALIDATION ---------------- */

            if (!code) {

                showMessage(
                    "Course code is required.",
                    "error"
                );


                return;

            }


            if (!name) {

                showMessage(
                    "Course name is required.",
                    "error"
                );


                return;

            }


            if (!instructor) {

                showMessage(
                    "Instructor is required.",
                    "error"
                );


                return;

            }


            if (!days) {

                showMessage(
                    "Choose a meeting schedule.",
                    "error"
                );


                return;

            }


            if (
                days !== "Online" &&
                !time
            ) {

                showMessage(
                    "Choose a meeting time.",
                    "error"
                );


                return;

            }



            /* ================================================= */
            /* PREVENT DUPLICATE COURSE CODE */
            /* ================================================= */

            const duplicate =
                getCourses().some(
                    course =>
                        course.code
                            .toLowerCase() ===
                        code.toLowerCase()
                );


            if (duplicate) {

                showMessage(
                    `${code} is already in your course list.`,
                    "warning"
                );


                return;

            }



            /* ================================================= */
            /* CREATE COURSE */
            /* ================================================= */

            const newCourse = {

                id:
                    createId(
                        "course"
                    ),

                code,

                name,

                instructor,

                days,

                /*
                    Keep a time value even for Online
                    courses so existing validation
                    continues to accept the object.
                */

                time:
                    time || "00:00"

            };


            const saved =
                addCourse(
                    newCourse
                );


            closeCourseModal();



            if (
                typeof refreshApplicationCallback ===
                "function"
            ) {

                refreshApplicationCallback();

            }

            else {

                renderCourses();

            }


            showMessage(
                saved
                    ? "Course added."
                    : "Course added, but browser storage was unavailable.",
                saved
                    ? "success"
                    : "warning"
            );

        }
    );



    /* ================================================= */
    /* CLOSE MODAL BY CLICKING BACKDROP */
    /* ================================================= */

    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeCourseModal();

            }

        }
    );

}