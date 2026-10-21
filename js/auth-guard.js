/*
    auth-guard.js

    Protects CampusFlow from being opened without
    a valid login session.

    It also:

    - Sets the correct Student/Professor role.
    - Locks Student accounts to Student View.
    - Allows Professor accounts to use the view switcher.
    - Displays the logged-in username.
    - Adds a Log Out button.
*/


import {
    setActiveRole
}
from "./state.js";



/* ================================================= */
/* SESSION SETTINGS */
/* ================================================= */

const SESSION_KEY =
    "campusFlowCurrentUser";



/* ================================================= */
/* READ LOGIN SESSION */
/* ================================================= */

function readSession() {

    try {

        const raw =
            sessionStorage.getItem(
                SESSION_KEY
            );


        if (!raw) {

            return null;

        }


        const user =
            JSON.parse(
                raw
            );


        /*
            Make sure the stored session has the
            minimum information CampusFlow needs.
        */

        if (
            !user ||
            typeof user.username !== "string" ||
            ![
                "student",
                "professor"
            ].includes(
                user.role
            )
        ) {

            return null;

        }


        return user;

    }

    catch (error) {

        console.error(
            "Unable to read login session:",
            error
        );


        return null;

    }

}



/* ================================================= */
/* REQUIRE LOGIN */
/* ================================================= */

export function requireLogin() {

    const user =
        readSession();


    /*
        No valid session means the user must
        return to the login screen.
    */

    if (!user) {

        sessionStorage.removeItem(
            SESSION_KEY
        );


        window.location.replace(
            "login.html"
        );


        return null;

    }


    /*
        IMPORTANT:

        CampusFlow's current state.js uses:

        campusflow-v2-role

        setActiveRole() writes to the correct key,
        fixing the mismatch in the older login code.
    */

    setActiveRole(
        user.role
    );


    return user;

}



/* ================================================= */
/* ACCOUNT INTERFACE */
/* ================================================= */

export function setupAuthenticatedInterface(
    user
) {

    if (!user) {

        return;

    }


    const switcher =
        document.querySelector(
            ".role-switcher"
        );


    /*
        Students stay in Student View.

        Professors keep the switcher because they may
        want to preview the Student interface.
    */

    if (switcher) {

        switcher.style.display =
            user.role === "student"
                ? "none"
                : "";

    }


    /*
        Prevent duplicate account controls.
    */

    if (
        document.getElementById(
            "accountPanel"
        )
    ) {

        return;

    }


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (!sidebar) {

        return;

    }



    /* ================================================= */
    /* ACCOUNT PANEL STYLES */
    /* ================================================= */

    const style =
        document.createElement(
            "style"
        );


    style.textContent =
        `

        .account-panel {
            margin-top: 22px;
            padding-top: 16px;
            border-top: 1px solid #4b5563;
        }


        .account-user {
            display: block;
            color: #f9fafb;
            font-size: 13px;
            font-weight: 700;
            overflow-wrap: anywhere;
        }


        .account-role {
            display: block;
            margin-top: 3px;
            color: #9ca3af;
            font-size: 11px;
            text-transform: capitalize;
        }


        .logout-button {
            width: 100%;
            margin-top: 10px;
            padding: 11px 12px;
            border: 1px solid #4b5563;
            border-radius: 8px;
            background: transparent;
            color: #d1d5db;
            text-align: left;
            cursor: pointer;
        }


        .logout-button:hover {
            background: #374151;
        }

    `;


    document.head.appendChild(
        style
    );



    /* ================================================= */
    /* ACCOUNT PANEL */
    /* ================================================= */

    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "accountPanel";


    panel.className =
        "account-panel";



    /* USERNAME */

    const username =
        document.createElement(
            "span"
        );


    username.className =
        "account-user";


    username.textContent =
        user.username;



    /* ROLE */

    const role =
        document.createElement(
            "span"
        );


    role.className =
        "account-role";


    role.textContent =
        `${user.role} account`;



    /* LOGOUT BUTTON */

    const logout =
        document.createElement(
            "button"
        );


    logout.type =
        "button";


    logout.className =
        "logout-button";


    logout.textContent =
        "Log Out";


    logout.addEventListener(
        "click",
        () => {

            sessionStorage.removeItem(
                SESSION_KEY
            );


            window.location.replace(
                "login.html"
            );

        }
    );


    panel.append(
        username,
        role,
        logout
    );


    sidebar.appendChild(
        panel
    );

}