begin;

create table if not exists public.rss_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null,
  default_category text not null default 'World',
  enabled boolean not null default true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  last_import_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rss_sources_name_length
    check (char_length(name) between 2 and 100),
  constraint rss_sources_feed_url_length
    check (char_length(feed_url) between 1 and 2048),
  constraint rss_sources_default_category_check
    check (default_category in (
      'World',
      'Technology',
      'Climate',
      'Finance',
      'Gaming'
    )),
  constraint rss_sources_last_import_count_check
    check (last_import_count >= 0)
);

create unique index if not exists rss_sources_feed_url_key
on public.rss_sources (feed_url);

create index if not exists rss_sources_enabled_name_idx
on public.rss_sources (enabled desc, name);

alter table public.rss_inbox
add column if not exists source_id uuid
references public.rss_sources(id)
on delete set null;

create index if not exists rss_inbox_source_id_idx
on public.rss_inbox (source_id);

alter table public.rss_sources enable row level security;
alter table public.rss_sources force row level security;

revoke all on table public.rss_sources
from public, anon, authenticated;

grant select, insert, update, delete
on table public.rss_sources
to service_role;

insert into public.rss_sources (
  name,
  feed_url,
  default_category,
  enabled
)
values (
  'Global Voices',
  'https://globalvoices.org/feed/',
  'World',
  true
)
on conflict (feed_url) do nothing;

comment on table public.rss_sources is
'Administrator-approved RSS publishers available to the review-first importer.';

comment on column public.rss_sources.default_category is
'Fallback suggestion used when feed metadata and title rules do not identify a more specific category.';

commit;
