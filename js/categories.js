/* ==========================================================================
   Bookly — categories.js
   Powers categories.html: full category grid + books-by-category view.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;

  const selectedCat = new URLSearchParams(window.location.search).get("cat");

  renderCategoryGrid(grid, selectedCat);

  if (selectedCat) {
    showCategoryBooks(selectedCat);
  }
});

async function renderCategoryGrid(grid, selectedCat) {
  const categoryResult = await BooklyAPI.getCategories();
  const categories = categoryResult.categories || [];
  grid.innerHTML = categories
    .map(
      (c) => `
    <div class="col-6 col-md-4 col-lg-2">
      <a href="categories.html?cat=${encodeURIComponent(c.name)}" class="category-tile ${selectedCat === c.name ? "border-2" : ""}" style="${selectedCat === c.name ? "border-color:var(--pink-500)" : ""}">
        <div class="category-icon"><i class="bi ${c.icon}"></i></div>
        <div class="cat-name">${c.name}</div>
        <div class="cat-count">${c.count.toLocaleString()} Books</div>
      </a>
    </div>`
    )
    .join("");
}

async function showCategoryBooks(category) {
  const section = document.getElementById("categoryBooksSection");
  const heading = document.getElementById("categoryBooksHeading");
  const grid = document.getElementById("categoryBooksGrid");
  if (!section || !grid) return;

  section.classList.remove("d-none");
  heading.textContent = `Books in "${category}"`;
  grid.innerHTML = BooklyUI.loadingState();

  const result = await BooklyAPI.getBooksByCategory(category, { maxResults: 8 });
  const books = result.books || [];

  let html = "";
  if (!result.ok) html += BooklyUI.errorState();

  if (books.length === 0) {
    html += BooklyUI.emptyState({ title: `No books found in ${category}` });
    grid.innerHTML = html;
    return;
  }

  html += `<div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3" id="categoryBooksRow"></div>`;
  grid.innerHTML = html;
  document.getElementById("categoryBooksRow").innerHTML = books.map((b) => BooklyUI.bookCard(b, { showViewDetails: true })).join("");
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}
