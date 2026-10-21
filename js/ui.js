/* ui.js - shared modal, notification, and details helpers */

import {
    formatFullDate
}
from "./utils.js";


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
            2800
        );

}


export function openModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


export function closeModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


export function openDetails(
    item
) {

    const modal =
        document.getElementById(
            "detailsModal"
        );


    if (!modal) {

        return;

    }


    const type =
        document.getElementById(
            "detailsType"
        );


    const title =
        document.getElementById(
            "detailsTitle"
        );


    const dateLabel =
        document.getElementById(
            "detailsDateLabel"
        );


    const date =
        document.getElementById(
            "detailsDate"
        );


    const courseLabel =
        document.getElementById(
            "detailsCourseLabel"
        );


    const course =
        document.getElementById(
            "detailsCourse"
        );


    const description =
        document.getElementById(
            "detailsDescription"
        );


    type.textContent =
        String(
            item.type ||
            item.source ||
            "DETAILS"
        ).toUpperCase();


    title.textContent =
        item.title ||
        item.topic ||
        "Details";


    if (
        item.source === "course"
    ) {

        dateLabel.textContent =
            "Schedule";


        date.textContent =
            item.schedule ||
            "Not provided";


        courseLabel.textContent =
            "Instructor";


        course.textContent =
            item.instructor ||
            "Not provided";

    }

    else {

        dateLabel.textContent =
            item.source === "task"
                ? "Due Date"
                : "Date";


        date.textContent =
            item.date
                ? formatFullDate(
                    item.date
                )
                : "Not provided";


        courseLabel.textContent =
            "Course";


        course.textContent =
            item.courseName ||
            "Personal / General";

    }


    description.textContent =
        item.description ||
        "No description provided.";


    openModal(
        "detailsModal"
    );

}


export function setupUI() {

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        closeModal(
                            button.dataset.closeModal
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            closeModal(
                                modal.id
                            );

                        }

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                document
                    .querySelectorAll(
                        ".modal-overlay.show"
                    )
                    .forEach(
                        modal =>
                            closeModal(
                                modal.id
                            )
                    );

            }

        }
    );

}
