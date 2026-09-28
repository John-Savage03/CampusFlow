/*
    details.js

    Controls the shared details modal used by
    events, assignments, exams, and courses.
*/


import {
    formatFullDate
}
from "./utils.js";



export function openDetails(
    item
) {

    const modal =
        document.getElementById(
            "detailsModal"
        );


    const typeElement =
        document.getElementById(
            "detailsType"
        );


    const titleElement =
        document.getElementById(
            "detailsTitle"
        );


    const dateLabel =
        document.getElementById(
            "detailsDateLabel"
        );


    const dateElement =
        document.getElementById(
            "detailsDate"
        );


    const courseLabel =
        document.getElementById(
            "detailsCourseLabel"
        );


    const courseElement =
        document.getElementById(
            "detailsCourse"
        );


    const descriptionElement =
        document.getElementById(
            "detailsDescription"
        );



    if (
        item.source === "course"
    ) {

        typeElement.textContent =
            "COURSE";


        titleElement.textContent =
            item.topic;


        dateLabel.textContent =
            "Schedule";


        dateElement.textContent =
            item.schedule ||
            "No schedule";


        courseLabel.textContent =
            "Instructor";


        courseElement.textContent =
            item.instructor ||
            "Not provided";


        descriptionElement.textContent =
            item.description ||
            "No additional details.";

    }


    else {

        typeElement.textContent =
            item.type
                .toUpperCase();


        titleElement.textContent =
            item.topic;


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


        courseLabel.textContent =
            item.source === "task"
                ? "Course"
                : "Category";


        courseElement.textContent =
            item.courseName ||
            "Personal / General";


        let description =
            item.description ||
            "No description provided.";


        if (
            item.source === "task"
        ) {

            description +=
                `\n\nPriority: ${item.priority}`;

            description +=
                `\nStatus: ${item.status}`;

        }


        descriptionElement.textContent =
            description;

    }



    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}



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



export function setupDetailsSystem() {

    const modal =
        document.getElementById(
            "detailsModal"
        );


    document.getElementById(
        "closeDetailsModalButton"
    ).addEventListener(
        "click",
        closeDetails
    );


    document.getElementById(
        "closeDetailsButton"
    ).addEventListener(
        "click",
        closeDetails
    );


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