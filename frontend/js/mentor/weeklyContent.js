import { api, fileUrl } from "../shared/api.js";
import {
  toast,
  toastError,
  openModal,
  closeModal,
  loadingBlock,
  errorBlock,
  escapeHtml
} from "../shared/ui.js";

let currentEditWeek = null;
let currentDomain = null;


// =====================================================
// LOAD WEEKLY CONTENT
// =====================================================

export async function loadWeeklyContent() {
  const grid = document.getElementById("weeklyContentGrid");
  const domainFilter = document.getElementById("weeklyContentDomainFilter");

  if (!grid) return;

  grid.innerHTML = loadingBlock("Loading weekly content…");

  try {
const domain = domainFilter
  ? domainFilter.value.trim()
  : "";

if (!domain) {
  grid.innerHTML = `
    <div class="empty-state">
      <h3>Select a Domain</h3>
      <p>Please select a domain to manage weekly content.</p>
    </div>
  `;
  return;
}

const weeks = await api.get(
  `/weekly-content?domain=${encodeURIComponent(domain)}`
);

    // Show 12 weeks for selected domain
    const selectedDomain = domain || "";

    const domainWeeks = Array.from(
      { length: 12 },
      (_, index) => {
        const weekNumber = index + 1;

        return (
          weeks.find(
            (w) =>
              Number(w.week) === weekNumber &&
(
  !selectedDomain ||
  String(w.domain).toLowerCase() ===
  String(selectedDomain).toLowerCase()
)          ) || {
            week: weekNumber,
            domain: selectedDomain,
            title: "",
            pdfUrl: null,
            pdfOriginalName: null,
            active: true
          }
        );
      }
    );

    grid.innerHTML = domainWeeks
      .map(renderSlot)
      .join("");

    grid
      .querySelectorAll("[data-edit-week]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          openEditor(
            Number(btn.dataset.editWeek),
            domainWeeks
          );
        });
      });

  } catch (err) {
    grid.innerHTML = errorBlock(err.message);
    toastError(err);
  }
}


// =====================================================
// RENDER WEEK
// =====================================================

function renderSlot(w) {
  const hasContent = Boolean(
    w.pdfUrl || w.title
  );

  return `
    <div class="week-slot ${
      w.active === false && hasContent
        ? "inactive"
        : ""
    }">

      <div class="num">
        WEEK ${w.week}
      </div>

      ${
        hasContent
          ? `<h3>${escapeHtml(w.title)}</h3>`
          : `<h3 class="empty-title">No content yet</h3>`
      }

      ${
        hasContent && w.active === false
          ? `<span class="badge badge-inactive">Inactive</span>`
          : ""
      }

      <div class="row">

        ${
          w.pdfUrl
            ? `
              <a
                class="pdf-chip"
                href="${fileUrl(w.pdfUrl)}"
                target="_blank"
                rel="noopener"
              >
                📄 View PDF
              </a>
            `
            : ""
        }

        <button
          class="btn btn-secondary btn-sm"
          data-edit-week="${w.week}"
        >
          ${hasContent ? "Replace / Edit" : "Upload"}
        </button>

      </div>

    </div>
  `;
}


// =====================================================
// OPEN EDITOR
// =====================================================

function openEditor(week, weeks) {
  currentEditWeek = week;

  const domainFilter =
    document.getElementById(
      "weeklyContentDomainFilter"
    );

currentDomain = domainFilter
  ? domainFilter.value.trim().toLowerCase()
  : "";

  if (!currentDomain) {
    toast(
      "Please select a domain first.",
      "error"
    );
    return;
  }

  const existing = weeks.find(
    (w) =>
      Number(w.week) === week &&
      w.domain === currentDomain
  );

  document.getElementById(
    "weeklyContentModalTitle"
  ).textContent =
    `${currentDomain} — Week ${week}`;

  document.getElementById(
    "wcWeek"
  ).value = week;

  document.getElementById(
    "wcTitle"
  ).value =
    existing?.title || "";

  document.getElementById(
    "wcFile"
  ).value = "";

  document.getElementById(
    "wcActive"
  ).checked =
    !existing ||
    existing.active !== false;

  openModal(
    "modal-weekly-content"
  );
}


// =====================================================
// SAVE WEEKLY CONTENT
// =====================================================

document
  .getElementById("saveWeeklyContentBtn")
  .addEventListener("click", async () => {

    const btn =
      document.getElementById(
        "saveWeeklyContentBtn"
      );

    const week = currentEditWeek;

    const title =
      document
        .getElementById("wcTitle")
        .value
        .trim();

    const file =
      document
        .getElementById("wcFile")
        .files[0];

    const active =
      document
        .getElementById("wcActive")
        .checked;

    if (!currentDomain) {
      toast(
        "Please select a domain first.",
        "error"
      );
      return;
    }

    if (!title) {
      toast(
        "A title is required",
        "error"
      );
      return;
    }

    btn.disabled = true;

    try {

      // =================================================
      // CHECK WHETHER CONTENT ALREADY EXISTS
      // =================================================

      let existing = null;

      try {
        existing = await api.get(
          `/weekly-content/${encodeURIComponent(
            currentDomain
          )}/${week}`
        );
      } catch {
        existing = null;
      }


      // =================================================
      // UPDATE EXISTING CONTENT
      // =================================================

      if (existing) {

        const formData =
          new FormData();

        formData.append(
          "title",
          title
        );

        formData.append(
          "active",
          String(active)
        );

        if (file) {
          formData.append(
            "pdf",
            file
          );
        }

        await api.put(
          `/weekly-content/${encodeURIComponent(
            currentDomain
          )}/${week}`,
          formData,
          true
        );

        toast(
          `${currentDomain} — Week ${week} updated`,
          "success"
        );

      }

      // =================================================
      // CREATE NEW CONTENT
      // =================================================

      else {

        const formData =
          new FormData();

        formData.append(
          "domain",
          currentDomain
        );

        formData.append(
          "week",
          String(week)
        );

        formData.append(
          "title",
          title
        );

        if (file) {
          formData.append(
            "pdf",
            file
          );
        }

        await api.post(
          "/weekly-content",
          formData,
          true
        );

        toast(
          `${currentDomain} — Week ${week} created`,
          "success"
        );
      }

      closeModal(
        "modal-weekly-content"
      );

      await loadWeeklyContent();

    } catch (err) {

      toastError(err);

    } finally {

      btn.disabled = false;

    }
  });


// =====================================================
// DOMAIN FILTER CHANGE
// =====================================================

const domainFilter =
  document.getElementById(
    "weeklyContentDomainFilter"
  );

if (domainFilter) {
  domainFilter.addEventListener(
    "change",
    loadWeeklyContent
  );
}