import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import SubmitButton from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { toggleImportPause, updateAiDraftAutomation } from "@/app/admin/sources/actions";

export const metadata: Metadata = { title: "Settings | AvenBrief", robots: { index: false, follow: false } };

type SettingsPageProps = {
  searchParams: Promise<{ result?: string | string[] }>;
};

async function SettingsContent({ searchParams }: SettingsPageProps) {
  await connection();
  const { user } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await getAdminSupabase()
    .from("rss_import_settings")
    .select("paused, auto_draft_enabled, auto_draft_limit")
    .eq("id", 1)
    .maybeSingle();
  const paused = data?.paused ?? false;
  const autoDraftEnabled = data?.auto_draft_enabled ?? false;
  const autoDraftLimit = data?.auto_draft_limit ?? 1;
  const result = typeof params.result === "string" ? params.result : "";
  const notice = result === "ai_draft_settings_saved"
    ? "Scheduled AI drafting settings saved."
    : result === "invalid_ai_draft_settings"
      ? "Choose an automatic drafting limit between 1 and 3."
      : result === "ai_draft_settings_error"
        ? "Could not save automatic drafting settings. Apply the scheduled AI-drafts migration and try again."
        : "";
  const noticeIsError = result === "invalid_ai_draft_settings" || result === "ai_draft_settings_error";

  return (
    <AdminShell current="/admin/settings" email={user.email}>
      <main className="mx-auto max-w-[920px] px-6 py-8 md:px-10 md:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Workspace</p>
        <h1 className="mt-2 font-serif text-[38px] font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted">Control publishing safeguards and automated imports.</p>

        {notice && (
          <p role={noticeIsError ? "alert" : "status"} className={`mt-6 rounded-xl p-4 ${noticeIsError ? "bg-red-50 text-red-700" : "bg-soft text-brand"}`}>
            {notice}
          </p>
        )}

        <section className="mt-8 overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="border-b border-border px-6 py-5"><h2 className="font-serif text-2xl font-semibold">RSS automation</h2><p className="mt-2 text-sm leading-6 text-muted">Scheduled imports add stories to the review queue. They never publish articles automatically.</p></div>
          <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-6">
            <div><h3 className="font-medium">Global import switch</h3><p className="mt-1 text-sm text-muted">Current status: <span className={paused ? "text-red-700" : "text-green-700"}>{paused ? "Paused" : "Active"}</span></p></div>
            <form action={toggleImportPause}><input type="hidden" name="next_paused" value={paused ? "false" : "true"} /><input type="hidden" name="return_to" value="/admin/settings" /><SubmitButton secondary={!paused} pendingText="Updating…">{paused ? "Resume imports" : "Pause imports"}</SubmitButton></form>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="border-b border-border px-6 py-5">
            <h2 className="font-serif text-2xl font-semibold">Automatic AI drafts</h2>
            <p className="mt-2 text-sm leading-6 text-muted">After a scheduled RSS import, Gemini can turn a limited number of new stories into private drafts and verify them automatically. It never publishes them.</p>
          </div>
          {error ? (
            <p role="alert" className="m-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Apply <code>20261110000100_scheduled_ai_drafts.sql</code> before configuring this feature.</p>
          ) : (
            <form action={updateAiDraftAutomation} className="grid gap-5 px-6 py-6 md:grid-cols-[1fr_180px_auto] md:items-end">
              <label className="flex items-start gap-3">
                <input name="auto_draft_enabled" type="checkbox" defaultChecked={autoDraftEnabled} className="mt-1 h-4 w-4" />
                <span><span className="block font-medium">Create verified drafts automatically</span><span className="mt-1 block text-sm leading-6 text-muted">Current status: {autoDraftEnabled ? "Active" : "Paused"}</span></span>
              </label>
              <label className="text-sm font-medium">Drafts per scheduled run
                <input name="auto_draft_limit" type="number" min={1} max={3} defaultValue={autoDraftLimit} required className="mt-2 w-full rounded-xl border border-border px-4 py-3" />
              </label>
              <SubmitButton pendingText="Saving…">Save automation</SubmitButton>
            </form>
          )}
        </section>

        <section className="mt-6 rounded-[10px] border border-border bg-white p-6">
          <h2 className="font-serif text-2xl font-semibold">Editorial safeguards</h2>
          <dl className="mt-5 divide-y divide-border text-sm">
            <div className="flex justify-between gap-4 py-4"><dt>Review-first workflow</dt><dd className="font-medium text-green-700">Enabled</dd></div>
            <div className="flex justify-between gap-4 py-4"><dt>Admin identity verification</dt><dd className="font-medium text-green-700">Enabled</dd></div>
            <div className="flex justify-between gap-4 py-4"><dt>Scheduled endpoint protection</dt><dd className="font-medium text-green-700">Enabled</dd></div>
          </dl>
        </section>
      </main>
    </AdminShell>
  );
}

export default function SettingsPage(props: SettingsPageProps) {
  return <Suspense fallback={<p className="px-6 py-12 text-muted">Opening settings…</p>}><SettingsContent {...props} /></Suspense>;
}
