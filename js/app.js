/* ==========================================================================
   Bookly — app.js
   Home page (index.html) logic: hero search, featured books,
   browse categories, stats bar.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const heroForm = document.getElementById("heroSearchForm");
  if (heroForm) {
    heroForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = document.getElementById("heroSearchInput").value.trim();
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    });
  }

  const featuredGrid = document.getElementById("featuredBooksGrid");
  if (featuredGrid) loadFeaturedBooks(featuredGrid);

  const categoriesGrid = document.getElementById("homeCategoriesGrid");
  if (categoriesGrid) loadCategories(categoriesGrid);
});

async function loadFeaturedBooks(grid) {
  grid.innerHTML = BooklyUI.loadingState("Loading featured books...");
  const result = await BooklyAPI.getFeaturedBooks(5);
  const books = result.books || [];

  if (books.length === 0) {
    grid.innerHTML = BooklyUI.emptyState({ title: "No featured books available right now." });
    return;
  }

  let html = "";
  if (!result.ok) html += BooklyUI.errorState();
  html += `<div class="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3" id="featuredRow"></div>`;
  grid.innerHTML = html;
  document.getElementById("featuredRow").innerHTML = books.map((b) => BooklyUI.bookCard(b)).join("");
}

async function loadCategories(grid) {
  const categoryResult = await BooklyAPI.getCategories();
  const categories = categoryResult.categories || [];
  grid.innerHTML = categories
    .slice(0, 6)
    .map(
      (c) => `
    <div class="col-6 col-md-4 col-lg-2">
      <a href="categories.html?cat=${encodeURIComponent(c.name)}" class="category-tile">
        <div class="category-icon"><i class="bi ${c.icon}"></i></div>
        <div class="cat-name">${c.name}</div>
        <div class="cat-count">${c.count.toLocaleString()} Books</div>
      </a>
    </div>`
    )
    .join("");
}
