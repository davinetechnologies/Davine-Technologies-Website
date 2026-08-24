import { api } from "../shared/api.js";
import { toastError, loadingBlock, emptyBlock, statusBadge, formatDateTime, escapeHtml } from "../shared/ui.js";

export async function loadDashboard() {
  const statsEl = document.getElementById("dashboardStats");
  const recentEl = document.getElementById("recentSubmissions");
  statsEl.innerHTML = loadingBlock("Crunching the numbers…");

  try {
    const s = await api.get("/dashboard/stats");

    statsEl.innerHTML = `
      <div class="stat-card"><div class="label">Total interns</div><div class="value">${s.totalInterns}</div></div>
      <div class="stat-card accent"><div class="label">Active interns</div><div class="value">${s.activeInterns}</div></div>
      <div class="stat-card"><div class="label">Completed</div><div class="value">${s.completedInterns}</div></div>
      <div class="stat-card"><div class="label">Pending review</div><div class="value">${s.submissions.Submitted || 0}</div></div>
      <div class="stat-card"><div class="label">Approved</div><div class="value">${s.submissions.Approved || 0}</div></div>
      <div class="stat-card"><div class="label">Rejected</div><div class="value">${s.submissions.Rejected || 0}</div></div>
    `;

    if (!s.recentSubmissions.length) {
      recentEl.innerHTML = emptyBlock("No submissions yet", "Once interns start submitting weekly work, it'll show up here.");
      return;
    }

    recentEl.innerHTML = `
      <table>
        <thead><tr><th>Intern</th><th>Week</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>
          ${s.recentSubmissions
            .map(
              (sub) => `
            <tr>
              <td class="cell-primary">${escapeHtml(sub.intern ? sub.intern.name : "—")} <span class="cell-sub mono">${escapeHtml(sub.intern ? sub.intern.internId : "")}</span></td>
              <td>Week ${sub.week}</td>
              <td>${statusBadge(sub.status)}</td>
              <td class="cell-sub">${formatDateTime(sub.submittedAt)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  } catch (err) {
    statsEl.innerHTML = "";
    recentEl.innerHTML = "";
    toastError(err);
  }
}
