import "server-only";

import nodemailer from "nodemailer";
import { buildNotificationEmail } from "@/lib/notification-email.mjs";
import { sanitiseErrorMessage } from "@/lib/error-reporting.mjs";
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
  const user = process.env.GMAIL_USER?.trim().toLowerCase();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  const from = process.env.NOTIFICATION_FROM_EMAIL?.trim() || (user ? `AvenBrief <${user}>` : "");
  return user && appPassword && from ? { user, appPassword, from } : null;
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
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: configuration.user,
        pass: configuration.appPassword,
      },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });
    const senderDomain = configuration.user.split("@")[1] || "gmail.com";
    await transporter.sendMail({
      from: configuration.from,
      to: recipient,
      subject: content.subject,
      html: content.html,
      text: content.text,
      messageId: `<avenbrief-notification-${notification.id}@${senderDomain}>`,
    });

    await supabase
      .from("admin_notifications")
      .update({ email_sent_at: new Date().toISOString(), email_error: null })
      .eq("id", notification.id)
      .is("email_sent_at", null);
  } catch (error) {
    const message = sanitiseErrorMessage(
      error instanceof Error ? error : "Email delivery failed.",
    ).slice(0, 500);
    console.error("Admin notification email failed:", { notificationId: notification.id, message });
    await supabase
      .from("admin_notifications")
      .update({ email_error: message })
      .eq("id", notification.id)
      .is("email_sent_at", null);
  }
}
