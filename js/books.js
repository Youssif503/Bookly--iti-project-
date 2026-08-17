/* ==========================================================================
   Bookly — books.js
   Powers books.html (All Books) and search.html (Search Results).
   Both pages share the same grid / filter / sort / pagination pattern.
   ========================================================================== */

const BooklyBooksPage = (() => {
  const PAGE_SIZE = 12;
  let state = {
    query: "",
    category: "All Categories",
    sort: "relevance",
    page: 1,
    totalItems: 0,
    mode: "books", // "books" | "search"
  };

  function getUrlParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  async function renderCategoryFilter(listEl) {
    const categoryResult = await BooklyAPI.getCategories();
    const categories = categoryResult.categories || [];
    const items = [`<li><a href="#" class="cat-filter-link ${state.category === "All Categories" ? "active" : ""}" data-cat="All Categories">All Categories <span class="count"></span></a></li>`]
      .concat(
        categories.map(
          (c) =>
            `<li><a href="#" class="cat-filter-link ${state.category === c.name ? "active" : ""}" data-cat="${c.name}">${c.name} <span class="count">(${c.count})</span></a></li>`
        )
      );
    listEl.innerHTML = items.join("");
    listEl.querySelectorAll(".cat-filter-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        state.category = link.dataset.cat;
        state.page = 1;
        listEl.querySelectorAll(".cat-filter-link").forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        loadResults();
      });
    });
  }

  async function loadResults() {
    const grid = document.getElementById("booksGrid");
    const resultsInfo = document.getElementById("resultsInfo");
    const paginationEl = document.getElementById("booksPagination");
    if (!grid) return;

    grid.innerHTML = BooklyUI.loadingState();
    if (paginationEl) paginationEl.innerHTML = "";

    const startIndex = (state.page - 1) * PAGE_SIZE;
    const result = await BooklyAPI.searchBooks(state.query, {
      category: state.category,
      maxResults: PAGE_SIZE,
      startIndex,
      sort: state.sort,
    });

    let books = result.books || [];
    if (state.sort === "rating") books = [...books].sort((a, b) => b.rating - a.rating);
    if (state.sort === "az") books = [...books].sort((a, b) => a.title.localeCompare(b.title));
    if (state.sort === "za") books = [...books].sort((a, b) => b.title.localeCompare(a.title));

    state.totalItems = Math.min(result.totalItems || books.length, 2000);

    let html = "";
    if (!result.ok) html += BooklyUI.errorState();

    if (books.length === 0) {
      html += BooklyUI.emptyState({
        title: state.mode === "search" ? `No results for "${state.query}"` : "No books found",
        desc: "Try a different search term or clear your filters.",
      });
      grid.innerHTML = html;
      updateResultsInfo(resultsInfo, 0);
      return;
    }

    html += `<div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3" id="booksRow"></div>`;
    grid.innerHTML = html;
    document.getElementById("booksRow").innerHTML = books.map((b) => BooklyUI.bookCard(b, { showViewDetails: true })).join("");

    updateResultsInfo(resultsInfo, books.length);
    renderPagination(paginationEl);
  }

  function updateResultsInfo(el, shownCount) {
    if (!el) return;
    const start = (state.page - 1) * PAGE_SIZE + 1;
    const end = start + shownCount - 1;
    if (state.mode === "search") {
      el.textContent = shownCount > 0 ? `Showing ${start}-${end} of ${state.totalItems} results for "${state.query}"` : `Showing 0 results for "${state.query}"`;
    } else {
      el.textContent = shownCount > 0 ? `Showing ${start}-${end} of ${state.totalItems} results` : "Showing 0 results";
    }
  }

  function renderPagination(el) {
    if (!el) return;
    const totalPages = Math.max(1, Math.min(Math.ceil(state.totalItems / PAGE_SIZE), 40));
    if (totalPages <= 1) {
      el.innerHTML = "";
      return;
    }
    const current = state.page;
    let pages = [];
    const windowSize = 2;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= current - windowSize && p <= current + windowSize)) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    const itemHtml = (p) => {
      if (p === "...") return `<li class="page-item disabled"><span class="page-link">…</span></li>`;
      return `<li class="page-item ${p === current ? "active" : ""}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
    };

    el.innerHTML = `
      <li class="page-item ${current === 1 ? "disabled" : ""}"><a class="page-link" href="#" data-page="${current - 1}"><i class="bi bi-chevron-left"></i></a></li>
      ${pages.map(itemHtml).join("")}
      <li class="page-item ${current === totalPages ? "disabled" : ""}"><a class="page-link" href="#" data-page="${current + 1}"><i class="bi bi-chevron-right"></i></a></li>
    `;

    el.querySelectorAll("a.page-link[data-page]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const p = parseInt(link.dataset.page, 10);
        if (isNaN(p) || p < 1 || p > totalPages || p === state.page) return;
        state.page = p;
        loadResults();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function initSearchBox(inputId, formId) {
    const form = document.getElementById(formId);
    const input = document.getElementById(inputId);
    if (!form || !input) return;
    input.value = state.query;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      state.query = input.value.trim();
      state.page = 1;
      loadResults();
      const info = document.getElementById("searchHeading");
      if (info && state.mode === "search") info.textContent = state.query ? `Search Results for "${state.query}"` : "Search Results";
    });
  }

  function initSortControls() {
    document.querySelectorAll('input[name="sortOption"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          state.sort = radio.value;
          state.page = 1;
          loadResults();
        }
      });
    });
  }

  function initBooksPage() {
    state.mode = "books";
    const authorParam = getUrlParam("author");
    if (authorParam) state.query = authorParam;
    const catList = document.getElementById("categoryFilterList");
    if (catList) renderCategoryFilter(catList);
    initSearchBox("booksSearchInput", "booksSearchForm");
    initSortControls();
    loadResults();
  }

  function initSearchPage() {
    state.mode = "search";
    state.query = getUrlParam("q") || "";
    const heading = document.getElementById("searchHeading");
    if (heading) heading.textContent = state.query ? `Search Results for "${state.query}"` : "Search Results";
    const catList = document.getElementById("categoryFilterList");
    if (catList) renderCategoryFilter(catList);
    initSearchBox("searchPageInput", "searchPageForm");
    loadResults();
  }

  return { initBooksPage, initSearchPage };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "books") BooklyBooksPage.initBooksPage();
  if (document.body.dataset.page === "search") BooklyBooksPage.initSearchPage();
});
