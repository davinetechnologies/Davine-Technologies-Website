import {
  toast,
  toastError,
  openModal,
  closeModal,
  loadingBlock,
  emptyBlock,
  errorBlock,
  escapeHtml
} from "../shared/ui.js";

import { api } from "../shared/api.js";

export function initResources() {
  document
    .getElementById("addResourceBtn")
    .addEventListener("click", () => {
      document.getElementById("resourceForm").reset();
      openModal("modal-resource");
    });

  document
    .getElementById("saveResourceBtn")
    .addEventListener("click", saveResource);
}
document
  .getElementById("resourcesList")
  .addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-resource-btn");

    if (!btn) return;

    const resourceId = btn.dataset.id;

    const confirmed = confirm(
      "Are you sure you want to delete this resource?"
    );

    if (!confirmed) return;

    try {
      btn.disabled = true;
      btn.textContent = "Deleting...";

      await api.delete(`/resources/${resourceId}`);

      toast("Resource deleted successfully", "success");

      loadResources();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Delete";

      toastError(err);
    }
  });
export async function loadResources() {
  const el = document.getElementById("resourcesList");

  el.innerHTML = loadingBlock("Loading resources…");

  try {
    const resources = await api.get("/resources");

    if (!resources.length) {
      el.innerHTML = emptyBlock(
        "No resources yet",
        "Add a resource to make it available to interns."
      );
      return;
    }

    el.innerHTML = resources
      .map(
        (resource) => `
          <div class="card mb-16">
            <div class="flex" style="justify-content:space-between; align-items:flex-start;">
              <div>
                <h3>${escapeHtml(resource.name)}</h3>
                
<p class="cell-sub mt-16">
  Domain: ${escapeHtml(resource.targetDomain || "All Domains")}
  &nbsp; | &nbsp;
  Week: ${resource.targetWeek ? `Week ${resource.targetWeek}` : "All Weeks"}
</p>

                <p class="cell-sub mt-16">
                  ${escapeHtml(resource.url)}
                </p>
              </div>

              <div class="flex gap-12">
                <a
                  class="btn btn-secondary btn-sm"
                  href="${escapeHtml(resource.url)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open
                </a>

                <button
                  class="btn btn-danger btn-sm delete-resource-btn"
                  data-id="${resource._id}"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        `
      )
      .join("");
  } catch (err) {
    el.innerHTML = errorBlock(err.message);
    toastError(err);
  }
}


async function saveResource() {
  const name = document.getElementById("resourceName").value.trim();
  const url = document.getElementById("resourceUrl").value.trim();
  const targetDomain =
    document.getElementById("resourceDomain").value || null;
  const targetWeekValue =
    document.getElementById("resourceWeek").value;

  const targetWeek = targetWeekValue
    ? Number(targetWeekValue)
    : null;

  if (!name || !url) {
    toast("Resource name and URL are required", "error");
    return;
  }

  try {
    await api.post("/resources", {
      name,
      url,
      targetDomain,
      targetWeek
    });

    toast("Resource added successfully", "success");

    closeModal("modal-resource");
    loadResources();
  } catch (err) {
    toastError(err);
  }
}
