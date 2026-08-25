import { api } from "../shared/api.js";
import {
  toastError,
  loadingBlock,
  emptyBlock,
  errorBlock,
  statusBadge,
  escapeHtml
} from "../shared/ui.js";

export function initWeeklyProgress() {
  const weekFilter = document.getElementById("progressWeekFilter");
  const internFilter = document.getElementById("progressInternFilter");

  if (!weekFilter || !internFilter) {
    console.error("Weekly Progress filters not found");
    return;
  }

  weekFilter.innerHTML =
    `<option value="">All weeks</option>` +
    Array.from(
      { length: 12 },
      (_, i) => `<option value="${i + 1}">Week ${i + 1}</option>`
    ).join("");

  refreshInternFilter();

  internFilter.addEventListener("change", loadProgress);
  weekFilter.addEventListener("change", loadProgress);

  // Initial load
  loadProgress();
}


// =====================================================
// LOAD INTERN DROPDOWN
// =====================================================

async function refreshInternFilter() {
  try {
    const result = await api.get("/interns");

    const interns = Array.isArray(result)
      ? result
      : result.interns || result.data || [];

    const select = document.getElementById("progressInternFilter");

    select.innerHTML =
      `<option value="">All interns</option>` +
      interns
        .map(
          (i) => `
            <option value="${escapeHtml(i.internId || "")}">
              ${escapeHtml(i.name || i.fullName || "—")}
              ${i.internId ? `(${escapeHtml(i.internId)})` : ""}
            </option>
          `
        )
        .join("");

  } catch (err) {
    console.error("Failed to load interns:", err);
    toastError(err);
  }
}


// =====================================================
// LOAD WEEKLY PROGRESS
// =====================================================

export async function loadProgress() {
  const el = document.getElementById("progressTable");

  if (!el) {
    console.error("progressTable element not found");
    return;
  }

  el.innerHTML = loadingBlock("Loading weekly progress…");

  try {
    const internId =
      document.getElementById("progressInternFilter")?.value || "";

    const week =
      document.getElementById("progressWeekFilter")?.value || "";

    let response;

    // =================================================
    // SPECIFIC INTERN
    // =================================================

    if (internId) {
      const encodedInternId = encodeURIComponent(internId);

      response = await api.get(
        `/weekly-progress/${encodedInternId}`
      );

    }

    // =================================================
    // ALL INTERNS
    // =================================================

    else {
      const params = new URLSearchParams();

      if (week) {
        params.set("week", week);
      }

      const query = params.toString();

      response = await api.get(
        `/weekly-progress${query ? `?${query}` : ""}`
      );
    }


    // =================================================
    // NORMALIZE BACKEND RESPONSE
    // =================================================

    const rows = Array.isArray(response)
      ? response
      : Array.isArray(response?.weeklyProgress)
        ? response.weeklyProgress
        : [];


    // =================================================
    // WEEK FILTER FOR SPECIFIC INTERN
    // =================================================

    const filteredRows = week
      ? rows.filter((r) => Number(r.week) === Number(week))
      : rows;


    // =================================================
    // EMPTY STATE
    // =================================================

    if (!filteredRows.length) {
      el.innerHTML = emptyBlock(
        "No progress records yet",
        "These fill in automatically as interns submit and get reviewed."
      );

      return;
    }


    // =================================================
    // TABLE
    // =================================================

    el.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Intern</th>
            <th>Week</th>
            <th>Task</th>
            <th>Activity</th>
            <th>AI Task</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Remarks</th>
          </tr>
        </thead>

        <tbody>
          ${filteredRows
            .map(
              (r) => `
                <tr>

                  <td class="cell-primary">
                    ${escapeHtml(r.internName || "—")}
                    <span class="cell-sub mono">
                      ${escapeHtml(r.internEmail || "")}
                    </span>
                  </td>

                  <td>
                    Week ${escapeHtml(String(r.week || "—"))}
                  </td>

                  <td>
                    <strong>
                      ${escapeHtml(r.task?.title || "—")}
                    </strong>

                    <span class="cell-sub">
                      ${escapeHtml(r.task?.status || "Pending")}
                    </span>
                  </td>

                  <td>
                    <strong>
                      ${escapeHtml(r.activity?.title || "—")}
                    </strong>

                    <span class="cell-sub">
                      ${escapeHtml(r.activity?.status || "Pending")}
                    </span>
                  </td>

                  <td>
                    <strong>
                      ${escapeHtml(r.aiAssistantTask?.title || "—")}
                    </strong>

                    <span class="cell-sub">
                      ${escapeHtml(
                        r.aiAssistantTask?.status || "Pending"
                      )}
                    </span>
                  </td>

                  <td>
                    ${statusBadge(r.overallStatus || "Pending")}
                  </td>

                  <td>
                    ${escapeHtml(String(r.progress ?? 0))}%
                  </td>

                  <td class="cell-sub">
                    ${escapeHtml(r.remarks || "—")}
                  </td>

                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;

  } catch (err) {
    console.error("LOAD WEEKLY PROGRESS ERROR:", err);

    el.innerHTML = errorBlock(
      err.message || "Failed to load weekly progress"
    );

    toastError(err);
  }
}