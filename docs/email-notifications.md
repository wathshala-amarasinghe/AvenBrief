# Operational email notifications

AvenBrief can mirror selected in-admin notifications to one administrator email address. Email delivery uses Resend and never changes the review-first publishing workflow.

## Setup

1. Apply `supabase/migrations/20261110000500_email_notifications.sql`.
2. Add `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` to the Vercel production environment.
3. Redeploy the application so the server functions receive the new variables.
4. Open **Admin → Settings → Email notifications**.
5. Enter the recipient, choose the alert types, enable delivery, and save.
6. Select **Send test email**, then open **Admin → Notifications** to confirm whether Resend accepted the message.

The production configuration also registers `/api/automation/health` at 02:00 UTC each day, two hours after the scheduled import. This independent check can create an overdue notification when the import cron has not completed within its expected window.

`NOTIFICATION_FROM_EMAIL` can include a display name, for example `AvenBrief <notifications@example.com>`. The sender must be permitted by the connected Resend account.

## Delivery and duplicate protection

Each operational event first creates one database notification with a unique deduplication key. Only a newly created notification can trigger email. The notification UUID is also sent to Resend as an idempotency key, so retries cannot produce duplicate messages. Delivery success or failure is recorded beside the notification and is visible in **Admin → Notifications**.

Email failure never stops RSS importing, AI drafting, verification, or access to the in-admin notification center. Automatic article publishing remains disabled.
