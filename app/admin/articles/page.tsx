import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import AdminShell from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { articleVerificationFingerprint } from "@/lib/article-verification";
import { classifyDraftReadiness } from "@/lib/draft-readiness.mjs";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Draft Readiness | AvenBrief",
  robots: { index: false, follow: false },
};

type DraftArticle = {
  id: string;
  title: string;
  category: string;
  created_at: string;
  summary: string;
  body: string;
  source_url: string | null;
  featured_image_url: string | null;
  image_alt: string;
  image_credit: string;
};

type Verification = {
  article_id: string;
  status: "running" | "completed" | "failed";
  publish_ready: boolean;
  article_fingerprint: string | null;
  started_at: string;
};

type ReadinessItem = DraftArticle & {
  state: "verification" | "image" | "ready";
  reason: string;
  old: boolean;
  ageDays: number;
};

const stateDetails = {
  verification: {
    title: "Verification blocked or needed",
    description: "Correct flagged claims or run verification on the saved article version.",
    badge: "bg-red-50 text-red-700",
  },
  image: {
    title: "Waiting for image details",
    description: "Add a featured image, useful alt text, and a proper image credit.",
    badge: "bg-amber-50 text-amber-800",
  },
  ready: {
    title: "Ready for final editorial review",
    description: "Verification and image requirements are complete. Perform the final human review before publishing.",
    badge: "bg-green-50 text-green-700",
  },
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

function DraftRows({ items, empty }: { items: ReadinessItem[]; empty: string }) {
  if (!items.length) return <p className="p-6 text-sm text-muted">{empty}</p>;

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <article key={item.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_170px_130px] lg:items-center">
          <div className="min-w-0">
            <Link href={`/admin/editor?id=${item.id}`} className="font-medium hover:text-brand">{item.title}</Link>
            <p className="mt-1 text-xs text-muted">{item.category} · Created {formatDate(item.created_at)}</p>
            <p className="mt-2 text-sm text-muted">{item.reason}</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${stateDetails[item.state].badge}`}>
            {item.state === "verification" ? "Verification" : item.state === "image" ? "Image needed" : "Ready"}
          </span>
          <Link href={`/admin/editor?id=${item.id}`} className="text-sm font-medium text-brand hover:underline">Open editor →</Link>
        </article>
      ))}
    </div>
  );
}

export default async function ArticlesPage() {
  await connection();
  const { user } = await requireAdmin();
  const supabase = getAdminSupabase();
  const draftResult = await supabase
    .from("articles")
    .select("id, title, category, created_at, summary, body, source_url, featured_image_url, image_alt, image_credit", { count: "exact" })
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(200);
  const drafts = (draftResult.data ?? []) as DraftArticle[];
  const draftIds = drafts.map((article) => article.id);
  const verificationResult = draftIds.length
    ? await supabase
        .from("article_verifications")
        .select("article_id, status, publish_ready, article_fingerprint, started_at")
        .in("article_id", draftIds)
        .order("started_at", { ascending: false })
    : { data: [], error: null };
  const latestVerification = new Map<string, Verification>();
  for (const row of (verificationResult.data ?? []) as Verification[]) {
    if (!latestVerification.has(row.article_id)) latestVerification.set(row.article_id, row);
  }

  const items = drafts.map((article): ReadinessItem => {
    const verification = latestVerification.get(article.id) ?? null;
    const verificationCurrent = Boolean(
      verification?.article_fingerprint &&
      verification.article_fingerprint === articleVerificationFingerprint(article),
    );
    return {
      ...article,
      ...classifyDraftReadiness({ article, verification, verificationCurrent }),
    } as ReadinessItem;
  });
  const groups = {
    verification: items.filter((item) => item.state === "verification"),
    image: items.filter((item) => item.state === "image"),
    ready: items.filter((item) => item.state === "ready"),
  };
  const older = items.filter((item) => item.old);
  const setupError = Boolean(draftResult.error || verificationResult.error);

  return (
    <AdminShell current="/admin/articles" email={user.email}>
      <main className="mx-auto max-w-[1240px] px-5 py-7 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Editorial workflow</p>
            <h1 className="mt-2 font-serif text-[38px] font-semibold">Draft readiness</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">See exactly what each private draft needs before the final editorial decision.</p>
          </div>
          <Link href="/admin/editor" className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">New article</Link>
        </div>

        {setupError && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">Some draft readiness data could not be loaded. Check the database migrations and server logs.</p>}
        {(draftResult.count ?? 0) > drafts.length && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Showing the newest {drafts.length} of {draftResult.count} private drafts.</p>}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Draft readiness totals">
          {[
            ["Verification", groups.verification.length, "Needs verification attention"],
            ["Image details", groups.image.length, "Verified, image work remains"],
            ["Ready", groups.ready.length, "Ready for final review"],
            ["Older drafts", older.length, "Seven days or older"],
          ].map(([label, value, note]) => (
            <article key={label} className="rounded-xl border border-border bg-white p-5">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 font-serif text-4xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-muted">{note}</p>
            </article>
          ))}
        </section>

        {(["verification", "image", "ready"] as const).map((state) => (
          <section key={state} className="mt-8 overflow-hidden rounded-xl border border-border bg-white">
            <div className="border-b border-border px-6 py-5">
              <h2 className="font-serif text-2xl font-semibold">{stateDetails[state].title}</h2>
              <p className="mt-2 text-sm text-muted">{stateDetails[state].description}</p>
            </div>
            <DraftRows items={groups[state]} empty={state === "ready" ? "No drafts are ready for final review yet." : "No drafts currently need this action."} />
          </section>
        ))}

        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border px-6 py-5">
            <h2 className="font-serif text-2xl font-semibold">Older drafts needing attention</h2>
            <p className="mt-2 text-sm text-muted">Private drafts created at least seven days ago, shown again here so they do not disappear in the backlog.</p>
          </div>
          <DraftRows items={older} empty="No private drafts are seven days old yet." />
        </section>
      </main>
    </AdminShell>
  );
}
