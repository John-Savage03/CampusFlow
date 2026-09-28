/*
    app.js

    CampusFlow application entry point.

    This file coordinates feature modules
    without containing their internal logic.
*/


import {
    setupNavigation
}
from "./navigation.js";


import {
    renderCalendars,
    setupCalendarControls
}
from "./calendar.js";


import {
    setupEventSystem
}
from "./events.js";


import {
    setupAssignments,
    renderTasks
}
from "./assignments.js";


import {
    setupCourses,
    renderCourses
}
from "./courses.js";


import {
    renderDashboard
}
from "./dashboard.js";


import {
    renderProfessorDashboard,
    setupProfessorDashboard
}
from "./professor.js";


import {
    setupDetailsSystem
}
from "./details.js";


import {
    setupRoleSystem
}
from "./role.js";



function refreshApplication() {

    renderCourses();

    renderTasks();

    renderCalendars();

    renderDashboard();

    renderProfessorDashboard();

}



function startCampusFlow() {

    try {

        setupNavigation();

        setupDetailsSystem();

        setupCalendarControls();

        setupProfessorDashboard();


        setupEventSystem(
            refreshApplication
        );


        setupAssignments(
            refreshApplication
        );


        setupCourses(
            refreshApplication
        );


        setupRoleSystem(
            refreshApplication
        );


        refreshApplication();

    }

    catch (error) {

        console.error(
            "CampusFlow could not start:",
            error
        );


        const message =
            document.getElementById(
                "appMessage"
            );


        if (message) {

            message.textContent =
                "CampusFlow encountered an unexpected startup error.";


            message.className =
                "app-message show error";

        }

    }

}



startCampusFlow();