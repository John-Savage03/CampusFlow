/*
    events.js

    PURPOSE:
    Controls creation of personal/general calendar events.

    Responsibilities:
    - Open Create Event modal
    - Choose a default date
    - Validate input
    - Save event to state
    - Move calendar to event month
    - Refresh application
    - Open newly created event details
*/


/* Add event to central state */
import {
    addEvent
}
from "./state.js";


/* ID and date helpers */
import {
    createDateString,
    createId
}
from "./utils.js";


/* Input cleaning and validation */
import {
    cleanText,
    cleanMultilineText,
    validateEvent
}
from "./validation.js";


/* Calendar controls */
import {
    getCalendarDate,
    setCalendarMonth
}
from "./calendar.js";


/* Shared details window */
import {
    openDetails
}
from "./details.js";


/* User feedback messages */
import {
    showMessage
}
from "./feedback.js";



/* ================================================= */
/* OPEN EVENT MODAL */
/* ================================================= */

function openEventModal() {

    const modal =
        document.getElementById(
            "eventModal"
        );


    /*
        Determine which month is currently being viewed.
    */
    const viewedDate =
        getCalendarDate();


    const today =
        new Date();


    /*
        Default to day 1 when looking at a month
        other than the current real month.
    */
    let day =
        1;


    /*
        If the user is viewing the current month,
        default the form to today's date.
    */
    if (

        today.getFullYear() ===
            viewedDate.getFullYear() &&

        today.getMonth() ===
            viewedDate.getMonth()

    ) {

        day =
            today.getDate();

    }


    /*
        Set the date input before showing modal.
    */
    document.getElementById(
        "eventDate"
    ).value =
        createDateString(

            viewedDate.getFullYear(),

            viewedDate.getMonth(),

            day

        );


    /*
        Display modal.
    */
    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    /*
        Place cursor directly in Event Topic.
    */
    document.getElementById(
        "eventTopic"
    ).focus();

}



/* ================================================= */
/* CLOSE EVENT MODAL */
/* ================================================= */

function closeEventModal() {

    const modal =
        document.getElementById(
            "eventModal"
        );


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    /*
        Clear previous form values.
    */
    document.getElementById(
        "eventForm"
    ).reset();

}



/* ================================================= */
/* EVENT SYSTEM SETUP */
/* ================================================= */

/*
    refreshApplication is passed from app.js.

    This allows events.js to request a complete refresh
    without needing to import every other feature module.
*/
export function setupEventSystem(
    refreshApplication
) {

    const modal =
        document.getElementById(
            "eventModal"
        );


    /* Open modal */
    document.getElementById(
        "openEventModalButton"
    ).addEventListener(
        "click",
        openEventModal
    );


    /* X close button */
    document.getElementById(
        "closeEventModalButton"
    ).addEventListener(
        "click",
        closeEventModal
    );


    /* Cancel button */
    document.getElementById(
        "cancelEventButton"
    ).addEventListener(
        "click",
        closeEventModal
    );


    /* ================================================= */
    /* CREATE EVENT */
    /* ================================================= */

    document.getElementById(
        "eventForm"
    ).addEventListener(
        "submit",
        event => {

            /*
                Prevent browser page refresh.
            */
            event.preventDefault();


            /*
                Build event object from form input.

                Input is cleaned before validation/storage.
            */
            const newEvent = {

                id:
                    createId(
                        "event"
                    ),

                topic:
                    cleanText(
                        document.getElementById(
                            "eventTopic"
                        ).value,
                        60
                    ),

                date:
                    document.getElementById(
                        "eventDate"
                    ).value,

                description:
                    cleanMultilineText(
                        document.getElementById(
                            "eventDescription"
                        ).value,
                        500
                    )

            };


            /*
                Run centralized event validation.
            */
            const errors =
                validateEvent(
                    newEvent
                );


            /*
                Show first error and stop if invalid.
            */
            if (
                errors.length > 0
            ) {

                showMessage(
                    errors[0],
                    "error"
                );


                return;

            }


            /*
                Add event to central state and localStorage.
            */
            const persisted =
                addEvent(
                    newEvent
                );


            /*
                Extract year/month from event date.
            */
            const [
                year,
                month
            ] =
                newEvent.date
                    .split("-")
                    .map(Number);


            /*
                Move calendar to the newly created
                event's month.
            */
            setCalendarMonth(
                year,
                month - 1
            );


            /*
                Close creation form.
            */
            closeEventModal();


            /*
                Refresh dashboards, calendar, etc.
            */
            refreshApplication();


            /*
                Tell user whether browser persistence worked.
            */
            showMessage(
                persisted
                    ? "Event created."
                    : "Event created, but browser storage was unavailable.",
                persisted
                    ? "success"
                    : "warning"
            );


            /*
                Immediately show the created event.
            */
            openDetails({

                id:
                    newEvent.id,

                source:
                    "event",

                type:
                    "event",

                topic:
                    newEvent.topic,

                date:
                    newEvent.date,

                description:
                    newEvent.description,

                courseName:
                    "Personal / General"

            });

        }
    );


    /* ================================================= */
    /* BACKGROUND CLICK CLOSE */
    /* ================================================= */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeEventModal();

            }

        }
    );


    /* ================================================= */
    /* ESCAPE KEY CLOSE */
    /* ================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeEventModal();

            }

        }
    );

}
