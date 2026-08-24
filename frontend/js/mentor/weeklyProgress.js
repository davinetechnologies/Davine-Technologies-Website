import { api } from "../shared/api.js";
import { toastError, loadingBlock, emptyBlock, errorBlock, statusBadge, escapeHtml } from "../shared/ui.js";

export function initWeeklyProgress() {
  document.getElementById("progressWeekFilter").innerHTML =
    `<option value="">All weeks</option>` + Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">Week ${i + 1}</option>`).join("");

  refreshInternFilter();

  ["progressInternFilter", "progressWeekFilter"].forEach((id) => document.getElementById(id).addEventListener("change", loadProgress));
}

async function refreshInternFilter() {
  try {
    const result = await api.get("/interns");

    const interns = Array.isArray(result)
      ? result
      : result.interns || result.data || [];

    document.getElementById("progressInternFilter").innerHTML =
      `<option value="">All interns</option>` +
      interns.map((i) => `
        <option value="${i._id}">
          ${escapeHtml(i.name || i.fullName || "—")}
          (${escapeHtml(i.internId || "")})
        </option>
      `).join("");

  } catch {
    /* non-fatal */
  }
}

export async function loadProgress() {
  const el = document.getElementById("progressTable");
  el.innerHTML = loadingBlock("Loading weekly progress…");

  try {
const intern =
  document.getElementById("progressInternFilter").value;

const week =
  document.getElementById("progressWeekFilter").value;

const params = new URLSearchParams();

if (intern) {
  params.set("intern", intern);
}

if (week) {
  params.set("week", week);
}

const query = params.toString();

const rows = await api.get(
  `/weekly-progress${query ? `?${query}` : ""}`
);

    if (!rows.length) {
      el.innerHTML = emptyBlock("No progress records yet", "These fill in automatically as interns submit and get reviewed.");
      return;
    }

    el.innerHTML = `
      <table>
        <thead><tr><th>Intern</th><th>Week</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              <td class="cell-primary">${r.intern ? escapeHtml(r.intern.name) : "—"} <span class="cell-sub mono">${r.intern ? escapeHtml(r.intern.internId) : ""}</span></td>
              <td>Week ${r.week}</td>
              <td>${statusBadge(r.status)}</td>
              <td class="cell-sub">${escapeHtml(r.notes || "—")}</td>
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
