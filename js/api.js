/* ===========================================================================
   Bookly — api.js
   =========================================================================== */

const BooklyAPI = (() => {
  const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
  const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
  const FEATURED_QUERY = "subject:fiction bestseller";
  let categoriesRequest = null;

  const CATEGORY_ICONS = {
    Fiction: "bi-book", Romance: "bi-heart", Mystery: "bi-search",
    Science: "bi-eyedropper", Biography: "bi-person-badge", Adventure: "bi-compass",
    History: "bi-bank", "Self Help": "bi-lightbulb", Business: "bi-briefcase",
    Poetry: "bi-feather", "Young Adult": "bi-people", Comics: "bi-emoji-laughing",
  };

  function mapVolumeToBook(item) {
    const info = item.volumeInfo || {};
    const sale = item.saleInfo || {};
    const imageLinks = info.imageLinks || {};
    return {
      id: item.id,
      title: info.title || "Untitled",
      authors: info.authors || ["Unknown Author"],
      rating: info.averageRating || (3.8 + (Math.abs(hashCode(item.id)) % 12) / 10),
      ratingsCount: info.ratingsCount || Math.abs(hashCode(item.id)) % 2000 + 20,
      category: (info.categories && info.categories[0]) || "Fiction",
      categories: info.categories || ["Fiction"],
      thumbnail: (imageLinks.thumbnail || imageLinks.smallThumbnail || "").replace("http://", "https://"),
      description: info.description || "No description available for this book yet.",
      publisher: info.publisher || "Unknown Publisher",
      publishedDate: info.publishedDate || "—",
      pageCount: info.pageCount || "—",
      language: (info.language || "en").toUpperCase(),
      isbn: (info.industryIdentifiers && info.industryIdentifiers[0] && info.industryIdentifiers[0].identifier) || "N/A",
      price: sale.listPrice ? `${sale.listPrice.amount} ${sale.listPrice.currencyCode}` : null,
    };
  }

  function hashCode(str) {
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  async function request(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`API responded with status ${response.status}`);
      return { data: await response.json(), ok: true };
    } catch (error) {
      console.warn("Bookly: Google Books API request failed.", error);
      return { data: null, ok: false, error };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function fetchVolumes(query, { maxResults = 12, startIndex = 0, orderBy = null } = {}) {
    const params = new URLSearchParams({ q: query, maxResults: String(maxResults), startIndex: String(startIndex) });
    if (orderBy) params.set("orderBy", orderBy);
    const result = await request(`${BASE_URL}?${params.toString()}`);
    if (!result.ok) return fetchOpenLibraryBooks(query, { maxResults, startIndex, error: result.error });
    const books = (result.data.items || []).map(mapVolumeToBook);
    return { books, totalItems: result.data.totalItems || books.length, ok: true };
  }

  function mapOpenLibraryBook(item) {
    const coverId = item.cover_i;
    return {
      id: `openlibrary:${item.key}`,
      title: item.title || "Untitled",
      authors: item.author_name || ["Unknown Author"],
      rating: item.ratings_average || (3.8 + (Math.abs(hashCode(item.key)) % 12) / 10),
      ratingsCount: item.ratings_count || Math.abs(hashCode(item.key)) % 2000 + 20,
      category: (item.subject && item.subject[0]) || "Fiction",
      categories: item.subject || ["Fiction"],
      thumbnail: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "",
      description: "No description available for this book yet.",
      publisher: (item.publisher && item.publisher[0]) || "Unknown Publisher",
      publishedDate: item.first_publish_year || "—",
      pageCount: item.number_of_pages_median || "—",
      language: (item.language && item.language[0] ? item.language[0] : "en").toUpperCase(),
      isbn: (item.isbn && item.isbn[0]) || "N/A",
      price: null,
    };
  }

  async function fetchOpenLibraryBooks(query, { maxResults, startIndex, error } = {}) {
    const normalizedQuery = query.replace(/subject:/gi, "");
    const params = new URLSearchParams({
      q: normalizedQuery,
      limit: String(maxResults),
      offset: String(startIndex),
      fields: "key,title,author_name,subject,cover_i,first_publish_year,edition_count,isbn,ratings_average,ratings_count,publisher,number_of_pages_median,language",
    });
    const result = await request(`${OPEN_LIBRARY_SEARCH_URL}?${params.toString()}`);
    if (!result.ok) return { books: [], totalItems: 0, ok: false, error: result.error || error };
    const books = (result.data.docs || []).map(mapOpenLibraryBook);
    return { books, totalItems: result.data.numFound || books.length, ok: true };
  }

  async function getFeaturedBooks(count = 5) {
    return fetchVolumes(FEATURED_QUERY, { maxResults: count });
  }

  async function searchBooks(query, { category = null, maxResults = 12, startIndex = 0, sort = "relevance" } = {}) {
    let q = query && query.trim() ? query.trim() : "bestseller books";
    if (category && category !== "All Categories") q += ` subject:${category}`;
    return fetchVolumes(q, { maxResults, startIndex, orderBy: sort === "newest" ? "newest" : null });
  }

  async function getBookById(id) {
    if (id.startsWith("openlibrary:")) {
      const key = id.slice("openlibrary:".length);
      const result = await request(`https://openlibrary.org${key}.json`);
      if (!result.ok) return { book: null, ok: false, error: result.error };
      return {
        book: mapOpenLibraryBook({
          ...result.data,
          key,
          author_name: result.data.authors && result.data.authors.map((author) => author.name).filter(Boolean),
          subject: result.data.subjects,
          cover_i: result.data.covers && result.data.covers[0],
          first_publish_year: result.data.first_publish_date,
        }),
        ok: true,
      };
    }
    const result = await request(`${BASE_URL}/${encodeURIComponent(id)}`);
    return result.ok ? { book: mapVolumeToBook(result.data), ok: true } : { book: null, ok: false, error: result.error };
  }

  async function getBooksByCategory(category, options = {}) {
    return searchBooks("", { ...options, category });
  }

  async function getCategories() {
    if (!categoriesRequest) {
      categoriesRequest = fetchVolumes("bestseller", { maxResults: 40 }).then((result) => {
        if (!result.ok) return { categories: [], ok: false, error: result.error };
        const counts = new Map();
        result.books.forEach((book) => (book.categories || []).forEach((name) => {
          const category = name.trim();
          if (category) counts.set(category, (counts.get(category) || 0) + 1);
        }));
        return {
          categories: [...counts.entries()]
            .map(([name, count]) => ({ name, count, icon: CATEGORY_ICONS[name] || "bi-book" }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
          ok: true,
        };
      });
    }
    return categoriesRequest;
  }

  return { getFeaturedBooks, searchBooks, getBookById, getBooksByCategory, getCategories };
})();
