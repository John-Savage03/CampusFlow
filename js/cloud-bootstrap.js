/*
    cloud-bootstrap.js

    Loads cloud account data before the normal CampusFlow
    modules start, then keeps browser storage synchronized
    back to the user's cloud account.
*/

const SESSION_KEY =
    "campusFlowCurrentUser";


const LEGACY_OWNER_KEY =
    "campusflow-v3-legacy-storage-owner";


let cloudEnabled =
    false;


let currentUser =
    null;


let applyingCloudData =
    false;


let syncTimer =
    null;



async function api(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                credentials:
                    "same-origin",

                ...options,

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );


    let body =
        {};


    try {

        body =
            await response.json();

    }

    catch {

        body =
            {};

    }


    return {
        response,
        body
    };

}



function belongsToCurrentUser(
    key,
    username
) {

    const encoded =
        encodeURIComponent(
            String(username || "")
                .trim()
                .toLowerCase()
        );


    if (
        key.includes(
            "::user::"
        )
    ) {

        return key.endsWith(
            `::user::${encoded}`
        );

    }


    return true;

}



function isSyncableKey(
    key,
    username
) {

    if (
        typeof key !==
            "string"
    ) {

        return false;

    }


    if (
        key ===
        LEGACY_OWNER_KEY
    ) {

        return false;

    }


    if (
        key ===
        "campusFlowUsers"
    ) {

        return false;

    }


    if (
        !key.startsWith(
            "campusflow-"
        )
    ) {

        return false;

    }


    return belongsToCurrentUser(
        key,
        username
    );

}



function collectSnapshot(
    username
) {

    const data =
        {};


    for (
        let index = 0;
        index < localStorage.length;
        index++
    ) {

        const key =
            localStorage.key(
                index
            );


        if (
            !isSyncableKey(
                key,
                username
            )
        ) {

            continue;

        }


        data[key] =
            localStorage.getItem(
                key
            );

    }


    return data;

}



function clearCurrentUserData(
    username
) {

    const keys =
        [];


    for (
        let index = 0;
        index < localStorage.length;
        index++
    ) {

        const key =
            localStorage.key(
                index
            );


        if (
            isSyncableKey(
                key,
                username
            )
        ) {

            keys.push(
                key
            );

        }

    }


    keys.forEach(
        key => {

            localStorage.removeItem(
                key
            );

        }
    );

}



function applySnapshot(
    username,
    data
) {

    applyingCloudData =
        true;


    try {

        clearCurrentUserData(
            username
        );


        Object
            .entries(
                data || {}
            )
            .forEach(
                ([
                    key,
                    value
                ]) => {

                    if (
                        !isSyncableKey(
                            key,
                            username
                        )
                    ) {

                        return;

                    }


                    if (
                        typeof value ===
                        "string"
                    ) {

                        localStorage.setItem(
                            key,
                            value
                        );

                    }

                }
            );

    }

    finally {

        applyingCloudData =
            false;

    }

}



function hasMeaningfulData(
    data
) {

    return (
        data &&
        typeof data ===
            "object" &&
        Object.keys(
            data
        ).length > 0
    );

}



async function pushSnapshot() {

    if (
        !cloudEnabled ||
        !currentUser
    ) {

        return;

    }


    const data =
        collectSnapshot(
            currentUser.username
        );


    try {

        const {
            response
        } =
            await api(
                "/api/cloud/snapshot",
                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify({
                            data
                        })
                }
            );


        if (
            response.status ===
            401
        ) {

            sessionStorage.removeItem(
                SESSION_KEY
            );

        }

    }

    catch (error) {

        console.error(
            "CampusFlow cloud sync failed:",
            error
        );

    }

}



function scheduleSync() {

    if (
        applyingCloudData ||
        !cloudEnabled
    ) {

        return;

    }


    window.clearTimeout(
        syncTimer
    );


    syncTimer =
        window.setTimeout(
            pushSnapshot,
            700
        );

}



function installStorageSync() {

    const originalSetItem =
        Storage.prototype.setItem;


    const originalRemoveItem =
        Storage.prototype.removeItem;


    const originalClear =
        Storage.prototype.clear;


    Storage.prototype.setItem =
        function (
            key,
            value
        ) {

            originalSetItem.call(
                this,
                key,
                value
            );


            if (
                this ===
                    localStorage &&
                currentUser &&
                isSyncableKey(
                    String(key),
                    currentUser.username
                )
            ) {

                scheduleSync();

            }

        };


    Storage.prototype.removeItem =
        function (
            key
        ) {

            originalRemoveItem.call(
                this,
                key
            );


            if (
                this ===
                    localStorage &&
                currentUser &&
                isSyncableKey(
                    String(key),
                    currentUser.username
                )
            ) {

                scheduleSync();

            }

        };


    Storage.prototype.clear =
        function () {

            originalClear.call(
                this
            );


            if (
                this ===
                localStorage
            ) {

                scheduleSync();

            }

        };


    window.addEventListener(
        "pagehide",
        () => {

            pushSnapshot();

        }
    );


    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                pushSnapshot();

            }

        }
    );

}



async function bootstrapCloud() {

    let status;


    try {

        status =
            await api(
                "/api/cloud/status"
            );

    }

    catch {

        return false;

    }


    if (
        !status.response.ok ||
        !status.body.configured
    ) {

        return false;

    }


    cloudEnabled =
        true;


    const me =
        await api(
            "/api/auth/me"
        );


    if (
        me.response.status ===
        401
    ) {

        sessionStorage.removeItem(
            SESSION_KEY
        );


        window.location.replace(
            "login.html"
        );


        return true;

    }


    if (
        !me.response.ok ||
        !me.body.user
    ) {

        throw new Error(
            "Unable to load the cloud login session."
        );

    }


    currentUser =
        me.body.user;


    sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(
            currentUser
        )
    );


    const localBeforeCloud =
        collectSnapshot(
            currentUser.username
        );


    const snapshot =
        await api(
            "/api/cloud/snapshot"
        );


    if (!snapshot.response.ok) {

        throw new Error(
            "Unable to load cloud account data."
        );

    }


    const cloudData =
        snapshot.body.data ||
        {};


    /*
        First cloud login on the original device:
        keep the local account data and upload it.

        Later devices:
        cloud data wins and is restored locally
        before the application starts.
    */

    if (
        !hasMeaningfulData(
            cloudData
        ) &&
        hasMeaningfulData(
            localBeforeCloud
        )
    ) {

        await api(
            "/api/cloud/snapshot",
            {
                method:
                    "PUT",

                body:
                    JSON.stringify({
                        data:
                            localBeforeCloud
                    })
            }
        );

    }

    else if (
        hasMeaningfulData(
            cloudData
        )
    ) {

        applySnapshot(
            currentUser.username,
            cloudData
        );

    }


    localStorage.setItem(
        "campusflow-v2-role",
        JSON.stringify(
            currentUser.role
        )
    );


    installStorageSync();


    return true;

}



async function start() {

    try {

        await bootstrapCloud();

    }

    catch (error) {

        console.error(
            "CampusFlow cloud startup failed:",
            error
        );

    }


    await import(
        "./app.js"
    );

}



start();
