/*
    storage.js

    Responsible only for reading and writing
    CampusFlow data to browser localStorage.

    Keeping storage separate makes it easier
    to replace localStorage with a database later.
*/


export function loadData(
    key,
    fallbackValue
) {

    try {

        const storedValue =
            localStorage.getItem(
                key
            );


        if (
            storedValue === null
        ) {

            return fallbackValue;

        }


        return JSON.parse(
            storedValue
        );

    }

    catch (error) {

        console.error(
            `Unable to load ${key}:`,
            error
        );


        return fallbackValue;

    }

}



export function saveData(
    key,
    value
) {

    try {

        localStorage.setItem(

            key,

            JSON.stringify(
                value
            )

        );


        return true;

    }

    catch (error) {

        console.error(
            `Unable to save ${key}:`,
            error
        );


        return false;

    }

}