begin;

alter table public.rss_inbox
drop constraint if exists rss_inbox_status_check;

alter table public.rss_inbox
add constraint rss_inbox_status_check
check (status in ('new', 'reviewed', 'archived'));

alter table public.rss_inbox
add column if not exists archived_at timestamptz;

create index if not exists rss_inbox_editorial_filters_idx
on public.rss_inbox (
  status,
  source_name,
  suggested_category,
  source_published_at desc nulls last
);

comment on column public.rss_inbox.archived_at is
'Timestamp for recoverable editorial archive actions. Archived stories are never deleted.';

commit;
