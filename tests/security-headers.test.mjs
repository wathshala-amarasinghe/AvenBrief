import assert from "node:assert/strict";
import test from "node:test";
import {
  createContentSecurityPolicy,
  createNoIndexHeaders,
  createSecurityHeaders,
} from "../lib/security-headers.mjs";

test("production CSP limits executable and embeddable content", () => {
  const policy = createContentSecurityPolicy();

  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /frame-src 'none'/);
  assert.match(policy, /form-action 'self'/);
  assert.match(policy, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(policy, /'unsafe-eval'/);
});

test("development CSP permits the evaluator required by the dev runtime", () => {
  assert.match(
    createContentSecurityPolicy({ development: true }),
    /script-src 'self' 'unsafe-inline' 'unsafe-eval'/,
  );
});

test("security headers cover transport, framing, MIME and permissions", () => {
  const headers = Object.fromEntries(
    createSecurityHeaders().map(({ key, value }) => [key, value]),
  );

  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headers["Strict-Transport-Security"], /max-age=31536000/);
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
});

test("private route headers prevent indexing and cached search copies", () => {
  assert.deepEqual(createNoIndexHeaders(), [
    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  ]);
});
