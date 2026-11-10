# Admin notifications

Apply `supabase/migrations/20261110000300_admin_notifications.sql`, then deploy the application. The admin sidebar displays an unread badge and **Admin → Notifications** lists operational events in Sri Lanka time.

Notifications are created for private AI drafts, verification results, Gemini quota or configuration failures, RSS source failures, scheduled-import failures, and automation that has not completed within 26 hours. Events use stable deduplication keys so retries and repeated page loads do not create duplicate alerts.

Notifications are server-only records protected by row-level security and the Supabase service role. Messages are redacted before storage or display. Administrators can mark one notification or all notifications as read.

The overdue health check runs when an administrator opens the Automation Monitor or Notifications page. It cannot replace external uptime monitoring, because an application that is completely unavailable cannot notify itself.
