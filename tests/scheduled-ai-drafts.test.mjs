import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseScheduledDraftLimit } from "../lib/scheduled-ai-draft-validation.mjs";

const ingestRoute = await readFile(new URL("../app/api/news/ingest/route.ts", import.meta.url), "utf8");

test("scheduled AI drafting accepts only the supported per-run limits", () => {
  assert.equal(parseScheduledDraftLimit("1"), 1);
  assert.equal(parseScheduledDraftLimit(3), 3);
  assert.equal(parseScheduledDraftLimit("0"), null);
  assert.equal(parseScheduledDraftLimit("4"), null);
  assert.equal(parseScheduledDraftLimit("1.5"), null);
  assert.equal(parseScheduledDraftLimit("not-a-number"), null);
});

test("scheduled ingestion passes only newly imported stories to automatic drafting", () => {
  assert.match(ingestRoute, /runScheduledAiDrafts\(summary\.importedItemIds, summary\.runId\)/);
  assert.match(ingestRoute, /const summary = await runRssImport\("scheduled"\)/);
});
