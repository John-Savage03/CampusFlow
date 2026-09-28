/*
    role.js

    Controls Student and Professor view modes.

    This module only manages role-related interface
    changes. Application data remains in state.js.
*/


import {
    getActiveRole,
    setActiveRole
}
from "./state.js";


import {
    refreshCurrentPage
}
from "./navigation.js";


import {
    showMessage
}
from "./feedback.js";



function setText(
    elementId,
    text
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            text;

    }

}



function updateRoleButtons(
    role
) {

    const buttons =
        document.querySelectorAll(
            ".role-button"
        );


    buttons.forEach(
        button => {

            const isActive =
                button.dataset.role ===
                role;


            button.classList.toggle(
                "active",
                isActive
            );


            button.setAttribute(
                "aria-pressed",
                String(
                    isActive
                )
            );

        }
    );

}



function applyStudentLabels() {

    setText(
        "activeRoleLabel",
        "Student View"
    );


    setText(
        "assignmentsNavLabel",
        "Assignments & Exams"
    );


    setText(
        "coursesNavLabel",
        "Courses"
    );


    setText(
        "calendarPageDescription",
        "View your events, assignments, and exams in one location."
    );


    setText(
        "assignmentsPageTitle",
        "Assignment & Exam Tracker"
    );


    setText(
        "assignmentsPageDescription",
        "Track your deadlines, exams, priorities, and progress."
    );


    setText(
        "openTaskModalButton",
        "+ Add Assignment / Exam"
    );


    setText(
        "taskModalTitle",
        "Add Assignment or Exam"
    );


    setText(
        "taskModalDescription",
        "Add coursework to your personal tracker."
    );


    setText(
        "taskSubmitButton",
        "Add"
    );


    setText(
        "coursesPageTitle",
        "My Courses"
    );


    setText(
        "coursesPageDescription",
        "Manage courses you are taking."
    );


    setText(
        "openCourseModalButton",
        "+ Add Course"
    );


    setText(
        "courseModalTitle",
        "Add Course"
    );


    setText(
        "courseModalDescription",
        "Add a course to your student planner."
    );


    setText(
        "courseSubmitButton",
        "Add Course"
    );

}



function applyProfessorLabels() {

    setText(
        "activeRoleLabel",
        "Professor View"
    );


    setText(
        "assignmentsNavLabel",
        "Coursework"
    );


    setText(
        "coursesNavLabel",
        "Course Management"
    );


    setText(
        "calendarPageDescription",
        "View course events, assignment deadlines, and exam dates in one location."
    );


    setText(
        "assignmentsPageTitle",
        "Coursework Management"
    );


    setText(
        "assignmentsPageDescription",
        "Create and review assignments and exams for your courses."
    );


    setText(
        "openTaskModalButton",
        "+ Create Coursework"
    );


    setText(
        "taskModalTitle",
        "Create Assignment or Exam"
    );


    setText(
        "taskModalDescription",
        "Create coursework for one of your courses."
    );


    setText(
        "taskSubmitButton",
        "Create"
    );


    setText(
        "coursesPageTitle",
        "Course Management"
    );


    setText(
        "coursesPageDescription",
        "Manage the courses you teach and their schedules."
    );


    setText(
        "openCourseModalButton",
        "+ Create Course"
    );


    setText(
        "courseModalTitle",
        "Create Course"
    );


    setText(
        "courseModalDescription",
        "Add a course that you teach."
    );


    setText(
        "courseSubmitButton",
        "Create Course"
    );

}



export function applyRoleInterface() {

    const role =
        getActiveRole();


    document.body.dataset.role =
        role;


    updateRoleButtons(
        role
    );


    if (
        role === "professor"
    ) {

        applyProfessorLabels();

    }

    else {

        applyStudentLabels();

    }

}



export function setupRoleSystem(
    refreshApplication
) {

    applyRoleInterface();


    /*
        Resolve the saved role immediately.
        For example, Professor view remains
        active after refreshing the browser.
    */

    refreshCurrentPage();


    const buttons =
        document.querySelectorAll(
            ".role-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const requestedRole =
                        button.dataset.role;


                    if (
                        requestedRole ===
                        getActiveRole()
                    ) {

                        return;

                    }


                    const persisted =
                        setActiveRole(
                            requestedRole
                        );


                    applyRoleInterface();


                    refreshCurrentPage();


                    refreshApplication();


                    const roleName =
                        requestedRole ===
                        "professor"
                            ? "Professor"
                            : "Student";


                    showMessage(

                        persisted
                            ? `${roleName} view activated.`
                            : `${roleName} view activated, but the preference could not be saved.`,

                        persisted
                            ? "success"
                            : "warning"

                    );

                }
            );

        }
    );

}