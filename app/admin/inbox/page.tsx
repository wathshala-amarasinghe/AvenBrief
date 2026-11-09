import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import SubmitButton from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { isArticleId } from "@/lib/article-validation.mjs";
import { normaliseQuery } from "@/lib/article-browse.mjs";
import { categories } from "@/lib/categories";
import { suggestRssCategory } from "@/lib/rss-category.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  archiveStories,
  createAiDraft,
  createDraft,
  importRss,
  markReviewed,
  restoreStories,
} from "./actions";

export const metadata: Metadata = {
  title: "Review Queue | AvenBrief",
  robots: { index: false, follow: false },
};

type InboxPageProps = {
  searchParams: Promise<{
    result?: string;
    view?: string;
    imported?: string;
    failed?: string;
    selected?: string;
    q?: string;
    source?: string;
    category?: string;
    age?: string;
    count?: string;
  }>;
};

type QueueView = "new" | "reviewed" | "archived";

function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Date unavailable";
}

function sourceDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Publisher website";
  }
}

function queueHref(
  view: QueueView,
  filters: { q: string; source: string; category: string; age: string },
) {
  const search = new URLSearchParams();
  if (view !== "new") search.set("view", view);
  if (filters.q) search.set("q", filters.q);
  if (filters.source) search.set("source", filters.source);
  if (filters.category) search.set("category", filters.category);
  if (filters.age) search.set("age", filters.age);
  const query = search.toString();
  return `/admin/inbox${query ? `?${query}` : ""}`;
}

async function InboxContent({ searchParams }: InboxPageProps) {
  await connection();
  const { user } = await requireAdmin();
  const params = await searchParams;
  const view: QueueView =
    params.view === "reviewed"
      ? "reviewed"
      : params.view === "archived"
        ? "archived"
        : "new";
  const queryText = normaliseQuery(params.q);
  const sourceFilter = typeof params.source === "string"
    ? params.source.trim().slice(0, 100)
    : "";
  const categoryFilter = categories.some(
    (category) => category.name === params.category,
  )
    ? params.category ?? ""
    : "";
  const ageFilter = ["24h", "7d", "30d", "stale"].includes(params.age ?? "")
    ? params.age ?? ""
    : "";
  const filters = {
    q: queryText,
    source: sourceFilter,
    category: categoryFilter,
    age: ageFilter,
  };
  const supabase = getAdminSupabase();

  let query = supabase
    .from("rss_inbox")
    .select(
      "id, title, source_name, source_url, source_author, source_published_at, imported_at, article_id, suggested_category",
    )
    .eq("status", view)
    .order("source_published_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false })
    .limit(50);

  if (queryText) {
    query = query.ilike("title", `%${queryText.replace(/[\\%_]/g, "\\$&")}%`);
  }
  if (sourceFilter) query = query.eq("source_name", sourceFilter);
  if (categoryFilter) query = query.eq("suggested_category", categoryFilter);
  if (ageFilter) {
    const ageDays = ageFilter === "24h" ? 1 : ageFilter === "7d" ? 7 : 30;
    const boundary = new Date(new Date().getTime() - ageDays * 24 * 60 * 60 * 1000)
      .toISOString();
    query = ageFilter === "stale"
      ? query.lt("imported_at", boundary)
      : query.gte("imported_at", boundary);
  }

  const [storiesResult, sourcesResult] = await Promise.all([
    query,
    supabase.from("rss_sources").select("name").order("name"),
  ]);
  const { data, error } = storiesResult;
  const availableSources = (sourcesResult.data ?? []).map((source) => source.name);
  const stories = (data ?? []).map((story) => ({
    ...story,
    suggested_category:
      story.suggested_category ?? suggestRssCategory({ title: story.title }),
  }));
  const requested =
    typeof params.selected === "string" && isArticleId(params.selected)
      ? params.selected
      : null;
  const selected = stories.find((story) => story.id === requested) ?? stories[0] ?? null;
  const imported = Number.parseInt(params.imported ?? "0", 10) || 0;
  const failed = Number.parseInt(params.failed ?? "0", 10) || 0;
  const changed = Number.parseInt(params.count ?? "0", 10) || 0;
  const notices: Record<string, string> = {
    imported: `Import complete: ${imported} new ${imported === 1 ? "story" : "stories"}.${failed ? ` ${failed} source failed.` : ""}`,
    reviewed: "Story moved to Reviewed.",
    archived: `${changed} ${changed === 1 ? "story" : "stories"} archived. This can be undone from the Archived view.`,
    restored: `${changed} ${changed === 1 ? "story" : "stories"} restored to the review queue.`,
    selection_required: "Select at least one story first.",
    feed_error: "No enabled source completed successfully. Check News Sources.",
    database_error: "The change could not be saved. Please try again.",
    empty: "Enabled sources returned no usable stories.",
    no_sources: "No RSS sources are enabled.",
    paused: "RSS importing is globally paused.",
    already_running: "An RSS import is already running.",
    invalid: "That story could not be identified.",
    category_required: "Choose a category before creating the draft.",
    draft_error: "The draft could not be created. Please try again.",
    ai_not_configured: "AI drafting is not configured yet. Add GEMINI_API_KEY in Vercel, then redeploy.",
    ai_source_unavailable: "The original article could not be read safely. Open the source and create a manual draft instead.",
    ai_generation_failed: "The AI service could not create a valid draft. Please try again or create a manual draft.",
    ai_insufficient_source: "The source did not contain enough reliable information for an AI draft.",
    ai_running: "An AI draft is already being generated for this story.",
    ai_setup_required: "Apply migration 20261109000300_ai_draft_generation.sql before using AI drafts.",
  };
  const notice = params.result ? notices[params.result] : "";
  const hasFilters = Boolean(
    queryText || sourceFilter || categoryFilter || ageFilter,
  );

  return (
    <AdminShell current="/admin/inbox" email={user.email}>
      <main className="mx-auto max-w-[1240px] px-5 py-7 md:px-8 md:py-9">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Editorial workflow</p>
            <h1 className="mt-2 font-serif text-[38px] font-semibold">Review queue</h1>
            <p className="mt-2 text-sm text-muted">Filter source stories, verify originals, and move unsuitable coverage into a recoverable archive.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/analytics" className="rounded-lg border border-border bg-white px-4 py-3 text-sm hover:bg-soft">View analytics</Link>
            <Link href="/admin/sources" className="rounded-lg border border-border bg-white px-4 py-3 text-sm hover:bg-soft">Manage sources</Link>
            <form action={importRss}><SubmitButton pendingText="Checking…">Import RSS</SubmitButton></form>
          </div>
        </div>

        {notice && (
          <p
            role={["database_error", "feed_error", "draft_error"].includes(params.result ?? "") || (params.result ?? "").startsWith("ai_") ? "alert" : "status"}
            className="mt-5 rounded-xl bg-soft p-4 text-sm text-brand"
          >
            {notice}
          </p>
        )}

        <div className="mt-7 border-b border-border pb-5">
          <nav aria-label="Inbox views" className="flex gap-5 text-sm">
            {([
              ["new", "To review"],
              ["reviewed", "Reviewed"],
              ["archived", "Archived"],
            ] as const).map(([value, label]) => (
              <Link
                key={value}
                href={queueHref(value, filters)}
                className={view === value ? "font-semibold text-brand" : "text-muted"}
              >
                {label}
              </Link>
            ))}
          </nav>

          <form action="/admin/inbox" className="mt-5 grid gap-3 md:grid-cols-[minmax(220px,1fr)_190px_160px_160px_auto]">
            {view !== "new" && <input type="hidden" name="view" value={view} />}
            <label className="sr-only" htmlFor="queue-search">Search review queue</label>
            <input id="queue-search" name="q" defaultValue={queryText} placeholder="Search story titles" className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />
            <label className="sr-only" htmlFor="queue-source">Publisher</label>
            <select id="queue-source" name="source" defaultValue={sourceFilter} className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
              <option value="">All publishers</option>
              {availableSources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <label className="sr-only" htmlFor="queue-category">Category</label>
            <select id="queue-category" name="category" defaultValue={categoryFilter} className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="queue-age">Story age</label>
            <select id="queue-age" name="age" defaultValue={ageFilter} className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
              <option value="">Any age</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="stale">Older than 30 days</option>
            </select>
            <button type="submit" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Apply filters</button>
          </form>
          {hasFilters && <Link href={queueHref(view, { q: "", source: "", category: "", age: "" })} className="mt-3 inline-block text-xs text-brand hover:underline">Clear all filters →</Link>}
        </div>

        {error ? (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-6 text-red-700">The review queue could not be loaded. Apply the editorial analytics migration and check the server logs.</p>
        ) : stories.length ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(320px,0.88fr)_minmax(0,1.42fr)]">
            <form action={view === "archived" ? restoreStories : archiveStories} className="overflow-hidden rounded-xl border border-border bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <span className="text-xs text-muted">{stories.length} {stories.length === 1 ? "story" : "stories"}</span>
                <ConfirmSubmitButton
                  confirmation={view === "archived" ? "Restore the selected stories to the review queue?" : "Archive the selected stories? They will leave this queue but can be restored later."}
                  pendingText={view === "archived" ? "Restoring…" : "Archiving…"}
                  destructive={view !== "archived"}
                >
                  {view === "archived" ? "Restore selected" : "Archive selected"}
                </ConfirmSubmitButton>
              </div>
              <div className="max-h-[720px] divide-y divide-border overflow-y-auto">
                {stories.map((story) => {
                  const baseHref = queueHref(view, filters);
                  return (
                    <div key={story.id} className={`flex items-start gap-3 p-4 hover:bg-soft ${selected?.id === story.id ? "bg-soft" : ""}`}>
                      <input type="checkbox" name="ids" value={story.id} aria-label={`Select ${story.title}`} className="mt-1 h-4 w-4 accent-blue-600" />
                      <Link href={`${baseHref}${baseHref.includes("?") ? "&" : "?"}selected=${story.id}`} className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{story.source_name}</p>
                        <h2 className="mt-2 font-serif text-lg font-semibold leading-snug">{story.title}</h2>
                        <p className="mt-2 text-xs text-muted">{sourceDomain(story.source_url)} · {story.suggested_category} · {date(story.source_published_at)}</p>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </form>

            {selected && (
              <section aria-label="Selected story" className="h-fit rounded-xl border border-border bg-white p-6 lg:sticky lg:top-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand">{selected.source_name}</p>
                    <p className="mt-1 text-xs text-muted">Publisher · {sourceDomain(selected.source_url)}</p>
                    <h2 className="mt-3 max-w-2xl font-serif text-[30px] font-semibold leading-tight">{selected.title}</h2>
                  </div>
                  <span className="rounded-full bg-soft px-3 py-1 text-xs capitalize text-muted">{view === "new" ? "To review" : view}</span>
                </div>
                <dl className="mt-6 grid gap-4 border-y border-border py-5 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted">Original author</dt><dd className="mt-1">{selected.source_author || "Not supplied"}</dd></div>
                  <div><dt className="text-muted">Published</dt><dd className="mt-1">{date(selected.source_published_at)}</dd></div>
                </dl>
                <a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-medium text-brand hover:underline">Read and verify original →</a>

                <div className="mt-7 rounded-xl bg-soft p-5">
                  {selected.article_id ? (
                    <Link href={`/admin/editor?id=${selected.article_id}`} className="font-medium text-brand hover:underline">Open created article →</Link>
                  ) : view === "archived" ? (
                    <p className="text-sm text-muted">Restore this story before creating a draft.</p>
                  ) : (
                    <div>
                      <form action={createAiDraft}>
                        <input type="hidden" name="id" value={selected.id} />
                        <p className="mb-3 text-sm text-muted">AI reads the original, writes an editable article and saves it privately. It never publishes automatically.</p>
                        <SubmitButton pendingText="Writing AI draft…">Generate AI draft</SubmitButton>
                      </form>
                      <details className="mt-5 border-t border-border pt-4">
                        <summary className="cursor-pointer text-sm font-medium text-brand">Create a blank draft instead</summary>
                        <form action={createDraft} className="mt-4 flex flex-wrap items-end gap-3">
                          <input type="hidden" name="id" value={selected.id} />
                          <label className="flex-1 text-sm font-medium">Draft category
                            <select name="category" defaultValue={selected.suggested_category ?? ""} required className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3">
                              <option value="" disabled>Choose a category</option>
                              {categories.map((category) => <option key={category.slug} value={category.name}>{category.name}{selected.suggested_category === category.name ? " (suggested)" : ""}</option>)}
                            </select>
                          </label>
                          <SubmitButton pendingText="Creating…">Create blank draft</SubmitButton>
                        </form>
                      </details>
                    </div>
                  )}
                </div>
                {view === "new" && (
                  <form action={markReviewed} className="mt-4">
                    <input type="hidden" name="id" value={selected.id} />
                    <SubmitButton secondary pendingText="Updating…">Mark reviewed without drafting</SubmitButton>
                  </form>
                )}
              </section>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl bg-soft p-7">
            <h2 className="font-serif text-2xl font-semibold">{hasFilters ? "No matching stories" : view === "archived" ? "The archive is empty" : view === "reviewed" ? "No reviewed stories yet" : "The review queue is clear"}</h2>
            <p className="mt-2 text-sm text-muted">{hasFilters ? "Try broader filters or clear the current selection." : view === "archived" ? "Archived stories remain recoverable and will appear here." : view === "reviewed" ? "Stories appear here after review." : "Import from an approved source when you are ready."}</p>
            {hasFilters && <Link href={queueHref(view, { q: "", source: "", category: "", age: "" })} className="mt-4 inline-block text-sm text-brand hover:underline">Clear filters →</Link>}
          </div>
        )}
      </main>
    </AdminShell>
  );
}

export default function InboxPage(props: InboxPageProps) {
  return (
    <Suspense fallback={<div className="admin-shell min-h-screen bg-[#f7f9fc] p-8 text-muted">Opening review queue…</div>}>
      <InboxContent {...props} />
    </Suspense>
  );
}
