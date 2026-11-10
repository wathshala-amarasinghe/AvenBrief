"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminEmailDeliveryConfigured } from "@/lib/admin-notification-email";
import { createAdminNotification, type AdminNotificationType } from "@/lib/admin-notifications";
import { isValidNotificationEmail } from "@/lib/notification-preferences.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function updateEmailNotificationPreferences(formData: FormData) {
  await requireAdmin();
  const recipient = String(formData.get("recipient_email") ?? "").trim().toLowerCase();
  const enabled = formData.get("email_enabled") === "on";

  if (!isValidNotificationEmail(recipient)) {
    redirect("/admin/settings?result=invalid_notification_email");
  }

  const { error } = await getAdminSupabase()
    .from("admin_notification_preferences")
    .update({
      email_enabled: enabled,
      recipient_email: recipient,
      notify_draft_ready: formData.get("notify_draft_ready") === "on",
      notify_verification_passed: formData.get("notify_verification_passed") === "on",
      notify_verification_blocked: formData.get("notify_verification_blocked") === "on",
      notify_ai_quota: formData.get("notify_ai_quota") === "on",
      notify_rss_failure: formData.get("notify_rss_failure") === "on",
      notify_automation_stale: formData.get("notify_automation_stale") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("Email notification preferences update failed:", {
      code: error.code,
      message: error.message,
    });
    redirect("/admin/settings?result=notification_settings_error");
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings?result=notification_settings_saved");
}

export async function sendTestNotificationEmail() {
  await requireAdmin();
  if (!adminEmailDeliveryConfigured()) {
    redirect("/admin/settings?result=notification_email_not_configured");
  }

  const { data: preferences, error } = await getAdminSupabase()
    .from("admin_notification_preferences")
    .select("email_enabled, recipient_email, notify_draft_ready, notify_verification_passed, notify_verification_blocked, notify_ai_quota, notify_rss_failure, notify_automation_stale")
    .eq("id", 1)
    .maybeSingle();

  if (error || !preferences?.email_enabled || !isValidNotificationEmail(preferences.recipient_email)) {
    redirect("/admin/settings?result=notification_email_disabled");
  }

  const enabledTypes: Array<[AdminNotificationType, boolean]> = [
    ["draft_ready", preferences.notify_draft_ready],
    ["verification_passed", preferences.notify_verification_passed],
    ["verification_blocked", preferences.notify_verification_blocked],
    ["ai_quota", preferences.notify_ai_quota],
    ["rss_failure", preferences.notify_rss_failure],
    ["automation_stale", preferences.notify_automation_stale],
  ];
  const enabledType = enabledTypes.find(([, enabled]) => enabled)?.[0];
  if (!enabledType) {
    redirect("/admin/settings?result=notification_email_no_events");
  }

  await createAdminNotification({
    type: enabledType,
    severity: "info",
    title: "AvenBrief email test",
    message: "Operational email delivery is configured. Future selected automation alerts will be sent to this recipient.",
    href: "/admin/settings",
    dedupeKey: `email-test:${crypto.randomUUID()}`,
  });

  revalidatePath("/admin/notifications");
  redirect("/admin/settings?result=notification_test_requested");
}
