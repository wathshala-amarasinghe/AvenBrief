import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import ArticleEditor from "@/components/article-editor";
import AdminShell from "@/components/admin-shell";
import VerificationRunControl from "@/components/verification-run-control";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isArticleId } from "@/lib/article-validation.mjs";
import { articleVerificationFingerprint } from "@/lib/article-verification";
import { verifyArticle } from "@/app/admin/editor/verification-actions";
import type { ArticleRecord } from "@/lib/article-types";

export const metadata: Metadata = {
  title: "Article Editor | AvenBrief",
  robots: { index: false, follow: false },
};

export const maxDuration = 300;

type EditorPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    saved?: string | string[];
    generated?: string | string[];
    verification?: string | string[];
  }>;
};

type VerificationRecord = {
  status: "running" | "completed" | "failed";
  verdict: "pass" | "review" | "fail" | null;
  score: number | null;
  publish_ready: boolean;
  summary: string | null;
  critical_issues: unknown;
  warnings: unknown;
  claims: unknown;
  article_fingerprint: string | null;
  error: string | null;
  completed_at: string | null;
};

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function claimList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { claim: string; evidence: string; status: string } =>
    Boolean(item) && typeof item === "object" &&
    "claim" in item && typeof item.claim === "string" &&
    "evidence" in item && typeof item.evidence === "string" &&
    "status" in item && typeof item.status === "string");
}

async function EditorContent({ searchParams }: EditorPageProps) {
  await connection();
  const { user } = await requireAdmin();
  const supabase = getAdminSupabase();
  const params = await searchParams;
  const id = params.id;

  if (id !== undefined && (typeof id !== "string" || !isArticleId(id))) {
    notFound();
  }

  let article: ArticleRecord | null = null;
  let generation: { confidence: number | null; warnings: unknown } | null = null;
  let verification: VerificationRecord | null = null;
  let verificationSetupRequired = false;
  if (typeof id === "string") {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error("Could not load the article.");
    if (!data) notFound();
    article = data as ArticleRecord;

    const { data: verificationData, error: verificationError } = await supabase
      .from("article_verifications")
      .select("status, verdict, score, publish_ready, summary, critical_issues, warnings, claims, article_fingerprint, error, completed_at")
      .eq("article_id", id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    verificationSetupRequired = Boolean(verificationError);
    verification = verificationData as VerificationRecord | null;

    if (params.generated === "1") {
      const { data: generated } = await supabase
        .from("ai_draft_generations")
        .select("confidence, warnings")
        .eq("article_id", id)
        .eq("status", "succeeded")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      generation = generated;
    }
  }

  const saved = article && params.saved === article.status;
  const verificationStale = Boolean(article && verification?.article_fingerprint &&
    verification.article_fingerprint !== articleVerificationFingerprint(article));
  const verificationNotice = typeof params.verification === "string" ? {
    passed: "Verification passed. This saved version is eligible for publishing.",
    blocked: "Verification completed and found issues that must be corrected before publishing.",
    failed: "Verification could not be completed. Check the source page and server log, then try again.",
    running: "A verification run is already in progress.",
    source_required: "Add and save an original source URL before verification.",
    setup_required: "Apply the article-verification database migration before running verification.",
    article_error: "The saved article could not be loaded for verification.",
  }[params.verification] : null;

  return (
    <AdminShell current="/admin/editor" email={user.email}>
    <main className="mx-auto max-w-[1240px] px-6 py-8 md:px-10 md:py-10">
      <Link href="/admin" className="text-sm text-muted hover:text-brand">← Overview</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Articles</p><h1 className="mt-2 font-serif text-[38px] font-semibold">{article ? "Review & edit" : "New article"}</h1></div>
        {article?.status === "published" && <Link href={`/news/${article.slug}`} className="text-sm text-brand hover:underline">View published article →</Link>}
      </div>

      {saved && article && (
        <p role="status" className="mt-6 rounded-xl bg-soft p-4 text-brand">
          {article.status === "published" ? "Article published." : "Draft saved privately."}
        </p>
      )}

      {article && params.generated === "1" && (
        <div role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">AI draft created{generation?.confidence != null ? ` · confidence ${generation.confidence}%` : ""}</p>
          <p className="mt-2">Verify every fact against the original source, improve the writing, and add a properly credited image before publishing.</p>
          {generation && Array.isArray(generation.warnings) && generation.warnings.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {generation.warnings.filter((warning): warning is string => typeof warning === "string").map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {article && (
        <section className="mt-6 rounded-[10px] border border-border bg-white p-5" aria-labelledby="verification-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Source consistency</p>
              <h2 id="verification-heading" className="mt-2 font-serif text-2xl font-semibold">Automated editorial verification</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Checks the saved title, summary, and article claims against the original source. It cannot prove that the publisher itself is truthful.</p>
            </div>
            <VerificationRunControl
              action={verifyArticle}
              articleId={article.id}
              disabled={verificationSetupRequired}
              hasReport={Boolean(verification)}
              status={verification?.status ?? null}
            />
          </div>

          {verificationNotice && <p role="status" className="mt-4 rounded-lg bg-soft p-3 text-sm text-brand">{verificationNotice}</p>}
          {verificationSetupRequired && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Apply <code>20261109000400_article_verifications.sql</code> in Supabase before using verification.</p>}
          {verificationStale && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This report is stale because the saved article changed. Run verification again.</p>}

          {verification && !verificationStale && verification.status === "completed" && (
            <div className="mt-5 space-y-5">
              <div className={`rounded-lg p-4 ${verification.publish_ready ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
                <p className="font-semibold">{verification.publish_ready ? "Passed" : "Publishing blocked"}{verification.score != null ? ` · ${verification.score}/100` : ""}</p>
                {verification.summary && <p className="mt-2 text-sm leading-6">{verification.summary}</p>}
              </div>
              {stringList(verification.critical_issues).length > 0 && (
                <div><h3 className="font-semibold text-red-800">Critical issues</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">{stringList(verification.critical_issues).map((issue) => <li key={issue}>{issue}</li>)}</ul></div>
              )}
              {stringList(verification.warnings).length > 0 && (
                <div><h3 className="font-semibold">Warnings</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{stringList(verification.warnings).map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
              )}
              <div>
                <h3 className="font-semibold">Claim checks</h3>
                <div className="mt-3 space-y-3">{claimList(verification.claims).map((claim, index) => (
                  <div key={`${claim.claim}-${index}`} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium"><span className={claim.status === "supported" ? "text-green-700" : claim.status === "partial" ? "text-amber-700" : "text-red-700"}>{claim.status}</span> · {claim.claim}</p>
                    <p className="mt-1 text-muted">{claim.evidence}</p>
                  </div>
                ))}</div>
              </div>
            </div>
          )}
          {verification?.status === "failed" && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">The last verification failed{verification.error ? `: ${verification.error}` : "."}</p>}
        </section>
      )}

      <div className="mt-7 rounded-[10px] border border-border bg-white p-6 md:p-8"><ArticleEditor key={article?.id ?? "new"} article={article} /></div>
    </main>
    </AdminShell>
  );
}

export default function EditorPage(props: EditorPageProps) {
  return (
    <Suspense fallback={<p className="px-6 py-12 text-muted">Opening editor…</p>}>
      <EditorContent {...props} />
    </Suspense>
  );
}
