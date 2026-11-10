# Operational email notifications

AvenBrief can mirror selected in-admin notifications to one administrator email address. Email delivery uses Gmail SMTP with a Google App Password and never changes the review-first publishing workflow.

## Setup

1. Apply `supabase/migrations/20261110000500_email_notifications.sql`.
2. Enable 2-Step Verification on the Gmail account and create a dedicated 16-character Google App Password named `AvenBrief`.
3. Add `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and optionally `NOTIFICATION_FROM_EMAIL` to the Vercel production environment.
4. Redeploy the application so the server functions receive the new variables.
5. Open **Admin → Settings → Email notifications**.
6. Enter the recipient, choose the alert types, enable delivery, and save.
7. Select **Send test email**, then open **Admin → Notifications** to confirm whether Gmail accepted the message.

The production configuration also registers `/api/automation/health` at 02:00 UTC each day, two hours after the scheduled import. This independent check can create an overdue notification when the import cron has not completed within its expected window.

`GMAIL_APP_PASSWORD` is not the normal Google account password and must remain server-only. Spaces in the generated App Password are accepted and removed before authentication. `NOTIFICATION_FROM_EMAIL` defaults to `AvenBrief <GMAIL_USER>`; Gmail may rewrite a different sender address to the authenticated account.

## Delivery and duplicate protection

Each operational event first creates one database notification with a unique deduplication key. Only a newly created notification can trigger email, and its UUID becomes a stable message ID. Delivery success or failure is recorded beside the notification and is visible in **Admin → Notifications**.

Email failure never stops RSS importing, AI drafting, verification, or access to the in-admin notification center. Automatic article publishing remains disabled.
