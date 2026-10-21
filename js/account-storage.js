/*
    account-storage.js

    Creates account-specific localStorage keys.

    This prevents one logged-in CampusFlow account
    from reading another account's academic data
    in the same browser.
*/


const SESSION_KEY =
    "campusFlowCurrentUser";


const LEGACY_OWNER_KEY =
    "campusflow-v3-legacy-storage-owner";



/* ================================================= */
/* CURRENT ACCOUNT */
/* ================================================= */

export function getCurrentAccount() {

    try {

        const raw =
            sessionStorage.getItem(
                SESSION_KEY
            );


        if (!raw) {

            return null;

        }


        const account =
            JSON.parse(
                raw
            );


        if (
            !account ||
            typeof account.username !== "string" ||
            !account.username.trim()
        ) {

            return null;

        }


        return account;

    }

    catch (error) {

        console.error(
            "Unable to read the current CampusFlow account:",
            error
        );


        return null;

    }

}



export function getCurrentAccountId() {

    const account =
        getCurrentAccount();


    if (!account) {

        return null;

    }


    return account.username
        .trim()
        .toLowerCase();

}



/* ================================================= */
/* ACCOUNT-SPECIFIC STORAGE KEY */
/* ================================================= */

export function getAccountStorageKey(
    baseKey
) {

    const accountId =
        getCurrentAccountId();


    /*
        The auth guard will redirect logged-out users.

        This fallback prevents a logged-out browser
        from accidentally reading another user's data
        during the redirect.
    */

    if (!accountId) {

        return `${baseKey}::logged-out`;

    }


    return (
        `${baseKey}::user::${encodeURIComponent(accountId)}`
    );

}



/* ================================================= */
/* LEGACY DATA MIGRATION */
/* ================================================= */

export function getScopedStorageKey(
    baseKey,
    options = {}
) {

    const scopedKey =
        getAccountStorageKey(
            baseKey
        );


    const accountId =
        getCurrentAccountId();


    if (
        !options.migrateLegacy ||
        !accountId
    ) {

        return scopedKey;

    }


    try {

        const scopedValue =
            localStorage.getItem(
                scopedKey
            );


        const legacyValue =
            localStorage.getItem(
                baseKey
            );


        /*
            No migration is needed if:

            - this account already has its own data
            - or no old shared data exists
        */

        if (
            scopedValue !== null ||
            legacyValue === null
        ) {

            return scopedKey;

        }


        const legacyOwner =
            localStorage.getItem(
                LEGACY_OWNER_KEY
            );


        /*
            The first existing account to open this
            upgraded version receives the old shared
            CampusFlow data.

            New accounts will NOT receive copies.
        */

        if (
            !legacyOwner ||
            legacyOwner === accountId
        ) {

            localStorage.setItem(
                LEGACY_OWNER_KEY,
                accountId
            );


            localStorage.setItem(
                scopedKey,
                legacyValue
            );

        }

    }

    catch (error) {

        console.error(
            `Unable to migrate ${baseKey}:`,
            error
        );

    }


    return scopedKey;

}