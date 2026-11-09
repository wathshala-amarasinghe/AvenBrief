import test from "node:test";
import assert from "node:assert/strict";
import { buildEditorialAnalytics } from "../lib/editorial-analytics.mjs";

const now = new Date("2026-11-09T12:00:00Z");
const articles = [
  { id: "a1", status: "published", category: "World", published_at: "2026-11-09T08:00:00Z" },
  { id: "a2", status: "published", category: "Climate", published_at: "2026-11-08T08:00:00Z" },
  { id: "a3", status: "draft", category: "Finance", published_at: null },
];
const inbox = [
  { id: "i1", status: "reviewed", source_name: "Publisher A", article_id: "a1", source_published_at: "2026-11-09", imported_at: "2026-11-09", suggested_category: "World" },
  { id: "i2", status: "new", source_name: "Publisher A", article_id: null, source_published_at: "2026-11-01", imported_at: "2026-11-02", suggested_category: "World" },
  { id: "i3", status: "archived", source_name: "Publisher B", article_id: null, source_published_at: null, imported_at: "2026-11-07", suggested_category: "Climate" },
];

test("editorial analytics calculates workflow and publishing totals", () => {
  const result = buildEditorialAnalytics({ articles, inbox, now });
  assert.deepEqual(result.summary, {
    publishedTotal: 2,
    publishedToday: 1,
    imported: 3,
    awaitingReview: 1,
    reviewed: 1,
    archived: 1,
    drafted: 1,
    publishedFromFeeds: 1,
  });
  assert.equal(result.daily.at(-1).published, 1);
  assert.equal(result.categories.find((row) => row.category === "Climate").published, 1);
});

test("source conversion and reliability remain separate metrics", () => {
  const result = buildEditorialAnalytics({
    articles,
    inbox,
    sources: [{ name: "Publisher A", default_category: "World", enabled: true, last_success_at: "2026-11-09", last_error: null }],
    sourceRuns: [
      { source_name: "Publisher A", status: "succeeded" },
      { source_name: "Publisher A", status: "failed" },
    ],
    now,
  });
  const source = result.sourceMetrics.find((row) => row.name === "Publisher A");
  assert.equal(source.conversionRate, 50);
  assert.equal(source.successRate, 50);
  assert.equal(source.health, "healthy");
});

test("oldest queue highlights stale stories first", () => {
  const result = buildEditorialAnalytics({ articles, inbox, now });
  assert.equal(result.oldestQueue[0].id, "i2");
  assert.equal(result.oldestQueue[0].ageDays, 8);
});
