import { api } from "../shared/api.js";
import {
  toast, toastError, openModal, closeModal, confirmAction,
  loadingBlock, emptyBlock, errorBlock, statusBadge, formatDate, escapeHtml,
} from "../shared/ui.js";

let editingBatchId = null;

export function initBatches() {
  document.getElementById("addBatchBtn").addEventListener("click", () => openBatchForm(null));
  document.getElementById("saveBatchBtn").addEventListener("click", saveBatch);
  document.getElementById("batchesTable").addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit-batch]");
    const delBtn = e.target.closest("[data-del-batch]");
    if (editBtn) openBatchForm(editBtn.dataset.editBatch);
    if (delBtn) deleteBatch(delBtn.dataset.delBatch);
  });
}

export async function loadBatches() {
  const el = document.getElementById("batchesTable");
  el.innerHTML = loadingBlock("Loading batches…");

  try {
    const batches = await api.get("/batches");
    if (!batches.length) {
      el.innerHTML = emptyBlock("No batches yet", "Create one to start grouping interns by cohort.");
      return;
    }
    el.innerHTML = `
      <table>
        <thead><tr><th>Batch</th><th>Domain</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${batches
            .map(
              (b) => `
            <tr>
              <td class="cell-primary">${escapeHtml(b.batchName)}</td>
              <td>${escapeHtml(b.domain)}</td>
              <td class="cell-sub">${formatDate(b.startDate)}</td>
              <td class="cell-sub">${formatDate(b.endDate)}</td>
              <td>${statusBadge(b.status)}</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-sm" data-edit-batch="${b._id}">Edit</button>
                <button class="btn btn-ghost btn-sm" data-del-batch="${b._id}">Delete</button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  } catch (err) {
    el.innerHTML = errorBlock(err.message);
    toastError(err);
  }
}

async function openBatchForm(id) {
  editingBatchId = id;
  document.getElementById("batchForm").reset();
  document.getElementById("batchModalTitle").textContent = id ? "Edit batch" : "New batch";

  if (id) {
    try {
      const batches = await api.get("/batches");
      const b = batches.find((x) => x._id === id);
      if (b) {
        document.getElementById("batchName").value = b.batchName;
        document.getElementById("batchDomain").value = b.domain;
        document.getElementById("batchStart").value = b.startDate ? b.startDate.slice(0, 10) : "";
        document.getElementById("batchEnd").value = b.endDate ? b.endDate.slice(0, 10) : "";
        document.getElementById("batchStatus").value = b.status;
      }
    } catch (err) {
      toastError(err);
    }
  }
  openModal("modal-batch");
}

async function saveBatch() {
  const payload = {
    batchName: document.getElementById("batchName").value.trim(),
    domain: document.getElementById("batchDomain").value,
    startDate: document.getElementById("batchStart").value,
    endDate: document.getElementById("batchEnd").value || null,
    status: document.getElementById("batchStatus").value,
  };
  if (!payload.batchName || !payload.startDate) {
    toast("Batch name and start date are required", "error");
    return;
  }

  try {
    if (editingBatchId) {
      await api.put(`/batches/${editingBatchId}`, payload);
      toast("Batch updated", "success");
    } else {
      await api.post("/batches", payload);
      toast("Batch created", "success");
    }
    closeModal("modal-batch");
    loadBatches();
  } catch (err) {
    toastError(err);
  }
}

async function deleteBatch(id) {
  if (!confirmAction("Delete this batch? Interns in it will keep their other data but lose the batch link.")) return;
  try {
    await api.del(`/batches/${id}`);
    toast("Batch deleted", "success");
    loadBatches();
  } catch (err) {
    toastError(err);
  }
}
