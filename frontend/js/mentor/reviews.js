
import { api } from "../shared/api.js";

let reviews = [];

export async function loadReviews() {
  const rows = document.getElementById("mentorReviewRows");
  const message = document.getElementById("reviewsMessage");

  if (!rows) return;

  rows.innerHTML =
    '<tr><td colspan="6">Loading reviews...</td></tr>';

  if (message) message.textContent = "";

  try {
    const response = await api.get("/reviews/admin");

    reviews = Array.isArray(response)
      ? response
      : response.reviews || response.data || [];

    renderReviews();
  } catch (error) {
    console.error("Review loading error:", error);
    rows.innerHTML =
      '<tr><td colspan="6">Unable to load reviews. Please refresh.</td></tr>';

    if (message) {
      message.textContent = error.message || "Failed to load reviews.";
    }
  }
}

function renderReviews() {
  const rows = document.getElementById("mentorReviewRows");
  if (!rows) return;

  const statusFilter =
    document.getElementById("mentorReviewStatusFilter")?.value || "All";

  const search =
    document.getElementById("mentorReviewSearch")?.value
      .trim().toLowerCase() || "";

  const filtered = reviews.filter((review) => {
    const status = review.status || "Pending";
    const internName =
      review.internName || review.name || review.intern?.name || "Intern";

    const matchesStatus =
      statusFilter === "All" || status === statusFilter;

    const matchesSearch =
      `${internName} ${review.domain || ""} ${review.review || ""}`
        .toLowerCase()
        .includes(search);

    return matchesStatus && matchesSearch;
  });

  document.getElementById("totalReviews").textContent = reviews.length;
  document.getElementById("pendingReviews").textContent =
    reviews.filter((r) => r.status === "Pending").length;
  document.getElementById("approvedReviews").textContent =
    reviews.filter((r) => r.status === "Approved").length;
  document.getElementById("rejectedReviews").textContent =
    reviews.filter((r) => r.status === "Rejected").length;

  rows.replaceChildren();

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No reviews found.";
    tr.appendChild(td);
    rows.appendChild(tr);
    return;
  }

  filtered.forEach((review) => {
    const tr = document.createElement("tr");
    const status = review.status || "Pending";

    const internName =
      review.internName || review.name || review.intern?.name || "Intern";

    const values = [
      internName,
      review.domain || "—",
      `${review.rating ?? "—"} / 5`,
      review.review || review.comment || "—",
      status
    ];

    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = String(value);
      tr.appendChild(td);
    });

    const actions = document.createElement("td");

    if (status === "Pending") {
      actions.append(
        createActionButton("Approve", "Approved", review._id),
        document.createTextNode(" "),
        createActionButton("Reject", "Rejected", review._id)
      );
    } else if (status === "Approved") {
      actions.append(
        createActionButton("Remove from Public", "Unpublished", review._id)
      );
    } else if (status === "Unpublished") {
      actions.append(
        createActionButton("Publish Again", "Approved", review._id)
      );
    } else if (status === "Rejected") {
      actions.append(
        createActionButton("Approve", "Approved", review._id)
      );
    }

    tr.appendChild(actions);
    rows.appendChild(tr);
  });
}

function createActionButton(label, status, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = "btn btn-primary";

  button.addEventListener("click", async () => {
    if (
      !window.confirm(
        status === "Unpublished"
          ? "Remove this review from the public page?"
          : status === "Approved"
          ? "Publish this review on the public page?"
          : `Change review status to ${status}?`
      )
    ) {
      return;
    }

    button.disabled = true;

    try {
      await api.patch(
        `/reviews/admin/${encodeURIComponent(id)}/status`,
        { status }
      );

      await loadReviews();
    } catch (error) {
      console.error("Review status update error:", error);

      const message = document.getElementById("reviewsMessage");
      if (message) {
        message.textContent =
          error.message || "Unable to update review status.";
      }

      button.disabled = false;
    }
  });

  return button;
}

export function initReviews() {
  document
    .getElementById("refreshMentorReviews")
    ?.addEventListener("click", loadReviews);

  document
    .getElementById("mentorReviewStatusFilter")
    ?.addEventListener("change", renderReviews);

  document
    .getElementById("mentorReviewSearch")
    ?.addEventListener("input", renderReviews);
}
