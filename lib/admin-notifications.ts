import "server-only";

import { sanitiseErrorMessage } from "@/lib/error-reporting.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { automationHealthState } from "@/lib/admin-notification-rules.mjs";
import { deliverAdminNotificationEmail } from "@/lib/admin-notification-email";

export type AdminNotificationType =
  | "draft_ready"
  | "verification_passed"
  | "verification_blocked"
  | "ai_quota"
  | "rss_failure"
  | "automation_stale";

export async function createAdminNotification(input: {
  type: AdminNotificationType;
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  href?: string | null;
  dedupeKey: string;
}) {
  const { data, error } = await getAdminSupabase()
    .from("admin_notifications")
    .insert({
      type: input.type,
      severity: input.severity,
      title: input.title.slice(0, 160),
      message: sanitiseErrorMessage(input.message).slice(0, 1000),
      href: input.href?.startsWith("/admin") ? input.href.slice(0, 500) : null,
      dedupe_key: input.dedupeKey.slice(0, 300),
    })
    .select("id, type, title, message, href")
    .single();

  if (error) {
    if (error.code === "23505") return;
    console.error("Admin notification could not be saved:", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  if (data) await deliverAdminNotificationEmail(data);
}

export async function ensureAutomationHealthNotification(now = new Date()) {
  const { data: latestRun, error } = await getAdminSupabase()
    .from("rss_import_runs")
    .select("id, status, started_at, completed_at")
    .eq("run_type", "scheduled")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return;
  const health = automationHealthState(latestRun, now);
  if (health === "healthy") return;
  const stuck = health === "stuck";

  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  await createAdminNotification({
    type: "automation_stale",
    severity: "error",
    title: stuck ? "Scheduled automation appears stuck" : "Scheduled automation is overdue",
    message: stuck
      ? "The latest scheduled import has remained in progress for more than 10 minutes. AvenBrief attempted automatic recovery; check the Vercel function logs."
      : "No scheduled RSS import has completed within the last 26 hours. Check the Vercel cron configuration and runtime logs.",
    href: "/admin/automation",
    dedupeKey: `automation-health:${day}:${stuck ? "stuck" : "overdue"}`,
  });
}
