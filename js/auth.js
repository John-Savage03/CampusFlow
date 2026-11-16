/*
    auth.js

    CampusFlow cloud-first authentication.

    When the server has cloud accounts configured:
    - signup creates a server account
    - login uses the server
    - an existing browser-only account can be promoted
      automatically after its local password verifies

    When cloud accounts are not configured, the original
    browser-only behavior remains available for development.
*/

(function () {

    const USERS_KEY =
        "campusFlowUsers";


    const SESSION_KEY =
        "campusFlowCurrentUser";


    const ROLE_KEY =
        "campusflow-v2-role";


    const PBKDF2_ROUNDS =
        600000;


    const MIN_PASSWORD_LENGTH =
        8;


    const HOME_PAGE =
        "index.html";


    const loginForm =
        document.getElementById(
            "loginForm"
        );


    const signUpForm =
        document.getElementById(
            "signUpForm"
        );


    let cloudConfigured =
        false;



    function showMessage(
        message,
        success = false
    ) {

        const element =
            document.getElementById(
                "message"
            );


        if (!element) {

            return;

        }


        element.textContent =
            message;


        element.classList.toggle(
            "success",
            success
        );

    }



    async function api(
        url,
        options = {}
    ) {

        const response =
            await fetch(
                url,
                {
                    credentials:
                        "same-origin",

                    ...options,

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})
                    }
                }
            );


        let body =
            {};


        try {

            body =
                await response.json();

        }

        catch {

            body =
                {};

        }


        return {
            response,
            body
        };

    }



    function getUsers() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        USERS_KEY
                    ) ||
                    "[]"
                );


            return Array.isArray(
                saved
            )
                ? saved
                : [];

        }

        catch {

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

        catch {

            return false;

        }

    }



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
            typeof text !==
                "string" ||
            text.length % 2 !==
                0 ||
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



    async function makeHash(
        password,
        salt,
        rounds
    ) {

        if (
            !window.crypto ||
            !crypto.subtle
        ) {

            throw new Error(
                "Web Crypto is unavailable."
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



    function startSession(
        user
    ) {

        const publicUser = {
            username:
                user.username,

            role:
                user.role
        };


        sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify(
                publicUser
            )
        );


        localStorage.setItem(
            ROLE_KEY,
            JSON.stringify(
                user.role
            )
        );

    }



    async function findVerifiedLocalUser(
        username,
        password
    ) {

        const user =
            getUsers()
                .find(
                    item =>
                        String(
                            item.username
                        )
                            .toLowerCase() ===
                        String(
                            username
                        )
                            .toLowerCase()
                );


        if (!user) {

            return null;

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


            return attempt ===
                user.hash
                    ? user
                    : null;

        }

        catch {

            return null;

        }

    }



    async function createLocalAccount({
        username,
        password,
        role
    }) {

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

            throw new Error(
                "That username is already taken."
            );

        }


        const salt =
            crypto.getRandomValues(
                new Uint8Array(
                    16
                )
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
            hash:
                await makeHash(
                    password,
                    salt,
                    PBKDF2_ROUNDS
                ),
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


        return user;

    }



    async function detectCloud() {

        try {

            const {
                response,
                body
            } =
                await api(
                    "/api/cloud/status"
                );


            cloudConfigured =
                response.ok &&
                Boolean(
                    body.configured
                );


            if (
                cloudConfigured
            ) {

                const me =
                    await api(
                        "/api/auth/me"
                    );


                if (
                    me.response.ok &&
                    me.body.user
                ) {

                    startSession(
                        me.body.user
                    );


                    window.location.replace(
                        HOME_PAGE
                    );

                }

            }

        }

        catch {

            cloudConfigured =
                false;

        }

    }



    if (
        signUpForm
    ) {

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


            retypeInput
                .setCustomValidity(
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


                showMessage(
                    ""
                );


                const username =
                    document
                        .getElementById(
                            "CreateUsername"
                        )
                        ?.value
                        .trim() ||
                    "";


                const password =
                    passwordInput
                        ?.value ||
                    "";


                const retype =
                    retypeInput
                        ?.value ||
                    "";


                const role =
                    document
                        .getElementById(
                            "Role"
                        )
                        ?.value ||
                    "";


                if (
                    username.length < 3 ||
                    username.length > 40
                ) {

                    return showMessage(
                        "Username must be between 3 and 40 characters."
                    );

                }


                if (
                    password.length <
                    MIN_PASSWORD_LENGTH
                ) {

                    return showMessage(
                        "Password must be at least 8 characters."
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


                const button =
                    document.getElementById(
                        "SignUpButton"
                    );


                if (button) {

                    button.disabled =
                        true;

                }


                try {

                    let user;


                    if (
                        cloudConfigured
                    ) {

                        const result =
                            await api(
                                "/api/auth/signup",
                                {
                                    method:
                                        "POST",

                                    body:
                                        JSON.stringify({
                                            username,
                                            password,
                                            role
                                        })
                                }
                            );


                        if (
                            !result.response.ok
                        ) {

                            throw new Error(
                                result.body.message ||
                                "Unable to create the account."
                            );

                        }


                        user =
                            result.body.user;

                    }

                    else {

                        user =
                            await createLocalAccount({
                                username,
                                password,
                                role
                            });

                    }


                    startSession(
                        user
                    );


                    window.location.replace(
                        HOME_PAGE
                    );

                }

                catch (error) {

                    showMessage(
                        error.message ||
                        "Unable to create the account."
                    );


                    if (button) {

                        button.disabled =
                            false;

                    }

                }

            }
        );

    }



    if (
        loginForm
    ) {

        loginForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                showMessage(
                    ""
                );


                const username =
                    document
                        .getElementById(
                            "Username"
                        )
                        ?.value
                        .trim() ||
                    "";


                const password =
                    document
                        .getElementById(
                            "Password"
                        )
                        ?.value ||
                    "";


                const button =
                    document.getElementById(
                        "LoginButton"
                    );


                if (button) {

                    button.disabled =
                        true;

                }


                try {

                    let user =
                        null;


                    if (
                        cloudConfigured
                    ) {

                        const result =
                            await api(
                                "/api/auth/login",
                                {
                                    method:
                                        "POST",

                                    body:
                                        JSON.stringify({
                                            username,
                                            password
                                        })
                                }
                            );


                        if (
                            result.response.ok
                        ) {

                            user =
                                result.body.user;

                        }

                        else if (
                            result.response.status ===
                            401
                        ) {

                            /*
                                Existing browser-only account migration.

                                Verify the old local password first.
                                If correct, create the same account in
                                the cloud and continue normally.
                            */

                            const localUser =
                                await findVerifiedLocalUser(
                                    username,
                                    password
                                );


                            if (
                                localUser
                            ) {

                                const migration =
                                    await api(
                                        "/api/auth/signup",
                                        {
                                            method:
                                                "POST",

                                            body:
                                                JSON.stringify({
                                                    username:
                                                        localUser.username,

                                                    password,

                                                    role:
                                                        localUser.role
                                                })
                                        }
                                    );


                                if (
                                    migration.response.ok
                                ) {

                                    user =
                                        migration.body.user;

                                }

                            }

                        }

                    }

                    else {

                        user =
                            await findVerifiedLocalUser(
                                username,
                                password
                            );

                    }


                    if (!user) {

                        showMessage(
                            "Wrong username or password."
                        );


                        if (button) {

                            button.disabled =
                                false;

                        }


                        return;

                    }


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
                        "Unable to log in."
                    );


                    if (button) {

                        button.disabled =
                            false;

                    }

                }

            }
        );

    }



    detectCloud();

})();
