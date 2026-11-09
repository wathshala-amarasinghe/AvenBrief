# AI-assisted drafts

AI drafting is an optional admin-only step for an imported RSS story. It reads the original publisher page, creates an editable AvenBrief draft, and records the model, confidence score, warnings, outcome, and timestamps. It never publishes an article.

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

If the publisher blocks automated reading or exposes too little article text, use **Create a blank draft instead**. The application deliberately refuses to generate from a headline alone.

## Safety boundaries

- Original-source pages are treated as untrusted input and cannot provide instructions to the model.
- Private-network URLs, unusual ports, oversized responses, unsupported content types, and excessive redirects are blocked.
- Only public publisher text and story metadata are sent to Gemini. Never include passwords, private notes, or personal information in source content.
- Generated drafts are validated before they reach the article table.
- The generation audit table is inaccessible to browser clients.
