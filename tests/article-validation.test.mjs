import test from "node:test";
import assert from "node:assert/strict";
import { isArticleId, validateArticle } from "../lib/article-validation.mjs";

const draft = {
  title: "A new AvenBrief article",
  slug: "a-new-article",
  summary: "",
  body: "",
  category: "World",
  author_name: "",
  source_url: "",
  intent: "draft",
};

const published = {
  ...draft,
  summary: "An original article with useful context for readers.",
  body: "This original article contains enough text to publish and helps readers understand the topic.",
  author_name: "Test editor",
  intent: "publish",
};

test("incomplete content can be saved privately as a draft", () => {
  const result = validateArticle(draft);
  assert.equal(result.ok, true);
  assert.equal(result.value.intent, "draft");
});

test("complete content can be published", () => {
  assert.equal(validateArticle(published).ok, true);
});

for (const field of ["summary", "body", "author_name"]) {
  test("publishing requires " + field, () => {
    assert.equal(validateArticle({ ...published, [field]: "" }).ok, false);
  });
}

test("invalid and missing publish intents are rejected", () => {
  for (const intent of ["delete", "published", "", undefined]) {
    assert.equal(validateArticle({ ...published, intent }).ok, false);
  }
});

test("URL names are lowercase words separated by single hyphens", () => {
  for (const slug of ["../admin", "Title Here", "-start", "end-", "two--hyphens", "a".repeat(101)]) {
    assert.equal(validateArticle({ ...draft, slug }).ok, false);
  }
});

test("sample article URL names cannot be reused", () => {
  assert.equal(validateArticle(draft, [draft.slug]).ok, false);
});

test("unknown categories and non-text input are rejected", () => {
  assert.equal(validateArticle({ ...draft, category: "Other" }).ok, false);
  assert.equal(validateArticle({ ...draft, title: { name: "upload" } }).ok, false);
});

test("dangerous, invalid and credential-bearing source URLs are rejected", () => {
  for (const source_url of [
    "javascript:alert(1)", "data:text/html,test", "file:///secret",
    "not a URL", "https://user:password@example.com/story",
  ]) {
    assert.equal(validateArticle({ ...draft, source_url }).ok, false);
  }
});

test("ordinary source links are accepted and an empty source becomes null", () => {
  const result = validateArticle({ ...published, source_url: "https://example.com/story" });
  assert.equal(result.ok, true);
  assert.equal(result.value.source_url, "https://example.com/story");
  assert.equal(validateArticle(draft).value.source_url, null);
});

test("text is trimmed and Windows line endings are normalized", () => {
  const result = validateArticle({ ...draft, title: "  A title  ", body: " One\r\n\r\nTwo " });
  assert.equal(result.ok, true);
  assert.equal(result.value.title, "A title");
  assert.equal(result.value.body, "One\n\nTwo");
});

test("field size limits are enforced on the server", () => {
  for (const [field, length] of [
    ["title", 181], ["summary", 321], ["body", 100001], ["author_name", 101],
  ]) {
    assert.equal(validateArticle({ ...draft, [field]: "x".repeat(length) }).ok, false);
  }
});

test("article IDs must be UUIDs", () => {
  assert.equal(isArticleId("123e4567-e89b-12d3-a456-426614174000"), true);
  for (const value of ["", "../admin", "not-an-id", undefined, 42]) {
    assert.equal(isArticleId(value), false);
  }
});
