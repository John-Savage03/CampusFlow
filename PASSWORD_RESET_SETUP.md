# CampusFlow Password Reset Setup

CampusFlow now includes a complete password-recovery flow:

- Recovery email on new account signup
- Account Security control for existing users
- Recovery-email verification
- Forgot Password page
- One-time password reset links
- 30-minute reset expiration
- One-use reset tokens
- Password hashing inside the Supabase Edge Function
- Automatic revocation of all old login sessions after a reset
- Generic forgot-password responses to prevent account enumeration

## Email provider

The reset logic is deployed, but actual email delivery requires an email provider.

CampusFlow uses the Resend HTTP API from the existing Supabase `campusflow-api` Edge Function.

### Required Supabase Edge Function secrets

In the CampusFlow Supabase project, open Edge Function Secrets and add:

```
RESEND_API_KEY=<your Resend API key>
CAMPUSFLOW_APP_URL=<your deployed CampusFlow URL>
RESEND_FROM_EMAIL=CampusFlow <no-reply@your-verified-domain.com>
```

`CAMPUSFLOW_APP_URL` must be the origin only, for example:

```
https://your-campusflow-service.onrender.com
```

Do not include `/login.html` or another path.

For local development without production secrets, the function permits `http://localhost` and `http://127.0.0.1` links.

## Resend setup

1. Create a Resend account.
2. Add and verify a sending domain if the application needs to send recovery emails to arbitrary users.
3. Create an API key with sending access.
4. Store the key only in Supabase Edge Function Secrets.
5. Set `RESEND_FROM_EMAIL` to an address on the verified domain.

Never commit the Resend API key to GitHub and never put it in browser JavaScript.

## Existing CampusFlow accounts

Existing accounts do not have a recovery email yet.

After logging in:

1. Open **Account Security** in the sidebar.
2. Enter a recovery email.
3. Click **Send Verification**.
4. Open the verification email.
5. Click **Verify Email**.

After verification, **Forgot your password?** on the login page can send reset links to that account.

## New accounts

The signup page now requires a recovery email. The account itself can still be created if email delivery is temporarily unavailable, but password recovery will not be available until the recovery email is successfully verified.

## Reset behavior

A successful password reset:

1. Verifies the one-time token.
2. Rejects expired or already-used tokens.
3. Creates a new password salt and hash.
4. Marks the reset token used.
5. Deletes every active CampusFlow session for the account.
6. Requires the user to log in again with the new password.

## Security notes

- Recovery and reset tokens are stored only as SHA-256 hashes.
- Reset links expire after 30 minutes.
- Recovery-email verification links expire after 24 hours.
- Requests are throttled to avoid repeated email sends.
- Forgot-password responses do not reveal whether an email is registered.
- Production email links use `CAMPUSFLOW_APP_URL` from Supabase secrets rather than a request-provided domain.
