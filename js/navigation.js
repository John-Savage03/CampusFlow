/* navigation.js - page switching and quick navigation */

import {
    getActiveRole
}
from "./state.js";


let currentPage =
    "dashboard";


function resolvePageId(
    pageName
) {

    if (
        pageName !== "dashboard"
    ) {

        return pageName;

    }


    return getActiveRole() ===
        "professor"
        ? "professorDashboard"
        : "studentDashboard";

}


export function openPage(
    pageName
) {

    const pageId =
        resolvePageId(
            pageName
        );


    const target =
        document.getElementById(
            pageId
        );


    if (!target) {

        console.warn(
            `Page not found: ${pageId}`
        );


        return;

    }


    currentPage =
        pageName;


    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            page => {

                page.classList.remove(
                    "active-page"
                );

            }
        );


    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    target.classList.add(
        "active-page"
    );


    const navButton =
        document.querySelector(
            `[data-page="${pageName}"]`
        );


    if (navButton) {

        navButton.classList.add(
            "active"
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


export function refreshCurrentPage() {

    openPage(
        currentPage
    );

}


function connect(
    id,
    pageName
) {

    const button =
        document.getElementById(
            id
        );


    if (button) {

        button.addEventListener(
            "click",
            () => {

                openPage(
                    pageName
                );

            }
        );

    }

}


export function setupNavigation() {

    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openPage(
                            button.dataset.page
                        );

                    }
                );

            }
        );


    connect(
        "studentViewAssignmentsButton",
        "assignments"
    );


    connect(
        "studentOpenCalendarButton",
        "calendar"
    );


    connect(
        "professorCoursesButton",
        "courses"
    );


    connect(
        "professorAssignmentsButton",
        "assignments"
    );


    connect(
        "professorGradesButton",
        "grades"
    );


    connect(
        "professorCalendarButton",
        "calendar"
    );

}