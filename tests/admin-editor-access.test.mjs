import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const editorPage = await readFile(new URL("../app/admin/editor/page.tsx", import.meta.url), "utf8");
const editorActions = await readFile(new URL("../app/admin/editor/actions.ts", import.meta.url), "utf8");

test("admin editor reads drafts through the server-only admin client", () => {
  assert.match(editorPage, /await requireAdmin\(\)/);
  assert.match(editorPage, /const supabase = getAdminSupabase\(\)/);
  assert.doesNotMatch(editorPage, /\{\s*supabase[^}]*\}\s*=\s*await requireAdmin\(\)/);
});

test("admin editor saves drafts through the server-only admin client", () => {
  assert.match(editorActions, /await requireAdmin\(\)/);
  assert.match(editorActions, /const supabase = getAdminSupabase\(\)/);
  assert.doesNotMatch(editorActions, /\{\s*supabase[^}]*\}\s*=\s*await requireAdmin\(\)/);
});
