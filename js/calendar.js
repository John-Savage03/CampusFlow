/* calendar.js - full/mini calendar plus event creation */

import {
    getCalendarItemsForDate,
    updateEvent,
    addEvent,
    getEvents,
    getActiveRole
}
from "./state.js";


import {
    MONTH_NAMES,
    createDateString,
    createId,
    cleanText,
    cleanMultilineText,
    isValidDateString,
    formatTime
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

/* ================================================= */
/* OFFICE HOURS & MEETING SCHEDULER */
/* ================================================= */

/* "14:30" -> 870 (minutes since midnight). Makes times easy to compare. */
function toMinutes(time) {

    const [hour, minute] = time.split(":").map(Number);

    return hour * 60 + minute;

}

/* 870 -> "14:30" (turns minutes back into a time) */
function toTime(totalMinutes) {

    const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minute = String(totalMinutes % 60).padStart(2, "0");

    return `${hour}:${minute}`;

}


function setupOfficeHours(refreshApplication) {

    const form = document.getElementById("officeForm");

    /* ---------- ACTIVATION: professor clicks the button ---------- */
    document.getElementById("openOfficeModalButton")?.addEventListener("click", () => {

        /* Only professors can schedule office hours. */
        if (getActiveRole() !== "professor") {

            showMessage("Switch to Professor view to schedule office hours.", "warning");
            return;

        }

        form.reset();
        openModal("officeModal");

    });


    /* ---------- ACTION: professor submits the form ---------- */
    form?.addEventListener("submit", event => {

        event.preventDefault();

        /* INPUT: read everything from the form */
        const kind = document.getElementById("officeType").value;   /* "office-hours" or "meeting" */
        const date = document.getElementById("officeDate").value;
        const startTime = document.getElementById("officeStart").value;
        const length = Number(document.getElementById("officeLength").value);
        const student = cleanText(document.getElementById("officeStudent").value, 30);
        const purpose = cleanText(document.getElementById("officePurpose").value, 80);

        /* Meetings need a student and a purpose */
        if (kind === "meeting" && (!student || !purpose)) {

            showMessage("Add the student and the purpose for a meeting.", "error");
            return;

        }

        /* Work out when it starts and ends (in minutes) */
        const start = toMinutes(startTime);
        const end = start + length;

        if (end > 24 * 60) {

            showMessage("The time must end before midnight.", "error");
            return;

        }

        /* RESERVE CHECK: is that time already taken?
           - a meeting blocks any overlapping time
           - open office hours cannot overlap other office hours
           - a meeting CAN be booked inside open office hours */
        const taken = getEvents().some(item =>

            item.date === date &&
            item.kind &&
            start < toMinutes(item.endTime) &&
            end > toMinutes(item.startTime) &&
            (item.kind === "meeting" || kind === "office-hours")

        );

        if (taken) {

            showMessage("That time is already reserved. Pick another time.", "error");
            return;

        }

        /* Build the calendar entry */
        const endTime = toTime(end);

        const topic = cleanText(
            kind === "meeting"
                ? `Meeting: ${student} (${formatTime(startTime)})`
                : `Office Hours (${formatTime(startTime)})`,
            60
        );

        /* This text is what shows when the professor clicks the event */
        const description = [
            kind === "meeting" ? "Status: Scheduled" : "Status: Open for student meetings",
            `Time: ${formatTime(startTime)} - ${formatTime(endTime)}`,
            student ? `Student: ${student}` : "",
            purpose ? `Purpose: ${purpose}` : ""
        ].filter(Boolean).join("\n");

        /* OUTPUT: save it. The calendar already draws saved events,
           so it appears on the calendar automatically. */
        addEvent({
            id: createId("event"),
            topic,
            date,
            description,
            kind,          /* remembered so we can check conflicts later */
            startTime,
            endTime
        });

        /* Jump the calendar to that month and refresh the page */
        const [year, month] = date.split("-").map(Number);

        calendarDate = new Date(year, month - 1, 1);

        closeModal("officeModal");
        refreshApplication();

        showMessage(
            kind === "meeting" ? "Meeting scheduled." : "Office hours added."
        );

    });

}

/* ================================================= */
/* SMART SCHEDULE ADJUSTMENT */
/* ================================================= */

// When the user changes the time of an event and it overlaps a
// study or work session, we show open times the session can move to.

// the earliest and latest times we will suggest (in minutes)
const START_OF_DAY = 8 * 60;    // 8:00 AM
const END_OF_DAY = 21 * 60;     // 9:00 PM
const DAYS_TO_SEARCH = 7;       // how many days ahead we look


// true if the event has both a start time and an end time
function hasTimes(item) {
    return item.startTime && item.endTime;
}


// true if two events are on the same day and their times overlap
function timesOverlap(a, b) {

    if (a.date !== b.date) {
        return false;
    }

    return toMinutes(a.startTime) < toMinutes(b.endTime) &&
           toMinutes(a.endTime) > toMinutes(b.startTime);

}


// makes the new title, like "Study: Midterm (4:00 PM)"
function makeTitle(oldTitle, startTime) {

    let name = oldTitle;
    const spot = oldTitle.lastIndexOf(" (");

    // remove the old time at the end if there is one
    if (spot !== -1 && oldTitle.endsWith(")")) {
        name = oldTitle.slice(0, spot);
    }

    return name.slice(0, 48) + " (" + formatTime(startTime) + ")";

}


// makes the new description with the new time in it
function makeDescription(oldText, startTime, endTime) {

    const lines = (oldText || "").split("\n");
    const keep = [];

    // keep every line except the old time line
    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];
        const isTimeLine = line.startsWith("Time:") ||
            (line.includes(" - ") && (line.includes("AM") || line.includes("PM")));

        if (line !== "" && !isTimeLine) {
            keep.push(line);
        }

    }

    keep.push("Time: " + formatTime(startTime) + " - " + formatTime(endTime));

    return keep.join("\n");

}


// finds open times (same length as the session) over the next few days
function findOpenTimes(session) {

    const length = toMinutes(session.endTime) - toMinutes(session.startTime);

    // every other event with a time counts as busy
    const busy = [];
    const allEvents = getEvents();

    for (let i = 0; i < allEvents.length; i++) {
        if (hasTimes(allEvents[i]) && allEvents[i].id !== session.id) {
            busy.push(allEvents[i]);
        }
    }

    const parts = session.date.split("-").map(Number);
    const now = new Date();
    const found = [];

    // go through each day, starting with the session's own day
    for (let dayNumber = 0; dayNumber <= DAYS_TO_SEARCH; dayNumber++) {

        const day = new Date(parts[0], parts[1] - 1, parts[2] + dayNumber);
        const dateString = createDateString(day.getFullYear(), day.getMonth(), day.getDate());
        let foundToday = 0;

        // try a start time every 30 minutes
        for (let start = START_OF_DAY; start + length <= END_OF_DAY; start += 30) {

            // only suggest 2 times per day and 6 total
            if (foundToday >= 2 || found.length >= 6) {
                break;
            }

            // skip times that already passed
            const slotDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, start);
            if (slotDate < now) {
                continue;
            }

            const slot = {
                date: dateString,
                startTime: toTime(start),
                endTime: toTime(start + length)
            };

            // skip it if it overlaps anything else
            let isFree = true;

            for (let i = 0; i < busy.length; i++) {
                if (timesOverlap(busy[i], slot)) {
                    isFree = false;
                }
            }

            if (isFree) {
                found.push(slot);
                foundToday++;
            }

        }

    }

    return found;

}


// shows the open times for the first session in the list
function showNewTimes(sessions, conflictEvent, refreshApplication) {

    const message = document.getElementById("adjustMessage");
    const list = document.getElementById("adjustOptions");

    // no sessions left, so we are done
    if (sessions.length === 0) {
        closeModal("adjustModal");
        refreshApplication();
        return;
    }

    const session = sessions[0];
    const rest = sessions.slice(1);
    const options = findOpenTimes(session);

    if (options.length > 0) {
        message.textContent = '"' + session.topic + '" now overlaps with "' +
            conflictEvent.topic + '". Pick a new time:';
    } else {
        message.textContent = '"' + session.topic + '" now overlaps with "' +
            conflictEvent.topic + '". No open times were found in the next ' +
            DAYS_TO_SEARCH + " days.";
    }

    list.replaceChildren();

    // make one button for each open time
    options.forEach(slot => {

        const parts = slot.date.split("-").map(Number);
        const dayText = new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });

        const button = document.createElement("button");
        button.type = "button";
        button.className = "primary-button";
        button.textContent = dayText + "  |  " + formatTime(slot.startTime) +
            " - " + formatTime(slot.endTime);

        // when clicked, move the session to this time
        button.addEventListener("click", () => {

            updateEvent(session.id, {
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                topic: makeTitle(session.topic, slot.startTime),
                description: makeDescription(session.description, slot.startTime, slot.endTime)
            });

            showMessage("Session moved.");
            showNewTimes(rest, conflictEvent, refreshApplication);

        });

        list.appendChild(button);

    });

    // button to leave the session where it is
    const keepButton = document.createElement("button");
    keepButton.type = "button";
    keepButton.className = "secondary-button";
    keepButton.textContent = "Keep original time";

    keepButton.addEventListener("click", () => {
        showNewTimes(rest, conflictEvent, refreshApplication);
    });

    list.appendChild(keepButton);

    openModal("adjustModal");

}


function setupSmartSchedule(refreshApplication) {

    const form = document.getElementById("editEventForm");
    let editingId = null;   // which event is being edited

    // user clicks "Edit Time" in the details window
    document.getElementById("editEventTimeButton")?.addEventListener("click", event => {

        const id = event.currentTarget.dataset.eventId;
        const item = getEvents().find(e => e.id === id);

        if (!item) {
            return;
        }

        editingId = item.id;

        // fill the form with the event's current info
        document.getElementById("editEventName").textContent = item.topic;
        document.getElementById("editDate").value = item.date;
        document.getElementById("editStart").value = item.startTime || "09:00";
        document.getElementById("editEnd").value = item.endTime || "10:00";
        document.getElementById("editKind").value = "";

        closeModal("detailsModal");
        openModal("editEventModal");

    });

    // user saves the new time
    form?.addEventListener("submit", event => {

        event.preventDefault();

        const item = getEvents().find(e => e.id === editingId);

        if (!item) {
            return;
        }

        const newDate = document.getElementById("editDate").value;
        const newStart = document.getElementById("editStart").value;
        const newEnd = document.getElementById("editEnd").value;
        const chosenKind = document.getElementById("editKind").value;

        if (toMinutes(newEnd) <= toMinutes(newStart)) {
            showMessage("The end time must be after the start time.", "error");
            return;
        }

        // if they did not pick a type, keep the old one
        let newKind = chosenKind;

        if (newKind === "") {
            newKind = item.kind || "busy";
        }

        const changes = {
            date: newDate,
            startTime: newStart,
            endTime: newEnd,
            kind: newKind,
            topic: makeTitle(item.topic, newStart),
            description: makeDescription(item.description, newStart, newEnd)
        };

        updateEvent(item.id, changes);

        // this is the event with its new info
        const editedEvent = getEvents().find(e => e.id === item.id);

        // find study/work sessions that now overlap the edited event
        const affected = [];
        const allEvents = getEvents();

        for (let i = 0; i < allEvents.length; i++) {

            const other = allEvents[i];
            const isSession = other.kind === "study" || other.kind === "work";

            if (other.id !== editedEvent.id && isSession &&
                hasTimes(other) && timesOverlap(other, editedEvent)) {
                affected.push(other);
            }

        }

        closeModal("editEventModal");
        refreshApplication();

        if (affected.length === 0) {
            showMessage("Event updated. No conflicts found.");
            return;
        }

        showMessage("Event updated, but it conflicts with a session.", "warning");
        showNewTimes(affected, editedEvent, refreshApplication);

    });

}

export function setupCalendar(
    refreshApplication
) {

    /* Start the office hours / meeting scheduler */
    setupOfficeHours(refreshApplication);

        // smart schedule adjustment
    setupSmartSchedule(refreshApplication);

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