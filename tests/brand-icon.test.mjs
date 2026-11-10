import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("every icon entry point resolves to the versioned AvenBrief artwork", async () => {
  const [layout, manifest, faviconRoute] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/manifest.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/favicon.ico/route.ts", import.meta.url), "utf8"),
  ]);

  for (const source of [layout, manifest, faviconRoute]) {
    assert.match(source, /\/icon\.png\?v=3/);
  }
  assert.match(layout, /shortcut/);
  assert.match(layout, /apple/);
  assert.match(faviconRoute, /308/);
});
