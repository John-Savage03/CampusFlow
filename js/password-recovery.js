/*
    password-recovery.js

    Handles the public CampusFlow recovery pages:
    forgot password, password reset, and recovery-email verification.
*/

function message(text, success = false) {
    const box = document.getElementById("message");
    if (!box) return;

    box.textContent = text;
    box.classList.toggle("success", success);
}


async function post(url, body) {
    const response = await fetch(
        url,
        {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    return {
        response,
        data
    };
}


const forgotForm =
    document.getElementById("forgotPasswordForm");

if (forgotForm) {
    forgotForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            message("");

            const email =
                document
                    .getElementById("RecoveryEmail")
                    ?.value
                    .trim() || "";

            const button =
                document.getElementById("ForgotPasswordButton");

            if (button) {
                button.disabled = true;
            }

            try {
                const { data } =
                    await post(
                        "/api/auth/forgot-password",
                        { email }
                    );

                message(
                    data.message ||
                    "If an account exists for that verified email, a reset link has been sent.",
                    true
                );

                forgotForm.reset();
            } catch (error) {
                console.error(error);

                message(
                    "CampusFlow could not process the request."
                );
            } finally {
                if (button) {
                    button.disabled = false;
                }
            }
        }
    );
}


const resetForm =
    document.getElementById("resetPasswordForm");

if (resetForm) {
    const token =
        new URLSearchParams(
            window.location.search
        ).get("token") || "";

    const password =
        document.getElementById("NewPassword");

    const confirm =
        document.getElementById("ConfirmPassword");

    function checkPasswords() {
        if (!password || !confirm) return;

        confirm.setCustomValidity(
            password.value === confirm.value
                ? ""
                : "Passwords do not match."
        );
    }

    password?.addEventListener(
        "input",
        checkPasswords
    );

    confirm?.addEventListener(
        "input",
        checkPasswords
    );

    if (!token) {
        message(
            "This reset link is missing its token."
        );

        const button =
            document.getElementById("ResetPasswordButton");

        if (button) {
            button.disabled = true;
        }
    }

    resetForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            message("");
            checkPasswords();

            if (!resetForm.reportValidity()) {
                return;
            }

            const newPassword =
                password?.value || "";

            if (newPassword.length < 8) {
                return message(
                    "Password must be at least 8 characters."
                );
            }

            const button =
                document.getElementById("ResetPasswordButton");

            if (button) {
                button.disabled = true;
            }

            try {
                const {
                    response,
                    data
                } =
                    await post(
                        "/api/auth/reset-password",
                        {
                            token,
                            password: newPassword
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "The reset link is invalid or expired."
                    );
                }

                sessionStorage.removeItem(
                    "campusFlowCurrentUser"
                );

                message(
                    data.message ||
                    "Password updated.",
                    true
                );

                resetForm.reset();

                window.setTimeout(
                    () => {
                        window.location.replace(
                            "login.html"
                        );
                    },
                    1600
                );
            } catch (error) {
                message(
                    error.message ||
                    "Unable to reset the password."
                );

                if (button) {
                    button.disabled = false;
                }
            }
        }
    );
}


const verifyPage =
    document.getElementById("verifyEmailPage");

if (verifyPage) {
    const token =
        new URLSearchParams(
            window.location.search
        ).get("token") || "";

    async function verify() {
        if (!token) {
            return message(
                "This verification link is missing its token."
            );
        }

        try {
            const {
                response,
                data
            } =
                await post(
                    "/api/auth/verify-recovery-email",
                    { token }
                );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "This verification link is invalid or expired."
                );
            }

            message(
                data.message ||
                "Recovery email verified.",
                true
            );
        } catch (error) {
            message(
                error.message ||
                "Unable to verify the recovery email."
            );
        }
    }

    verify();
}
