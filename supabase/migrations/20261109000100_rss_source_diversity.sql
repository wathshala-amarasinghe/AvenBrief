begin;

alter table public.rss_sources
add column if not exists max_items_per_import smallint not null default 6;

alter table public.rss_sources
drop constraint if exists rss_sources_max_items_per_import_check;

alter table public.rss_sources
add constraint rss_sources_max_items_per_import_check
check (max_items_per_import between 1 and 12);

alter table public.rss_inbox
add column if not exists story_fingerprint text;

alter table public.rss_inbox
drop constraint if exists rss_inbox_story_fingerprint_length;

alter table public.rss_inbox
add constraint rss_inbox_story_fingerprint_length
check (story_fingerprint is null or char_length(story_fingerprint) <= 500);

update public.rss_inbox
set story_fingerprint = left(
  coalesce(
    to_char(source_published_at at time zone 'UTC', 'YYYY-MM-DD'),
    'undated'
  ) || ':' ||
  trim(regexp_replace(lower(title), '[^[:alnum:]]+', ' ', 'g')),
  500
)
where story_fingerprint is null
  and trim(title) <> '';

create index if not exists rss_inbox_story_fingerprint_idx
on public.rss_inbox (story_fingerprint)
where story_fingerprint is not null;

insert into public.rss_sources (
  name,
  feed_url,
  default_category,
  enabled,
  max_items_per_import
)
values
  (
    'MIT News — Artificial Intelligence',
    'https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml',
    'Technology',
    true,
    4
  ),
  (
    'MIT News — Climate & Sustainability',
    'https://news.mit.edu/rss/topic/climate-change-and-sustainability',
    'Climate',
    true,
    4
  ),
  (
    'MIT News — Business & Management',
    'https://news.mit.edu/rss/topic/business',
    'Finance',
    true,
    4
  ),
  (
    'Xbox Wire',
    'https://news.xbox.com/en-us/feed/',
    'Gaming',
    true,
    4
  )
on conflict (feed_url) do nothing;

comment on column public.rss_sources.max_items_per_import is
'Maximum number of recent feed items considered during each review-first import.';

comment on column public.rss_inbox.story_fingerprint is
'Normalized publication-day and title key used to suppress syndicated duplicates across publishers.';

commit;
