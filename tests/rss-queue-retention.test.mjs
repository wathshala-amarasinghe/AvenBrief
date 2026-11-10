import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findQueueRetentionCandidates } from "../lib/rss-queue-retention.mjs";

const story = (overrides = {}) => ({
  id: crypto.randomUUID(),
  source_url: `https://example.com/${crypto.randomUUID()}`,
  source_published_at: "2026-11-09T00:00:00Z",
  imported_at: "2026-11-09T01:00:00Z",
  ...overrides,
});

test("queue retention archives used sources and stories older than fourteen days", () => {
  const result = findQueueRetentionCandidates({
    stories: [
      story({ id: "used", source_url: "https://example.com/used/?utm_source=rss" }),
      story({ id: "stale", source_published_at: "2026-10-20T00:00:00Z" }),
      story({ id: "fresh" }),
    ],
    existingArticleUrls: ["https://example.com/used"],
    now: "2026-11-10T12:00:00Z",
  });

  assert.deepEqual(result, [
    { id: "used", reason: "source_already_used" },
    { id: "stale", reason: "stale" },
  ]);
});

test("queue retention uses import time when the publisher date is missing", () => {
  const result = findQueueRetentionCandidates({
    stories: [
      story({ id: "old-undated", source_published_at: null, imported_at: "2026-10-20T00:00:00Z" }),
      story({ id: "fresh-undated", source_published_at: null, imported_at: "2026-11-10T00:00:00Z" }),
    ],
    now: "2026-11-10T12:00:00Z",
  });

  assert.deepEqual(result, [{ id: "old-undated", reason: "stale" }]);
});

test("scheduled ingest runs queue retention before private drafting", async () => {
  const route = await readFile(new URL("../app/api/news/ingest/route.ts", import.meta.url), "utf8");
  const maintenanceCall = route.indexOf("runQueueRetention(summary.runId)");
  const draftingCall = route.indexOf("runScheduledAiDrafts(summary.importedItemIds, summary.runId)");
  assert.ok(maintenanceCall > 0);
  assert.ok(draftingCall > maintenanceCall);
});

test("queue-retention migration records a non-negative archived count", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20261110000600_queue_retention_monitoring.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /queue_items_archived integer not null default 0/i);
  assert.match(migration, /check \(queue_items_archived >= 0\)/i);
});

