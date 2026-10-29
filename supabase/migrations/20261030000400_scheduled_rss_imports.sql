begin;

create table if not exists public.rss_import_settings (
  id smallint primary key default 1,
  paused boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint rss_import_settings_singleton check (id = 1)
);

insert into public.rss_import_settings (id, paused)
values (1, false)
on conflict (id) do nothing;

create table if not exists public.rss_import_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  sources_total integer not null default 0,
  sources_succeeded integer not null default 0,
  sources_failed integer not null default 0,
  items_imported integer not null default 0,
  error text,
  constraint rss_import_runs_type_check
    check (run_type in ('manual', 'scheduled')),
  constraint rss_import_runs_status_check
    check (status in ('running', 'succeeded', 'partial', 'failed', 'skipped')),
  constraint rss_import_runs_counts_check
    check (
      sources_total >= 0
      and sources_succeeded >= 0
      and sources_failed >= 0
      and items_imported >= 0
    )
);

create unique index if not exists rss_import_runs_one_running_idx
on public.rss_import_runs ((true))
where status = 'running';

create index if not exists rss_import_runs_started_idx
on public.rss_import_runs (started_at desc);

create table if not exists public.rss_import_source_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.rss_import_runs(id) on delete cascade,
  source_id uuid references public.rss_sources(id) on delete set null,
  source_name text not null,
  status text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  items_found integer not null default 0,
  items_imported integer not null default 0,
  error text,
  constraint rss_import_source_runs_status_check
    check (status in ('succeeded', 'failed')),
  constraint rss_import_source_runs_counts_check
    check (items_found >= 0 and items_imported >= 0)
);

create index if not exists rss_import_source_runs_run_idx
on public.rss_import_source_runs (run_id, started_at);

alter table public.rss_import_settings enable row level security;
alter table public.rss_import_settings force row level security;
alter table public.rss_import_runs enable row level security;
alter table public.rss_import_runs force row level security;
alter table public.rss_import_source_runs enable row level security;
alter table public.rss_import_source_runs force row level security;

revoke all on table public.rss_import_settings
from public, anon, authenticated;
revoke all on table public.rss_import_runs
from public, anon, authenticated;
revoke all on table public.rss_import_source_runs
from public, anon, authenticated;

grant select, update
on table public.rss_import_settings
to service_role;
grant select, insert, update
on table public.rss_import_runs
to service_role;
grant select, insert
on table public.rss_import_source_runs
to service_role;

comment on table public.rss_import_runs is
'Auditable manual and scheduled RSS import executions.';

comment on index public.rss_import_runs_one_running_idx is
'Prevents overlapping imports across manual and scheduled triggers.';

commit;
