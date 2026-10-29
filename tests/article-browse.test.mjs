import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  ARTICLE_PAGE_SIZE, normaliseQuery, normalisePage, buildSearchFilter,
  createPublishedArticleQuery, articlePageHref,
} from "../lib/article-browse.mjs";

test("search input handles repeated parameters, controls and length limits", () => {
  assert.equal(normaliseQuery(["  Artificial\n intelligence  ", "ignored"]), "Artificial intelligence");
  assert.equal(normaliseQuery(null), "");
  assert.equal(normaliseQuery("a".repeat(200)).length, 120);
});

test("invalid page input cannot create negative or non-finite database ranges", () => {
  for (const value of ["-1", "0", "NaN", "1e3", "2.5", "9999999999999", undefined, {}]) {
    assert.equal(normalisePage(value), 1);
  }
  assert.equal(normalisePage(["3", "4"]), 3);
  assert.equal(normalisePage(2), 2);
});

test("empty searches do not add a logical filter", () => {
  assert.equal(buildSearchFilter("   "), "");
});

function splitQuotedFilters(expression) {
  const parts = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < expression.length; index++) {
    const character = expression[index];
    if (escaped) { escaped = false; continue; }
    if (quoted && character === "\\") { escaped = true; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) {
      parts.push(expression.slice(start, index));
      start = index + 1;
    }
  }
  assert.equal(quoted, false, "every quoted filter must close");
  parts.push(expression.slice(start));
  return parts;
}

test("punctuation and attempted logical filters remain inside exactly three search values", () => {
  for (const input of [
    'AI, cities (2026)',
    'a"),status.eq.draft,summary.ilike.("*',
    'a\\",or(status.eq.draft)',
    'He said "news" in C:\\reports',
    "ශ්‍රී ලංකාව",
  ]) {
    const parts = splitQuotedFilters(buildSearchFilter(input));
    assert.equal(parts.length, 3);
    ["title", "summary", "category"].forEach((column, index) => {
      const prefix = column + ".ilike.";
      assert.ok(parts[index].startsWith(prefix));
      const value = JSON.parse(parts[index].slice(prefix.length));
      assert.ok(value.startsWith("%") && value.endsWith("%"));
    });
  }
});

test("percent and underscore are escaped as literal search text", () => {
  const first = splitQuotedFilters(buildSearchFilter("50%_growth"))[0];
  assert.equal(JSON.parse(first.slice("title.ilike.".length)), "%50\\%\\_growth%");
});

test("pagination links retain and encode a search query", () => {
  const query = 'AI & climate "news"';
  const url = new URL(articlePageHref("/search", query, 2), "https://example.com");
  assert.equal(url.pathname, "/search");
  assert.equal(url.searchParams.get("q"), query);
  assert.equal(url.searchParams.get("page"), "2");
  const first = new URL(articlePageHref("/search", query, 1), "https://example.com");
  assert.equal(first.searchParams.has("page"), false);
  assert.equal(articlePageHref("/category/technology", "", 1), "/category/technology");
});

function captureClient() {
  const requests = [];
  const client = createClient("https://example.supabase.co", "test-publishable-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        requests.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
        return new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json", "Content-Range": "*/0" },
        });
      },
    },
  });
  return { client, requests };
}

test("the real Supabase SDK sends category, published-only and pagination filters together", async () => {
  const { client, requests } = captureClient();
  const response = await createPublishedArticleQuery(client, { category: "Technology", page: 2 });
  assert.equal(response.error, null);
  assert.equal(response.count, 0);
  const { url, headers } = requests[0];
  assert.equal(url.searchParams.get("status"), "eq.published");
  assert.equal(url.searchParams.get("category"), "eq.Technology");
  assert.equal(url.searchParams.get("offset"), String(ARTICLE_PAGE_SIZE));
  assert.equal(url.searchParams.get("limit"), String(ARTICLE_PAGE_SIZE));
  assert.equal(url.searchParams.get("order"), "published_at.desc,id.desc");
  assert.ok(headers.get("Prefer").includes("count=exact"));
  assert.ok(!url.searchParams.get("select").split(",").includes("body"));
});

test("searching cannot replace the independent published-only filter", async () => {
  const { client, requests } = captureClient();
  const query = 'x"),status.eq.draft,or(title.ilike.("*';
  await createPublishedArticleQuery(client, { query });
  const { url } = requests[0];
  assert.equal(url.searchParams.get("status"), "eq.published");
  assert.deepEqual(url.searchParams.getAll("status"), ["eq.published"]);
  assert.equal(url.searchParams.get("or"), "(" + buildSearchFilter(query) + ")");
  assert.equal(url.searchParams.get("offset"), "0");
});
