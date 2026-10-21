/* storage.js - safe localStorage helpers */

export function loadData(
    key,
    fallbackValue
) {

    try {

        const raw =
            localStorage.getItem(
                key
            );


        return raw === null
            ? fallbackValue
            : JSON.parse(
                raw
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