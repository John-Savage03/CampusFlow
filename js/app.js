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

import { 
    getTasks 
} 
from "./state.js";


/* ================================================= */
/* COURSE HUB PLACEHOLDER */
/* ================================================= */

let renderCourseHub =
    () => {};


let renderBulkMaterials =
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


    runSafely(
        "Bulk materials render",
        () => {

            Promise
                .resolve(
                    renderBulkMaterials()
                )
                .catch(
                    error => {

                        console.error(
                            "Bulk materials render failed:",
                            error
                        );

                    }
                );

        }
    );

}



/* ================================================= */
/* LOAD COURSE HUB */
/* ================================================= */

async function loadBulkMaterialsFeature() {

    try {

        const module =
            await import(
                "./bulk-materials.js"
            );


        if (
            typeof module.renderBulkMaterials ===
            "function"
        ) {

            renderBulkMaterials =
                module.renderBulkMaterials;

        }


        if (
            typeof module.setupBulkMaterials ===
            "function"
        ) {

            await module.setupBulkMaterials();

        }


        await renderBulkMaterials();

    }

    catch (error) {

        console.error(
            "Bulk material upload could not load:",
            error
        );

    }

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
        Load bulk file uploads after Course Hub
        has created its page and controls.
    */

    await loadBulkMaterialsFeature();


    /*
        Final refresh after Course Hub loads.
    */

    refreshApplication();

    //notification

    runSafely("Assignment reminders", () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const reminders = getTasks().filter(task => {
            if (!task.dueDate || task.status === "Completed") {
                return false;
            }

            const due = new Date(task.dueDate + "T00:00:00");

            return due >= today && due <= tomorrow;
        });
        
        //notification popup
        if (reminders.length > 0) {
        const box = document.createElement("div");

        box.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #DBEAFE;
            color: #172554;
            padding: 20px;
            border: 2px solid #2563EB;
            border-radius: 8px;
            z-index: 9999;
            max-width: 320px;
            box-shadow: 0 4px 12px #0002;
        `;

        const title = document.createElement("h3");
        title.textContent =
            `Assignment Reminders (${reminders.length})`;
        box.appendChild(title);

        const todayTasks = reminders.filter(task =>
            task.dueDate === localDate(today)
        );

        const tomorrowTasks = reminders.filter(task =>
            task.dueDate === localDate(tomorrow)
        );

        function localDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }

        function addGroup(label, tasks) {
            if (tasks.length === 0) return;

            const heading = document.createElement("h4");
            heading.textContent = label;
            box.appendChild(heading);

            tasks.forEach(task => {
                const item = document.createElement("p");
                item.textContent = "• " + task.title;
                item.style.margin = "6px 0";
                box.appendChild(item);
            });
        }

        addGroup("Due Today", todayTasks);
        addGroup("Due Tomorrow", tomorrowTasks);

        const close = document.createElement("button");
        close.textContent = "OK";
        close.style.marginTop = "12px";
        close.onclick = () => box.remove();

        box.appendChild(close);
        document.body.appendChild(box);
    }
    });
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