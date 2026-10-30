# AvenBrief

AvenBrief is a review-first news publication built with Next.js 16, Supabase, and Tailwind CSS. Public pages show only published articles. RSS imports remain private until an administrator reviews them and creates an editorial draft.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and add the required values.
3. Apply the SQL files in `supabase/migrations` in timestamp order, including the article-image storage bucket migration.
4. Start the application with `npm run dev`.

The public site is available at `http://localhost:3000`. The protected admin area is available at `http://localhost:3000/admin`.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_USER_ID`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Never commit `.env.local` or expose the service-role key and cron secret to client code.

## Quality checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment

Production deploys from the `main` branch to Vercel. `vercel.json` schedules the protected RSS ingestion endpoint once per day. Configure every required environment variable in Vercel before deploying.

Set `NEXT_PUBLIC_SITE_URL` to the production origin, without a trailing path. It controls canonical URLs, the sitemap, robots metadata, and social-sharing links.

See `docs/article-editor.md` and `docs/rss-inbox.md` for editorial workflow details.

## Monitoring

Enable **Web Analytics** and **Speed Insights** in the Vercel project after deployment. Public routes report anonymized traffic and Core Web Vitals; admin and login routes are excluded. Unhandled server errors are written as redacted structured records in Vercel Runtime Logs with the event name `request_error`.
