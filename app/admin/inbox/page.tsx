import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import SubmitButton from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { categories } from "@/lib/categories";
import { suggestRssCategory } from "@/lib/rss-category.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  importRss,
  markReviewed,
  createDraft,
} from "./actions";

export const metadata: Metadata = {
  title: "RSS Inbox | AvenBrief",
  robots: { index: false, follow: false },
};

type InboxPageProps = {
  searchParams: Promise<{
    result?: string;
    view?: string;
    imported?: string;
    failed?: string;
  }>;
};

async function InboxContent({ searchParams }: InboxPageProps) {
  await connection();

  await requireAdmin();
  const supabase = getAdminSupabase();
  const params = await searchParams;
  const reviewed = params.view === "reviewed";
  const importedCount = Number.parseInt(params.imported ?? "0", 10) || 0;
  const failedCount = Number.parseInt(params.failed ?? "0", 10) || 0;

  const { data: stories, error } = await supabase
    .from("rss_inbox")
    .select(
      "id, title, source_name, source_url, source_author, article_id, suggested_category",
    )
    .eq("status", reviewed ? "reviewed" : "new")
    .order("source_published_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("imported_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("RSS inbox failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  const categorisedStories = stories?.map((story) => ({
    ...story,
    suggested_category:
      story.suggested_category ??
      suggestRssCategory({ title: story.title }),
  }));

  const notice =
    params.result === "imported"
      ? `Import completed: ${importedCount} new ${importedCount === 1 ? "story" : "stories"}. Existing links were skipped.${
          failedCount ? ` ${failedCount} ${failedCount === 1 ? "source" : "sources"} failed; check RSS Sources.` : ""
        }`
      : params.result === "reviewed"
        ? "Story moved to Reviewed."
        : params.result === "feed_error"
          ? "No enabled RSS source completed successfully. Check RSS Sources for the recorded errors."
          : params.result === "database_error"
            ? "Could not save the changes. Please try again."
            : params.result === "empty"
              ? "Enabled sources returned no usable stories."
              : params.result === "no_sources"
                ? "No RSS sources are enabled. Add or enable one in RSS Sources."
                : params.result === "paused"
                  ? "RSS importing is globally paused. Resume it in RSS Sources."
                  : params.result === "already_running"
                    ? "An RSS import is already running. Check again shortly."
              : params.result === "invalid"
                ? "That story could not be identified."
                : "";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin"
        className="text-sm text-brand hover:underline"
      >
        ← Admin dashboard
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="font-serif text-4xl font-semibold">
            RSS review inbox
          </h1>
          <p className="mt-3 text-muted">
            Review source stories before writing your articles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/sources"
            className="rounded-xl border border-border px-5 py-3 text-sm font-medium hover:bg-soft"
          >
            Manage sources
          </Link>
          <form action={importRss}>
            <SubmitButton pendingText="Checking sources…">
              Import RSS
            </SubmitButton>
          </form>
        </div>
      </div>

      {params.result === "category_required" && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 p-4 text-red-700"
        >
          Choose a category before creating the draft.
        </p>
      )}
      {params.result === "draft_error" && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 p-4 text-red-700"
        >
          Could not create the draft. Please try again.
          Check the terminal if this continues.
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-6 rounded-xl bg-soft p-4 text-brand"
        >
          {notice}
        </p>
      )}

      <nav
        aria-label="Inbox views"
        className="mt-8 flex flex-wrap gap-6 border-b border-border pb-5"
      >
        <Link
          href="/admin/inbox"
          aria-current={!reviewed ? "page" : undefined}
          className="text-brand hover:underline"
        >
          To review
        </Link>

        <Link
          href="/admin/inbox?view=reviewed"
          aria-current={reviewed ? "page" : undefined}
          className="text-brand hover:underline"
        >
          Reviewed
        </Link>

        <Link
          href="/admin/editor"
          className="text-brand hover:underline"
        >
          New article →
        </Link>
      </nav>

      <p className="mt-5 text-sm text-muted">
        Showing up to 50 recent stories.
      </p>

      <section
        aria-label={reviewed ? "Reviewed stories" : "Stories to review"}
        className="mt-6 space-y-5"
      >
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 p-6 text-red-700">
            Could not open the inbox. Check that the database
            table and its permissions were created.
          </p>
        ) : categorisedStories?.length ? (
          categorisedStories.map((story) => (
            <article
              key={story.id}
              className="rounded-xl border border-border p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                {story.source_name}
              </p>

              <h2 className="mt-3 font-serif text-2xl font-semibold">
                <a
                  href={story.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand"
                >
                  {story.title}
                </a>
              </h2>

              {story.source_author && (
                <p className="mt-3 text-sm text-muted">
                  Original author: {story.source_author}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-5">
                <a
                  href={story.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand hover:underline"
                >
                  Read original →
                </a>

                {story.article_id ? (
                  <Link
                    href={"/admin/editor?id=" + story.article_id}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Open article →
                  </Link>
                ) : (
                  <form
                    action={createDraft}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={story.id}
                    />

                    <div>
                      <label
                        htmlFor={"category-" + story.id}
                        className="mb-2 block text-sm font-medium"
                      >
                        Category
                      </label>

                      <select
                        id={"category-" + story.id}
                        name="category"
                        defaultValue={story.suggested_category ?? ""}
                        required
                        className="rounded-xl border border-border bg-white px-4 py-3"
                      >
                        <option value="" disabled>
                          Choose a category
                        </option>

                        {categories.map((category) => (
                          <option
                            key={category.slug}
                            value={category.name}
                          >
                            {category.name}
                            {story.suggested_category === category.name
                              ? " (suggested)"
                              : ""}
                          </option>
                        ))}
                      </select>

                      {story.suggested_category && (
                        <p className="mt-2 text-xs text-muted">
                          Suggested automatically. You can change it.
                        </p>
                      )}
                    </div>

                    <SubmitButton pendingText="Creating draft…">
                      Create Draft
                    </SubmitButton>
                  </form>
                )}

                {!reviewed && (
                  <form action={markReviewed}>
                    <input
                      type="hidden"
                      name="id"
                      value={story.id}
                    />
                    <SubmitButton
                      secondary
                      pendingText="Updating…"
                    >
                      Mark reviewed
                    </SubmitButton>
                  </form>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-xl bg-soft p-6 text-muted">
            {reviewed
              ? "No reviewed stories yet."
              : "Your inbox is empty. Choose Import RSS to collect stories."}
          </p>
        )}
      </section>
    </main>
  );
}

export default function InboxPage(props: InboxPageProps) {
  return (
    <Suspense
      fallback={
        <p className="px-6 py-12 text-muted">
          Opening inbox…
        </p>
      }
    >
      <InboxContent {...props} />
    </Suspense>
  );
}
