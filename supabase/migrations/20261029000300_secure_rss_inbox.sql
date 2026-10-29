begin;

-- Remove older policies if the inbox table was originally created in the
-- Supabase dashboard. Browser roles are intentionally denied below.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rss_inbox'
  loop
    execute format(
      'drop policy %I on public.rss_inbox',
      policy_record.policyname
    );
  end loop;
end;
$$;

alter table public.rss_inbox enable row level security;
alter table public.rss_inbox force row level security;

revoke all on table public.rss_inbox
from public, anon, authenticated;

grant select, insert, update, delete
on table public.rss_inbox
to service_role;

revoke all
on function public.create_draft_from_rss(uuid, text)
from public, anon, authenticated;

grant execute
on function public.create_draft_from_rss(uuid, text)
to service_role;

commit;
