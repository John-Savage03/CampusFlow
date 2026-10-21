
/*
    materials.js
    Handles creating, saving, displaying, filtering, and deleting
    course resources.
*/

// Import the existing course list and the app's message notification function.
import { getCourses } from "./state.js";
import { showMessage } from "./feedback.js";

// Use a unique localStorage key to keep course resources separate
// from other CampusFlow data.
const STORAGE_KEY = "campusflow-course-materials-v1";

// Load saved resources when this module starts.
let materials = loadMaterials();


// Read saved resources from localStorage and check that each item
// has the basic fields this feature expects.
function loadMaterials() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved)
            ? saved.filter(item =>
                item &&
                typeof item.id === "string" &&
                typeof item.title === "string" &&
                typeof item.courseId === "string"
            )
            : [];
    } catch (error) {
        // Prevent invalid saved data from crashing the page.
        console.error("Unable to load course materials:", error);
        return [];
    }
}


// Convert the materials array into JSON and save it in the browser.
// Return true when saving succeeds and false if it fails.
function saveMaterials() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(materials)
        );

        return true;
    } catch (error) {
        console.error("Unable to save course materials:", error);
        showMessage(
            "Could not save materials in this browser.",
            "error"
        );

        return false;
    }
}


// Escape special HTML characters so user-entered text is displayed
// as text instead of being interpreted as HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// Validate resource URLs and allow only HTTP or HTTPS links.
// Return an empty string if the URL is missing or invalid.
function safeUrl(value) {
    if (!value) return "";

    try {
        const url = new URL(value);

        return ["http:", "https:"].includes(url.protocol)
            ? url.href
            : "";
    } catch {
        return "";
    }
}


// Fill the course dropdown and filter using CampusFlow's saved courses.
// Preserve the user's current selections when possible.
function populateCourseOptions() {
    const courses = getCourses();

    const courseSelect = document.getElementById("materialCourse");
    const filterSelect = document.getElementById(
        "materialsCourseFilter"
    );

    const selectedCourse = courseSelect.value;
    const selectedFilter = filterSelect.value || "all";

    // Add every available course to the form dropdown.
    courseSelect.innerHTML =
        '<option value="">Select a course</option>' +
        courses.map(course => `
            <option value="${escapeHTML(course.id)}">
                ${escapeHTML(course.code)} - ${escapeHTML(course.name)}
            </option>
        `).join("");

    // Add the same courses to the list filter.
    filterSelect.innerHTML =
        '<option value="all">All courses</option>' +
        courses.map(course => `
            <option value="${escapeHTML(course.id)}">
                ${escapeHTML(course.code)} - ${escapeHTML(course.name)}
            </option>
        `).join("");

    // Restore selections if those courses still exist.
    if (courses.some(course => course.id === selectedCourse)) {
        courseSelect.value = selectedCourse;
    }

    if (
        selectedFilter === "all" ||
        courses.some(course => course.id === selectedFilter)
    ) {
        filterSelect.value = selectedFilter;
    }

    // Prevent adding a resource when no courses are available.
    courseSelect.disabled = courses.length === 0;
}


// Display the saved resources and update the count.
// This function runs after adding, deleting, or filtering resources.
export function renderMaterials() {
    const list = document.getElementById("materialsList");
    const summary = document.getElementById("materialsSummary");
    const filter = document.getElementById("materialsCourseFilter");

    // Exit if this page's HTML elements are unavailable.
    if (!list || !summary || !filter) return;

    populateCourseOptions();

    const selectedCourse = filter.value || "all";
    const courses = getCourses();

    // Keep all resources or show only resources for the selected course.
    // Newer resources appear first.
    const filtered = materials
        .filter(item =>
            selectedCourse === "all" ||
            item.courseId === selectedCourse
        )
        .sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
        );

    // Update the number of resources currently displayed.
    summary.textContent =
        `${filtered.length} material${filtered.length === 1 ? "" : "s"} saved`;

    // Show a helpful message when no resources match the filter.
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="materials-empty">
                <h3>No materials found</h3>
                <p>
                    Add a note or resource above, or choose another
                    course filter.
                </p>
            </div>
        `;

        return;
    }

    // Build a card for each resource, including its course,
    // type, description, optional link, and delete button.
    list.innerHTML = filtered.map(item => {
        const course = courses.find(
            entry => entry.id === item.courseId
        );

        const url = safeUrl(item.url);

        return `
            <article
                class="material-card"
                data-material-id="${escapeHTML(item.id)}"
            >
                <div class="material-card-header">
                    <div>
                        <span class="material-type">
                            ${escapeHTML(item.type)}
                        </span>

                        <h3>${escapeHTML(item.title)}</h3>

                        <p class="material-course">
                            ${course
                                ? `${escapeHTML(course.code)} - ${escapeHTML(course.name)}`
                                : "Course no longer available"}
                        </p>
                    </div>

                    <button
                        type="button"
                        class="material-delete-button"
                        data-action="delete-material"
                        aria-label="Delete ${escapeHTML(item.title)}"
                    >
                        Delete
                    </button>
                </div>

                ${item.notes ? `
                    <p class="material-notes">
                        ${escapeHTML(item.notes)}
                    </p>
                ` : ""}

                ${url ? `
                    <a
                        class="material-link"
                        href="${escapeHTML(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open resource ↗
                    </a>
                ` : ""}
            </article>
        `;
    }).join("");
}


// Attach event listeners to the form, filter, and resource list.
// Call this once when CampusFlow starts.
export function setupMaterials() {
    const form = document.getElementById("materialForm");
    const list = document.getElementById("materialsList");
    const filter = document.getElementById("materialsCourseFilter");

    // Do not attach listeners if the required HTML is missing.
    if (!form || !list || !filter) return;

    // Handle form submissions without reloading the page.
    form.addEventListener("submit", event => {
        event.preventDefault();

        // Read the user's input and remove extra spaces.
        const title = form.elements.title.value.trim();
        const courseId = form.elements.courseId.value;
        const type = form.elements.type.value;
        const url = form.elements.url.value.trim();
        const notes = form.elements.notes.value.trim();

        // Make sure a title and course have been provided.
        if (!title || !courseId) {
            showMessage(
                "Enter a title and select a course.",
                "error"
            );

            return;
        }

        // Reject invalid or unsupported resource links.
        if (url && !safeUrl(url)) {
            showMessage(
                "Enter a valid HTTP or HTTPS link.",
                "error"
            );

            return;
        }

        // Create a resource object with a unique ID and timestamp.
        materials.unshift({
            id: `material-${Date.now()}-${Math.random()
                .toString(36).slice(2, 8)}`,
            title,
            courseId,
            type,
            url,
            notes,
            createdAt: new Date().toISOString()
        });

        // Save the new resource, clear the form, and refresh the list.
        if (saveMaterials()) {
            form.reset();
            renderMaterials();

            showMessage("Course material saved.", "success");
        }
    });

    // Re-render the list when the user selects a different course.
    filter.addEventListener("change", renderMaterials);

    // Use one click listener for all delete buttons in the resource list.
    // This also works for cards created later by renderMaterials().
    list.addEventListener("click", event => {
        const button = event.target.closest(
            '[data-action="delete-material"]'
        );

        if (!button) return;

        const card = button.closest("[data-material-id]");

        // Remove the matching resource from the array.
        materials = materials.filter(
            item => item.id !== card.dataset.materialId
        );

        // Save the updated list and refresh the page.
        saveMaterials();
        renderMaterials();

        showMessage("Course material deleted.", "success");
    });
}
