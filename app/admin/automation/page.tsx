import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { buildAutomationMonitoring } from "@/lib/automation-monitoring.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { ensureAutomationHealthNotification } from "@/lib/admin-notifications";

export const metadata: Metadata = {
  title: "Automation Monitor | AvenBrief",
  robots: { index: false, follow: false },
};

function formatTimestamp(value?: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(value)) + " Sri Lanka time";
}

function stateStyle(value: string) {
  if (value === "passed" || value === "succeeded") return "bg-green-50 text-green-700";
  if (value === "blocked" || value === "failed") return "bg-red-50 text-red-700";
  if (value === "processing" || value === "running") return "bg-amber-50 text-amber-800";
  return "bg-soft text-muted";
}

async function AutomationContent() {
  await connection();
  const { user } = await requireAdmin();
  await ensureAutomationHealthNotification();
  const supabase = getAdminSupabase();
  const [runsResult, generationsResult, settingsResult] = await Promise.all([
    supabase
      .from("rss_import_runs")
      .select("id, status, started_at, completed_at, items_imported, error")
      .eq("run_type", "scheduled")
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("ai_draft_generations")
      .select("id, inbox_id, article_id, import_run_id, status, started_at, completed_at, error")
      .eq("trigger_type", "scheduled")
      .order("started_at", { ascending: false })
      .limit(30),
    supabase
      .from("rss_import_settings")
      .select("paused, auto_draft_enabled, auto_draft_limit")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const generations = generationsResult.data ?? [];
  const articleIds = generations.map((row) => row.article_id).filter((id): id is string => Boolean(id));
  const inboxIds = generations.map((row) => row.inbox_id);
  const [articlesResult, inboxResult, verificationsResult] = await Promise.all([
    articleIds.length
      ? supabase.from("articles").select("id, title, status").in("id", articleIds)
      : Promise.resolve({ data: [], error: null }),
    inboxIds.length
      ? supabase.from("rss_inbox").select("id, title, source_name").in("id", inboxIds)
      : Promise.resolve({ data: [], error: null }),
    articleIds.length
      ? supabase
          .from("article_verifications")
          .select("article_id, status, publish_ready, started_at, error")
          .in("article_id", articleIds)
          .order("started_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const setupError = Boolean(
    runsResult.error || generationsResult.error || settingsResult.error ||
    articlesResult.error || inboxResult.error || verificationsResult.error,
  );
  const monitoring = buildAutomationMonitoring({
    runs: runsResult.data ?? [],
    generations,
    articles: articlesResult.data ?? [],
    inbox: inboxResult.data ?? [],
    verifications: verificationsResult.data ?? [],
  });
  const settings = settingsResult.data;

  return (
    <AdminShell current="/admin/automation" email={user.email}>
      <main className="mx-auto max-w-[1240px] px-5 py-7 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Scheduled workflow</p>
            <h1 className="mt-2 font-serif text-[38px] font-semibold">Automation monitor</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Track RSS imports, private AI drafts, source verification, and failures. Automatic publishing remains disabled.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/settings" className="rounded-lg border border-border bg-white px-5 py-3 text-sm font-medium hover:bg-soft">Automation settings</Link>
            <Link href="/admin/inbox" className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">Review queue</Link>
          </div>
        </div>

        {setupError && (
          <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Apply <code>20261110000200_ai_automation_monitoring.sql</code> and confirm the earlier automation migrations are installed.</p>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="Latest automation run summary">
          {[
            ["Stories imported", monitoring.summary.storiesImported],
            ["Drafts attempted", monitoring.summary.draftsAttempted],
            ["Drafts created", monitoring.summary.draftsCreated],
            ["Verification passed", monitoring.summary.verificationPassed],
            ["Blocked", monitoring.summary.verificationBlocked],
            ["Failures", monitoring.summary.failures],
          ].map(([label, value]) => (
            <article key={label} className="rounded-xl border border-border bg-white p-5">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 font-serif text-4xl font-semibold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-white p-5"><p className="text-sm text-muted">Latest scheduled import</p><p className="mt-2 font-medium">{formatTimestamp(monitoring.latestRun?.started_at)}</p><p className="mt-1 text-xs capitalize text-muted">Status: {monitoring.latestRun?.status ?? "No run"}</p></article>
          <article className="rounded-xl border border-border bg-white p-5"><p className="text-sm text-muted">RSS automation</p><p className={`mt-2 font-medium ${settings?.paused ? "text-red-700" : "text-green-700"}`}>{settings?.paused ? "Paused" : "Active"}</p><p className="mt-1 text-xs text-muted">Controls importing and downstream drafting</p></article>
          <article className="rounded-xl border border-border bg-white p-5"><p className="text-sm text-muted">AI drafting</p><p className={`mt-2 font-medium ${settings?.auto_draft_enabled ? "text-green-700" : "text-red-700"}`}>{settings?.auto_draft_enabled ? "Active" : "Paused"}</p><p className="mt-1 text-xs text-muted">Limit: {settings?.auto_draft_limit ?? 1} per scheduled run</p></article>
        </section>

        {monitoring.summary.configurationProblems > 0 && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">The recent history contains {monitoring.summary.configurationProblems} Gemini quota or configuration problem{monitoring.summary.configurationProblems === 1 ? "" : "s"}. Check the failure details below and your Vercel environment variables.</p>
        )}

        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border px-6 py-5"><h2 className="font-serif text-2xl font-semibold">Recent scheduled draft attempts</h2><p className="mt-2 text-sm text-muted">Most recent first. Open a created draft to inspect its full verification report.</p></div>
          {monitoring.rows.length ? (
            <div className="divide-y divide-border">
              {monitoring.rows.map((row) => (
                <article key={row.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_130px_130px_170px] lg:items-center">
                  <div className="min-w-0">
                    {row.articleId ? <Link href={`/admin/editor?id=${row.articleId}`} className="font-medium hover:text-brand">{row.title}</Link> : <p className="font-medium">{row.title}</p>}
                    <p className="mt-1 text-xs text-muted">{row.sourceName} · {formatTimestamp(row.startedAt)}</p>
                    {row.error && <p className="mt-2 break-words text-sm text-red-700">{row.error}</p>}
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${stateStyle(row.draftStatus)}`}>Draft: {row.draftStatus}</span>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${stateStyle(row.verificationState)}`}>Verify: {row.verificationState.replace("_", " ")}</span>
                  <div className="text-sm">{row.articleId ? <Link href={`/admin/editor?id=${row.articleId}`} className="text-brand hover:underline">Open private draft →</Link> : <span className="text-muted">No draft created</span>}</div>
                </article>
              ))}
            </div>
          ) : (
            <p className="p-6 text-muted">No scheduled AI draft attempts have been recorded yet. Run the cron after applying the monitoring migration.</p>
          )}
        </section>
      </main>
    </AdminShell>
  );
}

export default function AutomationPage() {
  return <Suspense fallback={<p className="px-6 py-12 text-muted">Loading automation history…</p>}><AutomationContent /></Suspense>;
}
