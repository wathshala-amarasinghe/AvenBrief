begin;

-- Keep imported publisher metadata separate from editable AvenBrief articles.
create table if not exists public.rss_inbox (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_name text not null,
  source_url text not null,
  source_author text not null default '',
  source_published_at timestamptz,
  imported_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'reviewed')),
  article_id uuid references public.articles(id) on delete set null
);

-- Require category values from the application.
alter table public.articles
alter column category drop default;

alter table public.rss_inbox
add column if not exists article_id uuid
references public.articles(id)
on delete set null;

create unique index if not exists rss_inbox_source_url_key
on public.rss_inbox (source_url);

create unique index if not exists rss_inbox_article_id_key
on public.rss_inbox (article_id)
where article_id is not null;

create index if not exists rss_inbox_review_queue_idx
on public.rss_inbox (
  status,
  source_published_at desc nulls last,
  imported_at desc
);

-- Browser clients cannot access imported metadata directly. The application
-- authenticates ADMIN_USER_ID first, then uses its server-only service client.
alter table public.rss_inbox enable row level security;
alter table public.rss_inbox force row level security;

revoke all on table public.rss_inbox
from public, anon, authenticated;

grant select, insert, update, delete
on table public.rss_inbox
to service_role;

-- The service-role RPC inserts an empty, private article draft after the
-- application has authenticated ADMIN_USER_ID.
grant insert
on table public.articles
to service_role;

-- Replace the old function that always selected World.
drop function if exists public.create_draft_from_rss(uuid);

create or replace function public.create_draft_from_rss(
  p_inbox_id uuid,
  p_category text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_story public.rss_inbox%rowtype;
  new_article_id uuid;
  slug_base text;
begin
  if p_category is null
     or p_category not in ('World', 'Technology', 'Climate') then
    raise exception 'Choose a valid category.';
  end if;

  select *
  into source_story
  from public.rss_inbox
  where id = p_inbox_id
  for update;

  if not found then
    raise exception 'Story not found or access denied.';
  end if;

  if source_story.article_id is not null then
    return source_story.article_id;
  end if;

  new_article_id := gen_random_uuid();

  slug_base := regexp_replace(
    lower(left(source_story.title, 60)),
    '[^a-z0-9]+',
    '-',
    'g'
  );

  slug_base := trim(both '-' from slug_base);

  if slug_base = '' then
    slug_base := 'story';
  end if;

  insert into public.articles (
    id,
    title,
    slug,
    summary,
    body,
    category,
    author_name,
    source_url,
    status,
    published_at
  )
  values (
    new_article_id,
    left(source_story.title, 180),
    slug_base || '-' ||
      replace(new_article_id::text, '-', ''),
    '',
    '',
    p_category,
    '',
    source_story.source_url,
    'draft',
    null
  );

  update public.rss_inbox
  set
    article_id = new_article_id,
    status = 'reviewed'
  where id = p_inbox_id;

  if not found then
    raise exception 'Could not link the draft to its source.';
  end if;

  return new_article_id;
end;
$$;

revoke all
on function public.create_draft_from_rss(uuid, text)
from public, anon, authenticated;

grant execute
on function public.create_draft_from_rss(uuid, text)
to service_role;

commit;
