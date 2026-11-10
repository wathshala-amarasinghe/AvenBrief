import assert from "node:assert/strict";
import test from "node:test";
import { automationHealthState } from "../lib/admin-notification-rules.mjs";

const now = new Date("2026-11-10T12:00:00Z");

test("automation health remains quiet after a recent completed run", () => {
  assert.equal(automationHealthState({
    status: "succeeded",
    started_at: "2026-11-10T10:00:00Z",
    completed_at: "2026-11-10T10:05:00Z",
  }, now), "healthy");
});

test("automation health detects stuck and overdue schedules", () => {
  assert.equal(automationHealthState({
    status: "running",
    started_at: "2026-11-10T10:00:00Z",
    completed_at: null,
  }, now), "stuck");
  assert.equal(automationHealthState({
    status: "succeeded",
    started_at: "2026-11-09T08:00:00Z",
    completed_at: "2026-11-09T08:05:00Z",
  }, now), "overdue");
  assert.equal(automationHealthState(null, now), "overdue");
});
