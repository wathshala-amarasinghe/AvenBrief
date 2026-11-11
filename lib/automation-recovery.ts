import "server-only";

import {
  automationRecoveryCutoff,
  automationRecoveryMessage,
} from "@/lib/automation-recovery-rules.mjs";
import { createAdminNotification } from "@/lib/admin-notifications";
import { getAdminSupabase } from "@/lib/supabase-admin";

export type AutomationRecoverySummary = {
  imports: number;
  drafts: number;
  verifications: number;
  total: number;
  errors: string[];
};

export async function recoverStaleAutomationRuns(
  now = new Date(),
): Promise<AutomationRecoverySummary> {
  const supabase = getAdminSupabase();
  const cutoff = automationRecoveryCutoff(now);
  const completedAt = now.toISOString();

  const [importsResult, draftsResult, verificationsResult] = await Promise.all([
    supabase
      .from("rss_import_runs")
      .update({
        status: "failed",
        completed_at: completedAt,
        error: "Run automatically closed after remaining active for more than 10 minutes.",
      })
      .eq("status", "running")
      .lt("started_at", cutoff)
      .select("id"),
    supabase
      .from("ai_draft_generations")
      .update({
        status: "failed",
        completed_at: completedAt,
        error: "AI draft job automatically closed after remaining active for more than 10 minutes.",
      })
      .eq("status", "running")
      .lt("started_at", cutoff)
      .select("id"),
    supabase
      .from("article_verifications")
      .update({
        status: "failed",
        completed_at: completedAt,
        error: "Verification job automatically closed after remaining active for more than 10 minutes.",
      })
      .eq("status", "running")
      .lt("started_at", cutoff)
      .select("id"),
  ]);

  const errors = [importsResult.error, draftsResult.error, verificationsResult.error]
    .filter((error): error is NonNullable<typeof error> => Boolean(error))
    .map((error) => error.message);
  const summary = {
    imports: importsResult.data?.length ?? 0,
    drafts: draftsResult.data?.length ?? 0,
    verifications: verificationsResult.data?.length ?? 0,
    total: (importsResult.data?.length ?? 0) +
      (draftsResult.data?.length ?? 0) +
      (verificationsResult.data?.length ?? 0),
    errors,
  };

  if (errors.length) {
    console.error("Stale automation recovery was incomplete:", errors);
  }

  if (summary.total > 0) {
    const recovered = automationRecoveryMessage(summary);
    await createAdminNotification({
      type: "automation_stale",
      severity: "error",
      title: "Stuck automation jobs recovered",
      message: `AvenBrief marked ${recovered} as failed after they remained active for more than 10 minutes. The next scheduled workflow can continue.`,
      href: "/admin/automation",
      dedupeKey: `automation-recovery:${completedAt.slice(0, 13)}`,
    });
  }

  return summary;
}
