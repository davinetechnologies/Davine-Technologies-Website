import { api } from "./api.js";
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  if (!form) {
    console.error("Mentor login form not found.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      showError("Please enter your email and password.");
      return;
    }

    const button = form.querySelector("button[type='submit']");

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "Signing in...";
      }

      const result = await api.post("/auth/login", {
        email,
        password,
        portal: "mentor"
      });

      console.log("Mentor login response:", result);

      if (!result.success) {
        throw new Error(result.message || "Login failed.");
      }

      // Save authentication data
      if (result.token) {
        localStorage.setItem("mp_token", result.token);
      }

if (result.user) {
  const mentorUser = {
    ...result.user,
    portal: "mentor"
  };

  localStorage.setItem("mp_user", JSON.stringify(mentorUser));
}

      if (result.intern) {
        localStorage.setItem("mp_intern", JSON.stringify(result.intern));
      }

      // Redirect to mentor dashboard
      window.location.href = "mentor.html";

    } catch (error) {
      console.error("Mentor login error:", error);
      showError(error.message || "Unable to sign in. Please try again.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Sign in";
      }
    }
  });

  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.add("show");
      errorBox.style.display = "block";
    } else {
      alert(message);
    }
  }
});