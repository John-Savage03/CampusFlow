/* Bulk course material uploads for CampusFlow Course Hub. */
import { getCourses } from "./state.js";
import { getCurrentAccountId } from "./account-storage.js";
import { showMessage } from "./ui.js";

const DB_NAME = "campusflow-bulk-materials-v1";
const STORE = "files";
const MAX_FILES = 20;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_SIZE = 75 * 1024 * 1024;
let pendingFiles = [];
let setupDone = false;

function makeId() {
    if (crypto.randomUUID) return "bulk-" + crypto.randomUUID();
    return "bulk-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function openDb() {
    return new Promise(function(resolve, reject) {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = function() {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
                const store = db.createObjectStore(STORE, { keyPath: "id" });
                store.createIndex("ownerCourse", ["ownerId", "courseId"], { unique: false });
            }
        };
        request.onsuccess = function() { resolve(request.result); };
        request.onerror = function() { reject(request.error); };
    });
}

async function saveRecords(records) {
    const db = await openDb();
    return new Promise(function(resolve, reject) {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        records.forEach(function(record) { store.put(record); });
        tx.oncomplete = function() { db.close(); resolve(); };
        tx.onerror = function() { const error = tx.error; db.close(); reject(error); };
    });
}

async function getRecords(ownerId, courseId) {
    const db = await openDb();
    return new Promise(function(resolve, reject) {
        const tx = db.transaction(STORE, "readonly");
        const index = tx.objectStore(STORE).index("ownerCourse");
        const request = index.getAll(IDBKeyRange.only([ownerId, courseId]));
        request.onsuccess = function() {
            const rows = request.result || [];
            rows.sort(function(a, b) { return b.uploadedAt - a.uploadedAt; });
            db.close();
            resolve(rows);
        };
        request.onerror = function() { const error = request.error; db.close(); reject(error); };
    });
}

async function getRecord(id) {
    const db = await openDb();
    return new Promise(function(resolve, reject) {
        const request = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
        request.onsuccess = function() { db.close(); resolve(request.result || null); };
        request.onerror = function() { const error = request.error; db.close(); reject(error); };
    });
}

async function removeRecord(id) {
    const db = await openDb();
    return new Promise(function(resolve, reject) {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = function() { db.close(); resolve(); };
        tx.onerror = function() { const error = tx.error; db.close(); reject(error); };
    });
}

function currentCourseId() {
    const select = document.getElementById("courseHubCourseSelect");
    return select && select.value ? select.value : (getCourses()[0] ? getCourses()[0].id : "");
}

function injectStyles() {
    if (document.getElementById("bulkMaterialStyles")) return;
    const style = document.createElement("style");
    style.id = "bulkMaterialStyles";
    style.textContent = ".bulk-list{display:grid;gap:10px}.bulk-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;background:#f9fafb}.bulk-meta{margin-top:4px;color:var(--muted);font-size:12px}.bulk-actions{display:flex;gap:7px;flex-wrap:wrap}.bulk-action{padding:7px 10px;border:1px solid #d1d5db;border-radius:6px;background:white}.bulk-delete{color:var(--danger);border-color:#fecaca}.bulk-picker{padding:18px;border:2px dashed #93c5fd;border-radius:10px;background:#eff6ff;text-align:center}@media(max-width:620px){.bulk-row{align-items:flex-start;flex-direction:column}}";
    document.head.appendChild(style);
}

function injectUi() {
    const hub = document.getElementById("courseHub");
    if (!hub) return false;

    const actions = hub.querySelector(".course-hub-actions");
    if (actions && !document.getElementById("openBulkMaterialButton")) {
        const button = document.createElement("button");
        button.id = "openBulkMaterialButton";
        button.type = "button";
        button.className = "secondary-button";
        button.textContent = "Bulk Upload Files";
        actions.appendChild(button);
    }

    const materialPanel = document.getElementById("courseMaterialList")?.closest(".panel");
    if (materialPanel && !document.getElementById("bulkMaterialPanel")) {
        const panel = document.createElement("div");
        panel.id = "bulkMaterialPanel";
        panel.className = "panel";
        panel.innerHTML = '<div class="panel-header"><div><h2>Uploaded Files</h2><p class="panel-subtitle">Files uploaded in bulk for the selected course.</p></div><span id="bulkMaterialCount" class="panel-subtitle">0 files</span></div><div id="bulkMaterialList" class="bulk-list"></div>';
        materialPanel.insertAdjacentElement("afterend", panel);
    }

    if (!document.getElementById("bulkMaterialModal")) {
        const modal = document.createElement("div");
        modal.id = "bulkMaterialModal";
        modal.className = "modal-overlay";
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = '<div class="modal"><div class="modal-header"><div><h2>Bulk Upload Course Materials</h2><p>Select multiple files for one course.</p></div><button type="button" class="close-button" id="closeBulkMaterialButton">×</button></div><form id="bulkMaterialForm"><div class="form-group"><label for="bulkMaterialCourse">Course</label><select id="bulkMaterialCourse" required></select></div><div class="bulk-picker"><input id="bulkMaterialFiles" type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,.png,.jpg,.jpeg,.webp,.gif,.zip"><p class="panel-subtitle" style="margin-top:8px">Choose up to 20 files. 20 MB each, 75 MB total.</p></div><div id="bulkPendingList" class="bulk-list" style="margin-top:16px"></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelBulkMaterialButton">Cancel</button><button type="submit" class="primary-button" id="uploadBulkMaterialButton">Upload All</button></div></form></div>';
        document.body.appendChild(modal);
    }
    return true;
}

function populateCourses() {
    const select = document.getElementById("bulkMaterialCourse");
    if (!select) return;
    const courses = getCourses();
    const current = currentCourseId();
    select.replaceChildren();
    courses.forEach(function(course) {
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = course.code + " - " + course.name;
        select.appendChild(option);
    });
    if (courses.some(function(course) { return course.id === current; })) select.value = current;
}

function renderPending() {
    const list = document.getElementById("bulkPendingList");
    const upload = document.getElementById("uploadBulkMaterialButton");
    if (!list) return;
    list.replaceChildren();
    if (!pendingFiles.length) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No files selected yet.";
        list.appendChild(message);
        if (upload) upload.disabled = true;
        return;
    }
    if (upload) upload.disabled = false;
    pendingFiles.forEach(function(file, index) {
        const row = document.createElement("div");
        row.className = "bulk-row";
        const info = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = file.name;
        const meta = document.createElement("div");
        meta.className = "bulk-meta";
        meta.textContent = formatBytes(file.size);
        info.append(name, meta);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "bulk-action bulk-delete";
        remove.dataset.index = String(index);
        remove.textContent = "Remove";
        row.append(info, remove);
        list.appendChild(row);
    });
}

function openModal() {
    if (!getCourses().length) return showMessage("Create a course before uploading materials.", "warning");
    populateCourses();
    pendingFiles = [];
    renderPending();
    const modal = document.getElementById("bulkMaterialModal");
    modal?.classList.add("show");
    modal?.setAttribute("aria-hidden", "false");
}

function closeModal() {
    const modal = document.getElementById("bulkMaterialModal");
    modal?.classList.remove("show");
    modal?.setAttribute("aria-hidden", "true");
    pendingFiles = [];
}

async function openFile(recordId, download) {
    const ownerId = getCurrentAccountId();
    const record = await getRecord(recordId);
    if (!record || record.ownerId !== ownerId) return showMessage("That file is not available for this account.", "error");
    const url = URL.createObjectURL(record.blob);
    if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = record.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } else {
        window.open(url, "_blank", "noopener,noreferrer");
    }
    setTimeout(function() { URL.revokeObjectURL(url); }, download ? 1000 : 60000);
}

export async function renderBulkMaterials() {
    injectStyles();
    if (!injectUi()) return;
    const list = document.getElementById("bulkMaterialList");
    const count = document.getElementById("bulkMaterialCount");
    if (!list || !count) return;
    list.replaceChildren();

    const ownerId = getCurrentAccountId();
    const courseId = currentCourseId();
    if (!ownerId || !courseId) {
        count.textContent = "0 files";
        return;
    }

    const records = await getRecords(ownerId, courseId);
    count.textContent = records.length + " file" + (records.length === 1 ? "" : "s");
    if (!records.length) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No uploaded files for this course yet.";
        list.appendChild(message);
        return;
    }

    records.forEach(function(record) {
        const row = document.createElement("article");
        row.className = "bulk-row";
        row.dataset.fileId = record.id;
        const info = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = record.name;
        const meta = document.createElement("div");
        meta.className = "bulk-meta";
        meta.textContent = formatBytes(record.size) + " • Uploaded " + new Date(record.uploadedAt).toLocaleDateString();
        info.append(name, meta);
        const actions = document.createElement("div");
        actions.className = "bulk-actions";
        [["open", "Open"], ["download", "Download"], ["delete", "Delete"]].forEach(function(item) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "bulk-action" + (item[0] === "delete" ? " bulk-delete" : "");
            button.dataset.action = item[0];
            button.textContent = item[1];
            actions.appendChild(button);
        });
        row.append(info, actions);
        list.appendChild(row);
    });
}

export async function setupBulkMaterials() {
    if (setupDone) return renderBulkMaterials();
    injectStyles();
    if (!injectUi()) return;
    setupDone = true;

    document.getElementById("openBulkMaterialButton")?.addEventListener("click", openModal);
    document.getElementById("closeBulkMaterialButton")?.addEventListener("click", closeModal);
    document.getElementById("cancelBulkMaterialButton")?.addEventListener("click", closeModal);

    document.getElementById("bulkMaterialFiles")?.addEventListener("change", function(event) {
        const selected = Array.from(event.target.files || []).slice(0, MAX_FILES);
        const accepted = selected.filter(function(file) { return file.size <= MAX_FILE_SIZE; });
        pendingFiles = accepted;
        renderPending();
        if (accepted.length !== Array.from(event.target.files || []).length) showMessage("Some files were skipped because of size or the 20-file limit.", "warning");
    });

    document.getElementById("bulkPendingList")?.addEventListener("click", function(event) {
        const button = event.target.closest("[data-index]");
        if (!button) return;
        pendingFiles.splice(Number(button.dataset.index), 1);
        renderPending();
    });

    document.getElementById("bulkMaterialForm")?.addEventListener("submit", async function(event) {
        event.preventDefault();
        const ownerId = getCurrentAccountId();
        const courseId = document.getElementById("bulkMaterialCourse")?.value || "";
        if (!ownerId) return showMessage("Log in before uploading files.", "error");
        if (!getCourses().some(function(course) { return course.id === courseId; })) return showMessage("Choose a valid course.", "error");
        if (!pendingFiles.length) return showMessage("Choose at least one file.", "warning");
        const total = pendingFiles.reduce(function(sum, file) { return sum + file.size; }, 0);
        if (total > MAX_TOTAL_SIZE) return showMessage("This upload is larger than the 75 MB total limit.", "error");

        const button = document.getElementById("uploadBulkMaterialButton");
        if (button) { button.disabled = true; button.textContent = "Uploading..."; }
        try {
            const uploadedAt = Date.now();
            const records = pendingFiles.map(function(file) {
                return { id: makeId(), ownerId, courseId, name: file.name, type: file.type, size: file.size, uploadedAt, blob: file };
            });
            await saveRecords(records);
            const hubSelect = document.getElementById("courseHubCourseSelect");
            if (hubSelect) hubSelect.value = courseId;
            closeModal();
            await renderBulkMaterials();
            showMessage(records.length + " file" + (records.length === 1 ? "" : "s") + " uploaded.", "success");
        } catch (error) {
            console.error("Bulk material upload failed:", error);
            showMessage("The browser could not save those files. Try fewer or smaller files.", "error");
        } finally {
            if (button) { button.disabled = false; button.textContent = "Upload All"; }
        }
    });

    document.getElementById("bulkMaterialList")?.addEventListener("click", async function(event) {
        const button = event.target.closest("[data-action]");
        const row = button?.closest("[data-file-id]");
        if (!button || !row) return;
        if (button.dataset.action === "open") return openFile(row.dataset.fileId, false);
        if (button.dataset.action === "download") return openFile(row.dataset.fileId, true);
        if (button.dataset.action === "delete") {
            const record = await getRecord(row.dataset.fileId);
            if (!record || record.ownerId !== getCurrentAccountId()) return;
            if (!confirm("Delete " + record.name + "?")) return;
            await removeRecord(record.id);
            await renderBulkMaterials();
            showMessage("Uploaded file deleted.", "success");
        }
    });

    document.getElementById("courseHubCourseSelect")?.addEventListener("change", function() {
        renderBulkMaterials().catch(function(error) { console.error(error); });
    });

    document.getElementById("bulkMaterialModal")?.addEventListener("click", function(event) {
        if (event.target.id === "bulkMaterialModal") closeModal();
    });

    await renderBulkMaterials();
}
