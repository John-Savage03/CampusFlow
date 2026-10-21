
/*
    projects.js
    Project and Subtask Manager - Sprint Feature 11.
*/

import { showMessage } from "./feedback.js";

const STORAGE_KEY = "campusflow-projects-v1";
let projects = loadProjects();

function loadProjects() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved)
            ? saved.filter(project =>
                project &&
                typeof project.id === "string" &&
                typeof project.name === "string" &&
                typeof project.deadline === "string" &&
                Array.isArray(project.tasks)
            )
            : [];
    } catch (error) {
        console.error("Unable to load projects:", error);
        return [];
    }
}

function saveProjects() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(projects)
        );
        return true;
    } catch (error) {
        console.error("Unable to save projects:", error);
        showMessage(
            "Could not save project changes in this browser.",
            "error"
        );
        return false;
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(dateString) {
    if (!dateString) return "No deadline";

    const date = new Date(`${dateString}T00:00:00`);

    return Number.isNaN(date.getTime())
        ? dateString
        : date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
}

function getProgress(project) {
    const total = project.tasks.length;

    const completed = project.tasks.filter(
        task => task.completed
    ).length;

    const percent = total
        ? Math.round((completed / total) * 100)
        : 0;

    let status = "Not started";

    if (total > 0 && completed === total) {
        status = "Completed";
    } else if (completed > 0) {
        status = "In progress";
    }

    return { total, completed, percent, status };
}

export function renderProjects() {
    const container = document.getElementById("projectList");
    const summary = document.getElementById("projectSummary");

    if (!container || !summary) return;

    const totalTasks = projects.reduce(
        (sum, project) => sum + project.tasks.length,
        0
    );

    const completedTasks = projects.reduce(
        (sum, project) =>
            sum + project.tasks.filter(task => task.completed).length,
        0
    );

    summary.textContent =
        `${projects.length} project${projects.length === 1 ? "" : "s"} · ` +
        `${completedTasks} of ${totalTasks} subtasks completed`;

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="project-empty">
                <h3>No projects yet</h3>
                <p>Create a project above, then add smaller tasks
                to build your checklist.</p>
            </div>`;
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    container.innerHTML = projects.map(project => {
        const progress = getProgress(project);

        const overdue =
            project.deadline &&
            new Date(`${project.deadline}T00:00:00`) < today &&
            progress.status !== "Completed";

        return `
            <article class="project-card"
                data-project-id="${escapeHTML(project.id)}">

                <div class="project-card-header">
                    <div class="project-card-title">
                        <h2>${escapeHTML(project.name)}</h2>
                        <p class="project-deadline ${overdue ? "overdue" : ""}">
                            ${overdue ? "Overdue · " : "Deadline · "}
                            ${escapeHTML(formatDate(project.deadline))}
                        </p>
                    </div>

                    <span class="project-status ${
                        progress.status.toLowerCase().replace(/\s+/g, "-")
                    }">${progress.status}</span>
                </div>

                <div class="project-progress-row">
                    <span>${progress.completed} of ${progress.total} tasks completed</span>
                    <strong>${progress.percent}%</strong>
                </div>

                <div class="project-progress-track"
                    role="progressbar"
                    aria-valuenow="${progress.percent}"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="${escapeHTML(project.name)} progress">
                    <span style="width:${progress.percent}%"></span>
                </div>

                <ul class="project-task-list">
                    ${project.tasks.length
                        ? project.tasks.map(task => `
                            <li class="project-task ${
                                task.completed ? "is-complete" : ""
                            }">
                                <label>
                                    <input type="checkbox"
                                        data-action="toggle-task"
                                        data-task-id="${escapeHTML(task.id)}"
                                        ${task.completed ? "checked" : ""}>
                                    <span>${escapeHTML(task.title)}</span>
                                </label>

                                <button type="button"
                                    class="project-remove-task"
                                    data-action="remove-task"
                                    data-task-id="${escapeHTML(task.id)}"
                                    aria-label="Remove ${escapeHTML(task.title)}">
                                    ×
                                </button>
                            </li>
                        `).join("")
                        : `<li class="project-no-tasks">
                            No subtasks yet. Add the first task below.
                           </li>`
                    }
                </ul>

                <form class="project-add-task-form"
                    data-project-id="${escapeHTML(project.id)}">

                    <label class="sr-only"
                        for="new-task-${escapeHTML(project.id)}">
                        New task for ${escapeHTML(project.name)}
                    </label>

                    <input id="new-task-${escapeHTML(project.id)}"
                        name="taskTitle"
                        type="text"
                        maxlength="160"
                        placeholder="Add a smaller task…"
                        required>

                    <button class="small-button" type="submit">
                        Add Task
                    </button>
                </form>

                <div class="project-card-footer">
                    <button type="button"
                        class="project-delete-button"
                        data-action="delete-project">
                        Delete project
                    </button>
                </div>
            </article>`;
    }).join("");
}

export function setupProjects() {
    const createForm = document.getElementById("createProjectForm");
    const container = document.getElementById("projectList");

    if (!createForm || !container) return;

    // Create a project.
    createForm.addEventListener("submit", event => {
        event.preventDefault();

        const nameInput = document.getElementById("projectName");
        const deadlineInput = document.getElementById("projectDeadline");

        const name = nameInput.value.trim();
        const deadline = deadlineInput.value;

        if (!name || !deadline) {
            showMessage(
                "Enter a project name and deadline.",
                "error"
            );
            return;
        }

        projects.unshift({
            id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            deadline,
            createdAt: new Date().toISOString(),
            tasks: []
        });

        saveProjects();
        createForm.reset();
        renderProjects();

        showMessage(
            "Project created. Add your smaller tasks below.",
            "success"
        );
    });

    // Add a subtask to its project.
    container.addEventListener("submit", event => {
        const form = event.target.closest(".project-add-task-form");
        if (!form) return;

        event.preventDefault();

        const input = form.elements.taskTitle;
        const title = input.value.trim();

        if (!title) return;

        const project = projects.find(
            item => item.id === form.dataset.projectId
        );

        if (!project) return;

        project.tasks.push({
            id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title,
            completed: false
        });

        saveProjects();
        renderProjects();

        showMessage("Task added to project.", "success");
    });

    // Mark a subtask complete or incomplete.
    container.addEventListener("change", event => {
        const checkbox = event.target.closest(
            '[data-action="toggle-task"]'
        );

        if (!checkbox) return;

        const card = checkbox.closest("[data-project-id]");

        const project = projects.find(
            item => item.id === card.dataset.projectId
        );

        const task = project &&
            project.tasks.find(
                item => item.id === checkbox.dataset.taskId
            );

        if (!task) return;

        task.completed = checkbox.checked;

        saveProjects();
        renderProjects();
    });

    // Remove a subtask or delete a project.
    container.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const card = button.closest("[data-project-id]");
        if (!card) return;

        const project = projects.find(
            item => item.id === card.dataset.projectId
        );

        if (!project) return;

        if (button.dataset.action === "remove-task") {
            project.tasks = project.tasks.filter(
                task => task.id !== button.dataset.taskId
            );

            saveProjects();
            renderProjects();
            showMessage("Task removed.", "success");

        } else if (button.dataset.action === "delete-project") {
            if (!window.confirm(
                `Delete project "${project.name}" and all its subtasks?`
            )) {
                return;
            }

            projects = projects.filter(
                item => item.id !== project.id
            );

            saveProjects();
            renderProjects();
            showMessage("Project deleted.", "success");
        }
    });

    renderProjects();
}
