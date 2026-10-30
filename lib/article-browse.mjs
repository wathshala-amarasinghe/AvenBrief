export const ARTICLE_PAGE_SIZE = 12;
// Selecting the row keeps reads backwards-compatible while additive migrations
// roll out; ArticlePreview exposes only the public fields used by the UI.
const previewFields = "*";

/** @param {unknown} value @returns {string} */
export function normaliseQuery(value) {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return "";
  return first.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

/** @param {unknown} value @returns {number} */
export function normalisePage(value) {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string" && typeof first !== "number") return 1;
  const text = String(first);
  if (!/^[0-9]{1,6}$/.test(text)) return 1;
  return Math.max(1, Number(text));
}

/**
 * Quote each value using PostgREST's quoted-value grammar. User punctuation must
 * stay inside a value and must never become another logical filter.
 * @param {string} query
 * @returns {string}
 */
export function buildSearchFilter(query) {
  const term = normaliseQuery(query);
  if (!term) return "";
  const pattern = "%" + term.replace(/[\\%_]/g, "\\$&") + "%";
  const quoted = JSON.stringify(pattern);
  return ["title", "summary", "category"]
    .map((column) => column + ".ilike." + quoted)
    .join(",");
}

/**
 * @typedef {{query?: string, category?: string, page?: number}} BrowseOptions
 * @param {import("@supabase/supabase-js").SupabaseClient} client
 * @param {BrowseOptions} options
 */
export function createPublishedArticleQuery(client, options = {}) {
  const page = normalisePage(options.page);
  const start = (page - 1) * ARTICLE_PAGE_SIZE;
  let request = client
    .from("articles")
    .select(previewFields, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .range(start, start + ARTICLE_PAGE_SIZE - 1);

  if (options.category) request = request.eq("category", options.category);
  const filter = buildSearchFilter(options.query ?? "");
  if (filter) request = request.or(filter);
  return request;
}

/** @param {string} path @param {string} query @param {number} page */
export function articlePageHref(path, query, page) {
  const params = new URLSearchParams();
  const term = normaliseQuery(query);
  if (term) params.set("q", term);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return path + (suffix ? "?" + suffix : "");
}
