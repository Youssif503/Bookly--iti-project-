/* ==========================================================================
   Bookly — details.js
   Powers book-details.html
   ========================================================================== */

const DEMO_REVIEWS = [
  { name: "Sarah Johnson", rating: 5.0, date: "Apr 12, 2024", text: "Beautifully written and thought-provoking. A book that stays with you long after you finish it.", avatar: "https://i.pravatar.cc/80?img=47" },
  { name: "Michael Brown", rating: 4.0, date: "Mar 28, 2024", text: "Incredible story about choices and second chances. Highly recommended!", avatar: "https://i.pravatar.cc/80?img=12" },
  { name: "Amelia Chen", rating: 4.5, date: "Feb 09, 2024", text: "A gentle, moving read. The pacing was perfect and I couldn't put it down.", avatar: "https://i.pravatar.cc/80?img=32" },
];

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("bookDetailsContainer");
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    container.innerHTML = BooklyUI.emptyState({ title: "Book not found", desc: "No book id was provided." });
    return;
  }

  loadDetails(id, container);
});

async function loadDetails(id, container) {
  container.innerHTML = BooklyUI.loadingState("Loading book details...");
  const result = await BooklyAPI.getBookById(id);

  if (!result.book) {
    container.innerHTML = BooklyUI.emptyState({ title: "Book not found", desc: "This title may have been removed." });
    return;
  }

  const book = result.book;
  BooklyFavorites.cacheBook(book);
  document.title = `${book.title} — Bookly`;

  const breadcrumbTitle = document.getElementById("breadcrumbTitle");
  if (breadcrumbTitle) breadcrumbTitle.textContent = book.title;

  const isFav = BooklyFavorites.isFavorite(book.id);
  const authors = Array.isArray(book.authors) ? book.authors.join(", ") : book.authors;
  const categories = Array.isArray(book.categories) ? book.categories.join(", ") : book.category;

  let html = "";
  if (!result.ok) html += BooklyUI.errorState("We couldn't reach the book service.");

  html += `
  <div class="row g-4">
    <div class="col-md-4 col-lg-3">
      <div class="details-cover">${BooklyUI.coverOrFallback(book)}</div>
    </div>
    <div class="col-md-8 col-lg-9">
      <h2 class="mb-1">${BooklyUI.escapeHtml(book.title)}</h2>
      <div class="d-flex align-items-center gap-2 mb-2">
        <span class="text-body">${BooklyUI.escapeHtml(authors)}</span>
        <span class="badge-author">Author</span>
      </div>
      <div class="d-flex align-items-center gap-2 mb-3">
        <span class="text-pink fw-semibold"><i class="bi bi-star-fill"></i> ${book.rating.toFixed(1)}</span>
        <span class="text-muted">(${(book.ratingsCount || 1200).toLocaleString()} ratings)</span>
      </div>
      <div class="d-flex gap-2 mb-3 flex-wrap">
        <button class="btn btn-pink" id="favToggleBtn"><i class="bi ${isFav ? "bi-heart-fill" : "bi-heart"}"></i> ${isFav ? "In Favorites" : "Add to Favorites"}</button>
        <a href="#reviewsSection" class="btn btn-pink-outline"><i class="bi bi-chat-square-text"></i> Read Reviews</a>
      </div>
      <ul class="details-meta-list">
        <li><i class="bi bi-building"></i><strong>Publisher:</strong> <span>${BooklyUI.escapeHtml(book.publisher)}</span></li>
        <li><i class="bi bi-calendar3"></i><strong>Publish Date:</strong> <span>${BooklyUI.escapeHtml(String(book.publishedDate))}</span></li>
        <li><i class="bi bi-file-earmark-text"></i><strong>Pages:</strong> <span>${BooklyUI.escapeHtml(String(book.pageCount))}</span></li>
        <li><i class="bi bi-translate"></i><strong>Language:</strong> <span>${BooklyUI.escapeHtml(book.language)}</span></li>
        <li><i class="bi bi-upc-scan"></i><strong>ISBN:</strong> <span>${BooklyUI.escapeHtml(book.isbn)}</span></li>
        <li><i class="bi bi-tags"></i><strong>Categories:</strong> <span>${BooklyUI.escapeHtml(categories)}</span></li>
      </ul>
    </div>
  </div>

  <hr class="my-4">

  <div class="row">
    <div class="col-lg-9">
      <h4 class="section-title mb-3">About the Book</h4>
      <p class="text-body" id="bookDescription">${BooklyUI.escapeHtml(truncate(book.description, 320))}</p>
      ${book.description && book.description.length > 320 ? `<button class="btn btn-link-pink px-0" id="readMoreBtn">Read More</button>` : ""}
    </div>
  </div>

  <hr class="my-4" id="reviewsSection">

  <div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="section-title mb-0">Reviews (${DEMO_REVIEWS.length + Math.floor((book.ratingsCount || 1200) / 10)})</h4>
    <a href="#" class="view-all-link">View All &rarr;</a>
  </div>
  <div id="reviewsList">
    ${DEMO_REVIEWS.map(
      (r) => `
      <div class="review-card">
        <div class="d-flex justify-content-between">
          <div class="d-flex gap-2">
            <img src="${r.avatar}" class="review-avatar" alt="${BooklyUI.escapeHtml(r.name)}">
            <div>
              <div class="fw-semibold">${BooklyUI.escapeHtml(r.name)}</div>
              <div class="review-stars"><i class="bi bi-star-fill"></i> ${r.rating.toFixed(1)}</div>
            </div>
          </div>
          <span class="text-muted small">${r.date}</span>
        </div>
        <p class="text-body mt-2 mb-0">${BooklyUI.escapeHtml(r.text)}</p>
      </div>`
    ).join("")}
  </div>`;

  container.innerHTML = html;

  const readMoreBtn = document.getElementById("readMoreBtn");
  if (readMoreBtn) {
    readMoreBtn.addEventListener("click", () => {
      document.getElementById("bookDescription").textContent = book.description;
      readMoreBtn.remove();
    });
  }

  const favBtn = document.getElementById("favToggleBtn");
  if (favBtn) {
    favBtn.addEventListener("click", () => {
      const nowFav = BooklyFavorites.toggle(book.id, book);
      favBtn.innerHTML = `<i class="bi ${nowFav ? "bi-heart-fill" : "bi-heart"}"></i> ${nowFav ? "In Favorites" : "Add to Favorites"}`;
      BooklyUI.showToast(nowFav ? "Added to Favorites" : "Removed from Favorites");
      document.dispatchEvent(new CustomEvent("bookly:favorites-changed"));
    });
  }
}

function truncate(text, len) {
  if (!text || text.length <= len) return text || "";
  return text.slice(0, len).trim() + "…";
}
