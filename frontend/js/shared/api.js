const API_BASE = "https://davine-technologies-website.onrender.com/api";
async function request(
  method,
  path,
  body = null,
  options = {}
) {
  const token = localStorage.getItem("mp_token");

  const isFormData = body instanceof FormData;

  const headers = {
    ...(body && !isFormData
      ? {
          "Content-Type": "application/json"
        }
      : {}),

    ...(token
      ? {
          Authorization: `Bearer ${token}`
        }
      : {}),

    ...(options.headers || {})
  };

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method,
      headers,
      body: body
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined
    }
  );

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      message: text
    };
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Request failed: ${response.status}`
    );
  }

  return data;
}


// ========================================
// API OBJECT
// ========================================

export const api = {

  get(path, options = {}) {
    return request(
      "GET",
      path,
      null,
      options
    );
  },

  post(path, body = null, isFormData = false) {
    return request(
      "POST",
      path,
      body
    );
  },

  put(path, body = null, isFormData = false) {
    return request(
      "PUT",
      path,
      body
    );
  },

  patch(path, body = null) {
    return request(
      "PATCH",
      path,
      body
    );
  },

  delete(path) {
    return request(
      "DELETE",
      path
    );
  }
};


// ========================================
// FILE URL
// ========================================

export function fileUrl(url) {

  if (!url) {
    return "";
  }

  // Already an absolute URL
  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  // Backend URL without /api
  const backendBase =
    API_BASE.replace("/api", "");

  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}