import test from "node:test";
import assert from "node:assert/strict";
import { safeRequestPath, sanitiseErrorMessage } from "../lib/error-reporting.mjs";

test("request paths omit query parameters", () => {
  assert.equal(safeRequestPath("/search?q=private&token=secret"), "/search");
});

test("error messages redact credentials and tokens", () => {
  const message = sanitiseErrorMessage(
    "Bearer abc123 sb_secret_example eyJabc.def.ghi https://example.com?token=secret-value",
  );
  assert.equal(message.includes("abc123"), false);
  assert.equal(message.includes("sb_secret_example"), false);
  assert.equal(message.includes("eyJabc.def.ghi"), false);
  assert.equal(message.includes("secret-value"), false);
});

test("error messages are bounded", () => {
  assert.equal(sanitiseErrorMessage("x".repeat(2000)).length, 1000);
});
