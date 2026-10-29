import "server-only";

import { getHeadlinesFromSource } from "@/lib/rss";
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
};

type RssSource = {
  id: string;
  name: string;
  feed_url: string;
  default_category: string;
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message).trim();
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
    };
  }

  if (runError || !run) throw runError ?? new Error("Could not start import run.");
  runId = run.id;
  const activeRunId = run.id;

  try {
    const { data, error: sourcesError } = await supabase
      .from("rss_sources")
      .select("id, name, feed_url, default_category")
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
      };
    }

    let sourcesSucceeded = 0;
    let sourcesFailed = 0;
    let itemsImported = 0;

    for (const source of sources) {
      const sourceStartedAt = new Date().toISOString();
      let itemsFound = 0;
      let newItems = 0;

      try {
        const headlines = await getHeadlinesFromSource(source.feed_url);
        itemsFound = headlines.length;

        const rows = headlines.map((story) => {
          const publishedTime = Date.parse(story.publishedAt);
          const suggestedCategory = story.suggestedCategory === "World"
            ? source.default_category
            : story.suggestedCategory;

          return {
            source_id: source.id,
            title: story.title,
            source_name: source.name,
            source_url: story.url,
            source_author: story.author,
            source_published_at: Number.isFinite(publishedTime)
              ? new Date(publishedTime).toISOString()
              : null,
            suggested_category: suggestedCategory,
            status: "new",
          };
        });

        if (rows.length) {
          const { data: inserted, error: importError } = await supabase
            .from("rss_inbox")
            .upsert(rows, {
              onConflict: "source_url",
              ignoreDuplicates: true,
            })
            .select("id");

          if (importError) throw importError;
          newItems = inserted?.length ?? 0;

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
