begin;

alter table public.admin_notifications
add column if not exists email_sent_at timestamptz,
add column if not exists email_error text;

create table if not exists public.admin_notification_preferences (
  id smallint primary key default 1,
  email_enabled boolean not null default false,
  recipient_email text,
  notify_draft_ready boolean not null default true,
  notify_verification_passed boolean not null default true,
  notify_verification_blocked boolean not null default true,
  notify_ai_quota boolean not null default true,
  notify_rss_failure boolean not null default true,
  notify_automation_stale boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint admin_notification_preferences_singleton check (id = 1),
  constraint admin_notification_preferences_email_check check (
    recipient_email is null
    or (char_length(recipient_email) between 3 and 254 and recipient_email like '%@%')
  )
);

insert into public.admin_notification_preferences (id)
values (1)
on conflict (id) do nothing;

alter table public.admin_notification_preferences enable row level security;
alter table public.admin_notification_preferences force row level security;

revoke all on table public.admin_notification_preferences
from public, anon, authenticated;

grant select, update
on table public.admin_notification_preferences
to service_role;

comment on table public.admin_notification_preferences is
'Server-only delivery preferences for AvenBrief operational email notifications.';

comment on column public.admin_notifications.email_sent_at is
'Set after the configured mail transport accepts the notification email. The unique notification row prevents duplicate delivery attempts.';

commit;
