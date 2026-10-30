begin;

grant select, insert, update, delete
on table public.articles
to service_role;

commit;
