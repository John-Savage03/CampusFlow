/*
    coursehub.js

    Sprint 2 Course Material, Note, and
    Course Management Organizer.

    This module is intentionally independent from
    the main CampusFlow application.

    It adds:

    - Course Hub navigation
    - Course material organizer
    - Course note organizer
    - Pinned notes
    - Course management information
    - Syllabus links
    - Instructor contact information
    - Classroom / location
    - Credit hours
    - Office hours
    - Course goals and reminders

    All Course Hub data is stored in localStorage.
*/


import {
    getCourses,
    getTasksForCourse,
    getActiveRole
}
from "./state.js";


import {
    createId,
    cleanText,
    cleanMultilineText
}
from "./utils.js";


import {
    openModal,
    closeModal,
    showMessage
}
from "./ui.js";


import {
    openPage
}
from "./navigation.js";



/* ================================================= */
/* STORAGE KEYS */
/* ================================================= */

const MATERIALS_KEY =
    "campusflow-v2-materials";


const NOTES_KEY =
    "campusflow-v2-notes";


const PROFILES_KEY =
    "campusflow-v2-course-profiles";



/* ================================================= */
/* MATERIAL TYPES */
/* ================================================= */

const MATERIAL_TYPES = [

    "Syllabus",

    "Lecture",

    "Reading",

    "Video",

    "Website",

    "Study Guide",

    "Other"

];



/* ================================================= */
/* CURRENT COURSE */
/* ================================================= */

let selectedCourseId =
    "";



/* ================================================= */
/* SAFE STORAGE */
/* ================================================= */

function safeLoad(
    key,
    fallback
) {

    try {

        const value =
            localStorage.getItem(
                key
            );


        return value === null
            ? fallback
            : JSON.parse(
                value
            );

    }

    catch (error) {

        console.error(
            `Unable to load ${key}:`,
            error
        );


        return fallback;

    }

}



function safeSave(
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



/* ================================================= */
/* MATERIAL STORAGE */
/* ================================================= */

function getMaterials() {

    const data =
        safeLoad(
            MATERIALS_KEY,
            []
        );


    return Array.isArray(
        data
    )
        ? data
        : [];

}



function saveMaterials(
    materials
) {

    return safeSave(
        MATERIALS_KEY,
        materials
    );

}



/* ================================================= */
/* NOTE STORAGE */
/* ================================================= */

function getNotes() {

    const data =
        safeLoad(
            NOTES_KEY,
            []
        );


    return Array.isArray(
        data
    )
        ? data
        : [];

}



function saveNotes(
    notes
) {

    return safeSave(
        NOTES_KEY,
        notes
    );

}



/* ================================================= */
/* COURSE PROFILE STORAGE */
/* ================================================= */

function getProfiles() {

    const data =
        safeLoad(
            PROFILES_KEY,
            {}
        );


    return (
        data &&
        typeof data === "object" &&
        !Array.isArray(
            data
        )
    )
        ? data
        : {};

}



function saveProfiles(
    profiles
) {

    return safeSave(
        PROFILES_KEY,
        profiles
    );

}



/* ================================================= */
/* SELECTED COURSE */
/* ================================================= */

function getSelectedCourse() {

    const courses =
        getCourses();


    if (
        courses.length === 0
    ) {

        selectedCourseId =
            "";


        return null;

    }


    /*
        If the selected course no longer exists,
        automatically select the first course.
    */

    if (
        !courses.some(
            course =>
                course.id ===
                selectedCourseId
        )
    ) {

        selectedCourseId =
            courses[0].id;

    }


    return (
        courses.find(
            course =>
                course.id ===
                selectedCourseId
        ) ||
        null
    );

}



/* ================================================= */
/* URL VALIDATION */
/* ================================================= */

function validOptionalUrl(
    value
) {

    const cleaned =
        cleanText(
            value,
            500
        );


    /*
        URL fields are optional.
    */

    if (!cleaned) {

        return "";

    }


    try {

        const url =
            new URL(
                cleaned
            );


        /*
            Only normal web links are accepted.
        */

        return [
            "http:",
            "https:"
        ].includes(
            url.protocol
        )
            ? url.href
            : null;

    }

    catch {

        return null;

    }

}



/* ================================================= */
/* COURSE HUB CSS */
/* ================================================= */

/*
    Course Hub styles are injected by this module.

    This means main.css does not have to be edited.
*/

function injectStyles() {

    if (
        document.getElementById(
            "courseHubStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "courseHubStyles";


    style.textContent =
        `

        .course-hub-toolbar {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
            padding: 18px;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: white;
        }


        .course-hub-toolbar .form-group {
            width: min(460px, 100%);
            margin-bottom: 0;
        }


        .course-hub-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
        }


        .course-hub-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }


        .course-management-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }


        .course-management-grid .full-width {
            grid-column: 1 / -1;
        }


        .hub-list {
            display: grid;
            gap: 10px;
        }


        .hub-card {
            padding: 14px;
            border: 1px solid var(--border);
            border-radius: 9px;
            background: #f9fafb;
        }


        .hub-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }


        .hub-card h3 {
            margin-bottom: 4px;
            font-size: 15px;
        }


        .hub-meta {
            color: var(--muted);
            font-size: 12px;
        }


        .hub-card p {
            margin-top: 9px;
            line-height: 1.5;
            white-space: pre-wrap;
        }


        .hub-card-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 11px;
        }


        .hub-small-button {
            padding: 6px 10px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            color: var(--text);
        }


        .hub-delete-button {
            padding: 6px 10px;
            border: 1px solid #fecaca;
            border-radius: 6px;
            background: white;
            color: var(--danger);
        }


        .hub-pin {
            display: inline-block;
            margin-left: 7px;
            padding: 3px 7px;
            border-radius: 999px;
            background: #dbeafe;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 700;
        }


        .hub-link {
            color: var(--primary);
            text-decoration: none;
        }


        .hub-link:hover {
            text-decoration: underline;
        }


        @media (max-width: 900px) {

            .course-hub-grid,
            .course-management-grid {
                grid-template-columns: 1fr;
            }


            .course-management-grid .full-width {
                grid-column: auto;
            }


            .course-hub-toolbar {
                align-items: stretch;
                flex-direction: column;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}



/* ================================================= */
/* CREATE COURSE HUB NAVIGATION BUTTON */
/* ================================================= */

function injectNavigation() {

    /*
        Prevent duplicate buttons during refreshes.
    */

    if (
        document.getElementById(
            "courseHubNavButton"
        )
    ) {

        return;

    }


    const navigation =
        document.querySelector(
            ".sidebar nav"
        );


    if (!navigation) {

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.id =
        "courseHubNavButton";


    button.className =
        "nav-button";


    button.dataset.page =
        "courseHub";


    const label =
        document.createElement(
            "span"
        );


    label.id =
        "courseHubNavLabel";


    label.textContent =
        "Course Hub";


    button.appendChild(
        label
    );


    /*
        Put Course Hub directly before Courses
        in the sidebar.
    */

    const coursesButton =
        navigation.querySelector(
            '[data-page="courses"]'
        );


    if (coursesButton) {

        navigation.insertBefore(
            button,
            coursesButton
        );

    }

    else {

        navigation.appendChild(
            button
        );

    }


    /*
        navigation.js was initialized before this
        button existed, so Course Hub connects its
        own click listener.
    */

    button.addEventListener(
        "click",
        () => {

            openPage(
                "courseHub"
            );


            renderCourseHub();

        }
    );

}



/* ================================================= */
/* CREATE COURSE HUB PAGE */
/* ================================================= */

function injectPage() {

    if (
        document.getElementById(
            "courseHub"
        )
    ) {

        return;

    }


    const main =
        document.querySelector(
            ".main-content"
        );


    if (!main) {

        return;

    }


    const section =
        document.createElement(
            "section"
        );


    section.id =
        "courseHub";


    section.className =
        "page";


    /*
        Static trusted HTML is used here only to
        construct the interface.

        User-created materials and notes are rendered
        separately with textContent.
    */

    section.innerHTML =
        `

        <div class="page-header">

            <div>

                <h1 id="courseHubPageTitle">
                    Course Material & Note Organizer
                </h1>

                <p id="courseHubPageDescription">
                    Keep materials, notes, and important
                    course information organized by class.
                </p>

            </div>

        </div>


        <!-- COURSE SELECTOR -->

        <div class="course-hub-toolbar">

            <div class="form-group">

                <label for="courseHubCourseSelect">
                    Active Course
                </label>

                <select id="courseHubCourseSelect">
                </select>

            </div>


            <div class="course-hub-actions">

                <button
                    type="button"
                    class="primary-button"
                    id="openMaterialModalButton"
                >
                    + Add Material
                </button>


                <button
                    type="button"
                    class="primary-button"
                    id="openNoteModalButton"
                >
                    + Add Note
                </button>

            </div>

        </div>


        <!-- COURSE HUB SUMMARY -->

        <div class="overview-grid">

            <div class="overview-card">

                <h3>
                    Selected Course
                </h3>

                <p
                    id="courseHubSelectedCourse"
                    class="deadline"
                >
                    None
                </p>

                <span id="courseHubSelectedCourseName">
                    Choose a course
                </span>

            </div>


            <div class="overview-card">

                <h3>
                    Materials
                </h3>

                <p
                    id="courseHubMaterialCount"
                    class="big-number"
                >
                    0
                </p>

                <span>
                    Saved course resources
                </span>

            </div>


            <div class="overview-card">

                <h3>
                    Notes
                </h3>

                <p
                    id="courseHubNoteCount"
                    class="big-number"
                >
                    0
                </p>

                <span>
                    Saved notes
                </span>

            </div>


            <div class="overview-card">

                <h3>
                    Coursework
                </h3>

                <p
                    id="courseHubCourseworkCount"
                    class="big-number"
                >
                    0
                </p>

                <span>
                    Assignments and exams
                </span>

            </div>

        </div>


        <!-- COURSE MANAGEMENT -->

        <div class="panel">

            <div class="panel-header">

                <div>

                    <h2>
                        Course Management Details
                    </h2>

                    <p class="panel-subtitle">
                        Store important information
                        for this course.
                    </p>

                </div>

            </div>


            <form id="courseProfileForm">

                <div class="course-management-grid">


                    <div class="form-group">

                        <label for="courseProfileLocation">
                            Classroom / Location
                        </label>

                        <input
                            type="text"
                            id="courseProfileLocation"
                            maxlength="80"
                            placeholder="Newton Oakes 120"
                        >

                    </div>


                    <div class="form-group">

                        <label for="courseProfileCredits">
                            Credit Hours
                        </label>

                        <input
                            type="number"
                            id="courseProfileCredits"
                            min="0"
                            max="12"
                            step="1"
                            placeholder="3"
                        >

                    </div>


                    <div class="form-group">

                        <label for="courseProfileOfficeHours">
                            Office Hours
                        </label>

                        <input
                            type="text"
                            id="courseProfileOfficeHours"
                            maxlength="120"
                            placeholder="T/Th 1400-1600"
                        >

                    </div>


                    <div class="form-group">

                        <label for="courseProfileContact">
                            Instructor Contact
                        </label>

                        <input
                            type="text"
                            id="courseProfileContact"
                            maxlength="120"
                            placeholder="Email or preferred contact"
                        >

                    </div>


                    <div class="form-group full-width">

                        <label for="courseProfileSyllabus">
                            Syllabus Link
                        </label>

                        <input
                            type="url"
                            id="courseProfileSyllabus"
                            maxlength="500"
                            placeholder="https://..."
                        >

                    </div>


                    <div class="form-group full-width">

                        <label for="courseProfileGoals">
                            Course Goals / Reminders
                        </label>

                        <textarea
                            id="courseProfileGoals"
                            rows="4"
                            maxlength="800"
                            placeholder="Important goals, policies, exam information, or reminders..."
                        ></textarea>

                    </div>

                </div>


                <button
                    type="submit"
                    class="primary-button"
                >
                    Save Course Details
                </button>

            </form>

        </div>


        <!-- MATERIALS + NOTES -->

        <div class="course-hub-grid">


            <!-- MATERIALS -->

            <div class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            Course Materials
                        </h2>

                        <p class="panel-subtitle">
                            Syllabi, readings, lectures,
                            videos, and study guides.
                        </p>

                    </div>

                </div>


                <div
                    id="courseMaterialList"
                    class="hub-list"
                >
                </div>

            </div>


            <!-- NOTES -->

            <div class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            Course Notes
                        </h2>

                        <p class="panel-subtitle">
                            Keep notes organized with
                            the course they belong to.
                        </p>

                    </div>

                </div>


                <div
                    id="courseNoteList"
                    class="hub-list"
                >
                </div>

            </div>

        </div>

    `;


    /*
        Insert Course Hub before the normal
        Courses page.
    */

    const coursesPage =
        document.getElementById(
            "courses"
        );


    if (coursesPage) {

        main.insertBefore(
            section,
            coursesPage
        );

    }

    else {

        main.appendChild(
            section
        );

    }

}



/* ================================================= */
/* CREATE MATERIAL + NOTE MODALS */
/* ================================================= */

function injectModals() {

    /* ---------------- MATERIAL MODAL ---------------- */

    if (
        !document.getElementById(
            "courseMaterialModal"
        )
    ) {

        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "courseMaterialModal";


        modal.className =
            "modal-overlay";


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        modal.innerHTML =
            `

            <div class="modal">

                <div class="modal-header">

                    <div>

                        <h2>
                            Add Course Material
                        </h2>

                        <p>
                            Save a resource under
                            the selected course.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="close-button"
                        id="closeMaterialModalButton"
                    >
                        ×
                    </button>

                </div>


                <form id="courseMaterialForm">


                    <div class="form-group">

                        <label for="materialCourse">
                            Course
                        </label>

                        <select
                            id="materialCourse"
                            required
                        >
                        </select>

                    </div>


                    <div class="form-group">

                        <label for="materialTitle">
                            Material Title
                        </label>

                        <input
                            type="text"
                            id="materialTitle"
                            maxlength="100"
                            required
                            placeholder="Chapter 5 Reading"
                        >

                    </div>


                    <div class="form-group">

                        <label for="materialType">
                            Material Type
                        </label>

                        <select
                            id="materialType"
                            required
                        >
                        </select>

                    </div>


                    <div class="form-group">

                        <label for="materialUrl">
                            Link
                        </label>

                        <input
                            type="url"
                            id="materialUrl"
                            maxlength="500"
                            placeholder="https://..."
                        >

                    </div>


                    <div class="form-group">

                        <label for="materialDescription">
                            Description / Reminder
                        </label>

                        <textarea
                            id="materialDescription"
                            rows="4"
                            maxlength="500"
                            placeholder="What this resource covers..."
                        ></textarea>

                    </div>


                    <div class="modal-actions">

                        <button
                            type="button"
                            class="secondary-button"
                            id="cancelMaterialButton"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="primary-button"
                        >
                            Save Material
                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            modal
        );

    }



    /* ---------------- NOTE MODAL ---------------- */

    if (
        !document.getElementById(
            "courseNoteModal"
        )
    ) {

        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "courseNoteModal";


        modal.className =
            "modal-overlay";


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        modal.innerHTML =
            `

            <div class="modal">

                <div class="modal-header">

                    <div>

                        <h2>
                            Add Course Note
                        </h2>

                        <p>
                            Save a note under
                            the selected course.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="close-button"
                        id="closeNoteModalButton"
                    >
                        ×
                    </button>

                </div>


                <form id="courseNoteForm">


                    <div class="form-group">

                        <label for="noteCourse">
                            Course
                        </label>

                        <select
                            id="noteCourse"
                            required
                        >
                        </select>

                    </div>


                    <div class="form-group">

                        <label for="noteTitle">
                            Note Title
                        </label>

                        <input
                            type="text"
                            id="noteTitle"
                            maxlength="100"
                            required
                            placeholder="Midterm Review Notes"
                        >

                    </div>


                    <div class="form-group">

                        <label for="noteBody">
                            Note
                        </label>

                        <textarea
                            id="noteBody"
                            rows="7"
                            maxlength="3000"
                            required
                            placeholder="Write your note here..."
                        ></textarea>

                    </div>


                    <label
                        style="
                            display:flex;
                            align-items:center;
                            gap:8px;
                            margin-bottom:16px;
                        "
                    >

                        <input
                            type="checkbox"
                            id="notePinned"
                        >

                        Pin this note to the top

                    </label>


                    <div class="modal-actions">

                        <button
                            type="button"
                            class="secondary-button"
                            id="cancelNoteButton"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="primary-button"
                        >
                            Save Note
                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            modal
        );

    }

}



/* ================================================= */
/* SELECT OPTION HELPER */
/* ================================================= */

function createOption(
    value,
    label
) {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        value;


    option.textContent =
        label;


    return option;

}



/* ================================================= */
/* POPULATE COURSE + MATERIAL SELECTORS */
/* ================================================= */

function populateSelectors() {

    const courses =
        getCourses();


    const selectors = [

        document.getElementById(
            "courseHubCourseSelect"
        ),

        document.getElementById(
            "materialCourse"
        ),

        document.getElementById(
            "noteCourse"
        )

    ].filter(
        Boolean
    );


    selectors.forEach(
        select => {

            const previous =
                select.value ||
                selectedCourseId;


            select.replaceChildren();


            courses.forEach(
                course => {

                    select.appendChild(
                        createOption(
                            course.id,
                            `${course.code} - ${course.name}`
                        )
                    );

                }
            );


            if (
                courses.some(
                    course =>
                        course.id ===
                        previous
                )
            ) {

                select.value =
                    previous;

            }

        }
    );


    /*
        Material type selector only needs to be
        populated once.
    */

    const materialType =
        document.getElementById(
            "materialType"
        );


    if (
        materialType &&
        materialType.options.length === 0
    ) {

        MATERIAL_TYPES.forEach(
            type => {

                materialType.appendChild(
                    createOption(
                        type,
                        type
                    )
                );

            }
        );

    }

}



/* ================================================= */
/* ROLE-SPECIFIC LABELS */
/* ================================================= */

function applyRoleLabels() {

    const professor =
        getActiveRole() ===
        "professor";


    const title =
        document.getElementById(
            "courseHubPageTitle"
        );


    const description =
        document.getElementById(
            "courseHubPageDescription"
        );


    if (title) {

        title.textContent =
            professor
                ? "Course Materials & Management Hub"
                : "Course Material & Note Organizer";

    }


    if (description) {

        description.textContent =
            professor
                ? "Organize resources, notes, and management information for the courses you teach."
                : "Keep materials, notes, and important course information organized by class.";

    }

}



/* ================================================= */
/* SUMMARY CARDS */
/* ================================================= */

function renderOverview(
    course
) {

    const materials =
        getMaterials()
            .filter(
                item =>
                    item.courseId ===
                    course.id
            );


    const notes =
        getNotes()
            .filter(
                item =>
                    item.courseId ===
                    course.id
            );


    const coursework =
        getTasksForCourse(
            course.id
        );


    document.getElementById(
        "courseHubSelectedCourse"
    ).textContent =
        course.code;


    document.getElementById(
        "courseHubSelectedCourseName"
    ).textContent =
        course.name;


    document.getElementById(
        "courseHubMaterialCount"
    ).textContent =
        materials.length;


    document.getElementById(
        "courseHubNoteCount"
    ).textContent =
        notes.length;


    document.getElementById(
        "courseHubCourseworkCount"
    ).textContent =
        coursework.length;

}



/* ================================================= */
/* COURSE PROFILE */
/* ================================================= */

function renderProfile(
    course
) {

    const profile =
        getProfiles()[
            course.id
        ] || {};


    document.getElementById(
        "courseProfileLocation"
    ).value =
        profile.location ||
        "";


    document.getElementById(
        "courseProfileCredits"
    ).value =
        profile.credits ??
        "";


    document.getElementById(
        "courseProfileOfficeHours"
    ).value =
        profile.officeHours ||
        "";


    document.getElementById(
        "courseProfileContact"
    ).value =
        profile.contact ||
        "";


    document.getElementById(
        "courseProfileSyllabus"
    ).value =
        profile.syllabusUrl ||
        "";


    document.getElementById(
        "courseProfileGoals"
    ).value =
        profile.goals ||
        "";

}



/* ================================================= */
/* EMPTY MESSAGE */
/* ================================================= */

function emptyMessage(
    text
) {

    const message =
        document.createElement(
            "p"
        );


    message.className =
        "empty-message";


    message.textContent =
        text;


    return message;

}



/* ================================================= */
/* MATERIAL LIST */
/* ================================================= */

function renderMaterials(
    course
) {

    const container =
        document.getElementById(
            "courseMaterialList"
        );


    if (!container) {

        return;

    }


    container.replaceChildren();


    const materials =
        getMaterials()
            .filter(
                material =>
                    material.courseId ===
                    course.id
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    first.title.localeCompare(
                        second.title
                    )
            );


    if (
        materials.length === 0
    ) {

        container.appendChild(
            emptyMessage(
                "No course materials saved yet."
            )
        );


        return;

    }


    materials.forEach(
        material => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "hub-card";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "hub-card-header";


            const heading =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                material.title;


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "hub-meta";


            meta.textContent =
                material.type;


            heading.append(
                title,
                meta
            );


            header.appendChild(
                heading
            );


            card.appendChild(
                header
            );


            /*
                Description is optional.
            */

            if (
                material.description
            ) {

                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    material.description;


                card.appendChild(
                    description
                );

            }


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "hub-card-actions";


            /*
                If a valid resource URL was supplied,
                create an Open Resource button.
            */

            if (
                material.url
            ) {

                const link =
                    document.createElement(
                        "a"
                    );


                link.className =
                    "hub-small-button hub-link";


                link.href =
                    material.url;


                link.target =
                    "_blank";


                link.rel =
                    "noopener noreferrer";


                link.textContent =
                    "Open Resource";


                actions.appendChild(
                    link
                );

            }


            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.className =
                "hub-delete-button";


            remove.textContent =
                "Delete";


            remove.addEventListener(
                "click",
                () => {

                    const updated =
                        getMaterials()
                            .filter(
                                item =>
                                    item.id !==
                                    material.id
                            );


                    saveMaterials(
                        updated
                    );


                    renderCourseHub();


                    showMessage(
                        "Material deleted."
                    );

                }
            );


            actions.appendChild(
                remove
            );


            card.appendChild(
                actions
            );


            container.appendChild(
                card
            );

        }
    );

}



/* ================================================= */
/* NOTE LIST */
/* ================================================= */

function renderNotes(
    course
) {

    const container =
        document.getElementById(
            "courseNoteList"
        );


    if (!container) {

        return;

    }


    container.replaceChildren();


    /*
        Pinned notes appear before normal notes.
    */

    const notes =
        getNotes()
            .filter(
                note =>
                    note.courseId ===
                    course.id
            )
            .sort(
                (
                    first,
                    second
                ) => {

                    if (
                        first.pinned !==
                        second.pinned
                    ) {

                        return first.pinned
                            ? -1
                            : 1;

                    }


                    return (
                        second.createdAt ||
                        0
                    ) -
                    (
                        first.createdAt ||
                        0
                    );

                }
            );


    if (
        notes.length === 0
    ) {

        container.appendChild(
            emptyMessage(
                "No course notes saved yet."
            )
        );


        return;

    }


    notes.forEach(
        note => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "hub-card";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "hub-card-header";


            const heading =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                note.title;


            /*
                Show a PINNED label when appropriate.
            */

            if (
                note.pinned
            ) {

                const pin =
                    document.createElement(
                        "span"
                    );


                pin.className =
                    "hub-pin";


                pin.textContent =
                    "PINNED";


                title.appendChild(
                    pin
                );

            }


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "hub-meta";


            meta.textContent =
                note.createdAt
                    ? new Date(
                        note.createdAt
                    ).toLocaleString()
                    : "Saved note";


            heading.append(
                title,
                meta
            );


            header.appendChild(
                heading
            );


            card.appendChild(
                header
            );


            const body =
                document.createElement(
                    "p"
                );


            body.textContent =
                note.body;


            card.appendChild(
                body
            );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "hub-card-actions";


            /* ---------------- PIN BUTTON ---------------- */

            const pinButton =
                document.createElement(
                    "button"
                );


            pinButton.type =
                "button";


            pinButton.className =
                "hub-small-button";


            pinButton.textContent =
                note.pinned
                    ? "Unpin"
                    : "Pin";


            pinButton.addEventListener(
                "click",
                () => {

                    const updated =
                        getNotes()
                            .map(
                                item =>
                                    item.id ===
                                    note.id
                                        ? {
                                            ...item,
                                            pinned:
                                                !item.pinned
                                        }
                                        : item
                            );


                    saveNotes(
                        updated
                    );


                    renderCourseHub();

                }
            );


            /* ---------------- DELETE BUTTON ---------------- */

            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.className =
                "hub-delete-button";


            remove.textContent =
                "Delete";


            remove.addEventListener(
                "click",
                () => {

                    const updated =
                        getNotes()
                            .filter(
                                item =>
                                    item.id !==
                                    note.id
                            );


                    saveNotes(
                        updated
                    );


                    renderCourseHub();


                    showMessage(
                        "Note deleted."
                    );

                }
            );


            actions.append(
                pinButton,
                remove
            );


            card.appendChild(
                actions
            );


            container.appendChild(
                card
            );

        }
    );

}



/* ================================================= */
/* NO COURSE STATE */
/* ================================================= */

function renderNoCourses() {

    const selected =
        document.getElementById(
            "courseHubSelectedCourse"
        );


    const name =
        document.getElementById(
            "courseHubSelectedCourseName"
        );


    const materialList =
        document.getElementById(
            "courseMaterialList"
        );


    const noteList =
        document.getElementById(
            "courseNoteList"
        );


    if (selected) {

        selected.textContent =
            "None";

    }


    if (name) {

        name.textContent =
            "Create a course first";

    }


    if (materialList) {

        materialList.replaceChildren(
            emptyMessage(
                "Create a course before adding materials."
            )
        );

    }


    if (noteList) {

        noteList.replaceChildren(
            emptyMessage(
                "Create a course before adding notes."
            )
        );

    }


    [
        "courseHubMaterialCount",
        "courseHubNoteCount",
        "courseHubCourseworkCount"
    ].forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    "0";

            }

        }
    );

}



/* ================================================= */
/* MAIN COURSE HUB RENDER */
/* ================================================= */

export function renderCourseHub() {

    /*
        If the Course Hub page has not been created
        yet, safely do nothing.
    */

    if (
        !document.getElementById(
            "courseHub"
        )
    ) {

        return;

    }


    applyRoleLabels();


    populateSelectors();


    const course =
        getSelectedCourse();


    if (!course) {

        renderNoCourses();


        return;

    }


    const mainSelect =
        document.getElementById(
            "courseHubCourseSelect"
        );


    if (
        mainSelect &&
        mainSelect.value !==
        course.id
    ) {

        mainSelect.value =
            course.id;

    }


    renderOverview(
        course
    );


    renderProfile(
        course
    );


    renderMaterials(
        course
    );


    renderNotes(
        course
    );

}



/* ================================================= */
/* OPEN MATERIAL MODAL */
/* ================================================= */

function openMaterialModal() {

    const course =
        getSelectedCourse();


    if (!course) {

        showMessage(
            "Create a course before adding materials.",
            "warning"
        );


        return;

    }


    populateSelectors();


    document.getElementById(
        "materialCourse"
    ).value =
        course.id;


    openModal(
        "courseMaterialModal"
    );

}



/* ================================================= */
/* OPEN NOTE MODAL */
/* ================================================= */

function openNoteModal() {

    const course =
        getSelectedCourse();


    if (!course) {

        showMessage(
            "Create a course before adding notes.",
            "warning"
        );


        return;

    }


    populateSelectors();


    document.getElementById(
        "noteCourse"
    ).value =
        course.id;


    openModal(
        "courseNoteModal"
    );

}



/* ================================================= */
/* MODAL CLOSE HELPERS */
/* ================================================= */

function connectModalClose(
    modalId,
    ...buttonIds
) {

    buttonIds.forEach(
        id => {

            document
                .getElementById(
                    id
                )
                ?.addEventListener(
                    "click",
                    () => {

                        closeModal(
                            modalId
                        );

                    }
                );

        }
    );


    const modal =
        document.getElementById(
            modalId
        );


    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeModal(
                    modalId
                );

            }

        }
    );

}



/* ================================================= */
/* COURSE MANAGEMENT FORM */
/* ================================================= */

function setupProfileForm() {

    document
        .getElementById(
            "courseProfileForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const course =
                    getSelectedCourse();


                if (!course) {

                    return showMessage(
                        "Choose a course first.",
                        "warning"
                    );

                }


                const creditsRaw =
                    document.getElementById(
                        "courseProfileCredits"
                    ).value;


                const credits =
                    creditsRaw === ""
                        ? ""
                        : Number(
                            creditsRaw
                        );


                if (
                    credits !== "" &&
                    (
                        !Number.isFinite(
                            credits
                        ) ||
                        credits < 0 ||
                        credits > 12
                    )
                ) {

                    return showMessage(
                        "Credit hours must be between 0 and 12.",
                        "error"
                    );

                }


                const syllabusUrl =
                    validOptionalUrl(
                        document.getElementById(
                            "courseProfileSyllabus"
                        ).value
                    );


                if (
                    syllabusUrl === null
                ) {

                    return showMessage(
                        "Syllabus link must start with http:// or https://.",
                        "error"
                    );

                }


                const profiles =
                    getProfiles();


                profiles[
                    course.id
                ] = {

                    location:
                        cleanText(
                            document.getElementById(
                                "courseProfileLocation"
                            ).value,
                            80
                        ),

                    credits,

                    officeHours:
                        cleanText(
                            document.getElementById(
                                "courseProfileOfficeHours"
                            ).value,
                            120
                        ),

                    contact:
                        cleanText(
                            document.getElementById(
                                "courseProfileContact"
                            ).value,
                            120
                        ),

                    syllabusUrl,

                    goals:
                        cleanMultilineText(
                            document.getElementById(
                                "courseProfileGoals"
                            ).value,
                            800
                        )

                };


                const saved =
                    saveProfiles(
                        profiles
                    );


                showMessage(

                    saved
                        ? "Course details saved."
                        : "Course details could not be saved.",

                    saved
                        ? "success"
                        : "warning"

                );

            }
        );

}



/* ================================================= */
/* MATERIAL FORM */
/* ================================================= */

function setupMaterialForm() {

    document
        .getElementById(
            "courseMaterialForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const courseId =
                    document.getElementById(
                        "materialCourse"
                    ).value;


                const title =
                    cleanText(
                        document.getElementById(
                            "materialTitle"
                        ).value,
                        100
                    );


                const type =
                    document.getElementById(
                        "materialType"
                    ).value;


                const url =
                    validOptionalUrl(
                        document.getElementById(
                            "materialUrl"
                        ).value
                    );


                const description =
                    cleanMultilineText(
                        document.getElementById(
                            "materialDescription"
                        ).value,
                        500
                    );


                if (
                    !getCourses().some(
                        course =>
                            course.id ===
                            courseId
                    )
                ) {

                    return showMessage(
                        "Choose a valid course.",
                        "error"
                    );

                }


                if (!title) {

                    return showMessage(
                        "Material title is required.",
                        "error"
                    );

                }


                if (
                    !MATERIAL_TYPES.includes(
                        type
                    )
                ) {

                    return showMessage(
                        "Choose a valid material type.",
                        "error"
                    );

                }


                if (
                    url === null
                ) {

                    return showMessage(
                        "Material link must start with http:// or https://.",
                        "error"
                    );

                }


                const materials =
                    getMaterials();


                materials.push({

                    id:
                        createId(
                            "material"
                        ),

                    courseId,

                    title,

                    type,

                    url,

                    description,

                    createdAt:
                        Date.now()

                });


                saveMaterials(
                    materials
                );


                /*
                    Switch the Course Hub to the course
                    where the material was added.
                */

                selectedCourseId =
                    courseId;


                document
                    .getElementById(
                        "courseMaterialForm"
                    )
                    .reset();


                closeModal(
                    "courseMaterialModal"
                );


                renderCourseHub();


                showMessage(
                    "Course material saved."
                );

            }
        );

}



/* ================================================= */
/* NOTE FORM */
/* ================================================= */

function setupNoteForm() {

    document
        .getElementById(
            "courseNoteForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const courseId =
                    document.getElementById(
                        "noteCourse"
                    ).value;


                const title =
                    cleanText(
                        document.getElementById(
                            "noteTitle"
                        ).value,
                        100
                    );


                const body =
                    cleanMultilineText(
                        document.getElementById(
                            "noteBody"
                        ).value,
                        3000
                    );


                const pinned =
                    document.getElementById(
                        "notePinned"
                    ).checked;


                if (
                    !getCourses().some(
                        course =>
                            course.id ===
                            courseId
                    )
                ) {

                    return showMessage(
                        "Choose a valid course.",
                        "error"
                    );

                }


                if (!title) {

                    return showMessage(
                        "Note title is required.",
                        "error"
                    );

                }


                if (!body) {

                    return showMessage(
                        "Note text is required.",
                        "error"
                    );

                }


                const notes =
                    getNotes();


                notes.push({

                    id:
                        createId(
                            "note"
                        ),

                    courseId,

                    title,

                    body,

                    pinned,

                    createdAt:
                        Date.now()

                });


                saveNotes(
                    notes
                );


                selectedCourseId =
                    courseId;


                document
                    .getElementById(
                        "courseNoteForm"
                    )
                    .reset();


                closeModal(
                    "courseNoteModal"
                );


                renderCourseHub();


                showMessage(
                    "Course note saved."
                );

            }
        );

}



/* ================================================= */
/* COURSE HUB SETUP */
/* ================================================= */

export function setupCourseHub(
    refreshApplication
) {

    /*
        Build Course Hub after the normal
        CampusFlow application has started.
    */

    injectStyles();


    injectNavigation();


    injectPage();


    injectModals();


    populateSelectors();


    /*
        Default to the first available course.
    */

    const firstCourse =
        getCourses()[0];


    if (
        firstCourse &&
        !selectedCourseId
    ) {

        selectedCourseId =
            firstCourse.id;

    }


    /* ---------------- COURSE SELECTOR ---------------- */

    document
        .getElementById(
            "courseHubCourseSelect"
        )
        ?.addEventListener(
            "change",
            event => {

                selectedCourseId =
                    event.target.value;


                renderCourseHub();

            }
        );


    /* ---------------- OPEN MODALS ---------------- */

    document
        .getElementById(
            "openMaterialModalButton"
        )
        ?.addEventListener(
            "click",
            openMaterialModal
        );


    document
        .getElementById(
            "openNoteModalButton"
        )
        ?.addEventListener(
            "click",
            openNoteModal
        );


    /* ---------------- CLOSE MATERIAL MODAL ---------------- */

    connectModalClose(

        "courseMaterialModal",

        "closeMaterialModalButton",

        "cancelMaterialButton"

    );


    /* ---------------- CLOSE NOTE MODAL ---------------- */

    connectModalClose(

        "courseNoteModal",

        "closeNoteModalButton",

        "cancelNoteButton"

    );


    /* ---------------- FORMS ---------------- */

    setupProfileForm();


    setupMaterialForm();


    setupNoteForm();


    /*
        Update Student / Professor wording whenever
        the user changes roles.
    */

    document
        .querySelectorAll(
            ".role-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        /*
                            Give the existing role system
                            one event cycle to update state.
                        */

                        window.setTimeout(
                            () => {

                                applyRoleLabels();


                                renderCourseHub();

                            },
                            0
                        );

                    }
                );

            }
        );


    /*
        Render immediately.
    */

    renderCourseHub();

}