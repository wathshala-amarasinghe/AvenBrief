"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
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
