export const notificationPreferenceFields = {
  draft_ready: "notify_draft_ready",
  verification_passed: "notify_verification_passed",
  verification_blocked: "notify_verification_blocked",
  ai_quota: "notify_ai_quota",
  rss_failure: "notify_rss_failure",
  automation_stale: "notify_automation_stale",
};

export function isValidNotificationEmail(value) {
  if (typeof value !== "string") return false;
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function shouldEmailNotification(preferences, type) {
  if (!preferences?.email_enabled || !isValidNotificationEmail(preferences.recipient_email)) {
    return false;
  }

  const field = notificationPreferenceFields[type];
  return Boolean(field && preferences[field]);
}
