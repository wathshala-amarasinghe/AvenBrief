import "server-only";

import { createVerifiedAiDraft } from "@/lib/ai-draft-workflow";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { parseScheduledDraftLimit } from "@/lib/scheduled-ai-draft-validation.mjs";
import {
  buildScheduledAttemptQueue,
  rankScheduledStories,
} from "@/lib/scheduled-story-selection.mjs";

export type ScheduledDraftSummary = {
  enabled: boolean;
  attempted: number;
  created: number;
  verificationPassed: number;
  verificationBlocked: number;
  failed: number;
  rejected: number;
  skippedReason: "disabled" | "not_configured" | "no_new_items" | "no_eligible_items" | "selection_failed" | null;
};

export async function runScheduledAiDrafts(
  importedItemIds: string[],
  importRunId: string | null,
): Promise<ScheduledDraftSummary> {
  const empty = {
    enabled: false,
    attempted: 0,
    created: 0,
    verificationPassed: 0,
    verificationBlocked: 0,
    failed: 0,
    rejected: 0,
  };

  if (!importedItemIds.length) return { ...empty, skippedReason: "no_new_items" };

  const { data: settings, error } = await getAdminSupabase()
    .from("rss_import_settings")
    .select("auto_draft_enabled, auto_draft_limit")
    .eq("id", 1)
    .maybeSingle();

  if (error || !settings) {
    console.error("Scheduled AI drafting settings could not be loaded:", error);
    return { ...empty, skippedReason: "not_configured" };
  }
  if (!settings.auto_draft_enabled) return { ...empty, skippedReason: "disabled" };

  const limit = parseScheduledDraftLimit(settings.auto_draft_limit) ?? 1;
  const supabase = getAdminSupabase();
  const [storiesResult, articleSourcesResult] = await Promise.all([
    supabase
      .from("rss_inbox")
      .select("id, title, source_name, source_url, source_published_at")
      .in("id", importedItemIds)
      .eq("status", "new"),
    supabase
      .from("articles")
      .select("source_url")
      .not("source_url", "is", null),
  ]);

  if (storiesResult.error || articleSourcesResult.error) {
    console.error("Scheduled story selection could not be loaded:", {
      stories: storiesResult.error?.message,
      articles: articleSourcesResult.error?.message,
    });
    return { ...empty, enabled: true, skippedReason: "selection_failed" };
  }

  const selection = rankScheduledStories({
    stories: storiesResult.data ?? [],
    existingArticleUrls: (articleSourcesResult.data ?? [])
      .map((article) => article.source_url)
      .filter((url): url is string => Boolean(url)),
    limit,
  });
  const attemptIds = buildScheduledAttemptQueue(selection.ranked, limit);

  if (selection.rejected.length) {
    const { error: archiveError } = await supabase
      .from("rss_inbox")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .in("id", selection.rejected.map((story) => story.id))
      .eq("status", "new");

    if (archiveError) {
      console.error("Rejected scheduled stories could not be archived:", archiveError.message);
    }
  }

  if (!attemptIds.length) {
    return {
      ...empty,
      enabled: true,
      rejected: selection.rejected.length,
      skippedReason: "no_eligible_items",
    };
  }

  const summary: ScheduledDraftSummary = {
    enabled: true,
    attempted: 0,
    created: 0,
    verificationPassed: 0,
    verificationBlocked: 0,
    failed: 0,
    rejected: selection.rejected.length,
    skippedReason: null,
  };

  for (const inboxId of attemptIds) {
    if (summary.created >= limit) break;
    summary.attempted += 1;
    const result = await createVerifiedAiDraft(inboxId, {
      triggerType: "scheduled",
      importRunId,
    });
    if (result.status !== "created") {
      if (result.status !== "existing") summary.failed += 1;
      if (
        result.status === "setup_required" ||
        (result.status === "failed" && ["ai_quota_exhausted", "ai_not_configured"].includes(result.resultCode))
      ) break;
      continue;
    }

    summary.created += 1;
    if (result.verificationStatus === "passed") summary.verificationPassed += 1;
    else summary.verificationBlocked += 1;
  }

  return summary;
}
