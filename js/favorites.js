/* ==========================================================================
   Bookly — favorites.js
   Handles the Favorites LocalStorage store, and renders favorites.html
   ========================================================================== */

const BooklyFavorites = (() => {
  const KEY = "bookly_favorites";

  function getAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function isFavorite(bookId) {
    return getAll().some((b) => b.id === bookId);
  }

  function add(book) {
    const list = getAll();
    if (!list.some((b) => b.id === book.id)) {
      list.unshift(book);
      saveAll(list);
    }
  }

  function remove(bookId) {
    const list = getAll().filter((b) => b.id !== bookId);
    saveAll(list);
  }

  // Toggles favorite state for a book id. Requires a book object to be
  // available (cards keep a small cache) so we can store full details.
  function toggle(bookId, bookData = null) {
    if (isFavorite(bookId)) {
      remove(bookId);
      return false;
    }
    const book = bookData || BooklyFavorites._cache[bookId];
    if (book) add(book);
    return true;
  }

  // Small in-memory cache so toggle() can find book data even when only
  // an id is available at click time (e.g. from a card's onclick).
  const _cache = {};
  function cacheBook(book) {
    _cache[book.id] = book;
  }

  return { getAll, isFavorite, add, remove, toggle, cacheBook, _cache };
})();

// ---- favorites.html page logic -------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("favoritesGrid");
  const countLabel = document.getElementById("favoritesCount");
  if (!grid) return;

  function render() {
    const favs = BooklyFavorites.getAll();
    favs.forEach((b) => BooklyFavorites.cacheBook(b));
    if (countLabel) countLabel.textContent = `Books you have saved (${favs.length})`;

    if (favs.length === 0) {
      grid.className = "";
      grid.innerHTML = `
        ${BooklyUI.emptyState({
          icon: "bi-heart",
          title: "No favorites yet",
          desc: "Tap the heart icon on any book to save it here for later.",
        })}
        <div class="text-center"><a href="books.html" class="btn btn-pink">Browse Books</a></div>`;
      return;
    }

    grid.className = "row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3";
    grid.innerHTML = favs.map((b) => BooklyUI.bookCard(b)).join("");
  }

  render();
  document.addEventListener("bookly:favorites-changed", render);
});
