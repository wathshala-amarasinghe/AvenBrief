begin;

alter table public.ai_draft_generations
add column if not exists trigger_type text not null default 'manual',
add column if not exists import_run_id uuid references public.rss_import_runs(id) on delete set null;

alter table public.ai_draft_generations
drop constraint if exists ai_draft_generations_trigger_type_check;

alter table public.ai_draft_generations
add constraint ai_draft_generations_trigger_type_check
check (trigger_type in ('manual', 'scheduled'));

create index if not exists ai_draft_generations_trigger_started_idx
on public.ai_draft_generations (trigger_type, started_at desc);

create index if not exists ai_draft_generations_import_run_idx
on public.ai_draft_generations (import_run_id, started_at);

comment on column public.ai_draft_generations.trigger_type is
'Whether an administrator or the scheduled RSS workflow initiated the draft.';

comment on column public.ai_draft_generations.import_run_id is
'Scheduled RSS import that initiated this draft, when applicable.';

commit;
