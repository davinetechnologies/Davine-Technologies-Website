// =====================================================
// SHARED PORTAL AUTH
// =====================================================

const API_BASE =
  "https://davine-technologies-website.onrender.com/api";

// =====================================================
// LOGIN
// =====================================================

export async function login(email, password, portal) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password || !portal) {
    throw new Error("Email, password and portal are required");
  }

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: cleanEmail,
      password,
      portal
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Login failed"
    );
  }

  if (!data.token || !data.user) {
    throw new Error(
      "Invalid login response from server"
    );
  }

  // Make sure frontend knows which portal this session belongs to
  const user = {
    ...data.user,
    portal
  };

  // Clear any old session first
  localStorage.removeItem("mp_token");
  localStorage.removeItem("mp_user");
  localStorage.removeItem("mp_intern");

  // Save new session
  localStorage.setItem(
    "mp_token",
    data.token
  );

  localStorage.setItem(
    "mp_user",
    JSON.stringify(user)
  );

  // Intern profile/session data
  if (portal === "intern") {
    localStorage.setItem(
      "mp_intern",
      JSON.stringify(user)
    );
  }

  return {
    ...data,
    user
  };
}


// =====================================================
// REQUIRE PORTAL
// =====================================================

export function requirePortal(portal) {
  const token =
    localStorage.getItem("mp_token");

  const userRaw =
    localStorage.getItem("mp_user");

  if (!token || !userRaw) {
    redirectToLogin(portal);
    return null;
  }

  let user;

  try {
    user = JSON.parse(userRaw);
  } catch (error) {
    console.error(
      "Invalid stored user:",
      error
    );

    clearSession();
    redirectToLogin(portal);

    return null;
  }

  // ==========================================
  // STRICT PORTAL CHECK
  // ==========================================

  if (user.portal !== portal) {
    console.warn(
      `Wrong portal session. Expected: ${portal}, Found: ${user.portal}`
    );

    clearSession();
    redirectToLogin(portal);

    return null;
  }

  return user;
}


// =====================================================
// REDIRECT
// =====================================================

function redirectToLogin(portal) {
  if (portal === "intern") {
    window.location.href =
      "intern-login.html";
  } else {
    window.location.href =
      "mentor-login.html";
  }
}


// =====================================================
// CLEAR SESSION
// =====================================================

function clearSession() {
  localStorage.removeItem("mp_token");
  localStorage.removeItem("mp_user");
  localStorage.removeItem("mp_intern");
}


// =====================================================
// LOGOUT
// =====================================================

export async function logout() {
  const token =
    localStorage.getItem("mp_token");

  try {
    if (token) {
      await fetch(
        `${API_BASE}/auth/logout`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );
    }
  } catch (error) {
    console.warn(
      "Logout API request failed:",
      error
    );
  } finally {
    clearSession();

    window.location.href =
      "mentor-login.html";
  }
}