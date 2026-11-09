import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { buildEditorialAnalytics } from "@/lib/editorial-analytics.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Editorial Analytics | AvenBrief",
  robots: { index: false, follow: false },
};

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function healthStyle(health: string) {
  if (health === "healthy") return "bg-green-50 text-green-700";
  if (health === "error") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

async function AnalyticsContent() {
  await connection();
  const { user } = await requireAdmin();
  const supabase = getAdminSupabase();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString();

  const [articlesResult, inboxResult, sourcesResult, sourceRunsResult] =
    await Promise.all([
      supabase
        .from("articles")
        .select("id, status, category, published_at, created_at")
        .limit(1000),
      supabase
        .from("rss_inbox")
        .select(
          "id, title, status, source_name, source_published_at, imported_at, article_id, suggested_category",
        )
        .limit(1000),
      supabase
        .from("rss_sources")
        .select(
          "id, name, enabled, last_error, last_success_at, default_category",
        )
        .order("name"),
      supabase
        .from("rss_import_source_runs")
        .select("source_name, status, started_at")
        .gte("started_at", thirtyDaysAgo)
        .order("started_at", { ascending: false })
        .limit(1000),
    ]);

  const hasError = Boolean(
    articlesResult.error ||
      inboxResult.error ||
      sourcesResult.error ||
      sourceRunsResult.error,
  );
  const analytics = buildEditorialAnalytics({
    articles: articlesResult.data ?? [],
    inbox: inboxResult.data ?? [],
    sources: sourcesResult.data ?? [],
    sourceRuns: sourceRunsResult.data ?? [],
    now,
  });
  const maxDaily = Math.max(5, ...analytics.daily.map((row) => row.published));
  const maxCategory = Math.max(
    1,
    ...analytics.categories.map((row) => row.published),
  );

  return (
    <AdminShell current="/admin/analytics" email={user.email}>
      <main className="mx-auto max-w-[1240px] px-5 py-7 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Editorial operations
            </p>
            <h1 className="mt-2 font-serif text-[38px] font-semibold">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Monitor publishing pace, queue health, category balance, and how approved sources convert into finished reporting.
            </p>
          </div>
          <Link
            href="/admin/inbox"
            className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Manage review queue
          </Link>
        </div>

        {hasError && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Some analytics could not be loaded. Apply the analytics migration and check the server log.
          </p>
        )}

        <section aria-label="Editorial summary" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-border bg-white p-5">
            <p className="text-sm text-muted">Published today</p>
            <p className="mt-2 font-serif text-4xl font-semibold">{analytics.summary.publishedToday}</p>
            <p className="mt-1 text-xs text-muted">Daily target: 2–5</p>
          </article>
          <article className="rounded-xl border border-border bg-white p-5">
            <p className="text-sm text-muted">Awaiting review</p>
            <p className="mt-2 font-serif text-4xl font-semibold">{analytics.summary.awaitingReview}</p>
            <p className="mt-1 text-xs text-muted">{analytics.summary.imported} imported overall</p>
          </article>
          <article className="rounded-xl border border-border bg-white p-5">
            <p className="text-sm text-muted">Draft conversion</p>
            <p className="mt-2 font-serif text-4xl font-semibold">{analytics.summary.drafted}</p>
            <p className="mt-1 text-xs text-muted">Stories converted to drafts</p>
          </article>
          <article className="rounded-xl border border-border bg-white p-5">
            <p className="text-sm text-muted">Published from feeds</p>
            <p className="mt-2 font-serif text-4xl font-semibold">{analytics.summary.publishedFromFeeds}</p>
            <p className="mt-1 text-xs text-muted">{analytics.summary.archived} safely archived</p>
          </article>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-serif text-2xl font-semibold">Seven-day publishing pace</h2>
            <div className="mt-6 grid grid-cols-7 items-end gap-3" style={{ minHeight: 220 }}>
              {analytics.daily.map((row) => (
                <div key={row.day} className="flex h-full flex-col items-center justify-end gap-2">
                  <span className="text-xs font-semibold">{row.published}</span>
                  <div
                    className="w-full rounded-t-md bg-brand"
                    style={{ height: `${Math.max(4, (row.published / maxDaily) * 160)}px` }}
                    aria-label={`${row.published} published on ${row.day}`}
                  />
                  <span className="text-[11px] text-muted">{shortDate(row.day)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-serif text-2xl font-semibold">Published by category</h2>
            <div className="mt-6 space-y-4">
              {analytics.categories.map((row) => (
                <div key={row.category}>
                  <div className="flex justify-between text-sm">
                    <span>{row.category}</span>
                    <span className="font-semibold">{row.published}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(row.published / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border px-6 py-5">
            <h2 className="font-serif text-2xl font-semibold">Source performance</h2>
            <p className="mt-2 text-sm text-muted">Import reliability uses the last 30 days. Conversion measures published stories against imported stories.</p>
          </div>
          {analytics.sourceMetrics.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-soft text-xs text-muted">
                  <tr>
                    <th className="px-6 py-3 font-medium">Publisher</th>
                    <th className="px-4 py-3 font-medium">Health</th>
                    <th className="px-4 py-3 font-medium">Imported</th>
                    <th className="px-4 py-3 font-medium">Drafted</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                    <th className="px-4 py-3 font-medium">Conversion</th>
                    <th className="px-4 py-3 font-medium">Import success</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.sourceMetrics.map((source) => (
                    <tr key={source.name}>
                      <td className="px-6 py-4"><p className="font-medium">{source.name}</p><p className="mt-1 text-xs text-muted">{source.category}{source.enabled ? " · enabled" : " · paused"}</p></td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${healthStyle(source.health)}`}>{source.health}</span></td>
                      <td className="px-4 py-4">{source.imported}</td>
                      <td className="px-4 py-4">{source.drafted}</td>
                      <td className="px-4 py-4">{source.published}</td>
                      <td className="px-4 py-4">{source.conversionRate}%</td>
                      <td className="px-4 py-4">{source.successRate === null ? "No runs" : `${source.successRate}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-muted">No source activity is available yet.</p>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div><h2 className="font-serif text-2xl font-semibold">Oldest awaiting review</h2><p className="mt-1 text-sm text-muted">Review or archive stale stories before they crowd out newer coverage.</p></div>
            <Link href="/admin/inbox?age=stale" className="text-sm text-brand hover:underline">Open filtered queue →</Link>
          </div>
          {analytics.oldestQueue.length ? (
            <div className="divide-y divide-border">
              {analytics.oldestQueue.map((story) => (
                <article key={story.id} className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_150px_80px] sm:items-center">
                  <div><Link href={`/admin/inbox?selected=${story.id}`} className="font-medium hover:text-brand">{story.title}</Link><p className="mt-1 text-xs text-muted">{story.source_name} · {story.suggested_category ?? "Unassigned"}</p></div>
                  <span className="text-sm text-muted">{story.ageDays} days old</span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${story.ageDays >= 7 ? "bg-amber-50 text-amber-800" : "bg-soft text-muted"}`}>{story.ageDays >= 7 ? "Stale" : "Recent"}</span>
                </article>
              ))}
            </div>
          ) : (
            <p className="p-6 text-muted">The review queue is clear.</p>
          )}
        </section>
      </main>
    </AdminShell>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<p className="px-6 py-12 text-muted">Loading editorial analytics…</p>}>
      <AnalyticsContent />
    </Suspense>
  );
}
