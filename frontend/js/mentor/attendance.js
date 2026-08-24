import { api } from "../shared/api.js";
import {
  toast,
  toastError,
  loadingBlock,
  emptyBlock,
  errorBlock,
  statusBadge,
  formatDate,
  escapeHtml
} from "../shared/ui.js";

let internOptions = [];

export function initAttendance() {
  document.getElementById("attDate").value =
    new Date().toISOString().slice(0, 10);

  refreshInternOptions();

  document
    .getElementById("markAttendanceBtn")
    .addEventListener("click", markAttendance);

  document
    .getElementById("attFilterIntern")
    .addEventListener("change", loadAttendance);
}


// ========================================
// LOAD INTERNS
// ========================================

async function refreshInternOptions() {
  try {
    internOptions = await api.get("/interns");

    const opts = internOptions
      .map(
        (i) => `
          <option value="${i._id}">
            ${escapeHtml(i.fullName || i.name || "—")}
            (${escapeHtml(i.internId || "")})
          </option>
        `
      )
      .join("");

    document.getElementById("attInternSelect").innerHTML =
      `<option value="">Select intern</option>${opts}`;

    document.getElementById("attFilterIntern").innerHTML =
      `<option value="">All interns</option>${opts}`;

    // Load attendance after interns are loaded
    loadAttendance();

  } catch (err) {
    console.error("Failed to load interns:", err);
    toastError(err);
  }
}


// ========================================
// MARK ATTENDANCE
// ========================================

async function markAttendance() {
  const intern = document.getElementById("attInternSelect").value;
  const date = document.getElementById("attDate").value;
  const status = document.getElementById("attStatus").value;

  if (!intern || !date) {
    toast("Select an intern and a date", "error");
    return;
  }

  try {
    await api.post("/attendance", {
      intern,
      date,
      status
    });

    toast("Attendance saved", "success");

    loadAttendance();

  } catch (err) {
    toastError(err);
  }
}


// ========================================
// LOAD ATTENDANCE
// ========================================

export async function loadAttendance() {
  const el = document.getElementById("attendanceTable");

  el.innerHTML = loadingBlock("Loading attendance…");

  try {

    const selectedIntern =
      document.getElementById("attFilterIntern").value;

    let path = "/attendance";

    if (selectedIntern) {
      path += `?intern=${encodeURIComponent(selectedIntern)}`;
    }

    const records = await api.get(path);

    if (!records.length) {
      el.innerHTML = emptyBlock(
        "No attendance marked yet",
        "Use the form above to record the first entry."
      );
      return;
    }

    el.innerHTML = `
      <table>

        <thead>
          <tr>
            <th>Intern</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          ${records
            .map(
              (r) => `
                <tr>

                  <td class="cell-primary">
                    ${
                      r.intern
                        ? escapeHtml(
                            r.intern.fullName ||
                            r.intern.name ||
                            "—"
                          )
                        : "—"
                    }

                    <span class="cell-sub mono">
                      ${
                        r.intern
                          ? escapeHtml(r.intern.internId || "")
                          : ""
                      }
                    </span>
                  </td>

                  <td>
                    ${formatDate(r.date)}
                  </td>

                  <td>
                    ${statusBadge(r.status)}
                  </td>

                  <td>
                    <select
                      class="att-edit-status"
                      data-id="${r._id}"
                    >
                      <option value="Present"
                        ${r.status === "Present" ? "selected" : ""}>
                        Present
                      </option>

                      <option value="Absent"
                        ${r.status === "Absent" ? "selected" : ""}>
                        Absent
                      </option>

                      <option value="Leave"
                        ${r.status === "Leave" ? "selected" : ""}>
                        Leave
                      </option>
                    </select>
                  </td>

                </tr>
              `
            )
            .join("")}

        </tbody>

      </table>
    `;

    // ========================================
    // EDIT ATTENDANCE
    // ========================================

    document
      .querySelectorAll(".att-edit-status")
      .forEach((select) => {

        select.addEventListener("change", async (e) => {

          const id = e.target.dataset.id;
          const status = e.target.value;

          try {

            await api.put(`/attendance/${id}`, {
              status
            });

            toast("Attendance updated", "success");

            loadAttendance();

          } catch (err) {

            toastError(err);

          }

        });

      });

  } catch (err) {

    console.error("Attendance load error:", err);

    el.innerHTML = errorBlock(err.message);

    toastError(err);
  }
}