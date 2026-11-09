import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizeStoryUrl,
  createStoryFingerprint,
} from "../lib/rss-story-dedup.mjs";

test("story URLs remove fragments and known tracking parameters", () => {
  assert.equal(
    canonicalizeStoryUrl(
      "https://EXAMPLE.com/news/story/?utm_source=rss&b=2&a=1#comments",
    ),
    "https://example.com/news/story?a=1&b=2",
  );
});

test("story fingerprints match syndicated titles published on the same day", () => {
  const first = createStoryFingerprint({
    title: "AI’s next chapter: What changes now?",
    publishedAt: "2026-11-09T01:00:00Z",
  });
  const second = createStoryFingerprint({
    title: "AI's next chapter — what changes now",
    publishedAt: "2026-11-09T20:00:00Z",
  });

  assert.equal(first, second);
});

test("same title on different days remains reviewable", () => {
  assert.notEqual(
    createStoryFingerprint({ title: "Daily briefing", publishedAt: "2026-11-08" }),
    createStoryFingerprint({ title: "Daily briefing", publishedAt: "2026-11-09" }),
  );
});

test("empty titles do not create fingerprints", () => {
  assert.equal(createStoryFingerprint({ title: "  ", publishedAt: "" }), null);
});
