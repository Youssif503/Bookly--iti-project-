/* ==========================================================================
   Bookly — profile.js
   Powers profile.html
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const profileRoot = document.getElementById("profileRoot");
  if (!profileRoot) return;

  if (!BooklyUI.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const user = BooklyUI.getCurrentUser();
  populateProfile(user);
  initTabs();
  initSettingsForm(user);
  renderSavedBooks();
  initLogout();
});

function populateProfile(user) {
  document.getElementById("profileAvatar").src = user.avatar || "https://i.pravatar.cc/150";
  document.getElementById("profileFullName").textContent = user.fullName;
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("profileUsername").textContent = "@" + user.username;

  document.getElementById("settingsFullName").value = user.fullName || "";
  document.getElementById("settingsEmail").value = user.email || "";
  document.getElementById("settingsUsername").value = user.username || "";
  document.getElementById("settingsBio").value = user.bio || "";
}

function initTabs() {
  const tabLinks = document.querySelectorAll(".profile-tab-link");
  const panes = document.querySelectorAll(".profile-tab-pane");
  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      tabLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      const target = link.dataset.tab;
      panes.forEach((p) => p.classList.toggle("d-none", p.id !== target));
    });
  });
}

function initSettingsForm(user) {
  const form = document.getElementById("settingsForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const updates = {
      fullName: document.getElementById("settingsFullName").value.trim(),
      email: document.getElementById("settingsEmail").value.trim(),
      username: document.getElementById("settingsUsername").value.trim(),
      bio: document.getElementById("settingsBio").value.trim(),
    };
    const updated = BooklyAuth.updateCurrentUser(updates);
    if (updated) {
      populateProfile(BooklyUI.getCurrentUser());
      BooklyUI.showToast("Profile updated successfully");
    }
  });
}

function renderSavedBooks() {
  const grid = document.getElementById("savedBooksGrid");
  if (!grid) return;
  const favs = BooklyFavorites.getAll();
  if (favs.length === 0) {
    grid.innerHTML = BooklyUI.emptyState({
      icon: "bi-bookmark-heart",
      title: "No saved books yet",
      desc: "Books you favorite will show up in your reading list.",
    });
    return;
  }
  grid.innerHTML = `<div class="row row-cols-2 row-cols-md-3 g-3">${favs.map((b) => BooklyUI.bookCard(b)).join("")}</div>`;
}

function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    BooklyAuth.logout();
    window.location.href = "index.html";
  });
}
