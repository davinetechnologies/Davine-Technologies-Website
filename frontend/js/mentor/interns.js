import { api } from "../shared/api.js";

let internsLoaded = false;

export function initInterns() {
  const section = document.getElementById("section-interns");

  if (!section) {
    console.warn("Interns section not found.");
    return;
  }

  internsLoaded = false;
}

export async function loadInterns() {
  const section = document.getElementById("section-interns");

  if (!section) {
    console.warn("Interns section not found.");
    return;
  }

  if (internsLoaded) {
    return;
  }

  try {
    section.innerHTML = `
      <div class="section-head">
        <div>
          <h2>Interns</h2>
          <p>Manage and monitor interns.</p>
        </div>
      </div>

      <div class="card">
        <div class="loading-state">
          Loading interns...
        </div>
      </div>
    `;

    const result = await api.get("/interns");

    const interns =
      Array.isArray(result)
        ? result
        : result.interns || result.data || [];

    if (!interns.length) {
      section.innerHTML = `
        <div class="section-head">
          <div>
            <h2>Interns</h2>
            <p>Manage and monitor interns.</p>
          </div>
        </div>

        <div class="card">
          <div class="empty-state">
            No interns found.
          </div>
        </div>
      `;

      internsLoaded = true;
      return;
    }

    section.innerHTML = `
      <div class="section-head">
        <div>
          <h2>Interns</h2>
          <p>Manage and monitor interns.</p>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Domain</th>
                <th>Batch</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${interns.map((intern) => `
                <tr>
                  <td>${escapeHtml(intern.name || "—")}</td>
                  <td>${escapeHtml(intern.email || "—")}</td>
                  <td>${escapeHtml(
                    intern.domain ||
                    intern.program ||
                    "—"
                  )}</td>
                  <td>${escapeHtml(
                    intern.batchName ||
                    intern.batch?.name ||
                    "—"
                  )}</td>
                  <td>${escapeHtml(
                    intern.status || "Active"
                  )}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    internsLoaded = true;

  } catch (error) {
    console.error("Failed to load interns:", error);

    section.innerHTML = `
      <div class="section-head">
        <div>
          <h2>Interns</h2>
          <p>Manage and monitor interns.</p>
        </div>
      </div>

      <div class="card">
        <div class="error-state">
          Failed to load interns.
          <br>
          <small>${escapeHtml(error.message)}</small>
        </div>
      </div>
    `;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}