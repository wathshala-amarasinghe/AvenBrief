# AI-assisted drafts

AI drafting is an admin-only workflow for imported RSS stories. It reads the original publisher page, creates an editable AvenBrief draft, records the model, confidence score, warnings, outcome, and timestamps, and runs source-consistency verification. It never publishes an article.

## Setup

1. Apply `supabase/migrations/20261109000300_ai_draft_generation.sql`.
2. Add `GEMINI_API_KEY` to `.env.local` and the Vercel Production environment.
3. Optionally set `GEMINI_ARTICLE_MODEL`. The default is `gemini-2.5-flash`.
4. Redeploy after changing Vercel environment variables.

The API key is server-only. Do not prefix it with `NEXT_PUBLIC_`, commit it, paste it into an article, or expose it in screenshots.

## Workflow

1. Open **Admin → Review queue** and select an imported story.
2. Open and verify the original publisher link.
3. Choose **Generate AI draft**.
4. Review the confidence score and every warning in the editor.
5. Check names, dates, quotations, figures, attribution, category, source link, image rights, and overall originality.
6. Improve the article and add a credited featured image before publishing.

## Scheduled drafting

Apply `supabase/migrations/20261110000100_scheduled_ai_drafts.sql`, then open **Admin → Settings → Automatic AI drafts**. Scheduled RSS runs can draft between one and three newly imported stories per run. The default is one to protect API quotas. Drafting is sequential, verification runs immediately, and every resulting article remains private until an administrator publishes it.

Pausing RSS imports also prevents scheduled drafting because no new stories are imported. The separate automatic-drafting switch can stop AI generation while leaving RSS importing active.

## Monitoring

Apply `supabase/migrations/20261110000200_ai_automation_monitoring.sql`, then open **Admin → Automation**. The monitor links each scheduled import to its draft attempts and shows imported stories, created drafts, verification outcomes, failures, quota/configuration warnings, and links to private drafts. Stored error messages are redacted before display.

If the publisher blocks automated reading or exposes too little article text, use **Create a blank draft instead**. The application deliberately refuses to generate from a headline alone.

## Safety boundaries

- Original-source pages are treated as untrusted input and cannot provide instructions to the model.
- Private-network URLs, unusual ports, oversized responses, unsupported content types, and excessive redirects are blocked.
- Only public publisher text and story metadata are sent to Gemini. Never include passwords, private notes, or personal information in source content.
- Generated drafts are validated before they reach the article table.
- The generation audit table is inaccessible to browser clients.
