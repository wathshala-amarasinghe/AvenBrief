import "server-only";

import { getHeadlinesFromSource } from "@/lib/rss";
import {
  canonicalizeStoryUrl,
  createStoryFingerprint,
} from "@/lib/rss-story-dedup.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";

export type RssImportRunType = "manual" | "scheduled";
export type RssImportRunStatus =
  | "succeeded"
  | "partial"
  | "failed"
  | "skipped";

export type RssImportSummary = {
  runId: string | null;
  status: RssImportRunStatus;
  reason: "paused" | "already_running" | "no_sources" | null;
  sourcesTotal: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  itemsImported: number;
  importedItemIds: string[];
};

type RssSource = {
  id: string;
  name: string;
  feed_url: string;
  default_category: string;
  max_items_per_import: number;
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message).trim();
    if (/Attribute without value|Invalid character in entity name|Unexpected close tag/i.test(message)) {
      return "The source returned malformed XML and could not be read as an RSS or Atom feed.";
    }
    if (/returned a web page instead of an RSS|Unexpected root element|Non-whitespace before first tag/i.test(message)) {
      return "The configured URL is a web page, not a valid RSS or Atom feed.";
    }
    if (message) return message.slice(0, 500);
  }

  return "The import failed unexpectedly.";
}

async function recordSourceRun(
  supabase: ReturnType<typeof getAdminSupabase>,
  values: {
    run_id: string;
    source_id: string;
    source_name: string;
    status: "succeeded" | "failed";
    started_at: string;
    completed_at: string;
    items_found: number;
    items_imported: number;
    error: string | null;
  },
) {
  const { error } = await supabase.from("rss_import_source_runs").insert(values);
  if (error) {
    console.error("RSS source-run history could not be saved:", {
      code: error.code,
      message: error.message,
    });
  }
}

export async function runRssImport(
  runType: RssImportRunType,
): Promise<RssImportSummary> {
  const supabase = getAdminSupabase();
  const startedAt = new Date();
  const startedAtIso = startedAt.toISOString();
  let runId: string | null = null;

  const { data: settings, error: settingsError } = await supabase
    .from("rss_import_settings")
    .select("paused")
    .eq("id", 1)
    .single();

  if (settingsError) throw settingsError;

  if (settings.paused) {
    const { data } = await supabase
      .from("rss_import_runs")
      .insert({
        run_type: runType,
        status: "skipped",
        started_at: startedAtIso,
        completed_at: startedAtIso,
        error: "Importing is globally paused.",
      })
      .select("id")
      .single();

    return {
      runId: data?.id ?? null,
      status: "skipped",
      reason: "paused",
      sourcesTotal: 0,
      sourcesSucceeded: 0,
      sourcesFailed: 0,
      itemsImported: 0,
      importedItemIds: [],
    };
  }

  const staleBefore = new Date(startedAt.getTime() - 20 * 60 * 1000).toISOString();
  await supabase
    .from("rss_import_runs")
    .update({
      status: "failed",
      completed_at: startedAtIso,
      error: "Run automatically closed after exceeding 20 minutes.",
    })
    .eq("status", "running")
    .lt("started_at", staleBefore);

  const { data: run, error: runError } = await supabase
    .from("rss_import_runs")
    .insert({
      run_type: runType,
      status: "running",
      started_at: startedAtIso,
    })
    .select("id")
    .single();

  if (runError?.code === "23505") {
    const { data: skippedRun } = await supabase
      .from("rss_import_runs")
      .insert({
        run_type: runType,
        status: "skipped",
        started_at: startedAtIso,
        completed_at: startedAtIso,
        error: "Another RSS import was already running.",
      })
      .select("id")
      .single();

    return {
      runId: skippedRun?.id ?? null,
      status: "skipped",
      reason: "already_running",
      sourcesTotal: 0,
      sourcesSucceeded: 0,
      sourcesFailed: 0,
      itemsImported: 0,
      importedItemIds: [],
    };
  }

  if (runError || !run) throw runError ?? new Error("Could not start import run.");
  runId = run.id;
  const activeRunId = run.id;

  try {
    const { data, error: sourcesError } = await supabase
      .from("rss_sources")
      .select("id, name, feed_url, default_category, max_items_per_import")
      .eq("enabled", true)
      .order("name");

    if (sourcesError) throw sourcesError;
    const sources = (data ?? []) as RssSource[];

    if (!sources.length) {
      await supabase
        .from("rss_import_runs")
        .update({
          status: "skipped",
          completed_at: new Date().toISOString(),
          error: "No RSS sources are enabled.",
        })
        .eq("id", runId);

      return {
        runId,
        status: "skipped",
        reason: "no_sources",
        sourcesTotal: 0,
        sourcesSucceeded: 0,
        sourcesFailed: 0,
        itemsImported: 0,
        importedItemIds: [],
      };
    }

    let sourcesSucceeded = 0;
    let sourcesFailed = 0;
    let itemsImported = 0;
    const importedItemIds: string[] = [];

    for (const source of sources) {
      const sourceStartedAt = new Date().toISOString();
      let itemsFound = 0;
      let newItems = 0;

      try {
        const headlines = (await getHeadlinesFromSource(source.feed_url)).slice(
          0,
          source.max_items_per_import,
        );
        itemsFound = headlines.length;

        const candidateRows = headlines.map((story) => {
          const publishedTime = Date.parse(story.publishedAt);
          const suggestedCategory = story.suggestedCategory === "World"
            ? source.default_category
            : story.suggestedCategory;
          const canonicalUrl = canonicalizeStoryUrl(story.url);

          return {
            source_id: source.id,
            title: story.title,
            source_name: source.name,
            source_url: canonicalUrl,
            source_author: story.author,
            source_published_at: Number.isFinite(publishedTime)
              ? new Date(publishedTime).toISOString()
              : null,
            suggested_category: suggestedCategory,
            story_fingerprint: createStoryFingerprint({
              title: story.title,
              publishedAt: story.publishedAt,
            }),
            status: "new",
          };
        });

        const seenUrls = new Set<string>();
        const seenFingerprints = new Set<string>();
        const uniqueCandidates = candidateRows.filter((row) => {
          if (seenUrls.has(row.source_url)) return false;
          if (row.story_fingerprint && seenFingerprints.has(row.story_fingerprint)) {
            return false;
          }

          seenUrls.add(row.source_url);
          if (row.story_fingerprint) seenFingerprints.add(row.story_fingerprint);
          return true;
        });

        const urls = uniqueCandidates.map((row) => row.source_url);
        const fingerprints = uniqueCandidates
          .map((row) => row.story_fingerprint)
          .filter((value): value is string => Boolean(value));

        const [existingUrlsResult, existingFingerprintsResult] = await Promise.all([
          urls.length
            ? supabase.from("rss_inbox").select("source_url").in("source_url", urls)
            : Promise.resolve({ data: [], error: null }),
          fingerprints.length
            ? supabase
                .from("rss_inbox")
                .select("story_fingerprint")
                .in("story_fingerprint", fingerprints)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (existingUrlsResult.error) throw existingUrlsResult.error;
        if (existingFingerprintsResult.error) throw existingFingerprintsResult.error;

        const existingUrls = new Set(
          (existingUrlsResult.data ?? []).map((row) => row.source_url),
        );
        const existingFingerprints = new Set(
          (existingFingerprintsResult.data ?? [])
            .map((row) => row.story_fingerprint)
            .filter(Boolean),
        );
        const rows = uniqueCandidates.filter(
          (row) =>
            !existingUrls.has(row.source_url) &&
            (!row.story_fingerprint ||
              !existingFingerprints.has(row.story_fingerprint)),
        );

        if (rows.length) {
          const { data: inserted, error: importError } = await supabase
            .from("rss_inbox")
            .insert(rows)
            .select("id");

          if (importError) throw importError;
          newItems = inserted?.length ?? 0;
          importedItemIds.push(...(inserted ?? []).map((item) => item.id));

          const { error: linkError } = await supabase
            .from("rss_inbox")
            .update({ source_id: source.id })
            .in("source_url", rows.map((row) => row.source_url))
            .is("source_id", null);

          if (linkError) throw linkError;
        }

        const completedAt = new Date().toISOString();
        const { error: sourceUpdateError } = await supabase
          .from("rss_sources")
          .update({
            last_checked_at: completedAt,
            last_success_at: completedAt,
            last_error: null,
            last_import_count: newItems,
          })
          .eq("id", source.id);

        if (sourceUpdateError) throw sourceUpdateError;

        sourcesSucceeded += 1;
        itemsImported += newItems;
        await recordSourceRun(supabase, {
          run_id: activeRunId,
          source_id: source.id,
          source_name: source.name,
          status: "succeeded",
          started_at: sourceStartedAt,
          completed_at: completedAt,
          items_found: itemsFound,
          items_imported: newItems,
          error: null,
        });
      } catch (error) {
        sourcesFailed += 1;
        const completedAt = new Date().toISOString();
        const message = errorMessage(error);
        console.error(`RSS source failed (${source.name}):`, message);

        const { error: sourceUpdateError } = await supabase
          .from("rss_sources")
          .update({
            last_checked_at: completedAt,
            last_error: message,
            last_import_count: 0,
          })
          .eq("id", source.id);

        if (sourceUpdateError) {
          console.error("RSS failure outcome could not be saved:", {
            code: sourceUpdateError.code,
            message: sourceUpdateError.message,
          });
        }

        await recordSourceRun(supabase, {
          run_id: activeRunId,
          source_id: source.id,
          source_name: source.name,
          status: "failed",
          started_at: sourceStartedAt,
          completed_at: completedAt,
          items_found: itemsFound,
          items_imported: newItems,
          error: message,
        });
      }
    }

    const status: RssImportRunStatus = sourcesFailed === sources.length
      ? "failed"
      : sourcesFailed > 0
        ? "partial"
        : "succeeded";

    const { error: completionError } = await supabase
      .from("rss_import_runs")
      .update({
        status,
        completed_at: new Date().toISOString(),
        sources_total: sources.length,
        sources_succeeded: sourcesSucceeded,
        sources_failed: sourcesFailed,
        items_imported: itemsImported,
        error: status === "failed" ? "Every enabled source failed." : null,
      })
      .eq("id", runId);

    if (completionError) throw completionError;

    return {
      runId,
      status,
      reason: null,
      sourcesTotal: sources.length,
      sourcesSucceeded,
      sourcesFailed,
      itemsImported,
      importedItemIds,
    };
  } catch (error) {
    const message = errorMessage(error);
    await supabase
      .from("rss_import_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: message,
      })
      .eq("id", runId);
    throw error;
  }
}
