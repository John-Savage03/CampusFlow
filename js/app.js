/*
    app.js

    CampusFlow application entry point.

    Existing CampusFlow features load normally.
    Authentication is checked before the interface is initialized.

    Course Hub remains isolated so a Course Hub error
    cannot break the rest of the application.
*/


import {
    requireLogin,
    setupAuthenticatedInterface
}
from "./auth-guard.js";


import {
    setupUI
}
from "./ui.js";


import {
    setupNavigation
}
from "./navigation.js";


import {
    setupRoleSystem
}
from "./role.js";


import {
    setupCalendar,
    renderCalendar
}
from "./calendar.js";


import {
    setupAssignments,
    renderAssignments
}
from "./assignments.js";


import {
    setupCourses,
    renderCourses
}
from "./courses.js";


import {
    setupGrades,
    renderGrades
}
from "./grades.js";


import {
    renderDashboards
}
from "./dashboard.js";



/* ================================================= */
/* COURSE HUB PLACEHOLDER */
/* ================================================= */

let renderCourseHub =
    () => {};



/* ================================================= */
/* SAFE FEATURE RUNNER */
/* ================================================= */

function runSafely(
    name,
    callback
) {

    try {

        callback();

    }

    catch (error) {

        console.error(
            `${name} failed:`,
            error
        );

    }

}



/* ================================================= */
/* REFRESH APPLICATION */
/* ================================================= */

export function refreshApplication() {

    runSafely(
        "Courses render",
        renderCourses
    );


    runSafely(
        "Assignments render",
        renderAssignments
    );


    runSafely(
        "Grades render",
        renderGrades
    );


    runSafely(
        "Calendar render",
        renderCalendar
    );


    runSafely(
        "Dashboard render",
        renderDashboards
    );


    runSafely(
        "Course Hub render",
        renderCourseHub
    );

}



/* ================================================= */
/* LOAD COURSE HUB */
/* ================================================= */

async function loadCourseHubFeature() {

    try {

        const module =
            await import(
                "./coursehub.js"
            );


        if (
            typeof module.renderCourseHub ===
            "function"
        ) {

            renderCourseHub =
                module.renderCourseHub;

        }


        if (
            typeof module.setupCourseHub ===
            "function"
        ) {

            module.setupCourseHub(
                refreshApplication
            );

        }


        renderCourseHub();

    }

    catch (error) {

        console.error(
            "Course Hub could not load:",
            error
        );

    }

}



/* ================================================= */
/* START CAMPUSFLOW */
/* ================================================= */

async function startCampusFlow() {

    /*
        Require a valid login before starting
        the CampusFlow interface.

        The role saved with the account is also
        applied before the Student/Professor
        interface is rendered.
    */

    const user =
        requireLogin();


    if (!user) {

        return;

    }


    runSafely(
        "UI setup",
        setupUI
    );


    runSafely(
        "Navigation setup",
        setupNavigation
    );


    runSafely(
        "Calendar setup",
        () => {

            setupCalendar(
                refreshApplication
            );

        }
    );


    runSafely(
        "Assignments setup",
        () => {

            setupAssignments(
                refreshApplication
            );

        }
    );


    runSafely(
        "Courses setup",
        () => {

            setupCourses(
                refreshApplication
            );

        }
    );


    runSafely(
        "Grades setup",
        () => {

            setupGrades(
                refreshApplication
            );

        }
    );


    runSafely(
        "Role setup",
        () => {

            setupRoleSystem(
                refreshApplication
            );

        }
    );


    /*
        Adds the logged-in username, role,
        and Log Out button to the sidebar.
    */

    runSafely(
        "Account interface setup",
        () => {

            setupAuthenticatedInterface(
                user
            );

        }
    );


    /*
        Render the original working application.
    */

    refreshApplication();


    /*
        Load Course Hub separately.
    */

    await loadCourseHubFeature();


    /*
        Final refresh after Course Hub loads.
    */

    refreshApplication();

}



/* ================================================= */
/* RUN APPLICATION */
/* ================================================= */

startCampusFlow()
    .catch(
        error => {

            console.error(
                "CampusFlow startup error:",
                error
            );

        }
    );