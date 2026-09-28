/*
    navigation.js

    Handles navigation between CampusFlow pages.

    The Dashboard is role-aware. The logical
    "dashboard" page resolves to either the
    student or professor dashboard.
*/


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



export function getCurrentPage() {

    return currentPage;

}



export function openPage(
    pageName
) {

    const pages =
        document.querySelectorAll(
            ".page"
        );


    const buttons =
        document.querySelectorAll(
            ".nav-button"
        );


    const resolvedPageId =
        resolvePageId(
            pageName
        );


    const selectedPage =
        document.getElementById(
            resolvedPageId
        );


    if (!selectedPage) {

        console.error(
            `Page "${resolvedPageId}" was not found.`
        );


        return;

    }


    currentPage =
        pageName;


    pages.forEach(
        page => {

            page.classList.remove(
                "active-page"
            );

        }
    );


    buttons.forEach(
        button => {

            button.classList.remove(
                "active"
            );

        }
    );


    selectedPage.classList.add(
        "active-page"
    );


    const selectedButton =
        document.querySelector(
            `[data-page="${pageName}"]`
        );


    if (selectedButton) {

        selectedButton.classList.add(
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



export function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-button"
        );


    buttons.forEach(
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


    const calendarButton =
        document.getElementById(
            "openCalendarButton"
        );


    const miniCalendar =
        document.getElementById(
            "miniCalendar"
        );


    const assignmentsButton =
        document.getElementById(
            "viewAssignmentsButton"
        );


    calendarButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            openPage(
                "calendar"
            );

        }
    );


    miniCalendar.addEventListener(
        "click",
        () => {

            openPage(
                "calendar"
            );

        }
    );


    assignmentsButton.addEventListener(
        "click",
        () => {

            openPage(
                "assignments"
            );

        }
    );

}