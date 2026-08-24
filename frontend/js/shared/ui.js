// ---------- Toasts ----------
function ensureToastStack() {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

export function toast(message, type = "default") {
  const stack = ensureToastStack();
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

export function toastError(err) {
  toast(err && err.message ? err.message : "Something went wrong", "error");
}

// ---------- Modal ----------
export function openModal(id) {
  document.getElementById(id).classList.add("open");
}
export function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

export function confirmAction(message) {
  return window.confirm(message);
}

// ---------- Formatting ----------
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ---------- Status badges ----------
export function statusBadge(status) {
  const key = String(status || "").toLowerCase().replace(/\s+/g, "");
  return `<span class="badge badge-${key}">${escapeHtml(status || "Unknown")}</span>`;
}

// ---------- Week rail (signature element): a 12-segment track showing
// completed / current / upcoming weeks. Used on intern rows, the intern
// dashboard, and the weekly-content admin grid. ----------
export function weekRail(currentWeek, total = 12) {
  const segs = [];
  for (let i = 1; i <= total; i += 1) {
    let cls = "seg";
    if (i < currentWeek) cls += " done";
    else if (i === currentWeek) cls += " current";
    segs.push(`<span class="${cls}" title="Week ${i}"></span>`);
  }
  return `<div class="week-rail">${segs.join("")}</div>`;
}

export function weekRailLabeled(currentWeek, total = 12) {
  return `
    <div class="week-rail-labeled">
      <div class="top"><span>Week ${currentWeek} of ${total}</span><span>${Math.round((currentWeek / total) * 100)}%</span></div>
      ${weekRail(currentWeek, total)}
    </div>`;
}

// ---------- Empty / loading / error state blocks ----------
export function loadingBlock(label = "Loading…") {
  return `<div class="state-block"><span class="spinner"></span><p style="margin-top:10px">${escapeHtml(label)}</p></div>`;
}

export function emptyBlock(title, subtitle) {
  return `<div class="state-block"><div class="icon">🗂️</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle || "")}</p></div>`;
}

export function errorBlock(message) {
  return `<div class="state-block"><div class="icon">⚠️</div><h3>Couldn't load this</h3><p>${escapeHtml(message)}</p></div>`;
}
