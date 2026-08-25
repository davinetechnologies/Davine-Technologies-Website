// =====================================================
// MENTOR PORTAL AUTH
// =====================================================

export function requirePortal(portal) {
  const token = localStorage.getItem("mp_token");
  const userRaw = localStorage.getItem("mp_user");

  if (!token || !userRaw) {
    window.location.href = "mentor-login.html";
    return null;
  }

  let user;

  try {
    user = JSON.parse(userRaw);
  } catch (error) {
    console.error("Invalid stored user data:", error);

    localStorage.removeItem("mp_token");
    localStorage.removeItem("mp_user");

    window.location.href = "mentor-login.html";
    return null;
  }

  // Make sure this is a mentor account
  if (portal === "mentor") {
    if (user.portal && user.portal !== "mentor") {
      localStorage.removeItem("mp_token");
      localStorage.removeItem("mp_user");

      window.location.href = "mentor-login.html";
      return null;
    }
  }

  return user;
}


// =====================================================
// LOGOUT
// =====================================================

export async function logout() {
  try {
    const token = localStorage.getItem("mp_token");

    if (token) {
      try {
await fetch("https://davine-technologies-website.onrender.com/api/auth/logout", {          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.warn("Logout API request failed:", error);
      }
    }
  } finally {
    localStorage.removeItem("mp_token");
    localStorage.removeItem("mp_user");
    localStorage.removeItem("mp_intern");

    window.location.href = "mentor-login.html";
  }
}