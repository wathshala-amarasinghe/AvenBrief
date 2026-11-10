# Automated article verification

Automated verification compares a saved AvenBrief article with the text exposed by its original source URL. It checks material claims, names, dates, numbers, quotations, and attribution, then stores a claim-level report in `article_verifications`.

## Setup

1. Apply `supabase/migrations/20261109000400_article_verifications.sql`.
2. Keep `GEMINI_API_KEY` configured as a server-only environment variable.
3. Optionally set `GEMINI_VERIFICATION_MODEL`; otherwise the article-drafting model and safe model fallback are used.

## Workflow

1. Save the article as a draft.
2. Open the saved article in the admin editor.
3. Select **Run automated verification**.
4. Correct every critical, partial, or unsupported claim.
5. Save the corrected draft and run verification again.
6. Publish only after the exact saved version passes.

The report is tied to a SHA-256 fingerprint of the title, summary, body, and source URL. Editing any of those fields makes the previous report stale. The publish action rejects a sourced article when the current fingerprint does not have a passing report.

This process verifies consistency with the cited publisher. It does not establish that the publisher is accurate, independent, or trustworthy, so final editorial approval remains required.
