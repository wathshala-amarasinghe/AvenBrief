begin;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'draft_ready',
    'verification_passed',
    'verification_blocked',
    'ai_quota',
    'rss_failure',
    'automation_stale'
  )),
  severity text not null default 'info' check (severity in ('info', 'warning', 'error')),
  title text not null check (char_length(title) between 1 and 160),
  message text not null check (char_length(message) between 1 and 1000),
  href text check (href is null or (char_length(href) between 1 and 500 and href like '/admin%')),
  dedupe_key text not null unique check (char_length(dedupe_key) between 1 and 300),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_unread_idx
on public.admin_notifications (created_at desc)
where read_at is null;

alter table public.admin_notifications enable row level security;
alter table public.admin_notifications force row level security;

revoke all on table public.admin_notifications
from public, anon, authenticated;

grant select, insert, update
on table public.admin_notifications
to service_role;

comment on table public.admin_notifications is
'Server-only operational notifications shown to authenticated AvenBrief administrators.';

commit;
