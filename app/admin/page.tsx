import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const metadata: Metadata = { title: "Admin Dashboard | AvenBrief", robots: { index: false, follow: false } };

async function AdminDashboard() {
  await connection();
  const { user } = await requireAdmin();
  const supabase = getAdminSupabase();
  const [articleResult, articleCountResult, publishedCountResult, reviewResult, sourceResult] = await Promise.all([
    supabase.from("articles").select("id, title, status, category, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("rss_inbox").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("rss_sources").select("id", { count: "exact", head: true }).eq("enabled", true),
  ]);
  const articles = articleResult.data ?? [];
  const metricError = articleCountResult.error || publishedCountResult.error || reviewResult.error || sourceResult.error;

  return (
    <AdminShell current="/admin" email={user.email}>
      <main className="mx-auto max-w-295 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">AvenBrief newsroom</p><h1 className="mt-2 font-serif text-[38px] font-semibold">Overview</h1><p className="mt-2 text-sm text-muted">A clear view of what needs your attention today.</p></div>
          <Link href="/admin/editor" className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">New article</Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Newsroom metrics">
          {[{ label: "All articles", value: articleCountResult.count ?? 0, note: `${publishedCountResult.count ?? 0} published` }, { label: "Awaiting review", value: reviewResult.count ?? 0, note: "From approved feeds" }, { label: "Active sources", value: sourceResult.count ?? 0, note: "Scheduled for import" }].map((metric) => (
            <article key={metric.label} className="rounded-[10px] border border-border bg-white p-5"><p className="text-sm text-muted">{metric.label}</p><p className="mt-3 font-serif text-[36px] font-semibold">{metric.value}</p><p className="mt-1 text-xs text-muted">{metric.note}</p></article>
          ))}
        </section>

        {metricError && <p role="alert" className="mt-4 rounded-[10px] bg-red-50 p-4 text-sm text-red-700">Some dashboard totals could not be loaded. Open the related page for current data and check the server log.</p>}

        <section className="mt-8 rounded-[10px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="font-serif text-2xl font-semibold">Recent articles</h2><Link href="/admin/editor" className="text-sm text-brand hover:underline">View editor →</Link></div>
          {articleResult.error ? <p role="alert" className="p-6 text-red-700">Could not load articles. Please try again.</p> : articles.length ? (
            <div className="divide-y divide-border">{articles.map((article) => <article key={article.id} className="grid items-center gap-3 px-5 py-4 sm:grid-cols-[1fr_120px_90px]"><div><Link href={`/admin/editor?id=${article.id}`} className="font-medium hover:text-brand">{article.title}</Link><p className="mt-1 text-xs text-muted">{article.category}</p></div><span className="text-xs text-muted">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(article.created_at))}</span><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${article.status === "published" ? "bg-green-50 text-green-700" : "bg-soft text-muted"}`}>{article.status}</span></article>)}</div>
          ) : <p className="p-6 text-muted">You have no articles yet.</p>}
        </section>
      </main>
    </AdminShell>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<p className="px-6 py-12 text-muted">Checking admin access…</p>}><AdminDashboard /></Suspense>;
}
