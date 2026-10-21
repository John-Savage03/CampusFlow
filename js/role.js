/* role.js - student/professor view switching */

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
from "./ui.js";


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function applyLabels(
    role
) {

    if (
        role === "professor"
    ) {

        setText(
            "activeRoleLabel",
            "Professor View"
        );


        setText(
            "assignmentsNavLabel",
            "Coursework"
        );


        setText(
            "gradesNavLabel",
            "Gradebook"
        );


        setText(
            "coursesNavLabel",
            "Course Management"
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
            "gradesPageTitle",
            "Gradebook & Grade Calculator"
        );


        setText(
            "gradesPageDescription",
            "Record course scores, review averages, and calculate projected grades."
        );


        setText(
            "openGradeModalButton",
            "+ Record Grade"
        );


        setText(
            "gradeModalTitle",
            "Record Grade"
        );


        setText(
            "gradeModalDescription",
            "Record a score for one of your courses."
        );


        setText(
            "gradeSubmitButton",
            "Record Grade"
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


        setText(
            "calendarDescription",
            "View course events, assignment deadlines, and exam dates in one place."
        );

    }

    else {

        setText(
            "activeRoleLabel",
            "Student View"
        );


        setText(
            "assignmentsNavLabel",
            "Assignments & Exams"
        );


        setText(
            "gradesNavLabel",
            "Grades"
        );


        setText(
            "coursesNavLabel",
            "Courses"
        );


        setText(
            "assignmentsPageTitle",
            "Assignment & Exam Tracker"
        );


        setText(
            "assignmentsPageDescription",
            "Track deadlines, priorities, and progress."
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
            "Add coursework to your tracker."
        );


        setText(
            "taskSubmitButton",
            "Add"
        );


        setText(
            "gradesPageTitle",
            "Grade Tracker & Calculator"
        );


        setText(
            "gradesPageDescription",
            "Track course grades and calculate the score you need."
        );


        setText(
            "openGradeModalButton",
            "+ Add Grade"
        );


        setText(
            "gradeModalTitle",
            "Add Grade"
        );


        setText(
            "gradeModalDescription",
            "Record a grade for one of your courses."
        );


        setText(
            "gradeSubmitButton",
            "Add Grade"
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
            "Add a course to CampusFlow."
        );


        setText(
            "courseSubmitButton",
            "Add Course"
        );


        setText(
            "calendarDescription",
            "View events, assignments, and exams in one place."
        );

    }

}


export function applyRoleInterface() {

    const role =
        getActiveRole();


    document
        .querySelectorAll(
            ".role-button"
        )
        .forEach(
            button => {

                const active =
                    button.dataset.role ===
                    role;


                button.classList.toggle(
                    "active",
                    active
                );


                button.setAttribute(
                    "aria-pressed",
                    String(
                        active
                    )
                );

            }
        );


    applyLabels(
        role
    );

}


export function setupRoleSystem(
    refreshApplication
) {

    applyRoleInterface();


    document
        .querySelectorAll(
            ".role-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const role =
                            button.dataset.role;


                        if (
                            !role ||
                            role ===
                                getActiveRole()
                        ) {

                            return;

                        }


                        const saved =
                            setActiveRole(
                                role
                            );


                        applyRoleInterface();


                        refreshCurrentPage();


                        refreshApplication();


                        showMessage(

                            `${role === "professor"
                                ? "Professor"
                                : "Student"} view activated.`,

                            saved
                                ? "success"
                                : "warning"

                        );

                    }
                );

            }
        );

}
