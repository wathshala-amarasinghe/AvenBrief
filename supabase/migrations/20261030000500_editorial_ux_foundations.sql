begin;

alter table public.articles
  add column if not exists featured_image_url text,
  add column if not exists image_alt text not null default '',
  add column if not exists image_credit text not null default '';

alter table public.articles
  drop constraint if exists articles_featured_image_url_length,
  add constraint articles_featured_image_url_length
    check (featured_image_url is null or char_length(featured_image_url) <= 2048),
  drop constraint if exists articles_image_alt_length,
  add constraint articles_image_alt_length check (char_length(image_alt) <= 300),
  drop constraint if exists articles_image_credit_length,
  add constraint articles_image_credit_length check (char_length(image_credit) <= 300);

-- Remove the known invalid entry that points to an article page rather than a feed.
delete from public.rss_sources
where name = 'AvenBrief Editorial Team'
  and feed_url like 'https://globalvoices.org/2026/10/26/volunteers-from-poland-%';

comment on column public.articles.featured_image_url is
'Optional public HTTPS image used on article cards and reader pages.';
comment on column public.articles.image_alt is
'Alternative text describing the featured image.';
comment on column public.articles.image_credit is
'Optional photographer, publisher, or image-rights credit.';

commit;
