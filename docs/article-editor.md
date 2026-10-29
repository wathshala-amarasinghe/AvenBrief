# Article editor

The existing Supabase articles table, admin user ID, RLS policies, and environment variables are required. This feature adds no database migration and no new package dependencies.

## Try it locally

1. Run npm ci, npm test, npm run lint, and npm run build.
2. Start npm run dev and sign in at /login.
3. Open /admin and choose New article.
4. Enter a title and a unique lowercase URL name such as my-first-report.
5. Choose Save Draft. The editor redirects to the saved record; refreshing or saving again updates that same article.
6. Fill in an author, a summary of at least 20 characters, and an article body of at least 50 characters. Choose Publish.
7. Follow View published article. The article also appears in Latest from AvenBrief on the homepage.
8. Save Draft on a published article to remove it from public views. Publish it again to restore it.

URL names remain fixed after the first save, including for an existing database draft. Choose a new URL name when starting a new article. An existing title, body, summary, source and category can be edited. Body text is rendered as text, not HTML. Images and rich-text editing are outside this change.

## Access and publishing checks

- A signed-out visitor opening /admin/editor or a saved editor URL is redirected to /login.
- Test with a second non-admin account: the editor redirects to /login, the public API cannot expose drafts, and writes must fail under the existing RLS policy.
- Create a draft. Its direct /news/URL-name page must return not found in an incognito window, and /api/articles must omit it.
- Publish the same article, refresh the incognito page, and confirm its title, body, author and optional source appear.
- Edit the published article and publish again. Confirm the same URL now shows the changes and the original publication time is retained.
- Save it as a draft. Refresh both the public article and homepage; the article must no longer be public.
- Try a duplicate URL name, a missing publish author, and a javascript: source. Saving must show an error while retaining the form text.
- Refresh after saving a new draft: no extra database row should be created.
- Enter literal <script>alert(1)</script> in body text: the public page should display text, never execute it.

Public reads use a separate anonymous Supabase client. Public data is fetched at request time behind Suspense; no shared cache stores a private draft or stale publication state. Server Actions verify admin identity again before each write. Public pages depend on the existing policy allowing only status = published with published_at <= now().

The existing RSS page still links to external publishers. The Latest homepage section, category lists and Search now read published articles from Supabase. Sample articles remain separately labelled on the homepage.

## Automated checks

npm test runs article validation and browse-query tests with Node's built-in test runner. Browse tests use the real Supabase SDK with an intercepted fetch, without connecting to a database. The Editor checks GitHub Actions workflow also runs lint and a production build without database credentials. Authenticated saves and RLS behavior require the manual checks above against your configured Supabase project.

## Categories and search

- Open /category/technology after publishing a Technology article. It should appear there and remain absent from /category/world.
- Search for a distinctive word in the title or summary, or for Technology. Submit with Enter or the Search button.
- The URL stores the query as /search?q=your-query and pagination as &page=2, so links can be shared.
- Clear search to return to all published articles. Changing the query starts again at page 1.
- Lists show 12 stories per page with a total count and previous/next links when needed.
- Search and category results include only publicly readable published articles. Saving an article as Draft removes it from these lists on the next request.
- Move an article to a different category, republish, and verify that both category lists reflect the change.
- A database error displays an unavailable message; a successful query with no matches displays a distinct empty state.
- Confirm that quotes, commas, parentheses and Unicode search terms do not cause a query syntax error. Asterisks follow PostgREST's LIKE wildcard convention; percent and underscore are searched literally.

No new database columns or policies are needed. A quoted OR filter searches title, summary and category while a separate status filter and the existing RLS policy continue to restrict public visibility.
