import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseScheduledDraftLimit } from "../lib/scheduled-ai-draft-validation.mjs";
import {
  buildScheduledAttemptQueue,
  rankScheduledStories,
  scheduledDraftCooldownCutoff,
} from "../lib/scheduled-story-selection.mjs";

const ingestRoute = await readFile(new URL("../app/api/news/ingest/route.ts", import.meta.url), "utf8");

test("scheduled AI drafting accepts only the supported per-run limits", () => {
  assert.equal(parseScheduledDraftLimit("1"), 1);
  assert.equal(parseScheduledDraftLimit(3), 3);
  assert.equal(parseScheduledDraftLimit("0"), null);
  assert.equal(parseScheduledDraftLimit("4"), null);
  assert.equal(parseScheduledDraftLimit("1.5"), null);
  assert.equal(parseScheduledDraftLimit("not-a-number"), null);
});

test("scheduled ingestion passes new story IDs as drafting priorities", () => {
  assert.match(ingestRoute, /runScheduledAiDrafts\(summary\.importedItemIds, summary\.runId\)/);
  assert.match(ingestRoute, /const summary = await runRssImport\("scheduled"\)/);
});

const story = (overrides = {}) => ({
  id: crypto.randomUUID(),
  title: "A consequential story with broad public interest",
  source_name: "Global Voices",
  source_url: `https://example.com/${crypto.randomUUID()}`,
  source_published_at: "2026-11-10T08:00:00Z",
  ...overrides,
});

test("scheduled selection prefers authoritative reporting over feed order", () => {
  const polygon = story({ id: "polygon", source_name: "Polygon", title: "Recent entertainment report" });
  const un = story({
    id: "un",
    source_name: "UN News",
    title: "Climate crisis could push millions into extreme poverty",
    source_published_at: "2026-11-09T12:00:00Z",
  });

  const result = rankScheduledStories({
    stories: [polygon, un],
    limit: 1,
    now: "2026-11-10T12:00:00Z",
  });

  assert.deepEqual(result.selectedIds, ["un"]);
});

test("new imports rank before backlog stories", () => {
  const result = rankScheduledStories({
    stories: [
      story({ id: "backlog", source_name: "UN News", title: "High authority backlog story" }),
      story({ id: "new", source_name: "Polygon", title: "Newly imported story" }),
    ],
    preferredIds: ["new"],
    limit: 2,
    now: "2026-11-10T12:00:00Z",
  });

  assert.deepEqual(result.selectedIds, ["new", "backlog"]);
});

test("scheduled selection rejects stale, duplicate, promotional, routine, and rumor items", () => {
  const duplicateUrl = "https://example.com/already-used/";
  const result = rankScheduledStories({
    stories: [
      story({ id: "stale", source_published_at: "2026-10-20T00:00:00Z" }),
      story({ id: "duplicate", source_url: duplicateUrl }),
      story({ id: "promo", source_name: "Xbox Wire", title: "Out Now With These Tips" }),
      story({ id: "routine", source_name: "Federal Reserve Press Releases", title: "Federal Reserve Board announces approval of application by Example Bank" }),
      story({ id: "rumor", source_name: "TechCrunch", title: "An alleged honeypot scandal inspires memes" }),
      story({ id: "eligible", source_name: "Carbon Brief" }),
    ],
    existingArticleUrls: ["https://example.com/already-used"],
    limit: 3,
    now: "2026-11-10T12:00:00Z",
  });

  assert.deepEqual(result.selectedIds, ["eligible"]);
  assert.deepEqual(
    Object.fromEntries(result.rejected.map(({ id, reason }) => [id, reason])),
    {
      stale: "stale",
      duplicate: "source_already_used",
      promo: "promotional_or_guide",
      routine: "routine_notice",
      rumor: "rumor_or_meme",
    },
  );
});

test("scheduled selection is deterministic and enforces the per-run cap", () => {
  const stories = [
    story({ id: "b", title: "Beta story", source_name: "MIT News — Artificial Intelligence" }),
    story({ id: "a", title: "Alpha story", source_name: "MIT News — Artificial Intelligence" }),
    story({ id: "c", title: "Charlie story", source_name: "MIT News — Artificial Intelligence" }),
    story({ id: "d", title: "Delta story", source_name: "MIT News — Artificial Intelligence" }),
  ];

  const result = rankScheduledStories({ stories, limit: 99, now: "2026-11-10T12:00:00Z" });
  assert.deepEqual(result.selectedIds, ["a", "b", "c"]);
});

test("scheduled drafting keeps a bounded fallback queue", () => {
  const ranked = Array.from({ length: 8 }, (_, index) => ({
    id: `story-${index + 1}`,
    score: 100 - index,
  }));

  assert.deepEqual(buildScheduledAttemptQueue(ranked, 1), ["story-1", "story-2", "story-3"]);
  assert.deepEqual(buildScheduledAttemptQueue(ranked, 2), ["story-1", "story-2", "story-3", "story-4"]);
  assert.deepEqual(buildScheduledAttemptQueue(ranked, 3), ["story-1", "story-2", "story-3", "story-4", "story-5"]);
});

test("scheduled failure cooldown lasts twenty-four hours", () => {
  assert.equal(
    scheduledDraftCooldownCutoff("2026-11-11T12:00:00Z"),
    "2026-11-10T12:00:00.000Z",
  );
});

test("scheduled drafting retries candidates but stops at its success and provider limits", async () => {
  const workflow = await readFile(new URL("../lib/scheduled-ai-drafts.ts", import.meta.url), "utf8");

  assert.match(workflow, /if \(summary\.created >= limit\) break/);
  assert.match(workflow, /summary\.attempted \+= 1/);
  assert.match(workflow, /ai_quota_exhausted/);
  assert.match(workflow, /ai_not_configured/);
  assert.match(workflow, /\.eq\("status", "new"\)/);
  assert.doesNotMatch(workflow, /if \(!importedItemIds\.length\)/);
  assert.match(workflow, /scheduledDraftCooldownCutoff/);
});
