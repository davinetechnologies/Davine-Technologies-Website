import { api } from "../shared/api.js";
import { toast, toastError, openModal, closeModal, loadingBlock, emptyBlock, errorBlock, formatDateTime, escapeHtml } from "../shared/ui.js";

export function initAnnouncements() {
  refreshBatchOptions();
  document.getElementById("addAnnouncementBtn").addEventListener("click", () => {
    document.getElementById("announcementForm").reset();
    openModal("modal-announcement");
  });
  document.getElementById("saveAnnouncementBtn").addEventListener("click", saveAnnouncement);
}

async function refreshBatchOptions() {
  try {
    const batches = await api.get("/batches");
    document.getElementById("annBatch").innerHTML =
      `<option value="">— All batches —</option>` + batches.map((b) => `<option value="${b._id}">${escapeHtml(b.batchName)}</option>`).join("");
  } catch {
    /* non-fatal */
  }
}

export async function loadAnnouncements() {
  const el = document.getElementById("announcementsList");
  el.innerHTML = loadingBlock("Loading announcements…");

  try {
    const announcements = await api.get("/announcements");
    if (!announcements.length) {
      el.innerHTML = emptyBlock("No announcements yet", "Publish one to reach interns by batch, domain, or everyone.");
      return;
    }
    el.innerHTML = announcements
      .map(
        (a) => `
      <div class="card mb-16">
        <div class="flex" style="justify-content:space-between;">
          <h3>${escapeHtml(a.title)}</h3>
          <span class="cell-sub">${formatDateTime(a.publishedAt)}</span>
        </div>
        <p class="mt-16">${escapeHtml(a.message)}</p>
        <p class="cell-sub mt-16">
          ${a.targetBatch ? `Batch: ${escapeHtml(a.targetBatch.batchName)}` : ""}
          ${a.targetDomain ? `Domain: ${escapeHtml(a.targetDomain)}` : ""}
          ${!a.targetBatch && !a.targetDomain ? "Visible to all interns" : ""}
        </p>
      </div>`
      )
      .join("");
  } catch (err) {
    el.innerHTML = errorBlock(err.message);
    toastError(err);
  }
}

async function saveAnnouncement() {
  const payload = {
    title: document.getElementById("annTitle").value.trim(),
    message: document.getElementById("annMessage").value.trim(),
    targetBatch: document.getElementById("annBatch").value || null,
    targetDomain: document.getElementById("annDomain").value || null,
  };
  if (!payload.title || !payload.message) {
    toast("Title and message are required", "error");
    return;
  }
  try {
    await api.post("/announcements", payload);
    toast("Announcement published", "success");
    closeModal("modal-announcement");
    loadAnnouncements();
  } catch (err) {
    toastError(err);
  }
}
