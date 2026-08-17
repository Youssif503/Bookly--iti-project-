/* ==========================================================================
   Bookly — auth.js
   Demo-only authentication. No real backend: accounts and sessions are
   stored in LocalStorage purely so the UI flow can be tried out.
   ========================================================================== */

const BooklyAuth = (() => {
  const USERS_KEY = "bookly_users";
  const SESSION_KEY = "bookly_current_user";

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function register({ fullName, email, password }) {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, message: "An account with this email already exists." };
    }
    const user = {
      id: "u_" + Date.now(),
      fullName,
      email,
      username: email.split("@")[0],
      password, // demo only — never store plaintext passwords in a real app
      bio: "Book lover | Always looking for my next great read.",
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    setSession(user);
    return { ok: true, user };
  }

  function login({ identifier, password }) {
    const users = getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()
    );
    if (!user || user.password !== password) {
      return { ok: false, message: "Incorrect email/username or password." };
    }
    setSession(user);
    return { ok: true, user };
  }

  function setSession(user) {
    const { password, ...safeUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function updateCurrentUser(updates) {
    const current = BooklyUI.getCurrentUser();
    if (!current) return null;
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx > -1) {
      users[idx] = { ...users[idx], ...updates };
      saveUsers(users);
      setSession(users[idx]);
      return users[idx];
    }
    return null;
  }

  return { register, login, logout, updateCurrentUser, getUsers };
})();

// ---- login.html ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    if (BooklyUI.isLoggedIn()) window.location.href = "profile.html";

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const identifier = document.getElementById("loginIdentifier").value.trim();
      const password = document.getElementById("loginPassword").value;
      const alertBox = document.getElementById("loginAlert");
      const result = BooklyAuth.login({ identifier, password });
      if (result.ok) {
        window.location.href = "profile.html";
      } else {
        alertBox.textContent = result.message;
        alertBox.classList.remove("d-none");
      }
    });
  }

  const togglePw = document.querySelectorAll(".toggle-password");
  togglePw.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.querySelector(btn.dataset.target);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.querySelector("i").className = isPassword ? "bi bi-eye-slash" : "bi bi-eye";
    });
  });

  // ---- register.html ------------------------------------------------------
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    if (BooklyUI.isLoggedIn()) window.location.href = "profile.html";

    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fullName = document.getElementById("regFullName").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value;
      const confirm = document.getElementById("regConfirm").value;
      const alertBox = document.getElementById("registerAlert");

      if (password !== confirm) {
        alertBox.textContent = "Passwords do not match.";
        alertBox.classList.remove("d-none");
        return;
      }
      if (password.length < 6) {
        alertBox.textContent = "Password must be at least 6 characters.";
        alertBox.classList.remove("d-none");
        return;
      }
      const result = BooklyAuth.register({ fullName, email, password });
      if (result.ok) {
        window.location.href = "profile.html";
      } else {
        alertBox.textContent = result.message;
        alertBox.classList.remove("d-none");
      }
    });
  }
});
