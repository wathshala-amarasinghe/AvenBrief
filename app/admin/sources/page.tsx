import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import SubmitButton from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { categories } from "@/lib/categories";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  addSource,
  toggleImportPause,
  toggleSource,
  updateSource,
} from "./actions";

export const metadata: Metadata = {
  title: "RSS Sources | AvenBrief",
  robots: { index: false, follow: false },
};

type SourcesPageProps = {
  searchParams: Promise<{
    result?: string;
    message?: string;
  }>;
};

function formatTimestamp(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value)) + " UTC";
}

async function SourcesContent({ searchParams }: SourcesPageProps) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const supabase = getAdminSupabase();

  const [sourcesResult, settingsResult, runsResult] = await Promise.all([
    supabase
      .from("rss_sources")
      .select(
        "id, name, feed_url, default_category, enabled, last_checked_at, last_success_at, last_error, last_import_count",
      )
      .order("enabled", { ascending: false })
      .order("name"),
    supabase
      .from("rss_import_settings")
      .select("paused")
      .eq("id", 1)
      .single(),
    supabase
      .from("rss_import_runs")
      .select(
        "id, run_type, status, started_at, completed_at, sources_total, sources_succeeded, sources_failed, items_imported, error",
      )
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const { data: sources, error } = sourcesResult;
  const { data: importSettings, error: settingsError } = settingsResult;
  const { data: recentRuns, error: runsError } = runsResult;

  if (error) {
    console.error("RSS sources failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  const notice =
    params.result === "added"
      ? "Source added."
      : params.result === "updated"
        ? "Source settings saved."
        : params.result === "enabled"
          ? "Source enabled."
          : params.result === "disabled"
            ? "Source disabled."
            : params.result === "duplicate"
              ? "That feed URL is already registered."
              : params.result === "imports_paused"
                ? "All manual and scheduled RSS imports are paused."
                : params.result === "imports_resumed"
                  ? "RSS importing resumed."
              : params.result === "database_error"
                ? "Could not save the source. Check the server log and try again."
                : params.result === "invalid"
                  ? params.message || "Check the source details and try again."
                  : "";

  const noticeIsError = ["duplicate", "database_error", "invalid"].includes(
    params.result ?? "",
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin" className="text-sm text-brand hover:underline">
        ← Admin dashboard
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-serif text-4xl font-semibold">RSS sources</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Approve publisher feeds, choose their fallback categories, and pause
            individual imports without removing history.
          </p>
        </div>
        <Link
          href="/admin/inbox"
          className="rounded-xl border border-border px-5 py-3 hover:bg-soft"
        >
          Open RSS inbox
        </Link>
      </div>

      {notice && (
        <p
          role={noticeIsError ? "alert" : "status"}
          className={`mt-6 rounded-xl p-4 ${
            noticeIsError ? "bg-red-50 text-red-700" : "bg-soft text-brand"
          }`}
        >
          {notice}
        </p>
      )}

      <section className="mt-10 rounded-xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Global import control</h2>
            <p className="mt-2 text-sm text-muted">
              Pausing stops both the manual inbox button and scheduled endpoint.
            </p>
          </div>

          {settingsError || !importSettings ? (
            <p role="alert" className="text-sm text-red-700">
              Apply the scheduled-import migration to use this control.
            </p>
          ) : (
            <form action={toggleImportPause}>
              <input
                type="hidden"
                name="next_paused"
                value={importSettings.paused ? "false" : "true"}
              />
              <SubmitButton secondary pendingText="Updating…">
                {importSettings.paused ? "Resume all imports" : "Pause all imports"}
              </SubmitButton>
            </form>
          )}
        </div>

        <p className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          importSettings?.paused
            ? "bg-amber-50 text-amber-800"
            : "bg-green-50 text-green-700"
        }`}>
          {importSettings?.paused ? "Globally paused" : "Importing active"}
        </p>
      </section>

      <section className="mt-10 rounded-xl border border-border p-6">
        <h2 className="font-serif text-2xl font-semibold">Add approved source</h2>
        <form action={addSource} className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="new-source-name" className="mb-2 block text-sm font-medium">
              Publisher name
            </label>
            <input
              id="new-source-name"
              name="name"
              required
              maxLength={100}
              className="w-full rounded-xl border border-border px-4 py-3"
              placeholder="Global Voices"
            />
          </div>

          <div>
            <label htmlFor="new-source-category" className="mb-2 block text-sm font-medium">
              Fallback category
            </label>
            <select
              id="new-source-category"
              name="default_category"
              defaultValue="World"
              required
              className="w-full rounded-xl border border-border bg-white px-4 py-3"
            >
              {categories.map((category) => (
                <option key={category.slug} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="new-source-url" className="mb-2 block text-sm font-medium">
              HTTPS feed URL
            </label>
            <input
              id="new-source-url"
              name="feed_url"
              type="url"
              inputMode="url"
              required
              maxLength={2048}
              className="w-full rounded-xl border border-border px-4 py-3"
              placeholder="https://publisher.example/feed/"
            />
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input name="enabled" type="checkbox" defaultChecked />
            Enable this source immediately
          </label>

          <div className="md:text-right">
            <SubmitButton pendingText="Adding source…">Add source</SubmitButton>
          </div>
        </form>
      </section>

      <section aria-label="Approved RSS sources" className="mt-10 space-y-6">
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 p-6 text-red-700">
            Could not load RSS sources. Apply the source-management migration first.
          </p>
        ) : sources?.length ? (
          sources.map((source) => (
            <article key={source.id} className="rounded-xl border border-border p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-2xl font-semibold">{source.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      source.enabled
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {source.enabled ? "Enabled" : "Paused"}
                    </span>
                  </div>
                  <a
                    href={source.feed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-sm text-brand hover:underline"
                  >
                    {source.feed_url}
                  </a>
                </div>

                <form action={toggleSource}>
                  <input type="hidden" name="id" value={source.id} />
                  <input
                    type="hidden"
                    name="next_enabled"
                    value={source.enabled ? "false" : "true"}
                  />
                  <SubmitButton secondary pendingText="Updating…">
                    {source.enabled ? "Pause source" : "Enable source"}
                  </SubmitButton>
                </form>
              </div>

              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted">Last checked</dt>
                  <dd className="mt-1">{formatTimestamp(source.last_checked_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Last successful check</dt>
                  <dd className="mt-1">{formatTimestamp(source.last_success_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted">New items last time</dt>
                  <dd className="mt-1">{source.last_import_count}</dd>
                </div>
              </dl>

              {source.last_error && (
                <p role="status" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  Last error: {source.last_error}
                </p>
              )}

              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-brand">
                  Edit source settings
                </summary>
                <form action={updateSource} className="mt-5 grid gap-5 md:grid-cols-2">
                  <input type="hidden" name="id" value={source.id} />
                  <div>
                    <label htmlFor={`source-name-${source.id}`} className="mb-2 block text-sm font-medium">
                      Publisher name
                    </label>
                    <input
                      id={`source-name-${source.id}`}
                      name="name"
                      defaultValue={source.name}
                      required
                      maxLength={100}
                      className="w-full rounded-xl border border-border px-4 py-3"
                    />
                  </div>
                  <div>
                    <label htmlFor={`source-category-${source.id}`} className="mb-2 block text-sm font-medium">
                      Fallback category
                    </label>
                    <select
                      id={`source-category-${source.id}`}
                      name="default_category"
                      defaultValue={source.default_category}
                      required
                      className="w-full rounded-xl border border-border bg-white px-4 py-3"
                    >
                      {categories.map((category) => (
                        <option key={category.slug} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`source-url-${source.id}`} className="mb-2 block text-sm font-medium">
                      HTTPS feed URL
                    </label>
                    <input
                      id={`source-url-${source.id}`}
                      name="feed_url"
                      type="url"
                      defaultValue={source.feed_url}
                      required
                      maxLength={2048}
                      className="w-full rounded-xl border border-border px-4 py-3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <SubmitButton pendingText="Saving source…">Save source</SubmitButton>
                  </div>
                </form>
              </details>
            </article>
          ))
        ) : (
          <p className="rounded-xl bg-soft p-6 text-muted">
            No approved sources yet. Add one above.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl font-semibold">Recent import runs</h2>
        <p className="mt-3 text-muted">
          Manual and scheduled checks share the same audit history.
        </p>

        {runsError ? (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-6 text-red-700">
            Could not load import history. Apply the scheduled-import migration first.
          </p>
        ) : recentRuns?.length ? (
          <div className="mt-6 space-y-4">
            {recentRuns.map((run) => (
              <article key={run.id} className="rounded-xl border border-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium capitalize">
                      {run.run_type} import · {run.status}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      Started {formatTimestamp(run.started_at)}
                    </p>
                  </div>
                  <span className="rounded-full bg-soft px-3 py-1 text-sm text-brand">
                    {run.items_imported} new {run.items_imported === 1 ? "story" : "stories"}
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted">
                  Sources: {run.sources_succeeded} succeeded, {run.sources_failed} failed,
                  {" "}{run.sources_total} total.
                </p>
                {run.error && (
                  <p className="mt-3 text-sm text-red-700">{run.error}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-soft p-6 text-muted">
            No import runs recorded yet.
          </p>
        )}
      </section>
    </main>
  );
}

export default function SourcesPage(props: SourcesPageProps) {
  return (
    <Suspense fallback={<p className="px-6 py-12 text-muted">Opening sources…</p>}>
      <SourcesContent {...props} />
    </Suspense>
  );
}
