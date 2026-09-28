/*
    events.js

    Handles creating calendar events.
*/


import {
    addEvent
}
from "./state.js";


import {
    createDateString,
    createId
}
from "./utils.js";


import {
    cleanText,
    cleanMultilineText,
    validateEvent
}
from "./validation.js";


import {
    getCalendarDate,
    setCalendarMonth
}
from "./calendar.js";


import {
    openDetails
}
from "./details.js";


import {
    showMessage
}
from "./feedback.js";



function openEventModal() {

    const modal =
        document.getElementById(
            "eventModal"
        );


    const viewedDate =
        getCalendarDate();


    const today =
        new Date();


    let day =
        1;


    if (

        today.getFullYear() ===
            viewedDate.getFullYear() &&

        today.getMonth() ===
            viewedDate.getMonth()

    ) {

        day =
            today.getDate();

    }


    document.getElementById(
        "eventDate"
    ).value =
        createDateString(

            viewedDate.getFullYear(),

            viewedDate.getMonth(),

            day

        );


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.getElementById(
        "eventTopic"
    ).focus();

}



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


    document.getElementById(
        "eventForm"
    ).reset();

}



export function setupEventSystem(
    refreshApplication
) {

    const modal =
        document.getElementById(
            "eventModal"
        );


    document.getElementById(
        "openEventModalButton"
    ).addEventListener(
        "click",
        openEventModal
    );


    document.getElementById(
        "closeEventModalButton"
    ).addEventListener(
        "click",
        closeEventModal
    );


    document.getElementById(
        "cancelEventButton"
    ).addEventListener(
        "click",
        closeEventModal
    );


    document.getElementById(
        "eventForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


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


            const errors =
                validateEvent(
                    newEvent
                );


            if (
                errors.length > 0
            ) {

                showMessage(
                    errors[0],
                    "error"
                );


                return;

            }


            const persisted =
                addEvent(
                    newEvent
                );


            const [
                year,
                month
            ] =
                newEvent.date
                    .split("-")
                    .map(Number);


            setCalendarMonth(
                year,
                month - 1
            );


            closeEventModal();


            refreshApplication();


            showMessage(
                persisted
                    ? "Event created."
                    : "Event created, but browser storage was unavailable.",
                persisted
                    ? "success"
                    : "warning"
            );


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