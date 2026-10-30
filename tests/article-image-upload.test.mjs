import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_ARTICLE_IMAGE_BYTES,
  validateArticleImage,
} from "../lib/article-image-upload.mjs";

const signatures = {
  "image/jpeg": [0xff, 0xd8, 0xff, 0xe0],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/webp": [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
  "image/gif": [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
};

for (const [type, signature] of Object.entries(signatures)) {
  test(`${type} uploads are accepted when the signature matches`, () => {
    assert.equal(validateArticleImage({ type, size: 1024, bytes: new Uint8Array(signature) }).ok, true);
  });
}

test("empty and oversized files are rejected", () => {
  assert.equal(validateArticleImage({ type: "image/png", size: 0, bytes: new Uint8Array(signatures["image/png"]) }).ok, false);
  assert.equal(validateArticleImage({ type: "image/png", size: MAX_ARTICLE_IMAGE_BYTES + 1, bytes: new Uint8Array(signatures["image/png"]) }).ok, false);
});

test("unsupported and disguised files are rejected", () => {
  assert.equal(validateArticleImage({ type: "image/svg+xml", size: 100, bytes: new Uint8Array([60, 115, 118, 103]) }).ok, false);
  assert.equal(validateArticleImage({ type: "image/png", size: 100, bytes: new Uint8Array(signatures["image/jpeg"]) }).ok, false);
});
