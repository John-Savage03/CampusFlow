/*
    feedback.js

    PURPOSE:
    Provides one consistent system for temporary
    user messages.

    Examples:
    - "Course added."
    - "Status updated."
    - "Invalid due date."
*/


/*
    Holds the currently running timer.

    Keeping the timer allows a new message to replace
    the previous message without multiple timers
    interfering with each other.
*/
let messageTimer =
    null;



/*
    showMessage()

    Parameters:
    message = text shown to user
    type    = success, error, or warning

    Default type is success.
*/
export function showMessage(
    message,
    type = "success"
) {

    /*
        Locate the message element defined in index.html.
    */
    const element =
        document.getElementById(
            "appMessage"
        );


    /*
        Safely exit if the element does not exist.
    */
    if (!element) {

        return;

    }


    /*
        Cancel the previous hide timer if another
        message is already being displayed.
    */
    if (messageTimer) {

        clearTimeout(
            messageTimer
        );

    }


    /*
        textContent safely displays the message as text.
    */
    element.textContent =
        message;


    /*
        CSS classes control visibility and color.
    */
    element.className =
        `app-message show ${type}`;


    /*
        Hide the message automatically after 3 seconds.
    */
    messageTimer =
        setTimeout(
            () => {

                element.className =
                    "app-message";

            },
            3000
        );

}
