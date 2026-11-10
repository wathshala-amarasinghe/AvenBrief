begin;

alter table public.rss_import_settings
add column if not exists auto_draft_enabled boolean not null default true,
add column if not exists auto_draft_limit smallint not null default 1;

alter table public.rss_import_settings
drop constraint if exists rss_import_settings_auto_draft_limit_check;

alter table public.rss_import_settings
add constraint rss_import_settings_auto_draft_limit_check
check (auto_draft_limit between 1 and 3);

comment on column public.rss_import_settings.auto_draft_enabled is
'When enabled, newly imported scheduled stories are converted into private AI drafts.';

comment on column public.rss_import_settings.auto_draft_limit is
'Maximum number of newly imported stories drafted per scheduled run. Publishing remains manual.';

commit;
