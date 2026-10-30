import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import SubmitButton from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isArticleId } from "@/lib/article-validation.mjs";
import { normaliseQuery } from "@/lib/article-browse.mjs";
import { categories } from "@/lib/categories";
import { suggestRssCategory } from "@/lib/rss-category.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { importRss, markReviewed, createDraft } from "./actions";

export const metadata: Metadata = { title: "Review Queue | AvenBrief", robots: { index: false, follow: false } };

type InboxPageProps = { searchParams: Promise<{ result?: string; view?: string; imported?: string; failed?: string; selected?: string; q?: string }> };

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "Date unavailable";
}

async function InboxContent({ searchParams }: InboxPageProps) {
  await connection();
  const { user } = await requireAdmin();
  const params = await searchParams;
  const reviewed = params.view === "reviewed";
  const queryText = normaliseQuery(params.q);
  let query = getAdminSupabase().from("rss_inbox").select("id, title, source_name, source_url, source_author, source_published_at, imported_at, article_id, suggested_category").eq("status", reviewed ? "reviewed" : "new").order("source_published_at", { ascending: false, nullsFirst: false }).order("imported_at", { ascending: false }).limit(50);
  if (queryText) query = query.ilike("title", `%${queryText.replace(/[\\%_]/g, "\\$&")}%`);
  const { data, error } = await query;
  const stories = (data ?? []).map((story) => ({ ...story, suggested_category: story.suggested_category ?? suggestRssCategory({ title: story.title }) }));
  const requested = typeof params.selected === "string" && isArticleId(params.selected) ? params.selected : null;
  const selected = stories.find((story) => story.id === requested) ?? stories[0] ?? null;
  const viewQuery = reviewed ? "view=reviewed&" : "";
  const imported = Number.parseInt(params.imported ?? "0", 10) || 0;
  const failed = Number.parseInt(params.failed ?? "0", 10) || 0;
  const notices: Record<string, string> = {
    imported: `Import complete: ${imported} new ${imported === 1 ? "story" : "stories"}.${failed ? ` ${failed} source failed.` : ""}`,
    reviewed: "Story moved to Reviewed.", feed_error: "No enabled source completed successfully. Check News Sources.", database_error: "The change could not be saved. Please try again.", empty: "Enabled sources returned no usable stories.", no_sources: "No RSS sources are enabled.", paused: "RSS importing is globally paused.", already_running: "An RSS import is already running.", invalid: "That story could not be identified.", category_required: "Choose a category before creating the draft.", draft_error: "The draft could not be created. Please try again.",
  };
  const notice = params.result ? notices[params.result] : "";

  return (
    <AdminShell current="/admin/inbox" email={user.email}>
      <main className="mx-auto max-w-[1240px] px-5 py-7 md:px-8 md:py-9">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Editorial workflow</p><h1 className="mt-2 font-serif text-[38px] font-semibold">Review queue</h1><p className="mt-2 text-sm text-muted">Choose a source story, verify it, then create an editable draft.</p></div><div className="flex gap-3"><Link href="/admin/sources" className="rounded-[8px] border border-border bg-white px-4 py-3 text-sm hover:bg-soft">Manage sources</Link><form action={importRss}><SubmitButton pendingText="Checking…">Import RSS</SubmitButton></form></div></div>
        {notice && <p role={params.result?.includes("error") ? "alert" : "status"} className="mt-5 rounded-[10px] bg-soft p-4 text-sm text-brand">{notice}</p>}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <nav aria-label="Inbox views" className="flex gap-5 text-sm"><Link href="/admin/inbox" className={!reviewed ? "font-semibold text-brand" : "text-muted"}>To review</Link><Link href="/admin/inbox?view=reviewed" className={reviewed ? "font-semibold text-brand" : "text-muted"}>Reviewed</Link></nav>
          <form action="/admin/inbox" className="flex min-w-[260px] items-center rounded-[8px] border border-border bg-white px-3"><input type="hidden" name="view" value={reviewed ? "reviewed" : ""} /><label htmlFor="queue-search" className="sr-only">Search review queue</label><input id="queue-search" name="q" defaultValue={queryText} placeholder="Search queue" className="w-full bg-transparent py-2.5 text-sm outline-none" /></form>
        </div>

        {error ? <p role="alert" className="mt-6 rounded-[10px] bg-red-50 p-6 text-red-700">The review queue could not be loaded. Verify the RSS migrations and server logs.</p> : stories.length ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.45fr)]">
            <section aria-label="Source stories" className="overflow-hidden rounded-[10px] border border-border bg-white"><div className="border-b border-border px-4 py-3 text-xs text-muted">{stories.length} {stories.length === 1 ? "story" : "stories"}</div><div className="max-h-[720px] divide-y divide-border overflow-y-auto">{stories.map((story) => <Link key={story.id} href={`/admin/inbox?${viewQuery}${queryText ? `q=${encodeURIComponent(queryText)}&` : ""}selected=${story.id}`} className={`block p-4 hover:bg-soft ${selected?.id === story.id ? "bg-soft" : ""}`}><p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{story.source_name}</p><h2 className="mt-2 font-serif text-lg font-semibold leading-snug">{story.title}</h2><p className="mt-2 text-xs text-muted">{date(story.source_published_at)}</p></Link>)}</div></section>

            {selected && <section aria-label="Selected story" className="h-fit rounded-[10px] border border-border bg-white p-6 lg:sticky lg:top-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-brand">{selected.source_name}</p><h2 className="mt-3 max-w-2xl font-serif text-[30px] font-semibold leading-tight">{selected.title}</h2></div><span className="rounded-full bg-soft px-3 py-1 text-xs text-muted">{reviewed ? "Reviewed" : "To review"}</span></div><dl className="mt-6 grid gap-4 border-y border-border py-5 text-sm sm:grid-cols-2"><div><dt className="text-muted">Original author</dt><dd className="mt-1">{selected.source_author || "Not supplied"}</dd></div><div><dt className="text-muted">Published</dt><dd className="mt-1">{date(selected.source_published_at)}</dd></div></dl><a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-medium text-brand hover:underline">Read and verify original →</a>
              <div className="mt-7 rounded-[10px] bg-soft p-5">{selected.article_id ? <Link href={`/admin/editor?id=${selected.article_id}`} className="font-medium text-brand hover:underline">Open created article →</Link> : <form action={createDraft} className="flex flex-wrap items-end gap-3"><input type="hidden" name="id" value={selected.id} /><label className="flex-1 text-sm font-medium">Draft category<select name="category" defaultValue={selected.suggested_category ?? ""} required className="mt-2 w-full rounded-[8px] border border-border bg-white px-4 py-3"><option value="" disabled>Choose a category</option>{categories.map((category) => <option key={category.slug} value={category.name}>{category.name}{selected.suggested_category === category.name ? " (suggested)" : ""}</option>)}</select></label><SubmitButton pendingText="Creating…">Create draft</SubmitButton></form>}</div>
              {!reviewed && <form action={markReviewed} className="mt-4"><input type="hidden" name="id" value={selected.id} /><SubmitButton secondary pendingText="Updating…">Mark reviewed without drafting</SubmitButton></form>}
            </section>}
          </div>
        ) : <div className="mt-6 rounded-[10px] bg-soft p-7"><h2 className="font-serif text-2xl font-semibold">{queryText ? "No matching stories" : reviewed ? "No reviewed stories yet" : "The review queue is clear"}</h2><p className="mt-2 text-sm text-muted">{queryText ? "Try a different search term." : reviewed ? "Stories appear here after review." : "Import from an approved source when you are ready."}</p>{queryText && <Link href={`/admin/inbox${reviewed ? "?view=reviewed" : ""}`} className="mt-4 inline-block text-sm text-brand hover:underline">Clear search →</Link>}</div>}
      </main>
    </AdminShell>
  );
}

export default function InboxPage(props: InboxPageProps) { return <Suspense fallback={<div className="admin-shell min-h-screen bg-[#f7f9fc] p-8 text-muted">Opening review queue…</div>}><InboxContent {...props} /></Suspense>; }
