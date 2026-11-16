/*
    account-security.js

    Adds recovery-email controls for logged-in users.
*/

async function jsonApi(
    url,
    options = {}
) {
    const response = await fetch(
        url,
        {
            credentials: "same-origin",
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    let body = {};

    try {
        body = await response.json();
    } catch {
        body = {};
    }

    return {
        response,
        body
    };
}


function ensureStyles() {
    if (
        document.getElementById(
            "accountSecurityStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "accountSecurityStyles";

    style.textContent = `
        .account-security-button {
            width: 100%;
            margin-top: 8px;
            padding: 11px 12px;
            border: 1px solid #4b5563;
            border-radius: 8px;
            background: transparent;
            color: #d1d5db;
            text-align: left;
            cursor: pointer;
        }

        .account-security-button:hover {
            background: #374151;
        }

        .security-status {
            margin: 10px 0 14px;
            padding: 10px 12px;
            border-radius: 8px;
            background: #f3f4f6;
            color: #374151;
            font-size: 13px;
            line-height: 1.45;
        }

        .security-status.verified {
            background: #ecfdf5;
            color: #166534;
        }

        .security-status.warning {
            background: #fff7ed;
            color: #9a3412;
        }

        .security-message {
            min-height: 20px;
            margin-top: 10px;
            font-size: 13px;
        }

        .security-message.success {
            color: #166534;
        }

        .security-message.error {
            color: #b91c1c;
        }
    `;

    document.head.appendChild(
        style
    );
}


function injectModal() {
    if (
        document.getElementById(
            "accountSecurityModal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id =
        "accountSecurityModal";

    modal.className =
        "modal-overlay";

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    modal.innerHTML = `
        <div class="modal">

            <div class="modal-header">
                <div>
                    <h2>Account Security</h2>
                    <p>
                        Add a verified recovery email so you can reset your password from another device.
                    </p>
                </div>

                <button
                    type="button"
                    class="close-button"
                    id="closeAccountSecurity"
                >
                    ×
                </button>
            </div>

            <div
                id="recoveryEmailStatus"
                class="security-status"
            >
                Loading recovery email...
            </div>

            <form id="recoveryEmailForm">

                <div class="form-group">
                    <label for="accountRecoveryEmail">
                        Recovery Email
                    </label>

                    <input
                        type="email"
                        id="accountRecoveryEmail"
                        autocomplete="email"
                        required
                    >
                </div>

                <div class="modal-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="cancelAccountSecurity"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                        id="saveRecoveryEmail"
                    >
                        Send Verification
                    </button>
                </div>

            </form>

            <p
                id="accountSecurityMessage"
                class="security-message"
                role="status"
                aria-live="polite"
            ></p>

        </div>
    `;

    document.body.appendChild(
        modal
    );
}


function securityMessage(
    text,
    type = ""
) {
    const element =
        document.getElementById(
            "accountSecurityMessage"
        );

    if (!element) return;

    element.textContent = text;

    element.className =
        "security-message" +
        (
            type
                ? ` ${type}`
                : ""
        );
}


function closeModal() {
    const modal =
        document.getElementById(
            "accountSecurityModal"
        );

    modal?.classList.remove(
        "show"
    );

    modal?.setAttribute(
        "aria-hidden",
        "true"
    );

    securityMessage("");
}


async function loadStatus() {
    const status =
        document.getElementById(
            "recoveryEmailStatus"
        );

    const input =
        document.getElementById(
            "accountRecoveryEmail"
        );

    if (!status) return;

    try {
        const {
            response,
            body
        } =
            await jsonApi(
                "/api/auth/recovery-email"
            );

        if (!response.ok) {
            throw new Error(
                body.message ||
                "Unable to load account security."
            );
        }

        if (input) {
            input.value =
                body.recoveryEmail ||
                "";
        }

        status.className =
            "security-status";

        if (
            body.recoveryEmail &&
            body.verified
        ) {
            status.classList.add(
                "verified"
            );

            status.textContent =
                `Verified recovery email: ${body.recoveryEmail}`;
        } else if (
            body.recoveryEmail
        ) {
            status.classList.add(
                "warning"
            );

            status.textContent =
                `${body.recoveryEmail} is not verified yet. Send another verification email if needed.`;
        } else {
            status.classList.add(
                "warning"
            );

            status.textContent =
                "No recovery email is set. Password reset will not work until you add and verify one.";
        }

        if (
            !body.emailDeliveryConfigured
        ) {
            status.textContent +=
                " Email delivery still needs to be configured by the CampusFlow administrator.";
        }
    } catch (error) {
        status.className =
            "security-status warning";

        status.textContent =
            error.message ||
            "Unable to load recovery email status.";
    }
}


async function openModal() {
    const modal =
        document.getElementById(
            "accountSecurityModal"
        );

    modal?.classList.add(
        "show"
    );

    modal?.setAttribute(
        "aria-hidden",
        "false"
    );

    securityMessage("");

    await loadStatus();
}


export function setupAccountSecurity() {
    ensureStyles();
    injectModal();

    const accountPanel =
        document.getElementById(
            "accountPanel"
        );

    if (
        accountPanel &&
        !document.getElementById(
            "accountSecurityButton"
        )
    ) {
        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.id =
            "accountSecurityButton";

        button.className =
            "account-security-button";

        button.textContent =
            "Account Security";

        button.addEventListener(
            "click",
            openModal
        );

        const logout =
            accountPanel.querySelector(
                ".logout-button"
            );

        if (logout) {
            accountPanel.insertBefore(
                button,
                logout
            );
        } else {
            accountPanel.appendChild(
                button
            );
        }
    }

    document
        .getElementById(
            "closeAccountSecurity"
        )
        ?.addEventListener(
            "click",
            closeModal
        );

    document
        .getElementById(
            "cancelAccountSecurity"
        )
        ?.addEventListener(
            "click",
            closeModal
        );

    document
        .getElementById(
            "accountSecurityModal"
        )
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target.id ===
                    "accountSecurityModal"
                ) {
                    closeModal();
                }
            }
        );

    document
        .getElementById(
            "recoveryEmailForm"
        )
        ?.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                securityMessage("");

                const email =
                    document
                        .getElementById(
                            "accountRecoveryEmail"
                        )
                        ?.value
                        .trim() ||
                    "";

                const button =
                    document.getElementById(
                        "saveRecoveryEmail"
                    );

                if (button) {
                    button.disabled = true;
                    button.textContent =
                        "Sending...";
                }

                try {
                    const {
                        response,
                        body
                    } =
                        await jsonApi(
                            "/api/auth/recovery-email",
                            {
                                method: "POST",
                                body:
                                    JSON.stringify({
                                        email
                                    })
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            body.message ||
                            "Unable to save the recovery email."
                        );
                    }

                    securityMessage(
                        body.message ||
                        "Verification email sent.",
                        "success"
                    );

                    await loadStatus();
                } catch (error) {
                    securityMessage(
                        error.message ||
                        "Unable to save the recovery email.",
                        "error"
                    );
                } finally {
                    if (button) {
                        button.disabled = false;
                        button.textContent =
                            "Send Verification";
                    }
                }
            }
        );
}
