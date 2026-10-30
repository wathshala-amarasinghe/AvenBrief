import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceRoleKey) {
  throw new Error("Production data acceptance requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const [articles, sources, inbox, settings, runs] = await Promise.all([
  supabase.from("articles").select("slug, title, category, published_at, featured_image_url").eq("status", "published").order("published_at", { ascending: false }).limit(10),
  supabase.from("rss_sources").select("name, enabled, last_checked_at, last_success_at, last_error").eq("enabled", true),
  supabase.from("rss_inbox").select("id", { count: "exact", head: true }).eq("status", "new"),
  supabase.from("rss_import_settings").select("paused").eq("id", 1).maybeSingle(),
  supabase.from("rss_import_runs").select("run_type, status, started_at, completed_at, sources_total, sources_succeeded, sources_failed, items_imported, error").order("started_at", { ascending: false }).limit(5),
]);

const results = { articles, sources, inbox, settings, runs };
for (const [name, result] of Object.entries(results)) {
  if (result.error) throw new Error(`${name} query failed: ${result.error.message}`);
}

const published = articles.data ?? [];
const enabledSources = sources.data ?? [];
const recentRuns = runs.data ?? [];
const failures = [];

if (!published.length) failures.push("No published articles exist.");
if (!enabledSources.length) failures.push("No RSS sources are enabled.");
if (settings.data?.paused) failures.push("Scheduled RSS importing is globally paused.");
if (!recentRuns.length) failures.push("No RSS import run has been recorded.");
if (recentRuns[0]?.status === "running") failures.push("The latest RSS import is still marked as running.");
if (recentRuns[0]?.status === "failed") failures.push("The latest RSS import failed.");
if (enabledSources.every((source) => !source.last_success_at)) failures.push("No enabled RSS source has completed a successful import.");

const summary = {
  publishedArticles: published.length,
  newestPublishedSlug: published[0]?.slug ?? null,
  newestArticleHasImage: Boolean(published[0]?.featured_image_url),
  enabledSources: enabledSources.length,
  sourcesWithErrors: enabledSources.filter((source) => source.last_error).length,
  awaitingReview: inbox.count ?? 0,
  importsPaused: settings.data?.paused ?? null,
  latestImportStatus: recentRuns[0]?.status ?? null,
  latestImportType: recentRuns[0]?.run_type ?? null,
  latestItemsImported: recentRuns[0]?.items_imported ?? null,
};

console.log(JSON.stringify(summary, null, 2));
if (failures.length) {
  console.error("Production data acceptance failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Production data acceptance passed.");
}
