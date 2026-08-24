import { login } from "./shared/auth.js";

const errorBox = document.getElementById("loginError");
const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");

// If already logged in, skip straight to the dashboard.
const existing = localStorage.getItem("mp_user");
if (existing && localStorage.getItem("mp_token")) {
  location.href = "mentor.html";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.remove("show");
  loginBtn.disabled = true;
  loginBtn.innerHTML = `<span class="spinner"></span> Signing in…`;

  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    await login(email, password, "mentor");
    location.href = "mentor.html";
  } catch (err) {
    errorBox.textContent = err.message || "Sign in failed";
    errorBox.classList.add("show");
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign in";
  }
});
