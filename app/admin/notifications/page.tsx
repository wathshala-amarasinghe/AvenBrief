import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import SubmitButton from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { ensureAutomationHealthNotification } from "@/lib/admin-notifications";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export const metadata: Metadata = {
  title: "Notifications | AvenBrief",
  robots: { index: false, follow: false },
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(value)) + " Sri Lanka time";
}

function notificationStyle(severity: string, unread: boolean) {
  if (severity === "error") return unread ? "border-red-300 bg-red-50" : "border-red-100 bg-white";
  if (severity === "warning") return unread ? "border-amber-300 bg-amber-50" : "border-amber-100 bg-white";
  return unread ? "border-blue-200 bg-blue-50" : "border-border bg-white";
}

async function NotificationsContent() {
  await connection();
  const { user } = await requireAdmin();
  await ensureAutomationHealthNotification();
  const { data: notifications, error } = await getAdminSupabase()
    .from("admin_notifications")
    .select("id, type, severity, title, message, href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const unreadCount = notifications?.filter((item) => !item.read_at).length ?? 0;

  return (
    <AdminShell current="/admin/notifications" email={user.email}>
      <main className="mx-auto max-w-[1040px] px-5 py-7 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Operations</p>
            <h1 className="mt-2 font-serif text-[38px] font-semibold">Notifications</h1>
            <p className="mt-2 text-sm text-muted">Draft readiness, verification outcomes, quota warnings, feed failures, and automation health.</p>
          </div>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <SubmitButton secondary pendingText="Updating…">Mark all as read</SubmitButton>
            </form>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-8 rounded-xl bg-amber-50 p-5 text-amber-900">Apply <code>20261110000300_admin_notifications.sql</code> before using notifications.</p>
        ) : notifications?.length ? (
          <section className="mt-8 space-y-4" aria-label="Admin notifications">
            {notifications.map((notification) => {
              const unread = !notification.read_at;
              return (
                <article key={notification.id} className={`rounded-xl border p-5 ${notificationStyle(notification.severity, unread)}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{notification.title}</h2>
                        {unread && <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">New</span>}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted">{formatTimestamp(notification.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {notification.href && <Link href={notification.href} className="text-sm font-medium text-brand hover:underline">Open →</Link>}
                      {unread && (
                        <form action={markNotificationRead}>
                          <input type="hidden" name="id" value={notification.id} />
                          <button type="submit" className="text-sm text-muted hover:text-brand">Mark read</button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <p className="mt-8 rounded-xl border border-border bg-white p-6 text-muted">No notifications yet. Healthy automation stays quiet until a draft, verification result, failure, or overdue run needs attention.</p>
        )}
      </main>
    </AdminShell>
  );
}

export default function NotificationsPage() {
  return <Suspense fallback={<p className="px-6 py-12 text-muted">Loading notifications…</p>}><NotificationsContent /></Suspense>;
}
