begin;

alter table public.rss_import_runs
add column if not exists queue_items_archived integer not null default 0;

alter table public.rss_import_runs
drop constraint if exists rss_import_runs_queue_items_archived_check;

alter table public.rss_import_runs
add constraint rss_import_runs_queue_items_archived_check
check (queue_items_archived >= 0);

comment on column public.rss_import_runs.queue_items_archived is
'Recoverable review-queue entries archived by retention during this import run.';

commit;

