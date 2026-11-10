import assert from "node:assert/strict";
import test from "node:test";
import { buildAutomationMonitoring } from "../lib/automation-monitoring.mjs";

test("automation monitoring reports exact outcomes for the latest scheduled run", () => {
  const result = buildAutomationMonitoring({
    runs: [{ id: "run-2", items_imported: 2, started_at: "2026-11-10T01:00:00Z" }],
    generations: [
      { id: "g-1", import_run_id: "run-2", inbox_id: "i-1", article_id: "a-1", status: "succeeded", started_at: "2026-11-10T01:01:00Z", error: null },
      { id: "g-2", import_run_id: "run-2", inbox_id: "i-2", article_id: null, status: "failed", started_at: "2026-11-10T01:02:00Z", error: "API quota 429" },
    ],
    articles: [{ id: "a-1", title: "Verified draft" }],
    inbox: [
      { id: "i-1", title: "Source one", source_name: "Publisher" },
      { id: "i-2", title: "Source two", source_name: "Publisher" },
    ],
    verifications: [{ article_id: "a-1", status: "completed", publish_ready: true }],
  });

  assert.deepEqual(result.summary, {
    storiesImported: 2,
    draftsAttempted: 2,
    draftsCreated: 1,
    verificationPassed: 1,
    verificationBlocked: 0,
    failures: 1,
    configurationProblems: 1,
  });
  assert.equal(result.rows[0].title, "Verified draft");
  assert.equal(result.rows[0].verificationState, "passed");
});

test("automation monitoring redacts secrets from saved failures", () => {
  const result = buildAutomationMonitoring({
    runs: [{ id: "run-1", items_imported: 1 }],
    generations: [{
      id: "g-1",
      import_run_id: "run-1",
      inbox_id: "i-1",
      article_id: null,
      status: "failed",
      started_at: "2026-11-10T01:00:00Z",
      error: "Bearer private-token",
    }],
  });

  assert.equal(result.rows[0].error, "Bearer [redacted]");
});
