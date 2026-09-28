/*
    utils.js

    Reusable date, ID, and scheduling helpers.
*/


export const monthNames = [

    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"

];



export function createDateString(
    year,
    month,
    day
) {

    const monthText =
        String(
            month + 1
        ).padStart(
            2,
            "0"
        );


    const dayText =
        String(
            day
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${monthText}-${dayText}`
    );

}



export function dateToString(
    date
) {

    return createDateString(

        date.getFullYear(),

        date.getMonth(),

        date.getDate()

    );

}



export function parseDateString(
    dateString
) {

    const parts =
        dateString
            .split("-")
            .map(Number);


    return new Date(

        parts[0],

        parts[1] - 1,

        parts[2]

    );

}



export function formatDate(
    dateString
) {

    return parseDateString(
        dateString
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}



export function formatFullDate(
    dateString
) {

    return parseDateString(
        dateString
    ).toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}



export function formatTime(
    timeString
) {

    if (!timeString) {

        return "";

    }


    const [
        hours,
        minutes
    ] =
        timeString
            .split(":")
            .map(Number);


    const date =
        new Date();


    date.setHours(
        hours,
        minutes,
        0,
        0
    );


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}



export function createId(
    prefix
) {

    return (
        `${prefix}-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`
    );

}



export function courseMeetsOnDate(
    schedule,
    date
) {

    if (
        schedule === "Online"
    ) {

        return false;

    }


    const dayTokens = {

        0: "Su",
        1: "M",
        2: "T",
        3: "W",
        4: "Th",
        5: "F",
        6: "Sa"

    };


    const todayToken =
        dayTokens[
            date.getDay()
        ];


    const scheduleTokens =
        schedule
            .split("/")
            .map(
                value =>
                    value.trim()
            );


    return scheduleTokens.includes(
        todayToken
    );

}