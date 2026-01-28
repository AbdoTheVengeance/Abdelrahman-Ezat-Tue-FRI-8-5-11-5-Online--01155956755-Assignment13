var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var STORAGE_KEY = "kanban_todo";
// Get elements
var addBtn = document.getElementById("add-task-btn");
var overlay = document.getElementById("modal-overlay");
var modalTitle = document.getElementById("modal-title");
var closeBtn = document.getElementById("close-modal-btn");
var cancelBtn = document.getElementById("cancel-btn");
var form = document.getElementById("task-form");
var titleInput = document.getElementById("task-title");
var priorityInput = document.getElementById("task-priority");
var dueDateInput = document.getElementById("task-due-date");
var descInput = document.getElementById("task-description");
var titleError = document.getElementById("title-error");
var dateError = document.getElementById("date-error");
var descError = document.getElementById("description-error");
var charCount = document.getElementById("char-count");
var submitBtnText = document.getElementById("submit-btn-text");
var todoCol = document.getElementById("tasks-todo");
var inProgressCol = document.getElementById("tasks-in-progress");
var completedCol = document.getElementById("tasks-completed");
// column headers
var todoCountEl = document.querySelector('[data-status="todo"] .text-xs.text-slate-400');
var inProgressCountEl = document.querySelector('[data-status="in-progress"] .text-xs.text-slate-400');
var completedCountEl = document.querySelector('[data-status="completed"] .text-xs.text-slate-400');
// App state
var tasks = [];
var editingId = null;
// LocalStorage
function loadTasks() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        tasks = [];
        return;
    }
    try {
        tasks = JSON.parse(raw);
    }
    catch (_a) {
        tasks = [];
    }
}
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
// Small helpers
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (c) {
        if (c === "&")
            return "&amp;";
        if (c === "<")
            return "&lt;";
        if (c === ">")
            return "&gt;";
        if (c === '"')
            return "&quot;";
        return "&#039;";
    });
}
function clearErrors() {
    titleError.classList.add("hidden");
    dateError.classList.add("hidden");
    descError.classList.add("hidden");
    titleError.textContent = "";
    dateError.textContent = "";
    descError.textContent = "";
}
function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove("hidden");
}
function updateCharCount() {
    charCount.textContent = "".concat(descInput.value.length, "/500");
}
// Modal
function openCreateModal() {
    editingId = null;
    modalTitle.textContent = "Create New Task";
    submitBtnText.textContent = "Add Task";
    clearErrors();
    titleInput.value = "";
    priorityInput.value = "medium";
    dueDateInput.value = "";
    descInput.value = "";
    updateCharCount();
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
}
function openEditModal(task) {
    editingId = task.id;
    modalTitle.textContent = "Edit Task";
    submitBtnText.textContent = "Save Changes";
    clearErrors();
    titleInput.value = task.title;
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate;
    descInput.value = task.description;
    updateCharCount();
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
}
function closeModal() {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
    editingId = null;
}
// Validation
function validateForm() {
    clearErrors();
    var title = titleInput.value.trim();
    var desc = descInput.value.trim();
    var due = dueDateInput.value;
    var ok = true;
    if (title === "") {
        showError(titleError, "Title is required.");
        ok = false;
    }
    if (desc.length > 500) {
        showError(descError, "Description must be 500 characters or less.");
        ok = false;
    }
    // date check
    if (due !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        showError(dateError, "Invalid date.");
        ok = false;
    }
    return ok;
}
// Render
function updateCounts() {
    var todoCount = tasks.filter(function (t) { return t.status === "todo"; }).length;
    var inProgressCount = tasks.filter(function (t) { return t.status === "in-progress"; }).length;
    var completedCount = tasks.filter(function (t) { return t.status === "completed"; }).length;
    todoCountEl.textContent = "".concat(todoCount, " task").concat(todoCount === 1 ? "" : "s");
    inProgressCountEl.textContent = "".concat(inProgressCount, " task").concat(inProgressCount === 1 ? "" : "s");
    completedCountEl.textContent = "".concat(completedCount, " task").concat(completedCount === 1 ? "" : "s");
}
function makePriorityBadge(priority) {
    if (priority === "low") {
        return "<span class=\"bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide\">Low</span>";
    }
    if (priority === "high") {
        return "<span class=\"bg-red-50 text-red-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide\">High</span>";
    }
    return "<span class=\"bg-amber-50 text-amber-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide\">Medium</span>";
}
function makeCard(task) {
    var title = escapeHtml(task.title);
    var desc = task.description ? escapeHtml(task.description) : "No description";
    var due = task.dueDate ? escapeHtml(task.dueDate) : "No due date";
    return "\n    <div class=\"group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200\"\n         data-task-id=\"".concat(task.id, "\">\n      <div class=\"flex items-center justify-between mb-3\">\n        <div class=\"flex items-center gap-2\">\n          <span class=\"w-2 h-2 rounded-full bg-slate-300\"></span>\n          <span class=\"text-[10px] font-medium text-slate-400 uppercase tracking-wider\">Task</span>\n        </div>\n\n        <div class=\"flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity\">\n          <button class=\"edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors\"\n                  data-task-id=\"").concat(task.id, "\" title=\"Edit task\">\n            <i class=\"fa-solid fa-pen text-xs pointer-events-none\"></i>\n          </button>\n          <button class=\"delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors\"\n                  data-task-id=\"").concat(task.id, "\" title=\"Delete task\">\n            <i class=\"fa-solid fa-trash-can text-xs pointer-events-none\"></i>\n          </button>\n        </div>\n      </div>\n\n      <h3 class=\"font-semibold text-slate-800 mb-2 leading-snug\">").concat(title, "</h3>\n      <p class=\"text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2\">").concat(desc, "</p>\n\n      <div class=\"flex flex-wrap items-center gap-2 mb-4\">\n        ").concat(makePriorityBadge(task.priority), "\n        <span class=\"bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide\">\n          Due: ").concat(due, "\n        </span>\n      </div>\n\n      <div class=\"flex flex-wrap gap-2\">\n        ").concat(task.status !== "todo" ? "<button class=\"status-btn text-[11px] px-3 py-2 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200\"\n            data-task-id=\"".concat(task.id, "\" data-status=\"todo\">To Do</button>") : "", "\n\n        ").concat(task.status !== "in-progress" ? "<button class=\"status-btn text-[11px] px-3 py-2 rounded-lg font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200\"\n            data-task-id=\"".concat(task.id, "\" data-status=\"in-progress\">Start</button>") : "", "\n\n        ").concat(task.status !== "completed" ? "<button class=\"status-btn text-[11px] px-3 py-2 rounded-lg font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200\"\n            data-task-id=\"".concat(task.id, "\" data-status=\"completed\">Complete</button>") : "", "\n      </div>\n    </div>\n  ");
}
function render() {
    todoCol.innerHTML = "";
    inProgressCol.innerHTML = "";
    completedCol.innerHTML = "";
    for (var _i = 0, tasks_1 = tasks; _i < tasks_1.length; _i++) {
        var task = tasks_1[_i];
        var html = makeCard(task);
        if (task.status === "todo")
            todoCol.insertAdjacentHTML("beforeend", html);
        if (task.status === "in-progress")
            inProgressCol.insertAdjacentHTML("beforeend", html);
        if (task.status === "completed")
            completedCol.insertAdjacentHTML("beforeend", html);
    }
    updateCounts();
}
// CRUD
function addTask(task) {
    tasks.unshift(task);
    saveTasks();
    render();
}
function updateTask(updated) {
    tasks = tasks.map(function (t) { return (t.id === updated.id ? updated : t); });
    saveTasks();
    render();
}
function removeTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveTasks();
    render();
}
function moveTask(id, status) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task)
        return;
    task.status = status;
    saveTasks();
    render();
}
// Events
addBtn.addEventListener("click", openCreateModal);
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", function (e) {
    if (e.target === overlay)
        closeModal();
});
descInput.addEventListener("input", updateCharCount);
form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm())
        return;
    var title = titleInput.value.trim();
    var description = descInput.value.trim();
    var priority = priorityInput.value;
    var dueDate = dueDateInput.value;
    if (editingId) {
        var oldTask = tasks.find(function (t) { return t.id === editingId; });
        if (!oldTask)
            return;
        updateTask(__assign(__assign({}, oldTask), { title: title, description: description, priority: priority, dueDate: dueDate }));
    }
    else {
        addTask({
            id: String(Date.now()),
            title: title,
            description: description,
            priority: priority,
            dueDate: dueDate,
            status: "todo",
        });
    }
    closeModal();
});
// listener
document.addEventListener("click", function (e) {
    var target = e.target;
    var editBtn = target.closest(".edit-btn");
    if (editBtn) {
        var id_1 = editBtn.getAttribute("data-task-id");
        if (!id_1)
            return;
        var task = tasks.find(function (t) { return t.id === id_1; });
        if (!task)
            return;
        openEditModal(task);
        return;
    }
    var deleteBtn = target.closest(".delete-btn");
    if (deleteBtn) {
        var id = deleteBtn.getAttribute("data-task-id");
        if (!id)
            return;
        if (confirm("Delete this task?"))
            removeTask(id);
        return;
    }
    var statusBtn = target.closest(".status-btn");
    if (statusBtn) {
        var id = statusBtn.getAttribute("data-task-id");
        var status_1 = statusBtn.getAttribute("data-status");
        if (!id || !status_1)
            return;
        moveTask(id, status_1);
    }
});
// Start
loadTasks();
render();
updateCharCount();
