/*
    feedback.js

    Provides consistent success/error messages
    instead of scattered alert() calls.
*/


let messageTimer =
    null;



export function showMessage(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "appMessage"
        );


    if (!element) {

        return;

    }


    if (messageTimer) {

        clearTimeout(
            messageTimer
        );

    }


    element.textContent =
        message;


    element.className =
        `app-message show ${type}`;


    messageTimer =
        setTimeout(
            () => {

                element.className =
                    "app-message";

            },
            3000
        );

}