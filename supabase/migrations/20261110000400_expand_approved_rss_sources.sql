begin;

insert into public.rss_sources (
  name,
  feed_url,
  default_category,
  enabled,
  max_items_per_import
)
values
  (
    'UN News',
    'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    'World',
    true,
    3
  ),
  (
    'TechCrunch',
    'https://techcrunch.com/feed/',
    'Technology',
    true,
    3
  ),
  (
    'Carbon Brief',
    'https://www.carbonbrief.org/feed',
    'Climate',
    true,
    3
  ),
  (
    'Federal Reserve Press Releases',
    'https://www.federalreserve.gov/feeds/press_all.xml',
    'Finance',
    true,
    3
  ),
  (
    'Polygon',
    'https://www.polygon.com/feed/',
    'Gaming',
    true,
    3
  )
on conflict (feed_url) do nothing;

comment on table public.rss_sources is
'Administrator-approved RSS publishers used for attributed, review-first source discovery.';

commit;
