import "server-only";

import { buildNotificationEmail } from "@/lib/notification-email.mjs";
import { shouldEmailNotification } from "@/lib/notification-preferences.mjs";
import { absoluteUrl } from "@/lib/site-metadata";
import { getAdminSupabase } from "@/lib/supabase-admin";

type EmailNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
};

function deliveryConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NOTIFICATION_FROM_EMAIL?.trim();
  return apiKey && from ? { apiKey, from } : null;
}

export function adminEmailDeliveryConfigured() {
  return Boolean(deliveryConfiguration());
}

export async function deliverAdminNotificationEmail(notification: EmailNotification) {
  const configuration = deliveryConfiguration();
  if (!configuration) return;

  const supabase = getAdminSupabase();
  const { data: preferences, error: preferencesError } = await supabase
    .from("admin_notification_preferences")
    .select("email_enabled, recipient_email, notify_draft_ready, notify_verification_passed, notify_verification_blocked, notify_ai_quota, notify_rss_failure, notify_automation_stale")
    .eq("id", 1)
    .maybeSingle();

  const recipient = preferences?.recipient_email;
  if (
    preferencesError ||
    typeof recipient !== "string" ||
    !shouldEmailNotification(preferences, notification.type)
  ) return;

  const content = buildNotificationEmail(notification, absoluteUrl("/"));
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${configuration.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `avenbrief-notification-${notification.id}`,
      },
      body: JSON.stringify({
        from: configuration.from,
        to: [recipient],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Resend returned ${response.status}: ${detail}`);
    }

    await supabase
      .from("admin_notifications")
      .update({ email_sent_at: new Date().toISOString(), email_error: null })
      .eq("id", notification.id)
      .is("email_sent_at", null);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed.";
    console.error("Admin notification email failed:", { notificationId: notification.id, message });
    await supabase
      .from("admin_notifications")
      .update({ email_error: message })
      .eq("id", notification.id)
      .is("email_sent_at", null);
  }
}
