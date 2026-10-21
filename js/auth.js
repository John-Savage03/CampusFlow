/*
    auth.js

    Handles both:

    - signup.html
    - login.html

    CampusFlow accounts are stored locally in the
    browser for this class-project prototype.

    Passwords are not stored directly.

    PBKDF2 + SHA-256 is used to create a salted
    password hash before the account is saved.
*/


(function () {

    "use strict";



    /* ================================================= */
    /* SETTINGS */
    /* ================================================= */

    const USERS_KEY =
        "campusFlowUsers";


    const SESSION_KEY =
        "campusFlowCurrentUser";


    /*
        IMPORTANT:

        This is the role storage key used by the
        CURRENT version of CampusFlow state.js.
    */

    const ROLE_KEY =
        "campusflow-v2-role";


    const PBKDF2_ROUNDS =
        600000;


    const MIN_PASSWORD_LENGTH =
        8;


    const HOME_PAGE =
        "index.html";



    /* ================================================= */
    /* DETECT PAGE */
    /* ================================================= */

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    const signUpForm =
        document.getElementById(
            "signUpForm"
        );


    /*
        If someone is already logged in and manually
        visits login.html or signup.html, return them
        to CampusFlow.
    */

    if (
        (
            loginForm ||
            signUpForm
        ) &&
        sessionStorage.getItem(
            SESSION_KEY
        )
    ) {

        window.location.replace(
            HOME_PAGE
        );


        return;

    }



    /* ================================================= */
    /* MESSAGE HELPER */
    /* ================================================= */

    function showMessage(
        text,
        success = false
    ) {

        const message =
            document.getElementById(
                "message"
            );


        if (!message) {

            return;

        }


        message.textContent =
            text;


        message.classList.toggle(
            "success",
            success
        );

    }



    /* ================================================= */
    /* ACCOUNT STORAGE */
    /* ================================================= */

    function getUsers() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        USERS_KEY
                    ) || "[]"
                );


            return Array.isArray(
                saved
            )
                ? saved
                : [];

        }

        catch (error) {

            console.error(
                "Unable to load accounts:",
                error
            );


            return [];

        }

    }



    function saveUsers(
        users
    ) {

        try {

            localStorage.setItem(
                USERS_KEY,
                JSON.stringify(
                    users
                )
            );


            return true;

        }

        catch (error) {

            console.error(
                "Unable to save accounts:",
                error
            );


            return false;

        }

    }



    /* ================================================= */
    /* BYTE / HEX HELPERS */
    /* ================================================= */

    function toHex(
        bytes
    ) {

        return Array
            .from(
                bytes,
                byte =>
                    byte
                        .toString(16)
                        .padStart(
                            2,
                            "0"
                        )
            )
            .join("");

    }



    function fromHex(
        text
    ) {

        if (
            typeof text !== "string" ||
            text.length % 2 !== 0 ||
            !/^[0-9a-f]+$/i.test(
                text
            )
        ) {

            throw new Error(
                "Invalid password salt."
            );

        }


        const bytes =
            new Uint8Array(
                text.length / 2
            );


        for (
            let index = 0;
            index < bytes.length;
            index++
        ) {

            bytes[index] =
                parseInt(
                    text.slice(
                        index * 2,
                        index * 2 + 2
                    ),
                    16
                );

        }


        return bytes;

    }



    /* ================================================= */
    /* PASSWORD HASH */
    /* ================================================= */

    async function makeHash(
        password,
        salt,
        rounds
    ) {

        /*
            Web Crypto requires a secure context.

            localhost / Live Server works.
        */

        if (
            !window.crypto ||
            !crypto.subtle
        ) {

            throw new Error(
                "Web Crypto is unavailable. Open CampusFlow through Live Server."
            );

        }


        const passwordBytes =
            new TextEncoder()
                .encode(
                    password
                );


        const key =
            await crypto.subtle.importKey(

                "raw",

                passwordBytes,

                "PBKDF2",

                false,

                [
                    "deriveBits"
                ]

            );


        const bits =
            await crypto.subtle.deriveBits(

                {

                    name:
                        "PBKDF2",

                    salt,

                    iterations:
                        rounds,

                    hash:
                        "SHA-256"

                },

                key,

                256

            );


        return toHex(
            new Uint8Array(
                bits
            )
        );

    }



    /* ================================================= */
    /* START LOGIN SESSION */
    /* ================================================= */

    function startSession(
        user
    ) {

        /*
            sessionStorage means the user remains
            logged in for the current browser tab/session.
        */

        sessionStorage.setItem(

            SESSION_KEY,

            JSON.stringify({

                username:
                    user.username,

                role:
                    user.role

            })

        );


        /*
            Also update CampusFlow's Student/Professor
            role storage.
        */

        localStorage.setItem(

            ROLE_KEY,

            JSON.stringify(
                user.role
            )

        );

    }



    /* ================================================= */
    /* SIGNUP PAGE */
    /* ================================================= */

    if (signUpForm) {

        const passwordInput =
            document.getElementById(
                "CreatePassword"
            );


        const retypeInput =
            document.getElementById(
                "RetypePassword"
            );



        function checkPasswords() {

            if (
                !passwordInput ||
                !retypeInput
            ) {

                return;

            }


            retypeInput.setCustomValidity(

                passwordInput.value ===
                retypeInput.value

                    ? ""

                    : "Passwords do not match."

            );

        }



        passwordInput
            ?.addEventListener(
                "input",
                checkPasswords
            );


        retypeInput
            ?.addEventListener(
                "input",
                checkPasswords
            );



        signUpForm.addEventListener(

            "submit",

            async event => {

                event.preventDefault();


                showMessage("");


                const username =
                    document
                        .getElementById(
                            "CreateUsername"
                        )
                        ?.value
                        .trim() || "";


                const password =
                    passwordInput
                        ?.value || "";


                const retype =
                    retypeInput
                        ?.value || "";


                const role =
                    document
                        .getElementById(
                            "Role"
                        )
                        ?.value || "";



                /* ---------------- VALIDATION ---------------- */

                if (
                    username.length < 3
                ) {

                    return showMessage(
                        "Username must be at least 3 characters."
                    );

                }


                if (
                    username.length > 40
                ) {

                    return showMessage(
                        "Username must be 40 characters or less."
                    );

                }


                if (
                    password.length <
                    MIN_PASSWORD_LENGTH
                ) {

                    return showMessage(
                        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
                    );

                }


                if (
                    password !==
                    retype
                ) {

                    return showMessage(
                        "Passwords do not match."
                    );

                }


                if (
                    ![
                        "student",
                        "professor"
                    ].includes(
                        role
                    )
                ) {

                    return showMessage(
                        "Choose a valid account role."
                    );

                }



                /* ---------------- DUPLICATE USERNAME ---------------- */

                const users =
                    getUsers();


                if (
                    users.some(
                        user =>
                            user.username
                                .toLowerCase() ===
                            username
                                .toLowerCase()
                    )
                ) {

                    return showMessage(
                        "That username is already taken."
                    );

                }



                const button =
                    document.getElementById(
                        "SignUpButton"
                    );


                if (button) {

                    button.disabled =
                        true;

                }



                /* ---------------- CREATE ACCOUNT ---------------- */

                try {

                    const salt =
                        crypto.getRandomValues(
                            new Uint8Array(
                                16
                            )
                        );


                    const hash =
                        await makeHash(

                            password,

                            salt,

                            PBKDF2_ROUNDS

                        );


                    const user = {

                        username,

                        role,

                        salt:
                            toHex(
                                salt
                            ),

                        rounds:
                            PBKDF2_ROUNDS,

                        hash,

                        createdAt:
                            new Date()
                                .toISOString()

                    };


                    users.push(
                        user
                    );


                    if (
                        !saveUsers(
                            users
                        )
                    ) {

                        throw new Error(
                            "Account storage failed."
                        );

                    }


                    /*
                        Log the new user in immediately.
                    */

                    startSession(
                        user
                    );


                    window.location.replace(
                        HOME_PAGE
                    );

                }

                catch (error) {

                    console.error(
                        error
                    );


                    showMessage(
                        "Unable to create the account. Make sure CampusFlow is open with Live Server."
                    );


                    if (button) {

                        button.disabled =
                            false;

                    }

                }

            }

        );

    }



    /* ================================================= */
    /* LOGIN PAGE */
    /* ================================================= */

    if (loginForm) {

        loginForm.addEventListener(

            "submit",

            async event => {

                event.preventDefault();


                showMessage("");


                const username =
                    document
                        .getElementById(
                            "Username"
                        )
                        ?.value
                        .trim() || "";


                const password =
                    document
                        .getElementById(
                            "Password"
                        )
                        ?.value || "";


                /*
                    Find username without making
                    capitalization matter.
                */

                const user =
                    getUsers()
                        .find(
                            savedUser =>

                                savedUser.username
                                    .toLowerCase() ===

                                username
                                    .toLowerCase()

                        );


                /*
                    Use the same message for an invalid
                    username and password.
                */

                if (!user) {

                    return showMessage(
                        "Wrong username or password."
                    );

                }



                const button =
                    document.getElementById(
                        "LoginButton"
                    );


                if (button) {

                    button.disabled =
                        true;

                }



                try {

                    const rounds =
                        Number.isInteger(
                            user.rounds
                        )
                            ? user.rounds
                            : PBKDF2_ROUNDS;


                    const attempt =
                        await makeHash(

                            password,

                            fromHex(
                                user.salt
                            ),

                            rounds

                        );


                    if (
                        attempt !==
                        user.hash
                    ) {

                        showMessage(
                            "Wrong username or password."
                        );


                        if (button) {

                            button.disabled =
                                false;

                        }


                        return;

                    }


                    /*
                        Correct login.
                    */

                    startSession(
                        user
                    );


                    window.location.replace(
                        HOME_PAGE
                    );

                }

                catch (error) {

                    console.error(
                        error
                    );


                    showMessage(
                        "Unable to log in. Make sure CampusFlow is open with Live Server."
                    );


                    if (button) {

                        button.disabled =
                            false;

                    }

                }

            }

        );

    }

})();
