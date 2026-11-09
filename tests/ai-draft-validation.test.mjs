import assert from "node:assert/strict";
import test from "node:test";
import {
  createArticleSlug,
  sourceHtmlToText,
  validateGeneratedDraft,
} from "../lib/ai-draft-validation.mjs";

const validDraft = {
  can_draft: true,
  refusal_reason: "",
  title: "A clear and factual headline",
  summary: "A concise summary that gives readers the essential context.",
  body: "A".repeat(350),
  category: "World",
  confidence: 82,
  warnings: ["Confirm the final vote count."],
};

test("validates a complete generated draft", () => {
  const result = validateGeneratedDraft(validDraft);
  assert.equal(result.ok, true);
  assert.equal(result.value.confidence, 82);
});

test("rejects unsupported categories and short bodies", () => {
  assert.equal(validateGeneratedDraft({ ...validDraft, category: "Sport" }).ok, false);
  assert.equal(validateGeneratedDraft({ ...validDraft, body: "Too short" }).ok, false);
});

test("refuses to accept a draft when the source is insufficient", () => {
  const result = validateGeneratedDraft({
    ...validDraft,
    can_draft: false,
    refusal_reason: "The page contains navigation but no report.",
  });
  assert.deepEqual(result, {
    ok: false,
    error: "The page contains navigation but no report.",
  });
});

test("turns source HTML into bounded readable text", () => {
  const text = sourceHtmlToText("<header>Menu</header><article><h1>News &amp; context</h1><p>First paragraph.</p><script>bad()</script></article>");
  assert.equal(text, "News & context\n\nFirst paragraph.");
});

test("creates stable article slugs", () => {
  assert.equal(
    createArticleSlug("A Café Story!", "12345678-1234-1234-1234-123456789abc"),
    "a-cafe-story-123456781234",
  );
});
