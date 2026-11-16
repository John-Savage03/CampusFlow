# CampusFlow Cloud Accounts Setup

The `feature/cloud-accounts` branch adds cross-device CampusFlow accounts.

## What is cloud-backed

- Usernames and password hashes
- Login sessions
- Courses
- Assignments and exams
- Grades
- Calendar/event data
- Course Hub materials, notes, and course profiles
- Project/local CampusFlow data stored under `campusflow-*`
- Bulk-uploaded course files

The existing browser storage remains as a local cache. CampusFlow downloads the user's cloud snapshot before the normal app starts and uploads changes automatically.

## 1. Create a Supabase project

Create a Supabase project at https://supabase.com.

You do not need to manually create CampusFlow database tables. The server creates its cloud tables the first time it connects.

You also do not need to manually create the file bucket. If the service-role credentials are configured, CampusFlow creates a private bucket named `campusflow-materials`.

## 2. Get the required Supabase values

From the Supabase dashboard, collect:

- PostgreSQL connection string
- Project URL
- Service-role key

The service-role key is server-only. Never place it in `index.html`, browser JavaScript, screenshots, or GitHub.

## 3. Local setup

Copy:

```
.env.example
```

to:

```
.env
```

Fill in the real values.

Then run:

```bash
npm install
npm start
```

Open:

```
http://localhost:3000
```

Do not use Live Server for cloud-account testing. The Express server owns the login cookie and cloud API.

## 4. Render setup

In the Render Web Service environment settings add:

```
NODE_ENV=production
DATABASE_URL=<Supabase PostgreSQL connection string>
SUPABASE_URL=<Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service-role key>
SUPABASE_STORAGE_BUCKET=campusflow-materials
```

Redeploy the service after saving them.

## 5. Existing-account migration

If an existing CampusFlow account only exists in browser storage:

1. Log in with the same username and password on the original browser.
2. CampusFlow verifies the old local password.
3. The account is promoted to the cloud automatically.
4. Existing CampusFlow local data is uploaded as the account's first cloud snapshot.
5. Existing IndexedDB bulk-uploaded files are migrated to private cloud storage.

After this succeeds, another device can use the same username and password.

## 6. Test cross-device behavior

On device/browser A:

1. Log in.
2. Add a course.
3. Add an assignment.
4. Add a grade or Course Hub note.
5. Bulk upload a small test file.
6. Wait about one second after the last edit.

On device/browser B:

1. Open the deployed CampusFlow site.
2. Log in with the same credentials.
3. Confirm the same course, assignment, grade/note, and uploaded file appear.

## Security notes

- Passwords are hashed server-side with Node's scrypt.
- Session tokens are random, hashed in the database, and sent in HttpOnly cookies.
- Browser JavaScript never receives the database password or Supabase service-role key.
- Files are stored in a private bucket and opened with short-lived signed URLs.
- Server endpoints always resolve the user from the login session rather than accepting a user ID from the browser.
