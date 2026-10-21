/* calendar.js - full/mini calendar plus event creation */

import {
    getCalendarItemsForDate,
    addEvent
}
from "./state.js";


import {
    MONTH_NAMES,
    createDateString,
    createId,
    cleanText,
    cleanMultilineText,
    isValidDateString
}
from "./utils.js";


import {
    openDetails,
    openModal,
    closeModal,
    showMessage
}
from "./ui.js";


let calendarDate =
    new Date();


calendarDate =
    new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth(),
        1
    );


function getMonthInfo() {

    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    return {

        year,

        month,

        firstWeekday:
            new Date(
                year,
                month,
                1
            ).getDay(),

        daysInMonth:
            new Date(
                year,
                month + 1,
                0
            ).getDate(),

        previousDays:
            new Date(
                year,
                month,
                0
            ).getDate()

    };

}


function getCell(
    index,
    info
) {

    let year =
        info.year;


    let month =
        info.month;


    let day;


    let outside =
        false;


    if (
        index <
        info.firstWeekday
    ) {

        day =
            info.previousDays -
            info.firstWeekday +
            index +
            1;


        month--;


        if (
            month < 0
        ) {

            month = 11;

            year--;

        }


        outside =
            true;

    }

    else if (
        index <
        info.firstWeekday +
        info.daysInMonth
    ) {

        day =
            index -
            info.firstWeekday +
            1;

    }

    else {

        day =
            index -
            info.firstWeekday -
            info.daysInMonth +
            1;


        month++;


        if (
            month > 11
        ) {

            month = 0;

            year++;

        }


        outside =
            true;

    }


    return {
        year,
        month,
        day,
        outside
    };

}


function isToday(
    year,
    month,
    day
) {

    const today =
        new Date();


    return (

        today.getFullYear() ===
            year &&

        today.getMonth() ===
            month &&

        today.getDate() ===
            day

    );

}


function createItemButton(
    item,
    mini = false
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        `${
            mini
                ? "mini-item"
                : "calendar-item"
        } ${
            item.type === "assignment" ||
            item.type === "exam"
                ? item.type
                : ""
        }`;


    button.textContent =
        item.title;


    button.title =
        item.title;


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            openDetails(
                item
            );

        }
    );


    return button;

}


function renderFullCalendar() {

    const grid =
        document.getElementById(
            "fullCalendarGrid"
        );


    const heading =
        document.getElementById(
            "currentCalendarMonth"
        );


    if (
        !grid ||
        !heading
    ) {

        return;

    }


    grid.replaceChildren();


    const info =
        getMonthInfo();


    heading.textContent =
        `${MONTH_NAMES[info.month]} ${info.year}`;


    for (
        let index = 0;
        index < 42;
        index++
    ) {

        const cell =
            getCell(
                index,
                info
            );


        const day =
            document.createElement(
                "div"
            );


        day.className =
            `calendar-day${
                cell.outside
                    ? " outside"
                    : ""
            }${
                isToday(
                    cell.year,
                    cell.month,
                    cell.day
                )
                    ? " today"
                    : ""
            }`;


        const number =
            document.createElement(
                "span"
            );


        number.className =
            "calendar-number";


        number.textContent =
            cell.day;


        day.appendChild(
            number
        );


        const items =
            getCalendarItemsForDate(
                createDateString(
                    cell.year,
                    cell.month,
                    cell.day
                )
            );


        items.forEach(
            item => {

                day.appendChild(
                    createItemButton(
                        item
                    )
                );

            }
        );


        grid.appendChild(
            day
        );

    }

}


function renderMiniCalendar() {

    const grid =
        document.getElementById(
            "miniCalendarGrid"
        );


    const heading =
        document.getElementById(
            "miniCalendarMonth"
        );


    if (
        !grid ||
        !heading
    ) {

        return;

    }


    grid.replaceChildren();


    const info =
        getMonthInfo();


    heading.textContent =
        `${MONTH_NAMES[info.month]} ${info.year}`;


    for (
        let index = 0;
        index < 42;
        index++
    ) {

        const cell =
            getCell(
                index,
                info
            );


        const day =
            document.createElement(
                "div"
            );


        day.className =
            `mini-day${
                cell.outside
                    ? " outside"
                    : ""
            }${
                isToday(
                    cell.year,
                    cell.month,
                    cell.day
                )
                    ? " today"
                    : ""
            }`;


        const number =
            document.createElement(
                "span"
            );


        number.className =
            "mini-number";


        number.textContent =
            cell.day;


        day.appendChild(
            number
        );


        getCalendarItemsForDate(
            createDateString(
                cell.year,
                cell.month,
                cell.day
            )
        )
            .slice(
                0,
                2
            )
            .forEach(
                item => {

                    day.appendChild(
                        createItemButton(
                            item,
                            true
                        )
                    );

                }
            );


        grid.appendChild(
            day
        );

    }

}


export function renderCalendar() {

    renderFullCalendar();

    renderMiniCalendar();

}


export function setupCalendar(
    refreshApplication
) {

    document
        .getElementById(
            "previousMonthButton"
        )
        ?.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() - 1,
                        1
                    );


                renderCalendar();

            }
        );


    document
        .getElementById(
            "nextMonthButton"
        )
        ?.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() + 1,
                        1
                    );


                renderCalendar();

            }
        );


    document
        .getElementById(
            "openEventModalButton"
        )
        ?.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        "eventDate"
                    );


                if (input) {

                    const today =
                        new Date();


                    input.value =
                        createDateString(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate()
                        );

                }


                openModal(
                    "eventModal"
                );

            }
        );


    document
        .getElementById(
            "eventForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const topic =
                    cleanText(
                        document.getElementById(
                            "eventTopic"
                        )?.value,
                        60
                    );


                const date =
                    document.getElementById(
                        "eventDate"
                    )?.value || "";


                const description =
                    cleanMultilineText(
                        document.getElementById(
                            "eventDescription"
                        )?.value,
                        500
                    );


                if (!topic) {

                    return showMessage(
                        "Event topic is required.",
                        "error"
                    );

                }


                if (
                    !isValidDateString(
                        date
                    )
                ) {

                    return showMessage(
                        "Choose a valid event date.",
                        "error"
                    );

                }


                if (!description) {

                    return showMessage(
                        "Event description is required.",
                        "error"
                    );

                }


                addEvent({

                    id:
                        createId(
                            "event"
                        ),

                    topic,

                    date,

                    description

                });


                document
                    .getElementById(
                        "eventForm"
                    )
                    .reset();


                closeModal(
                    "eventModal"
                );


                const [
                    year,
                    month
                ] =
                    date
                        .split("-")
                        .map(Number);


                calendarDate =
                    new Date(
                        year,
                        month - 1,
                        1
                    );


                refreshApplication();


                showMessage(
                    "Event created."
                );

            }
        );

}