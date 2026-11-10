import "server-only";

import { createVerifiedAiDraft } from "@/lib/ai-draft-workflow";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { parseScheduledDraftLimit } from "@/lib/scheduled-ai-draft-validation.mjs";

export type ScheduledDraftSummary = {
  enabled: boolean;
  attempted: number;
  created: number;
  verificationPassed: number;
  verificationBlocked: number;
  failed: number;
  skippedReason: "disabled" | "not_configured" | "no_new_items" | null;
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
  const selectedIds = importedItemIds.slice(0, limit);
  const summary: ScheduledDraftSummary = {
    enabled: true,
    attempted: selectedIds.length,
    created: 0,
    verificationPassed: 0,
    verificationBlocked: 0,
    failed: 0,
    skippedReason: null,
  };

  for (const inboxId of selectedIds) {
    const result = await createVerifiedAiDraft(inboxId, {
      triggerType: "scheduled",
      importRunId,
    });
    if (result.status !== "created") {
      if (result.status !== "existing") summary.failed += 1;
      continue;
    }

    summary.created += 1;
    if (result.verificationStatus === "passed") summary.verificationPassed += 1;
    else summary.verificationBlocked += 1;
  }

  return summary;
}
