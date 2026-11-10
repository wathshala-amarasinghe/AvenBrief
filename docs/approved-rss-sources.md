# Approved RSS sources

Apply `supabase/migrations/20261110000400_expand_approved_rss_sources.sql` to add a second publisher set across all five AvenBrief categories. The migration adds UN News for World, TechCrunch for Technology, Carbon Brief for Climate, Federal Reserve press releases for Finance, and Polygon for Gaming.

Each endpoint was checked for valid RSS or Atom content, recent entries, HTTPS article links, and publicly readable article pages on November 10, 2026. The importer considers at most three recent items per source. Cross-publisher fingerprints and canonical URLs continue to suppress duplicates, while scheduled AI drafting remains limited separately in **Admin → Settings**.

RSS entries are discovery inputs, not republishing permission. AvenBrief creates original summaries, links and attributes the source, verifies drafts against the source page, and keeps every generated article private until editorial review. Administrators can pause or remove a source from **Admin → News sources** if its availability, quality, or terms change.
