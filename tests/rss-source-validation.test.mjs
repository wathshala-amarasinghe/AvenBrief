import test from "node:test";
import assert from "node:assert/strict";
import { validateRssSource } from "../lib/rss-source-validation.mjs";

const valid = {
  name: "Global Voices",
  feed_url: "https://globalvoices.org/feed/",
  default_category: "World",
  enabled: "on",
};

test("approved HTTPS source settings are normalised", () => {
  const result = validateRssSource({
    ...valid,
    name: "  Global Voices  ",
    feed_url: "https://globalvoices.org/feed/#latest",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    name: "Global Voices",
    feed_url: "https://globalvoices.org/feed/",
    default_category: "World",
    enabled: true,
  });
});

test("feed URLs must be public HTTPS endpoints", () => {
  for (const feed_url of [
    "http://example.com/feed",
    "https://localhost/feed",
    "https://127.0.0.1/feed",
    "https://192.168.1.10/feed",
    "https://user:password@example.com/feed",
    "https://example.com:8443/feed",
    "not a URL",
  ]) {
    assert.equal(validateRssSource({ ...valid, feed_url }).ok, false);
  }
});

test("source names and default categories are validated", () => {
  assert.equal(validateRssSource({ ...valid, name: "x" }).ok, false);
  assert.equal(
    validateRssSource({ ...valid, default_category: "Entertainment" }).ok,
    false,
  );
});

test("disabled sources remain valid", () => {
  const result = validateRssSource({ ...valid, enabled: undefined });
  assert.equal(result.ok, true);
  assert.equal(result.value.enabled, false);
});
