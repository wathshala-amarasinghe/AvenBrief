import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Admin Dashboard | AvenBrief",
  robots: { index: false, follow: false },
};

async function AdminDashboard() {
  await connection();
  const { supabase, user } = await requireAdmin();

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, status")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <Link href="/" className="text-sm text-brand hover:underline">
            ← View website
          </Link>
          <h1 className="mt-4 font-serif text-4xl font-semibold">
            Your articles
          </h1>
          <p className="mt-3 text-sm text-muted">
            Signed in as {user.email}
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-xl border border-border px-5 py-3 hover:bg-soft"
          >
            Sign out
          </button>
        </form>
      </div>

      <section className="mt-10 space-y-4">
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">
            Could not load articles. Please try again.
          </p>
        ) : articles?.length ? (
          articles.map((article) => (
            <article
              key={article.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border p-5"
            >
              <h2 className="font-serif text-xl font-semibold">
                {article.title}
              </h2>
              <span className="rounded-full bg-soft px-3 py-1 text-sm text-brand">
                {article.status}
              </span>
            </article>
          ))
        ) : (
          <p className="rounded-xl bg-soft p-6 text-muted">
            You have no articles yet.
          </p>
        )}
      </section>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <p className="px-6 py-12 text-muted">
          Checking admin access…
        </p>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}