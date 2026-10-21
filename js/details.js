/*
    details.js

    PURPOSE:
    Controls the shared Details modal.

    Instead of creating different detail windows for:
    - Courses
    - Events
    - Assignments
    - Exams

    CampusFlow reuses one modal and changes its
    labels/content based on the selected item.
*/


/* Date formatting helper */
import {
    formatFullDate
}
from "./utils.js";



/*
    openDetails()

    Receives one normalized item object and
    fills the shared modal with its information.
*/
export function openDetails(
    item
) {

    /* Main modal element */
    const modal =
        document.getElementById(
            "detailsModal"
        );


    /* Item type label */
    const typeElement =
        document.getElementById(
            "detailsType"
        );


    /* Item title */
    const titleElement =
        document.getElementById(
            "detailsTitle"
        );


    /* First detail heading */
    const dateLabel =
        document.getElementById(
            "detailsDateLabel"
        );


    /* First detail value */
    const dateElement =
        document.getElementById(
            "detailsDate"
        );


    /* Second detail heading */
    const courseLabel =
        document.getElementById(
            "detailsCourseLabel"
        );


    /* Second detail value */
    const courseElement =
        document.getElementById(
            "detailsCourse"
        );


    /* Main description */
    const descriptionElement =
        document.getElementById(
            "detailsDescription"
        );



    /* ================================================= */
    /* COURSE DETAILS */
    /* ================================================= */

    /*
        Courses use different labels than
        assignments/events.
    */
    if (
        item.source === "course"
    ) {

        typeElement.textContent =
            "COURSE";


        titleElement.textContent =
            item.topic;


        /*
            First field is Schedule instead of Date.
        */
        dateLabel.textContent =
            "Schedule";


        dateElement.textContent =
            item.schedule ||
            "No schedule";


        /*
            Second field is Instructor instead of Course.
        */
        courseLabel.textContent =
            "Instructor";


        courseElement.textContent =
            item.instructor ||
            "Not provided";


        descriptionElement.textContent =
            item.description ||
            "No additional details.";

    }


    /* ================================================= */
    /* EVENT / ASSIGNMENT / EXAM DETAILS */
    /* ================================================= */

    else {

        /*
            Display:
            EVENT
            ASSIGNMENT
            EXAM
        */
        typeElement.textContent =
            item.type
                .toUpperCase();


        titleElement.textContent =
            item.topic;


        /*
            Coursework uses Due Date.
            Events use Date.
        */
        dateLabel.textContent =
            item.source === "task"
                ? "Due Date"
                : "Date";


        dateElement.textContent =
            item.date
                ? formatFullDate(
                    item.date
                )
                : "No date";


        /*
            Coursework displays Course.
            Normal events display Category.
        */
        courseLabel.textContent =
            item.source === "task"
                ? "Course"
                : "Category";


        courseElement.textContent =
            item.courseName ||
            "Personal / General";


        /*
            Start with the normal description.
        */
        let description =
            item.description ||
            "No description provided.";


        /*
            Assignments and exams additionally show
            priority and current status.
        */
        if (
            item.source === "task"
        ) {

            description +=
                `\n\nPriority: ${item.priority}`;

            description +=
                `\nStatus: ${item.status}`;

        }


        /*
            textContent prevents description text
            from being interpreted as HTML.
        */
        descriptionElement.textContent =
            description;

    }



    /*
        Make the modal visible.
    */
    modal.classList.add(
        "show"
    );


    /*
        Update accessibility state.
    */
    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}



/*
    closeDetails()

    Hides the shared details window.
*/
export function closeDetails() {

    const modal =
        document.getElementById(
            "detailsModal"
        );


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}



/*
    setupDetailsSystem()

    Connects all ways the details modal can close:
    - X button
    - Close button
    - Clicking outside modal
    - Escape key
*/
export function setupDetailsSystem() {

    const modal =
        document.getElementById(
            "detailsModal"
        );


    /* X button */
    document.getElementById(
        "closeDetailsModalButton"
    ).addEventListener(
        "click",
        closeDetails
    );


    /* Bottom Close button */
    document.getElementById(
        "closeDetailsButton"
    ).addEventListener(
        "click",
        closeDetails
    );


    /*
        Clicking the dark overlay closes the modal.

        Clicking inside the white modal does not,
        because event.target would not equal modal.
    */
    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeDetails();

            }

        }
    );


    /* Escape key support */
    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeDetails();

            }

        }
    );

}