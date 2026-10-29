begin;

alter table public.rss_inbox
add column if not exists suggested_category text;

alter table public.rss_inbox
drop constraint if exists rss_inbox_suggested_category_check;

alter table public.rss_inbox
add constraint rss_inbox_suggested_category_check
check (
  suggested_category is null
  or suggested_category in (
    'World',
    'Technology',
    'Climate',
    'Finance',
    'Gaming'
  )
);

comment on column public.rss_inbox.suggested_category is
'Deterministic import suggestion. An administrator may override it before creating a draft.';

commit;
