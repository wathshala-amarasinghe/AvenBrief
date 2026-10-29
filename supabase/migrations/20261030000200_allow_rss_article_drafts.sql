begin;

-- create_draft_from_rss is SECURITY INVOKER, so its service-role caller needs
-- permission to insert the new private draft into public.articles.
grant insert
on table public.articles
to service_role;

commit;
