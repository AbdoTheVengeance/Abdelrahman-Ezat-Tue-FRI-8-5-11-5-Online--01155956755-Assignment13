type Status = "todo" | "in-progress" | "completed";
type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  status: Status;
};

const STORAGE_KEY = "kanban_todo";

// Get elements
const addBtn = document.getElementById("add-task-btn") as HTMLButtonElement;
const overlay = document.getElementById("modal-overlay") as HTMLDivElement;
const modalTitle = document.getElementById("modal-title") as HTMLHeadingElement;

const closeBtn = document.getElementById("close-modal-btn") as HTMLButtonElement;
const cancelBtn = document.getElementById("cancel-btn") as HTMLButtonElement;

const form = document.getElementById("task-form") as HTMLFormElement;
const titleInput = document.getElementById("task-title") as HTMLInputElement;
const priorityInput = document.getElementById("task-priority") as HTMLSelectElement;
const dueDateInput = document.getElementById("task-due-date") as HTMLInputElement;
const descInput = document.getElementById("task-description") as HTMLTextAreaElement;

const titleError = document.getElementById("title-error") as HTMLParagraphElement;
const dateError = document.getElementById("date-error") as HTMLParagraphElement;
const descError = document.getElementById("description-error") as HTMLParagraphElement;
const charCount = document.getElementById("char-count") as HTMLParagraphElement;

const submitBtnText = document.getElementById("submit-btn-text") as HTMLSpanElement;

const todoCol = document.getElementById("tasks-todo") as HTMLDivElement;
const inProgressCol = document.getElementById("tasks-in-progress") as HTMLDivElement;
const completedCol = document.getElementById("tasks-completed") as HTMLDivElement;

// column headers
const todoCountEl = document.querySelector('[data-status="todo"] .text-xs.text-slate-400') as HTMLParagraphElement;
const inProgressCountEl = document.querySelector('[data-status="in-progress"] .text-xs.text-slate-400') as HTMLParagraphElement;
const completedCountEl = document.querySelector('[data-status="completed"] .text-xs.text-slate-400') as HTMLParagraphElement;

// App state
let tasks: Task[] = [];
let editingId: string | null = null;

// LocalStorage
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    tasks = [];
    return;
  }

  try {
    tasks = JSON.parse(raw);
  } catch {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Small helpers
function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
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

function showError(el: HTMLElement, msg: string) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

function updateCharCount() {
  charCount.textContent = `${descInput.value.length}/500`;
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

function openEditModal(task: Task) {
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
function validateForm(): boolean {
  clearErrors();

  const title = titleInput.value.trim();
  const desc = descInput.value.trim();
  const due = dueDateInput.value;

  let ok = true;

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
  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in-progress").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  todoCountEl.textContent = `${todoCount} task${todoCount === 1 ? "" : "s"}`;
  inProgressCountEl.textContent = `${inProgressCount} task${inProgressCount === 1 ? "" : "s"}`;
  completedCountEl.textContent = `${completedCount} task${completedCount === 1 ? "" : "s"}`;
}

function makePriorityBadge(priority: Priority) {
  if (priority === "low") {
    return `<span class="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide">Low</span>`;
  }
  if (priority === "high") {
    return `<span class="bg-red-50 text-red-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide">High</span>`;
  }
  return `<span class="bg-amber-50 text-amber-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide">Medium</span>`;
}

function makeCard(task: Task) {
  const title = escapeHtml(task.title);
  const desc = task.description ? escapeHtml(task.description) : "No description";
  const due = task.dueDate ? escapeHtml(task.dueDate) : "No due date";

  return `
    <div class="group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200"
         data-task-id="${task.id}">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-slate-300"></span>
          <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Task</span>
        </div>

        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  data-task-id="${task.id}" title="Edit task">
            <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
          </button>
          <button class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  data-task-id="${task.id}" title="Delete task">
            <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
          </button>
        </div>
      </div>

      <h3 class="font-semibold text-slate-800 mb-2 leading-snug">${title}</h3>
      <p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">${desc}</p>

      <div class="flex flex-wrap items-center gap-2 mb-4">
        ${makePriorityBadge(task.priority)}
        <span class="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
          Due: ${due}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        ${task.status !== "todo" ? `<button class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
            data-task-id="${task.id}" data-status="todo">To Do</button>` : ""}

        ${task.status !== "in-progress" ? `<button class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200"
            data-task-id="${task.id}" data-status="in-progress">Start</button>` : ""}

        ${task.status !== "completed" ? `<button class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            data-task-id="${task.id}" data-status="completed">Complete</button>` : ""}
      </div>
    </div>
  `;
}

function render() {
  todoCol.innerHTML = "";
  inProgressCol.innerHTML = "";
  completedCol.innerHTML = "";

  for (const task of tasks) {
    const html = makeCard(task);

    if (task.status === "todo") todoCol.insertAdjacentHTML("beforeend", html);
    if (task.status === "in-progress") inProgressCol.insertAdjacentHTML("beforeend", html);
    if (task.status === "completed") completedCol.insertAdjacentHTML("beforeend", html);
  }

  updateCounts();
}

// CRUD
function addTask(task: Task) {
  tasks.unshift(task);
  saveTasks();
  render();
}

function updateTask(updated: Task) {
  tasks = tasks.map(t => (t.id === updated.id ? updated : t));
  saveTasks();
  render();
}

function removeTask(id: string) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function moveTask(id: string, status: Status) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.status = status;
  saveTasks();
  render();
}

// Events
addBtn.addEventListener("click", openCreateModal);
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

descInput.addEventListener("input", updateCharCount);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const priority = priorityInput.value as Priority;
  const dueDate = dueDateInput.value; 
  if (editingId) {
    const oldTask = tasks.find(t => t.id === editingId);
    if (!oldTask) return;

    updateTask({
      ...oldTask,
      title,
      description,
      priority,
      dueDate,
    });
  } else {
    addTask({
      id: String(Date.now()),
      title,
      description,
      priority,
      dueDate,
      status: "todo",
    });
  }

  closeModal();
});

// listener
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  const editBtn = target.closest(".edit-btn") as HTMLElement | null;
  if (editBtn) {
    const id = editBtn.getAttribute("data-task-id");
    if (!id) return;

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    openEditModal(task);
    return;
  }

  const deleteBtn = target.closest(".delete-btn") as HTMLElement | null;
  if (deleteBtn) {
    const id = deleteBtn.getAttribute("data-task-id");
    if (!id) return;

    if (confirm("Delete this task?")) removeTask(id);
    return;
  }

  const statusBtn = target.closest(".status-btn") as HTMLElement | null;
  if (statusBtn) {
    const id = statusBtn.getAttribute("data-task-id");
    const status = statusBtn.getAttribute("data-status") as Status | null;
    if (!id || !status) return;

    moveTask(id, status);
  }
});

// Start
loadTasks();
render();
updateCharCount();
