# RSS review workflow

RSS ingestion is review-first. Imports create private inbox items only; they never publish articles.

## Database setup

Apply every file in `supabase/migrations` in timestamp order. The migrations create the review inbox, source management, category suggestions, scheduled-run history, global pause control, and the draft-creation function.

## Source management

Use `/admin/sources` to add, test, edit, pause, enable, or remove an approved HTTPS RSS or Atom feed. Feed validation checks the URL and parses the response before saving it. Removing a paused source preserves existing inbox and import history.

Each source stores a default category and its last check, success, import count, and error. Publisher categories and title keywords can suggest a more specific category during import; an editor can change that suggestion before creating a draft.

## Review queue

Use `/admin/inbox` to:

- run a manual import;
- search pending or reviewed items;
- inspect the source, summary, and suggested category;
- mark an item reviewed; or
- create a private article draft.

Creating a draft copies the source title and URL. Editorial content remains private until an administrator completes and publishes it.

## Scheduled importing

Vercel calls `GET /api/news/ingest` using `CRON_SECRET` as a Bearer token. `POST` is also available for another trusted scheduler. The endpoint prevents overlapping runs, respects the global pause switch at `/admin/settings`, records source-level outcomes, and never publishes articles.

Keep `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` server-only. Never prefix them with `NEXT_PUBLIC_` or commit their values.
