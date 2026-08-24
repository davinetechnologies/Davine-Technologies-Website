import { api, fileUrl } from "../shared/api.js";
import {
  toast, toastError, openModal, closeModal,
  loadingBlock, emptyBlock, errorBlock, statusBadge, formatDateTime, escapeHtml,
} from "../shared/ui.js";

const DOMAINS = ["DevOps", "Cloud", "Data Analyst", "Gen AI"];
let currentReviewId = null;

export function initSubmissions() {
  document.getElementById("subWeekFilter").innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">Week ${i + 1}</option>`).join("");
  document.getElementById("subDomainFilter").innerHTML =
    `<option value="">All domains</option>` + DOMAINS.map((d) => `<option>${d}</option>`).join("");

  refreshBatchFilter();

  ["subWeekFilter", "subDomainFilter", "subBatchFilter", "subStatusFilter"].forEach((id) =>
    document.getElementById(id).addEventListener("change", loadSubmissionsBoard)
  );
  document.getElementById("subSearch").addEventListener("input", debounce(loadSubmissionsBoard, 250));

  document.getElementById("submissionsTable").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-review]");
    if (btn) openReview(btn.dataset.review);
  });

  document.getElementById("approveBtn").addEventListener("click", () => submitReview("Approved"));
  document.getElementById("rejectBtn").addEventListener("click", () => submitReview("Rejected"));
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function refreshBatchFilter() {
  try {
    const batches = await api.get("/batches");
    document.getElementById("subBatchFilter").innerHTML =
      `<option value="">All batches</option>` + batches.map((b) => `<option value="${b._id}">${escapeHtml(b.batchName)}</option>`).join("");
  } catch {
    /* non-fatal - filters just show only "All batches" */
  }
}

export async function loadSubmissionsBoard() {
  const el = document.getElementById("submissionsTable");
  el.innerHTML = loadingBlock("Loading submissions…");

  try {
    const week = document.getElementById("subWeekFilter").value;
    const rows = await api.get("/submissions/board", {
      week,
      domain: document.getElementById("subDomainFilter").value,
      batch: document.getElementById("subBatchFilter").value,
      status: document.getElementById("subStatusFilter").value,
      search: document.getElementById("subSearch").value,
    });

    if (!rows.length) {
      el.innerHTML = emptyBlock("No interns match these filters", "Try a different week or clear a filter.");
      return;
    }

    el.innerHTML = `
      <table>
        <thead><tr><th>Intern</th><th>Domain</th><th>Batch</th><th>Week</th><th>Submission</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
        <tbody>
          ${rows
            .map((row) => {
              const sub = row.submission;
              const canReview = sub && (sub.status === "Submitted" || sub.status === "Approved" || sub.status === "Rejected");
              return `
              <tr>
                <td><div class="cell-primary">${escapeHtml(row.intern.name)}</div><div class="cell-sub mono">${escapeHtml(row.intern.internId)}</div></td>
                <td>${escapeHtml(row.intern.domain)}</td>
                <td>${row.intern.batch ? escapeHtml(row.intern.batch.batchName) : "—"}</td>
                <td>Week ${row.week}</td>
                <td>${sub && sub.submissionFile ? `<a class="pdf-chip" href="${fileUrl(sub.submissionFile)}" target="_blank" rel="noopener">📄 PDF</a>` : '<span class="muted">—</span>'}</td>
                <td>${statusBadge(row.status)}</td>
                <td class="cell-sub">${sub ? formatDateTime(sub.submittedAt) : "—"}</td>
                <td class="text-right">
                  ${canReview ? `<button class="btn btn-secondary btn-sm" data-review="${sub._id}">${sub.status === "Submitted" ? "Review" : "View"}</button>` : ""}
                </td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
  } catch (err) {
    el.innerHTML = errorBlock(err.message);
    toastError(err);
  }
}

async function openReview(submissionId) {
  currentReviewId = submissionId;
  document.getElementById("reviewBody").innerHTML = loadingBlock();
  openModal("modal-review");

  try {
    const sub = await api.get(`/submissions/${submissionId}`);
    const locked = sub.status === "Approved" || sub.status === "Rejected";

    document.getElementById("reviewBody").innerHTML = `
      <p><b>Intern:</b> ${escapeHtml(sub.intern.name)} <span class="mono cell-sub">(${escapeHtml(sub.intern.internId)})</span></p>
      <p><b>Domain:</b> ${escapeHtml(sub.intern.domain)} &nbsp; <b>Week:</b> ${sub.week}</p>
      <p><b>Current status:</b> ${statusBadge(sub.status)}</p>
      <p class="mt-16">
        <a class="pdf-chip" href="${fileUrl(sub.submissionFile)}" target="_blank" rel="noopener">📄 View submitted PDF</a>
      </p>
      <div class="field mt-16">
        <label>Mentor feedback ${locked ? "" : "(shown to the intern)"}</label>
        <textarea id="reviewFeedback" ${locked ? "disabled" : ""}>${escapeHtml(sub.mentorFeedback || "")}</textarea>
      </div>
      ${locked ? `<p class="cell-sub">Reviewed ${formatDateTime(sub.reviewedAt)}. Approve/Reject again below to change the decision.</p>` : ""}
    `;
  } catch (err) {
    document.getElementById("reviewBody").innerHTML = errorBlock(err.message);
  }
}

async function submitReview(status) {
  if (!currentReviewId) return;
  const feedback = document.getElementById("reviewFeedback")?.value || "";

  try {
    await api.put(`/submissions/${currentReviewId}/review`, { status, mentorFeedback: feedback });
    toast(`Submission ${status.toLowerCase()}`, "success");
    closeModal("modal-review");
    loadSubmissionsBoard();
  } catch (err) {
    toastError(err);
  }
}
