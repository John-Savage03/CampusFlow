/* utils.js - shared formatting and date helpers */

export const MONTH_NAMES = [
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


export function createId(
    prefix
) {

    return (
        `${prefix}-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`
    );

}


export function cleanText(
    value,
    maxLength = 100
) {

    return typeof value === "string"
        ? value
            .trim()
            .replace(
                /\s+/g,
                " "
            )
            .slice(
                0,
                maxLength
            )
        : "";

}


export function cleanMultilineText(
    value,
    maxLength = 500
) {

    return typeof value === "string"
        ? value
            .trim()
            .slice(
                0,
                maxLength
            )
        : "";

}


export function createDateString(
    year,
    month,
    day
) {

    return (
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
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
    value
) {

    const [
        year,
        month,
        day
    ] =
        value
            .split("-")
            .map(Number);


    return new Date(
        year,
        month - 1,
        day
    );

}


export function isValidDateString(
    value
) {

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            value || ""
        )
    ) {

        return false;

    }


    const date =
        parseDateString(
            value
        );


    return (
        dateToString(
            date
        ) === value
    );

}


export function formatDate(
    value
) {

    if (
        !isValidDateString(
            value
        )
    ) {

        return "Invalid date";

    }


    return parseDateString(
        value
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
    value
) {

    if (
        !isValidDateString(
            value
        )
    ) {

        return "Invalid date";

    }


    return parseDateString(
        value
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
    value
) {

    if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(
            value || ""
        )
    ) {

        return "";

    }


    const [
        hour,
        minute
    ] =
        value
            .split(":")
            .map(Number);


    const date =
        new Date();


    date.setHours(
        hour,
        minute,
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


export function courseMeetsOnDate(
    schedule,
    date
) {

    if (
        schedule === "Online"
    ) {

        return false;

    }


    const dayTokens = [
        "Su",
        "M",
        "T",
        "W",
        "Th",
        "F",
        "Sa"
    ];


    const token =
        dayTokens[
            date.getDay()
        ];


    return String(
        schedule
    )
        .split("/")
        .map(
            part =>
                part.trim()
        )
        .includes(
            token
        );

}


export function calculatePointsAverage(
    records
) {

    const totals =
        records.reduce(
            (
                sum,
                item
            ) => {

                sum.earned +=
                    Number(
                        item.pointsEarned
                    ) || 0;


                sum.possible +=
                    Number(
                        item.pointsPossible
                    ) || 0;


                return sum;

            },
            {
                earned: 0,
                possible: 0
            }
        );


    return totals.possible > 0
        ? (
            totals.earned /
            totals.possible
        ) * 100
        : null;

}


export function getLetterGrade(
    value
) {

    if (
        value === null ||
        !Number.isFinite(
            value
        )
    ) {

        return "--";

    }


    if (value >= 90) return "A";

    if (value >= 80) return "B";

    if (value >= 70) return "C";

    if (value >= 60) return "D";

    return "F";

}
