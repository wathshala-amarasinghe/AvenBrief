import "server-only";

import { getAdminSupabase } from "@/lib/supabase-admin";
import { findQueueRetentionCandidates } from "@/lib/rss-queue-retention.mjs";

export type QueueRetentionSummary = {
  archived: number;
  stale: number;
  sourceAlreadyUsed: number;
  recorded: boolean;
  error: string | null;
};

export async function runQueueRetention(
  importRunId: string | null,
): Promise<QueueRetentionSummary> {
  const empty = {
    archived: 0,
    stale: 0,
    sourceAlreadyUsed: 0,
    recorded: false,
    error: null,
  };
  const supabase = getAdminSupabase();
  const [storiesResult, articleSourcesResult] = await Promise.all([
    supabase
      .from("rss_inbox")
      .select("id, source_url, source_published_at, imported_at")
      .eq("status", "new")
      .limit(1000),
    supabase
      .from("articles")
      .select("source_url")
      .not("source_url", "is", null),
  ]);

  if (storiesResult.error || articleSourcesResult.error) {
    const message = storiesResult.error?.message ?? articleSourcesResult.error?.message ?? "Queue retention query failed.";
    console.error("RSS queue retention could not be evaluated:", message);
    return { ...empty, error: message };
  }

  const candidates = findQueueRetentionCandidates({
    stories: storiesResult.data ?? [],
    existingArticleUrls: (articleSourcesResult.data ?? [])
      .map((article) => article.source_url)
      .filter((url): url is string => Boolean(url)),
  });
  let archived = 0;

  if (candidates.length) {
    const { data, error } = await supabase
      .from("rss_inbox")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .in("id", candidates.map((candidate) => candidate.id))
      .eq("status", "new")
      .select("id");

    if (error) {
      console.error("RSS queue retention could not archive candidates:", error.message);
      return { ...empty, error: error.message };
    }
    archived = data?.length ?? 0;
  }

  let recorded = false;
  if (importRunId) {
    const { error } = await supabase
      .from("rss_import_runs")
      .update({ queue_items_archived: archived })
      .eq("id", importRunId);

    if (error) {
      // Deployments remain safe while the migration is being applied. The
      // archive work still succeeds and the next run records its count.
      console.warn("RSS queue retention count was not recorded:", error.message);
    } else {
      recorded = true;
    }
  }

  return {
    archived,
    stale: candidates.filter((candidate) => candidate.reason === "stale").length,
    sourceAlreadyUsed: candidates.filter((candidate) => candidate.reason === "source_already_used").length,
    recorded,
    error: null,
  };
}

