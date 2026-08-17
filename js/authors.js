/* ==========================================================================
   Bookly — authors.js
   Powers authors.html. Google Books has no "list authors" endpoint, so
   Bookly keeps a curated author roster and looks up each author's books
   from the API on demand (View Books).
   ========================================================================== */

const BOOKLY_AUTHORS = [
  { name: "Colleen Hoover", books: 18, avatar: "https://i.pravatar.cc/150?img=47" },
  { name: "Paulo Coelho", books: 32, avatar: "https://i.pravatar.cc/150?img=13" },
  { name: "James Clear", books: 3, avatar: "https://i.pravatar.cc/150?img=68" },
  { name: "Matt Haig", books: 6, avatar: "https://i.pravatar.cc/150?img=14" },
  { name: "Kristin Hannah", books: 12, avatar: "https://i.pravatar.cc/150?img=44" },
  { name: "Delia Owens", books: 2, avatar: "https://i.pravatar.cc/150?img=45" },
  { name: "Tara Westover", books: 1, avatar: "https://i.pravatar.cc/150?img=48" },
  { name: "Alex Michaelides", books: 2, avatar: "https://i.pravatar.cc/150?img=15" },
  { name: "J.K. Rowling", books: 14, avatar: "https://i.pravatar.cc/150?img=49" },
  { name: "Taylor Jenkins Reid", books: 9, avatar: "https://i.pravatar.cc/150?img=25" },
  { name: "Brené Brown", books: 7, avatar: "https://i.pravatar.cc/150?img=26" },
  { name: "Yuval Noah Harari", books: 4, avatar: "https://i.pravatar.cc/150?img=59" },
];

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("authorsGrid");
  if (!grid) return;

  renderAuthors(BOOKLY_AUTHORS, grid);

  const searchForm = document.getElementById("authorsSearchForm");
  const searchInput = document.getElementById("authorsSearchInput");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = searchInput.value.trim().toLowerCase();
      const filtered = BOOKLY_AUTHORS.filter((a) => a.name.toLowerCase().includes(q));
      renderAuthors(filtered, grid);
    });
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = BOOKLY_AUTHORS.filter((a) => a.name.toLowerCase().includes(q));
      renderAuthors(filtered, grid);
    });
  }
});

function renderAuthors(authors, grid) {
  if (authors.length === 0) {
    grid.innerHTML = BooklyUI.emptyState({ icon: "bi-person-x", title: "No authors found", desc: "Try a different name." });
    return;
  }
  grid.innerHTML = authors
    .map(
      (a) => `
    <div class="col-md-6 col-lg-3">
      <div class="author-card">
        <img src="${a.avatar}" alt="${BooklyUI.escapeHtml(a.name)}" class="author-avatar">
        <div class="flex-grow-1">
          <div class="author-name">${BooklyUI.escapeHtml(a.name)}</div>
          <div class="author-count">${a.books} Books</div>
        </div>
        <a href="books.html?author=${encodeURIComponent(a.name)}" class="btn btn-pink-outline btn-sm">View</a>
      </div>
    </div>`
    )
    .join("");
}
