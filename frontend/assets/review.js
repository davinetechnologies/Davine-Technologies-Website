
const API_BASE = "https://davine-technologies-website.onrender.com/api";

document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

function getToken() {
  return localStorage.getItem("mp_token");
}

function setMessage(element, type, message) {
  if (!element) return;
  element.className = `form-message ${type}`;
  element.textContent = message;
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
      result.error ||
      `Request failed (${response.status})`
    );
  }

  return result;
}

// INTERN REVIEW SUBMISSION
const reviewForm = document.getElementById("reviewForm");

if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("formMessage");

    if (!reviewForm.reportValidity()) {
      setMessage(
        message,
        "error",
        "Please complete all required fields and confirm the consent checkbox."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setMessage(
        message,
        "error",
        "Please log in to your intern portal before submitting a review."
      );
      return;
    }

    const data = new FormData(reviewForm);
    const review = String(data.get("review") || "").trim();
    const ratingInput = reviewForm.querySelector(
      'input[name="rating"]:checked'
    );

    if (review.length < 10) {
      setMessage(message, "error", "Please write at least 10 characters.");
      return;
    }

    if (!ratingInput) {
      setMessage(message, "error", "Please select a rating.");
      return;
    }

    const submitButton = reviewForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    setMessage(message, "", "Submitting your review...");

    try {
      await apiRequest("/reviews", {
        method: "POST",
        body: JSON.stringify({
          rating: Number(ratingInput.value),
          review
        })
      });

setMessage(
  message,
  "success",
  "Your review has been submitted successfully."
);

      reviewForm.reset();
    } catch (error) {
      setMessage(
        message,
        "error",
        error.message ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

// PUBLIC APPROVED REVIEWS
const reviewsGrid = document.getElementById("reviewsGrid");

if (reviewsGrid) {
  loadPublicReviews();
}

async function loadPublicReviews() {
  try {
    const result = await apiRequest("/reviews/public");
    const reviews = Array.isArray(result)
      ? result
      : result.reviews || result.data || [];

    reviewsGrid.replaceChildren();

    if (!reviews.length) {
      const empty = document.createElement("article");
      empty.className = "empty-state";
      empty.textContent = "No approved reviews are available yet.";
      reviewsGrid.appendChild(empty);
      return;
    }

    reviews.forEach((review) => {
      const card = document.createElement("article");
      card.className = "review-card";

      const name = document.createElement("h3");
      name.textContent = review.name || "Davine Technologies Intern";

      const domain = document.createElement("p");
      domain.textContent = review.domain || "Internship";

      const rating = document.createElement("p");
      const score = Number(review.rating) || 0;
      rating.textContent =
        "★".repeat(Math.max(0, Math.min(5, score))) +
        "☆".repeat(5 - Math.max(0, Math.min(5, score)));

      const title = document.createElement("h4");
      title.textContent = review.title || "Intern Experience";

      const content = document.createElement("p");
      content.textContent = review.review || "";

      card.append(name, domain, rating, title, content);
      reviewsGrid.appendChild(card);
    });
  } catch (error) {
    reviewsGrid.replaceChildren();

    const errorMessage = document.createElement("p");
    errorMessage.textContent =
      "Reviews could not be loaded right now. Please try again later.";

    reviewsGrid.appendChild(errorMessage);
    console.error("Public reviews error:", error);
  }
}

// ADMIN REVIEW MODERATION
const adminRows = document.getElementById("adminReviewRows");
const statusFilter = document.getElementById("statusFilter");
const reviewSearch = document.getElementById("reviewSearch");
const adminMessage = document.getElementById("adminMessage");

if (adminRows) {
  loadAdminReviews();
}

let loadedAdminReviews = [];

async function loadAdminReviews() {
  if (!getToken()) {
    setMessage(
      adminMessage,
      "error",
      "Mentor/admin login token not found. Log in to the authorized portal first."
    );
    return;
  }

  try {
    const result = await apiRequest("/reviews/admin");
    loadedAdminReviews = Array.isArray(result)
      ? result
      : result.reviews || result.data || [];

    renderAdminReviews();
  } catch (error) {
    setMessage(
      adminMessage,
      "error",
      `Could not load reviews: ${error.message}`
    );
  }
}

function renderAdminReviews() {
  const status = statusFilter?.value || "all";
  const query = (reviewSearch?.value || "").trim().toLowerCase();

  adminRows.replaceChildren();

  const filtered = loadedAdminReviews.filter((review) => {
    const reviewStatus = String(review.status || "Pending").toLowerCase();
    const statusMatch =
      status === "all" || reviewStatus === status.toLowerCase();

    const searchText = [
      review.name,
      review.domain,
      review.batch,
      review.title,
      review.review
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return statusMatch && searchText.includes(query);
  });

  filtered.forEach((review) => {
    const row = document.createElement("tr");

    const personCell = document.createElement("td");
    const personName = document.createElement("strong");
    personName.textContent = review.name || "Intern";
    personCell.appendChild(personName);

    const domainCell = document.createElement("td");
    domainCell.textContent = review.domain || "—";

    const reviewCell = document.createElement("td");
    reviewCell.textContent = review.review || "";

    const ratingCell = document.createElement("td");
    ratingCell.textContent = `${Number(review.rating) || 0}/5`;

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    const currentStatus = review.status || "Pending";
    badge.className = `status-badge ${currentStatus.toLowerCase()}`;
    badge.textContent = currentStatus;
    statusCell.appendChild(badge);

    const actionCell = document.createElement("td");

    if (currentStatus !== "Approved") {
      const approve = document.createElement("button");
      approve.type = "button";
      approve.textContent = "Approve";
      approve.addEventListener("click", () =>
        updateReviewStatus(review._id, "Approved")
      );
      actionCell.appendChild(approve);
    }

    if (currentStatus !== "Rejected") {
      const reject = document.createElement("button");
      reject.type = "button";
      reject.textContent = "Reject";
      reject.addEventListener("click", () =>
        updateReviewStatus(review._id, "Rejected")
      );
      actionCell.appendChild(reject);
    }

    row.append(
      personCell,
      domainCell,
      reviewCell,
      ratingCell,
      statusCell,
      actionCell
    );

    adminRows.appendChild(row);
  });

  const stats = {
    total: loadedAdminReviews.length,
    pending: loadedAdminReviews.filter(
      (r) => r.status === "Pending"
    ).length,
    approved: loadedAdminReviews.filter(
      (r) => r.status === "Approved"
    ).length,
    rejected: loadedAdminReviews.filter(
      (r) => r.status === "Rejected"
    ).length
  };

  const statElements = {
    total: document.getElementById("totalReviews"),
    pending: document.getElementById("pendingReviews"),
    approved: document.getElementById("approvedReviews"),
    rejected: document.getElementById("rejectedReviews")
  };

  Object.entries(statElements).forEach(([key, element]) => {
    if (element) element.textContent = stats[key];
  });
}

async function updateReviewStatus(id, status) {
  try {
    await apiRequest(
      `/reviews/admin/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status })
      }
    );

    setMessage(
      adminMessage,
      "success",
      `Review ${status.toLowerCase()} successfully.`
    );

    await loadAdminReviews();
  } catch (error) {
    setMessage(
      adminMessage,
      "error",
      `Could not update review: ${error.message}`
    );
  }
}

statusFilter?.addEventListener("change", renderAdminReviews);
reviewSearch?.addEventListener("input", renderAdminReviews);
