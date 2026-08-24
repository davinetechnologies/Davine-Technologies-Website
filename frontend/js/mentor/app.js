import { requirePortal, logout } from "../shared/auth.js";
import { api } from "../shared/api.js";
import { toastError } from "../shared/ui.js";

import { loadDashboard } from "./dashboard.js";
import { initInterns, loadInterns } from "./interns.js";
import { loadWeeklyContent } from "./weeklyContent.js";
import { initSubmissions, loadSubmissionsBoard } from "./submissions.js";
import { initWeeklyProgress, loadProgress } from "./weeklyProgress.js";
import { initBatches, loadBatches } from "./batches.js";
import { initAnnouncements, loadAnnouncements } from "./announcements.js";
import { initDocuments, loadDocuments } from "./documents.js";
import { initAttendance, loadAttendance } from "./attendance.js";

const user = requirePortal("mentor");
if (user) {
  document.getElementById("mentorName").textContent = user.name;
}

const CRUMBS = {
  dashboard: "Dashboard",
  interns: "Interns",
  "weekly-content": "Weekly Content",
  submissions: "Submissions",
  "weekly-progress": "Weekly Progress",
  batches: "Batches",
  announcements: "Announcements",
  documents: "Documents",
  attendance: "Attendance",
  settings: "Settings",
};

const loaders = {
  dashboard: loadDashboard,
  interns: loadInterns,
  "weekly-content": loadWeeklyContent,
  submissions: loadSubmissionsBoard,
  "weekly-progress": loadProgress,
  batches: loadBatches,
  announcements: loadAnnouncements,
  documents: loadDocuments,
  attendance: loadAttendance,
  settings: loadSettings,
};

async function loadSettings() {
  try {
    const mentor = await api.get("/mentors/me");
    document.getElementById("settingsCard").innerHTML = `
      <div class="field"><label>Name</label><input value="${mentor.name}" disabled /></div>
      <div class="field"><label>Email</label><input value="${mentor.email}" disabled /></div>
      <div class="field"><label>Role</label><input value="${mentor.role}" disabled /></div>
      <p class="muted" style="margin-top:6px;">Account editing isn't part of the P0 workflow yet.</p>
    `;
  } catch (err) {
    toastError(err);
  }
}

function switchSection(name) {
  document.querySelectorAll(".sidebar-nav .nav-item").forEach((b) => b.classList.toggle("active", b.dataset.section === name));
  document.querySelectorAll(".section").forEach((s) => s.classList.toggle("active", s.id === `section-${name}`));
  document.getElementById("crumb").textContent = CRUMBS[name] || name;
  document.getElementById("sidebar").classList.remove("open");
  const loader = loaders[name];
  if (loader) loader();
}

document.getElementById("sidebarNav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-item");
  if (!btn) return;
  switchSection(btn.dataset.section);
});

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// Generic modal close wiring (any element with data-close="<modal id>")
document.addEventListener("click", (e) => {
  const closer = e.target.closest("[data-close]");
  if (closer) document.getElementById(closer.dataset.close).classList.remove("open");
  if (e.target.classList.contains("overlay")) e.target.classList.remove("open");
});

// Bootstrap
initInterns();
initSubmissions();
initWeeklyProgress();
initBatches();
initAnnouncements();
initDocuments();
initAttendance();
loadDashboard();
