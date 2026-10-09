import { api, fileUrl } from "../shared/api.js";
import {
  toast, toastError, openModal, closeModal,
  loadingBlock, emptyBlock, errorBlock, statusBadge, formatDateTime, escapeHtml,
} from "../shared/ui.js";

const DOMAINS = ["DevOps", "Cloud", "Data Analyst", "Gen AI"];

const CERTIFICATE_PRESETS = {
  devops: {
    label: "DevOps",
    role: "DevOps Intern",
    description: "Demonstrating strong technical aptitude, problem-solving, and dedication while gaining hands-on exposure in CI/CD pipelines, containerization, version control, infrastructure automation, and deployment workflows."
  },
  cloud: {
    label: "AWS Cloud Engineer",
    role: "AWS Cloud Engineer Intern",
    description: "Demonstrating strong technical aptitude, analytical thinking, and dedication while gaining hands-on exposure in cloud infrastructure, virtualization, storage and networking services, cloud security, and scalable deployments."
  },
  ta: {
    label: "Talent Acquisition",
    role: "Talent Acquisition Intern",
    description: "Demonstrating strong interpersonal skills, professionalism, and dedication while gaining valuable industry exposure in talent sourcing, candidate engagement, recruitment coordination, and hiring processes."
  },
  web: {
    label: "Web Development",
    role: "Web Development Intern",
    description: "Demonstrating strong technical skills, creativity, and dedication while gaining hands-on exposure in front-end and back-end development, responsive design, API integration, databases, and deployment."
  },
  data: {
    label: "Data Analytics",
    role: "Data Analytics Intern",
    description: "Demonstrating strong analytical skills, attention to detail, and dedication while gaining hands-on exposure in data collection and cleaning, exploratory analysis, visualization, reporting, and insight generation."
  },
  ai: {
    label: "AI & Machine Learning",
    role: "AI & Machine Learning Intern",
    description: "Demonstrating strong analytical skills, curiosity, and dedication while gaining hands-on exposure in data preprocessing, model building, evaluation, and deployment of machine learning solutions."
  },
  cyber: {
    label: "Cyber Security",
    role: "Cyber Security Intern",
    description: "Demonstrating strong technical aptitude, diligence, and dedication while gaining hands-on exposure in vulnerability assessment, network security, threat analysis, and security best practices."
  },
  uiux: {
    label: "UI/UX Design",
    role: "UI/UX Design Intern",
    description: "Demonstrating strong creativity, empathy, and dedication while gaining hands-on exposure in user research, wireframing, prototyping, visual design, and usability testing."
  },
  marketing: {
    label: "Digital Marketing",
    role: "Digital Marketing Intern",
    description: "Demonstrating strong communication skills, creativity, and dedication while gaining hands-on exposure in social media marketing, content creation, SEO, campaign planning, and performance analytics."
  }
};

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
  const certificateBtn = e.target.closest("[data-issue-certificate]");

  if (certificateBtn) {
    document.getElementById("certificateInternId").value =
      certificateBtn.dataset.issueCertificate;

    document.getElementById("certificateInternName").value =
      certificateBtn.dataset.internName || "";

    document.getElementById("certificateCredentialId").value = "";
    document.getElementById("certificateDomain").value = "";
    document.getElementById("certificateRole").value = "";
    document.getElementById("certificateDescription").value = "";

    openModal("modal-certificate");
    return;
  }

  const btn = e.target.closest("[data-review]");
  if (btn) openReview(btn.dataset.review);
});


  document.getElementById("approveBtn").addEventListener("click", () => submitReview("Approved"));
  document.getElementById("rejectBtn").addEventListener("click", () => submitReview("Rejected"));
  
  const certificateDomain = document.getElementById("certificateDomain");
  const certificateRole = document.getElementById("certificateRole");
  const certificateDescription = document.getElementById("certificateDescription");

  certificateDomain.innerHTML =
    '<option value="">Select certificate domain</option>' +
    Object.entries(CERTIFICATE_PRESETS)
      .map(([key, preset]) =>
        `<option value="${key}">${preset.label}</option>`
      )
      .join("");

  certificateDomain.addEventListener("change", () => {
    const preset = CERTIFICATE_PRESETS[certificateDomain.value];

    certificateRole.value = preset ? preset.role : "";
    certificateDescription.value = preset ? preset.description : "";
  });

  document.getElementById("issueCertificateBtn").addEventListener("click", async () => {
    const internId = document.getElementById("certificateInternId").value;
    const credentialId = document.getElementById("certificateCredentialId").value.trim();
    const domain = certificateDomain.value;
    const role = certificateRole.value.trim();
    const description = certificateDescription.value.trim();

    if (!internId || !credentialId || !domain || !role) {
      toastError(new Error("Please fill in all required certificate fields."));
      return;
    }

    const button = document.getElementById("issueCertificateBtn");
    button.disabled = true;

    try {
      await api.post("/certificates/issue", {
        internId,
        credentialId,
        domain,
        role,
        description
      });

      toast("Certificate issued and saved successfully.", "success");
      closeModal("modal-certificate");
      await loadSubmissionsBoard();
    } catch (err) {
      toastError(err);
    } finally {
      button.disabled = false;
    }
  });

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
const domain = document.getElementById("subDomainFilter").value;
const batch = document.getElementById("subBatchFilter").value;
const status = document.getElementById("subStatusFilter").value;
const search = document.getElementById("subSearch").value.trim();

const params = new URLSearchParams();

if (week) params.set("week", week);
if (domain) params.set("domain", domain);
if (batch) params.set("batch", batch);
if (status) params.set("status", status);
if (search) params.set("search", search);

const rows = await api.get(
  `/submissions/board?${params.toString()}`
);

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
              const canIssueCertificate = row.week === 12 && sub && sub.status === "Approved";
              const certificateIssued = Boolean(row.certificateIssued);
              return `
              <tr>
                <td><div class="cell-primary">${escapeHtml(row.intern.name)}</div><div class="cell-sub mono">${escapeHtml(row.intern.internId)}</div></td>
                <td>${escapeHtml(row.intern.domain)}</td>
                <td>${row.intern.batch ? escapeHtml(row.intern.batch.batchName) : "—"}</td>
                <td>Week ${row.week}</td>
                <td>${sub && sub.submissionFile ? `<a class="pdf-chip" href="${sub.submissionUrl || fileUrl(sub.submissionFile)}" target="_blank" rel="noopener">📄 PDF</a>` : '<span class="muted">—</span>'}</td>
                <td>${statusBadge(row.status)}</td>
                <td class="cell-sub">${sub ? formatDateTime(sub.submittedAt) : "—"}</td>
                <td class="text-right">
                  ${canReview ? `<button class="btn btn-secondary btn-sm" data-review="${sub._id}">${sub.status === "Submitted" ? "Review" : "View"}</button>` : ""}

${
  canIssueCertificate
    ? certificateIssued
      ? `<span class="btn btn-sm" style="background:#dcfce7;color:#166534;white-space:nowrap;cursor:default;">Certificate Issued ✓</span>`
      : `<button class="btn btn-primary btn-sm" data-issue-certificate="${row.intern._id}" data-intern-name="${escapeHtml(row.intern.name)}">Issue Certificate</button>`
    : ""
}
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
  } catch (err) {
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
        <a class="pdf-chip" href="${sub.submissionUrl || fileUrl(sub.submissionFile)}" target="_blank" rel="noopener">📄 View submitted PDF</a>
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
