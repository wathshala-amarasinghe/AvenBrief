begin;

create table if not exists public.ai_draft_generations (
  id uuid primary key default gen_random_uuid(),
  inbox_id uuid not null references public.rss_inbox(id) on delete cascade,
  article_id uuid references public.articles(id) on delete set null,
  provider text not null default 'openai',
  model text not null,
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed')),
  confidence smallint check (confidence between 0 and 100),
  warnings jsonb not null default '[]'::jsonb,
  source_text_chars integer not null default 0 check (source_text_chars >= 0),
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists ai_draft_one_running_per_story_idx
on public.ai_draft_generations (inbox_id)
where status = 'running';

create index if not exists ai_draft_article_history_idx
on public.ai_draft_generations (article_id, started_at desc)
where article_id is not null;

alter table public.ai_draft_generations enable row level security;
alter table public.ai_draft_generations force row level security;

revoke all on table public.ai_draft_generations
from public, anon, authenticated;

grant select, insert, update
on table public.ai_draft_generations
to service_role;

comment on table public.ai_draft_generations is
'Server-only audit history for AI-assisted article drafts. It never publishes articles.';

commit;
