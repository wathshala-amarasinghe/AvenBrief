-- Migration: Add Finance and Gaming to valid categories in create_draft_from_rss
begin;

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
     or p_category not in ('World', 'Technology', 'Climate', 'Finance', 'Gaming') then
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
