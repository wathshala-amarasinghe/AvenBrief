# RSS review inbox

The RSS inbox is review-first. Importing a publisher headline never publishes
an AvenBrief article. Creating a draft copies only the title and source URL;
the summary, article body and AvenBrief author remain empty until an editor
writes them.

New imports use publisher RSS categories first and title keywords second to
suggest World, Technology, Climate, Finance, or Gaming. The suggestion is
preselected in the inbox, but an administrator can change it before creating
the draft. Uncertain stories safely default to World.

## Server configuration

Copy the variable names from `.env.example` into `.env.local`. Keep the real
values out of Git and chat. `SUPABASE_SERVICE_ROLE_KEY` must only be configured
on the server; it bypasses Row Level Security.

The application still authenticates the signed-in user with `requireAdmin()`
and `ADMIN_USER_ID` before creating the service-role client. The service client
is limited to server-only modules and is used for the protected RSS inbox.

## Database setup

Apply the SQL files in `supabase/migrations` in timestamp order. The migrations:

- create `public.rss_inbox` when it does not exist;
- add unique source URL and linked-article indexes;
- create the review-queue index;
- enable and force RLS;
- remove direct access for anonymous and authenticated browser roles; and
- allow the server-only service role to manage the inbox and call
  `create_draft_from_rss`; and
- allow that security-invoker function to insert a private article draft.

The existing `public.articles` table and its article-editor schema are still
prerequisites.

## Approved sources

Apply `20261030000300_rss_sources.sql` after the earlier inbox migrations. It
creates `public.rss_sources`, links inbox rows to their publisher, and adds
Global Voices as the initial enabled source.

Open `/admin/sources` to:

- add an approved HTTPS RSS feed;
- edit its publisher name, feed URL, and fallback category;
- pause or re-enable the source; and
- review its last check, last successful check, imported count, and error.

The manual **Import RSS** action reads every enabled source. Each source has a
10-second request timeout and a 2 MB response limit. A failed source records
its error without stopping the remaining sources. Source URLs are restricted
to public HTTPS endpoints, and redirects are checked before they are followed.

The fallback category is used only when the publisher metadata and title rules
do not find a more specific match. Category suggestions remain editable before
draft creation.

## Manual verification

1. Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
2. Run `npm run dev`, sign in as the configured admin, and open `/admin/inbox`.
3. Import RSS. Confirm new Global Voices links appear in **To review**.
   Confirm each new item has a preselected category marked **suggested**.
4. Import again. Confirm duplicate source URLs are not added.
5. Mark one item reviewed and confirm it moves to **Reviewed**.
6. Choose a category for another item and create a draft.
7. Open the draft. Confirm the title and source URL were copied, while the
   summary, body, and author are empty.
8. In a signed-out browser, confirm the draft is absent from the homepage,
   search, category pages, `/api/articles`, and its direct article URL.
9. Add original editorial content and publish it. Confirm it becomes public.
10. Save it as a draft again and confirm it disappears from public views.

For source-management verification, add a second approved feed, import once,
and confirm both publishers record a successful check. Pause the second source,
import again, and confirm its last-check timestamp does not change. A deliberately
invalid or unavailable public feed should record an error without preventing
Global Voices from completing.

## Scheduled importing

Apply `20261030000400_scheduled_rss_imports.sql` after the source-management
migration. It adds the global pause setting, import-run history, per-source run
history, and a database constraint that permits only one running import.

Create a random value of at least 32 characters and save it as
`CRON_SECRET` in `.env.local` and in the deployment environment. Never
prefix it with `NEXT_PUBLIC_`, commit it, or send it in chat.

Schedulers call this provider-independent endpoint:

```text
GET or POST /api/news/ingest
Authorization: Bearer <CRON_SECRET>
```

The endpoint returns a JSON summary and never publishes an article. It only
stores deduplicated items in the review inbox. Unauthorized calls return 401;
missing server configuration returns 503. A global pause or overlapping run is
recorded as skipped and returns safely without starting another import.

The `/admin/sources` page contains the global pause control and the ten most
recent manual or scheduled runs. Manual imports and scheduler calls use the
same importer and audit tables.

Connect the endpoint to a recurring provider only after deployment hosting is
chosen. Configure the provider to send the secret in the Authorization header,
not in a URL query parameter.

### Vercel Hobby schedule

`vercel.json` registers `/api/news/ingest` once per day at `00:00 UTC`. This is
approximately 05:30 in Sri Lanka. Vercel Hobby may invoke the job at any point
within the scheduled hour, and it does not retry failed Cron invocations.

In the Vercel project settings, add `CRON_SECRET` to the Production environment
using the same private random value used locally. Vercel automatically sends
that value as a Bearer authorization header when it invokes the Cron route.
Cron Jobs run only on production deployments, not preview deployments.

A second authenticated account that does not match `ADMIN_USER_ID` must be
redirected away before the service-role client is created.
