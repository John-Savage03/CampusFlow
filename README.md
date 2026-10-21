# CampusFlow

CampusFlow is a student and professor academic planning application created for a Software Engineering course project.

The application provides different Student and Professor views while sharing a common academic data model.

---

# Sprint 1

Sprint 1 establishes the initial functional application and shells for the project's major features.

Sprint 1 includes:

- Student View
- Professor View
- Dashboard and Weekly Overview
- Course Management
- Unified Calendar
- Assignment and Exam Tracker
- Event Creation
- Shared Application State
- Browser Data Persistence

---

# User Views

## Student View

The Student View focuses on personal academic planning.

The student dashboard provides:

- Upcoming assignments and exams
- Current course count
- Completed coursework count
- Next deadline
- Today's class schedule
- Seven-day weekly overview
- Mini calendar

Student navigation includes:

- Dashboard
- Calendar
- Assignments & Exams
- Courses

---

## Professor View

The Professor View focuses on course and coursework management.

The professor dashboard provides:

- Number of courses being managed
- Total assignments and exams
- Upcoming coursework count
- Calendar event count
- Course overview
- Upcoming coursework
- Seven-day teaching overview
- Quick links to course, coursework, and calendar management

Professor navigation includes:

- Professor Dashboard
- Calendar
- Coursework
- Course Management

---

# Switching Views

The Student / Professor selector is located in the application sidebar.

Select:

- Student
- Professor

CampusFlow stores the selected view using browser localStorage.

If the browser is refreshed, CampusFlow will reopen using the last selected view.

---

# Important Sprint 1 Role Limitation

The Student and Professor modes currently represent two application perspectives rather than separate authenticated user accounts.

Both views use the same Sprint 1 demonstration data.

For example, an assignment created while viewing the site as a professor can also appear in the student calendar.

A later version can add:

- User accounts
- Authentication
- Student enrollments
- Professor course ownership
- Separate user records
- Server-side permissions

The current role architecture is separated from the other features so authentication can be added later without rebuilding the full interface.

---

# Dashboard

## Student Dashboard

The Student Dashboard provides:

- Upcoming work
- Current courses
- Completed work
- Next deadline
- Upcoming assignment list
- Today's schedule
- Weekly overview
- Mini calendar

---

## Professor Dashboard

The Professor Dashboard provides:

- Courses teaching
- Total coursework
- Upcoming deadlines
- Calendar event count
- Course overview
- Upcoming coursework
- Teaching week
- Quick management actions

---

# Unified Calendar

The Unified Calendar combines:

- Events
- Assignments
- Exams

Calendar colors are:

- Blue = Event
- Red = Assignment
- Yellow = Exam

Users can move between months using the previous and next month controls.

Clicking an item displays additional details.

---

# Assignment and Exam Tracker

The tracker supports:

- Assignments
- Exams
- Course association
- Due dates
- Priority
- Status
- Descriptions
- Course filtering
- Type filtering
- Status filtering
- Status updates

Assignments and exams automatically appear in:

- Unified Calendar
- Student Dashboard
- Professor Dashboard
- Weekly Overview

---

# Course Management

Course Management supports:

- Course code
- Course name
- Instructor
- Meeting schedule
- Meeting time
- Online courses
- Coursework count
- Course details

Courses become available when creating assignments and exams.

---

# Project Structure

```text
CampusFlow/
│
├── index.html
├── README.md
│
├── css/
│   ├── main.css
│   ├── calendar.css
│   └── modals.css
│
└── js/
    ├── app.js
    ├── navigation.js
    ├── storage.js
    ├── state.js
    ├── utils.js
    ├── validation.js
    ├── feedback.js
    ├── details.js
    ├── calendar.js
    ├── events.js
    ├── assignments.js
    ├── courses.js
    ├── dashboard.js
    ├── role.js
    └── professor.js

# Authentication setup (updated)

- `signup.html` saves newly created accounts in this browser's `localStorage` under `campusFlowUsers`. Passwords are stored as salted PBKDF2 hashes, not plain text.
- `login.html` uses the same saved account list, so newly registered usernames and passwords can be used to log in.
- Successful login opens `index.html`. That is the main application and already contains the Student and Professor interfaces; separate `student.html` and `professor.html` files are not needed for this version.
- `js/auth-guard.js` requires a logged-in session, locks Student accounts to Student View, and adds Log Out. Professor accounts start in Professor View and can use the role selector.

Run the project through a local web server (such as VS Code Live Server), not by opening the HTML files directly. Accounts are stored per browser and are only suitable for a class/demo prototype; production authentication requires a server and database.


## Task Organizer

- Sorts unfinished assignments and exams by deadline.
- Shows overdue, due today, and upcoming deadline labels.
- Places unfinished work before completed work in the assignment list.
- Keeps the dashboard focused on the four most urgent unfinished tasks.

## Project and Subtask Manager

- Create projects with deadlines.
- Break projects into smaller checklist tasks.
- Mark subtasks complete and track progress.
- Remove subtasks or delete projects.

## Course Materials and Notes Organizer

- Save notes, documents, readings, videos, links, and other resources.
- Connect each item to a course.
- Add a title, resource link, and notes or description.
- Filter saved materials by course and delete items when they are no longer needed.

## Student and Professor Accounts

- Users can sign up and log in as a student or professor.
- The app opens the matching view after login.
- Student and professor views provide different academic information.
- Demo account and application data are stored in the browser.
