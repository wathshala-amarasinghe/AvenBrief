import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { classifyDraftReadiness } from "../lib/draft-readiness.mjs";

const article = (overrides = {}) => ({
  created_at: "2026-11-10T00:00:00Z",
  featured_image_url: null,
  image_alt: "",
  image_credit: "",
  ...overrides,
});

test("draft readiness requires a current passing verification", () => {
  assert.equal(classifyDraftReadiness({ article: article(), now: "2026-11-11T00:00:00Z" }).state, "verification");
  assert.equal(classifyDraftReadiness({
    article: article(),
    verification: { status: "completed", publish_ready: true },
    verificationCurrent: false,
  }).reason, "Article changed after verification");
  assert.equal(classifyDraftReadiness({
    article: article(),
    verification: { status: "completed", publish_ready: false },
    verificationCurrent: true,
  }).state, "verification");
});

test("verified drafts identify missing images and final-review readiness", () => {
  const verification = { status: "completed", publish_ready: true };
  const missing = classifyDraftReadiness({ article: article(), verification, verificationCurrent: true });
  assert.equal(missing.state, "image");
  assert.match(missing.reason, /featured image/);

  const ready = classifyDraftReadiness({
    article: article({
      featured_image_url: "https://example.com/image.jpg",
      image_alt: "People meeting around a table",
      image_credit: "Example photographer",
    }),
    verification,
    verificationCurrent: true,
  });
  assert.equal(ready.state, "ready");
});

test("draft readiness flags drafts after seven days", () => {
  const result = classifyDraftReadiness({
    article: article({ created_at: "2026-11-01T00:00:00Z" }),
    now: "2026-11-11T00:00:00Z",
  });
  assert.equal(result.old, true);
  assert.equal(result.ageDays, 10);
});

test("articles navigation opens the readiness dashboard", async () => {
  const shell = await readFile(new URL("../components/admin-shell.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/admin/articles/page.tsx", import.meta.url), "utf8");
  assert.match(shell, /href: "\/admin\/articles", label: "Articles"/);
  assert.match(page, /await requireAdmin\(\)/);
  assert.match(page, /articleVerificationFingerprint/);
});
