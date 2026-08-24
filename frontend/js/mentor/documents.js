import { api, fileUrl } from "../shared/api.js";
import { toast, toastError, openModal, closeModal, confirmAction, loadingBlock, emptyBlock, errorBlock, formatDate, escapeHtml } from "../shared/ui.js";

export function initDocuments() {
  document.getElementById("addDocumentBtn").addEventListener("click", () => {
    document.getElementById("documentForm").reset();
    openModal("modal-document");
  });
  document.getElementById("saveDocumentBtn").addEventListener("click", saveDocument);
  document.getElementById("documentsTable").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-del-doc]");
    if (btn) deleteDocument(btn.dataset.delDoc);
  });
}

export async function loadDocuments() {
  const el = document.getElementById("documentsTable");
  el.innerHTML = loadingBlock("Loading documents…");

  try {
    const docs = await api.get("/documents");
    if (!docs.length) {
      el.innerHTML = emptyBlock("No documents yet", "Upload guidelines, policies, or reference material for interns.");
      return;
    }
    el.innerHTML = `
      <table>
        <thead><tr><th>Title</th><th>Category</th><th>Uploaded</th><th></th></tr></thead>
        <tbody>
          ${docs
            .map(
              (d) => `
            <tr>
              <td class="cell-primary">${escapeHtml(d.title)}</td>
              <td>${escapeHtml(d.category)}</td>
              <td class="cell-sub">${formatDate(d.createdAt)}</td>
              <td class="text-right">
                <a class="btn btn-secondary btn-sm" href="${fileUrl(d.fileUrl)}" target="_blank" rel="noopener">View</a>
                <button class="btn btn-ghost btn-sm" data-del-doc="${d._id}">Delete</button>
              </td>
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

async function saveDocument() {
  const title = document.getElementById("docTitle").value.trim();
  const category = document.getElementById("docCategory").value;
  const file = document.getElementById("docFile").files[0];
  if (!title || !file) {
    toast("Title and a PDF file are required", "error");
    return;
  }
  const form = new FormData();
  form.append("title", title);
  form.append("category", category);
  form.append("file", file);

  try {
    await api.post("/documents", form, true);
    toast("Document uploaded", "success");
    closeModal("modal-document");
    loadDocuments();
  } catch (err) {
    toastError(err);
  }
}

async function deleteDocument(id) {
  if (!confirmAction("Delete this document?")) return;
  try {
    await api.del(`/documents/${id}`);
    toast("Document deleted", "success");
    loadDocuments();
  } catch (err) {
    toastError(err);
  }
}
