/*
    calendar.js

    Renders the full calendar and dashboard
    mini calendar from shared application data.
*/


import {
    getCalendarItemsForDate
}
from "./state.js";


import {
    monthNames,
    createDateString
}
from "./utils.js";


import {
    openDetails
}
from "./details.js";



let calendarDate =
    new Date();


calendarDate =
    new Date(

        calendarDate.getFullYear(),

        calendarDate.getMonth(),

        1

    );



export function getCalendarDate() {

    return new Date(
        calendarDate
    );

}



export function setCalendarMonth(
    year,
    month
) {

    calendarDate =
        new Date(
            year,
            month,
            1
        );


    renderCalendars();

}



function isToday(
    year,
    month,
    day
) {

    const today =
        new Date();


    return (

        today.getFullYear() === year &&

        today.getMonth() === month &&

        today.getDate() === day

    );

}



function getMonthInformation() {

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

        previousMonthDays:
            new Date(
                year,
                month,
                0
            ).getDate()

    };

}



function getCalendarCellData(
    index,
    information
) {

    let day;

    let month =
        information.month;

    let year =
        information.year;

    let outsideMonth =
        false;



    if (
        index <
        information.firstWeekday
    ) {

        day =
            information.previousMonthDays -
            information.firstWeekday +
            index +
            1;


        month--;


        if (
            month < 0
        ) {

            month = 11;

            year--;

        }


        outsideMonth =
            true;

    }


    else if (
        index <
        information.firstWeekday +
        information.daysInMonth
    ) {

        day =
            index -
            information.firstWeekday +
            1;

    }


    else {

        day =
            index -
            (
                information.firstWeekday +
                information.daysInMonth
            ) +
            1;


        month++;


        if (
            month > 11
        ) {

            month = 0;

            year++;

        }


        outsideMonth =
            true;

    }



    return {

        day,
        month,
        year,
        outsideMonth

    };

}



function createCalendarItemButton(
    item,
    mini = false
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.classList.add(
        mini
            ? "mini-event"
            : "calendar-event"
    );


    if (
        item.type ===
        "assignment"
    ) {

        button.classList.add(
            "assignment"
        );

    }


    if (
        item.type ===
        "exam"
    ) {

        button.classList.add(
            "exam"
        );

    }


    /*
        textContent is intentionally used here.
        User-provided values are never inserted
        directly as HTML.
    */

    button.textContent =
        item.topic;


    button.title =
        item.topic;


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


    const title =
        document.getElementById(
            "currentCalendarMonth"
        );


    grid.replaceChildren();


    const information =
        getMonthInformation();


    title.textContent =
        `${monthNames[information.month]} ${information.year}`;



    for (
        let index = 0;
        index < 42;
        index++
    ) {

        const cell =
            getCalendarCellData(
                index,
                information
            );


        const dayElement =
            document.createElement(
                "div"
            );


        dayElement.classList.add(
            "calendar-day"
        );


        if (
            cell.outsideMonth
        ) {

            dayElement.classList.add(
                "outside-month"
            );

        }


        if (
            isToday(
                cell.year,
                cell.month,
                cell.day
            )
        ) {

            dayElement.classList.add(
                "today"
            );

        }


        const number =
            document.createElement(
                "span"
            );


        number.classList.add(
            "calendar-date-number"
        );


        number.textContent =
            cell.day;


        dayElement.appendChild(
            number
        );


        const dateString =
            createDateString(

                cell.year,

                cell.month,

                cell.day

            );


        const items =
            getCalendarItemsForDate(
                dateString
            );


        items.forEach(
            item => {

                dayElement.appendChild(
                    createCalendarItemButton(
                        item
                    )
                );

            }
        );


        grid.appendChild(
            dayElement
        );

    }

}



function renderMiniCalendar() {

    const grid =
        document.getElementById(
            "miniCalendarGrid"
        );


    const title =
        document.getElementById(
            "miniCalendarMonth"
        );


    grid.replaceChildren();


    const information =
        getMonthInformation();


    title.textContent =
        `${monthNames[information.month]} ${information.year}`;



    for (
        let index = 0;
        index < 42;
        index++
    ) {

        const cell =
            getCalendarCellData(
                index,
                information
            );


        const dayElement =
            document.createElement(
                "div"
            );


        dayElement.classList.add(
            "mini-date"
        );


        if (
            cell.outsideMonth
        ) {

            dayElement.classList.add(
                "outside-month"
            );

        }


        if (
            isToday(
                cell.year,
                cell.month,
                cell.day
            )
        ) {

            dayElement.classList.add(
                "today"
            );

        }


        const number =
            document.createElement(
                "span"
            );


        number.classList.add(
            "mini-date-number"
        );


        number.textContent =
            cell.day;


        dayElement.appendChild(
            number
        );


        const dateString =
            createDateString(

                cell.year,

                cell.month,

                cell.day

            );


        const items =
            getCalendarItemsForDate(
                dateString
            );


        items
            .slice(
                0,
                2
            )
            .forEach(
                item => {

                    dayElement.appendChild(
                        createCalendarItemButton(
                            item,
                            true
                        )
                    );

                }
            );


        if (
            items.length > 2
        ) {

            const more =
                document.createElement(
                    "span"
                );


            more.classList.add(
                "mini-more-events"
            );


            more.textContent =
                `+${items.length - 2} more`;


            dayElement.appendChild(
                more
            );

        }


        grid.appendChild(
            dayElement
        );

    }

}



export function renderCalendars() {

    renderFullCalendar();

    renderMiniCalendar();

}



export function setupCalendarControls() {

    document.getElementById(
        "previousMonthButton"
    ).addEventListener(
        "click",
        () => {

            calendarDate =
                new Date(

                    calendarDate.getFullYear(),

                    calendarDate.getMonth() - 1,

                    1

                );


            renderCalendars();

        }
    );


    document.getElementById(
        "nextMonthButton"
    ).addEventListener(
        "click",
        () => {

            calendarDate =
                new Date(

                    calendarDate.getFullYear(),

                    calendarDate.getMonth() + 1,

                    1

                );


            renderCalendars();

        }
    );

}