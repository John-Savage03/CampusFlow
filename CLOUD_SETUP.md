# CampusFlow Cloud Accounts

CampusFlow now uses a Supabase cloud backend for cross-device accounts and data.

## Cloud project

- Supabase project: `CampusFlow`
- Project ref: `gpjkrmokhypzjqzovmfo`
- Region: `us-east-1`
- Edge Function: `campusflow-api`
- Private file bucket: `campusflow-materials`

## What syncs across devices

- Account login
- Courses
- Assignments and exams
- Grades
- Calendar/event data
- Course Hub notes and materials
- Projects and other CampusFlow browser data stored under `campusflow-*`
- Bulk-uploaded course files

## How it works

The Render Node server does not store a Supabase database password or secret key.

The browser talks to the existing CampusFlow `/api/...` routes. The Node server keeps the CampusFlow session token in an HttpOnly cookie and proxies cloud requests to the deployed Supabase Edge Function. Supabase keeps its privileged credentials inside the Edge Function environment.

This means there are no Supabase secrets to copy into GitHub or Render.

## Existing account migration

On the original browser that already contains a CampusFlow account:

1. Open CampusFlow.
2. Log in with the same username and password.
3. If the username does not exist in the cloud yet, CampusFlow verifies the old local password and creates the matching cloud account.
4. The existing browser data becomes the first cloud snapshot.
5. Existing browser-only bulk files are moved into the private Supabase Storage bucket.

After that, another device can log in with the same username and password and load the same data.

## Local test

Run:

```bash
npm ci
npm start
```

Then open:

```
http://localhost:3000
```

Do not use VS Code Live Server for cloud-account testing because the Node server owns the secure session cookie and API proxy.

## Render deployment

No Supabase secret environment variables are required.

Render only needs to deploy the CampusFlow GitHub repository and run:

```
npm start
```

The cloud API URL is built into the server with an optional `CAMPUSFLOW_CLOUD_API_URL` override for future migrations.

## Cross-device verification

Device A:

1. Log in.
2. Add a course.
3. Add an assignment.
4. Add a grade or Course Hub note.
5. Upload a small file.
6. Wait about one second after the last edit.

Device B:

1. Open the same deployed CampusFlow website.
2. Log in with the same username and password.
3. Confirm the course, assignment, grade/note, and uploaded file appear.

## Security model

- User passwords are PBKDF2-hashed in the Supabase Edge Function.
- Session tokens are random and only their SHA-256 hashes are stored in the database.
- The raw session token stays in an HttpOnly, SameSite=Lax cookie on the CampusFlow site.
- Cloud tables have RLS enabled and no browser policies.
- The browser never receives a Supabase secret key.
- Uploaded files are stored in a private bucket.
- File opening/downloading uses short-lived signed URLs.
- Every snapshot/file operation resolves the account from the server-side session token.
