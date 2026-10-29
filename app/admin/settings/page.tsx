import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import SubmitButton from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { toggleImportPause } from "@/app/admin/sources/actions";

export const metadata: Metadata = { title: "Settings | AvenBrief", robots: { index: false, follow: false } };

async function SettingsContent() {
  await connection();
  const { user } = await requireAdmin();
  const { data } = await getAdminSupabase().from("rss_import_settings").select("paused").eq("id", 1).maybeSingle();
  const paused = data?.paused ?? false;

  return (
    <AdminShell current="/admin/settings" email={user.email}>
      <main className="mx-auto max-w-[920px] px-6 py-8 md:px-10 md:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Workspace</p>
        <h1 className="mt-2 font-serif text-[38px] font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted">Control publishing safeguards and automated imports.</p>

        <section className="mt-8 overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="border-b border-border px-6 py-5"><h2 className="font-serif text-2xl font-semibold">RSS automation</h2><p className="mt-2 text-sm leading-6 text-muted">Scheduled imports add stories to the review queue. They never publish articles automatically.</p></div>
          <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-6">
            <div><h3 className="font-medium">Global import switch</h3><p className="mt-1 text-sm text-muted">Current status: <span className={paused ? "text-red-700" : "text-green-700"}>{paused ? "Paused" : "Active"}</span></p></div>
            <form action={toggleImportPause}><input type="hidden" name="next_paused" value={paused ? "false" : "true"} /><SubmitButton secondary={!paused} pendingText="Updating…">{paused ? "Resume imports" : "Pause imports"}</SubmitButton></form>
          </div>
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

export default function SettingsPage() {
  return <Suspense fallback={<p className="px-6 py-12 text-muted">Opening settings…</p>}><SettingsContent /></Suspense>;
}
