begin;

create table if not exists public.article_verifications (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  provider text not null default 'google',
  model text not null,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  verdict text check (verdict in ('pass', 'review', 'fail')),
  score smallint check (score between 0 and 100),
  publish_ready boolean not null default false,
  summary text,
  critical_issues jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  claims jsonb not null default '[]'::jsonb,
  source_text_chars integer not null default 0 check (source_text_chars >= 0),
  article_fingerprint text,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists article_verification_one_running_idx
on public.article_verifications (article_id)
where status = 'running';

create index if not exists article_verification_history_idx
on public.article_verifications (article_id, started_at desc);

alter table public.article_verifications enable row level security;
alter table public.article_verifications force row level security;

revoke all on table public.article_verifications
from public, anon, authenticated;

grant select, insert, update
on table public.article_verifications
to service_role;

comment on table public.article_verifications is
'Server-only source-consistency reports for saved article versions. A report does not establish that the original publisher is truthful.';

commit;
