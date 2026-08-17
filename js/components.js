/* ==========================================================================
   Bookly — components.js
   Shared UI building blocks reused across every page: navbar, footer,
   book cards, rating stars, loading/empty states, favorites helpers.
   ========================================================================== */

const BooklyUI = (() => {
  const NAV_LINKS = [
    { href: "index.html", label: "Home", icon: "bi-house" },
    { href: "books.html", label: "Books", icon: "bi-book" },
    { href: "categories.html", label: "Categories", icon: "bi-grid" },
    { href: "authors.html", label: "Authors", icon: "bi-person" },
    { href: "favorites.html", label: "Favorites", icon: "bi-heart" },
  ];

  function currentPage() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    return path;
  }

  function isLoggedIn() {
    return !!localStorage.getItem("bookly_current_user");
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("bookly_current_user"));
    } catch (e) {
      return null;
    }
  }

  function renderNavbar() {
    const mount = document.getElementById("navbar-mount");
    if (!mount) return;
    const active = currentPage();
    const loggedIn = isLoggedIn();

    const linksHtml = NAV_LINKS.map((link) => {
      const isActive = link.href === active;
      return `<li class="nav-item">
        <a class="nav-link ${isActive ? "active" : ""}" href="${link.href}">
          <i class="bi ${link.icon}"></i><span>${link.label}</span>
        </a>
      </li>`;
    }).join("");

    const profileHref = loggedIn ? "profile.html" : "login.html";
    const profileIcon = loggedIn ? "bi-person-circle" : "bi-person";

    mount.innerHTML = `
    <nav class="navbar navbar-expand-lg bookly-navbar">
      <div class="container">
        <a class="navbar-brand" href="index.html"><i class="bi bi-book-half"></i>Bookly</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#booklyNav" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="booklyNav">
          <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
            ${linksHtml}
          </ul>
          <div class="d-flex align-items-center gap-2">
            <a href="search.html" class="nav-icon-btn" title="Search"><i class="bi bi-search"></i></a>
            <a href="${profileHref}" class="nav-icon-btn" title="${loggedIn ? "Profile" : "Login"}"><i class="bi ${profileIcon}"></i></a>
          </div>
        </div>
      </div>
    </nav>`;
  }

  function renderFooter() {
    const mount = document.getElementById("footer-mount");
    if (!mount) return;
    mount.innerHTML = `
    <footer class="bookly-footer">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-3 col-md-6">
            <div class="footer-brand mb-3"><i class="bi bi-book-half"></i>Bookly</div>
            <p>Your gateway to endless stories and knowledge.</p>
            <div class="footer-social mt-3">
              <a href="#" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i class="bi bi-twitter-x"></i></a>
              <a href="#" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
              <a href="#" aria-label="Email"><i class="bi bi-envelope"></i></a>
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <h6>Quick Links</h6>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="books.html">Books</a></li>
              <li><a href="categories.html">Categories</a></li>
              <li><a href="authors.html">Authors</a></li>
              <li><a href="favorites.html">Favorites</a></li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6">
            <h6>Support</h6>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6">
            <h6>Newsletter</h6>
            <p>Subscribe to get updates on new books and features.</p>
            <form class="footer-newsletter" id="newsletterForm">
              <input type="email" class="form-control" placeholder="Enter your email" required>
              <button type="submit" class="btn btn-pink w-100">Subscribe</button>
            </form>
          </div>
        </div>
        <div class="footer-bottom">&copy; 2024 Bookly. All rights reserved.</div>
      </div>
      <button class="back-to-top" id="backToTopBtn" aria-label="Back to top"><i class="bi bi-arrow-up"></i></button>
    </footer>`;

    const newsletterForm = document.getElementById("newsletterForm");
    if (newsletterForm) {
      newsletterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        BooklyUI.showToast("Thanks for subscribing to Bookly updates!");
        newsletterForm.reset();
      });
    }

    const backBtn = document.getElementById("backToTopBtn");
    if (backBtn) {
      window.addEventListener("scroll", () => {
        backBtn.classList.toggle("show", window.scrollY > 400);
      });
      backBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  }

  function starRating(rating) {
    const rounded = Math.round(rating * 10) / 10;
    return `<i class="bi bi-star-fill"></i> ${rounded.toFixed(1)}`;
  }

  function coverOrFallback(book) {
    if (book.thumbnail) {
      return `<img src="${book.thumbnail}" alt="${escapeHtml(book.title)} cover" loading="lazy" onerror="this.parentElement.innerHTML = BooklyUI.fallbackCoverHtml('${escapeHtml(book.title).replace(/'/g, "\\'")}')">`;
    }
    return fallbackCoverHtml(book.title);
  }

  function fallbackCoverHtml(title) {
    const hue = Math.abs(hashCode(title)) % 360;
    return `<div class="book-cover-fallback" style="background: linear-gradient(160deg, hsl(${hue},45%,32%), hsl(${hue + 30},50%,20%))">${escapeHtml(title)}</div>`;
  }

  function hashCode(str) {
    let hash = 0;
    if (!str) return 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bookCard(book, { showViewDetails = false } = {}) {
    BooklyFavorites.cacheBook(book);
    const isFav = BooklyFavorites.isFavorite(book.id);
    const author = Array.isArray(book.authors) ? book.authors[0] : book.authors;
    return `
    <div class="col">
      <div class="book-card">
        <div class="book-cover-wrap">
          <a href="book-details.html?id=${encodeURIComponent(book.id)}">${coverOrFallback(book)}</a>
          <button class="favorite-btn ${isFav ? "active" : ""}" data-book-id="${book.id}" title="Toggle favorite" onclick="BooklyUI.toggleFavoriteFromCard(event, '${book.id}')">
            <i class="bi ${isFav ? "bi-heart-fill" : "bi-heart"}"></i>
          </button>
        </div>
        <div class="book-card-body">
          <a href="book-details.html?id=${encodeURIComponent(book.id)}" class="text-decoration-none">
            <div class="book-card-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</div>
          </a>
          <div class="book-card-author">${escapeHtml(author)}</div>
          <div class="book-rating">${starRating(book.rating)}</div>
          ${showViewDetails ? `<div class="book-card-actions"><a href="book-details.html?id=${encodeURIComponent(book.id)}" class="btn btn-pink-outline btn-sm w-100">View Details</a></div>` : ""}
        </div>
      </div>
    </div>`;
  }

  function toggleFavoriteFromCard(event, bookId) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const nowFav = BooklyFavorites.toggle(bookId);
    btn.classList.toggle("active", nowFav);
    btn.querySelector("i").className = `bi ${nowFav ? "bi-heart-fill" : "bi-heart"}`;
    showToast(nowFav ? "Added to Favorites" : "Removed from Favorites");
    document.dispatchEvent(new CustomEvent("bookly:favorites-changed"));
  }

  function loadingState(message = "Loading books...") {
    return `
    <div class="state-box">
      <div class="spinner-border spinner-pink" role="status"></div>
      <h5 class="mt-3">${message}</h5>
    </div>`;
  }

  function emptyState({ icon = "bi-emoji-frown", title = "No results found", desc = "Try adjusting your search or filters.", }) {
    return `
    <div class="state-box">
      <i class="bi ${icon}"></i>
      <h5>${title}</h5>
      <p class="mb-0">${desc}</p>
    </div>`;
  }

  function errorState(message = "We couldn't reach the Bookly library service right now.") {
    return `
    <div class="alert alert-warning d-flex align-items-center gap-2" role="alert">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <div>${message} Showing sample books instead.</div>
    </div>`;
  }

  let toastContainer;
  function showToast(message, type = "success") {
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
      toastContainer.style.zIndex = 1080;
      document.body.appendChild(toastContainer);
    }
    const id = "toast-" + Date.now();
    const bg = type === "success" ? "text-bg-dark" : "text-bg-danger";
    const el = document.createElement("div");
    el.className = `toast align-items-center ${bg} border-0`;
    el.id = id;
    el.setAttribute("role", "alert");
    el.innerHTML = `<div class="d-flex">
      <div class="toast-body"><i class="bi bi-heart-fill text-pink me-2"></i>${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
    toastContainer.appendChild(el);
    const toast = new bootstrap.Toast(el, { delay: 2200 });
    toast.show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
  }

  return {
    renderNavbar,
    renderFooter,
    bookCard,
    starRating,
    coverOrFallback,
    fallbackCoverHtml,
    escapeHtml,
    loadingState,
    emptyState,
    errorState,
    showToast,
    toggleFavoriteFromCard,
    isLoggedIn,
    getCurrentUser,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  BooklyUI.renderNavbar();
  BooklyUI.renderFooter();
});
