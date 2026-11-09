import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import ArticleEditor from "@/components/article-editor";
import AdminShell from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isArticleId } from "@/lib/article-validation.mjs";
import type { ArticleRecord } from "@/lib/article-types";

export const metadata: Metadata = {
  title: "Article Editor | AvenBrief",
  robots: { index: false, follow: false },
};

type EditorPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    saved?: string | string[];
    generated?: string | string[];
  }>;
};

async function EditorContent({ searchParams }: EditorPageProps) {
  await connection();
  const { supabase, user } = await requireAdmin();
  const params = await searchParams;
  const id = params.id;

  if (id !== undefined && (typeof id !== "string" || !isArticleId(id))) {
    notFound();
  }

  let article: ArticleRecord | null = null;
  let generation: { confidence: number | null; warnings: unknown } | null = null;
  if (typeof id === "string") {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error("Could not load the article.");
    if (!data) notFound();
    article = data as ArticleRecord;

    if (params.generated === "1") {
      const { data: generated } = await getAdminSupabase()
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
