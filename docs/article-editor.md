# Article editor

The protected editor at `/admin/editor` creates and updates private drafts and published articles.

## Workflow

1. Sign in with the Supabase account identified by `ADMIN_USER_ID`.
2. Open **New article** from the dashboard, or open an existing article.
3. Enter the title. A URL slug is generated automatically and locks after the first save.
4. Add the category, author, summary, article body, source URL, and optional featured-image details.
5. Save privately with **Save draft**, or choose **Publish** after the content passes validation.

Publishing requires an author, a summary of at least 20 characters, and an article body of at least 50 characters. A featured image must use a public HTTPS URL and requires alternative text before publication.

Saving a published article as a draft removes it from the homepage, search, category pages, public API, and direct article route. Republishing restores the same URL and original publication time.

## Security

- Every editor page and Server Action verifies the current admin identity.
- Drafts are never returned by public article queries.
- Public reads use the anonymous Supabase client and database row-level security.
- Article bodies are rendered as text rather than executable HTML.
- Source and image URLs are validated on the server.

Apply `20261030000500_editorial_ux_foundations.sql` before using featured-image fields.
