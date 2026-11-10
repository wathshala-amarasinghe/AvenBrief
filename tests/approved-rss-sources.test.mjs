import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20261110000400_expand_approved_rss_sources.sql", import.meta.url),
  "utf8",
);

test("approved source expansion covers every publication category with HTTPS feeds", () => {
  for (const category of ["World", "Technology", "Climate", "Finance", "Gaming"]) {
    assert.match(migration, new RegExp(`'${category}'`));
  }
  assert.equal((migration.match(/https:\/\//g) ?? []).length, 5);
  assert.doesNotMatch(migration, /'http:\/\//);
  assert.match(migration, /on conflict \(feed_url\) do nothing/i);
});
