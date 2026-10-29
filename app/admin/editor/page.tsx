import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import ArticleEditor from "@/components/article-editor";
import { requireAdmin } from "@/lib/auth";
import { isArticleId } from "@/lib/article-validation.mjs";
import type { ArticleRecord } from "@/lib/article-types";

export const metadata: Metadata = {
  title: "Article Editor | AvenBrief",
  robots: { index: false, follow: false },
};

type EditorPageProps = {
  searchParams: Promise<{ id?: string | string[]; saved?: string | string[] }>;
};

async function EditorContent({ searchParams }: EditorPageProps) {
  await connection();
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const id = params.id;

  if (id !== undefined && (typeof id !== "string" || !isArticleId(id))) {
    notFound();
  }

  let article: ArticleRecord | null = null;
  if (typeof id === "string") {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error("Could not load the article.");
    if (!data) notFound();
    article = data as ArticleRecord;
  }

  const saved = article && params.saved === article.status;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/admin" className="text-sm text-brand hover:underline">
        ← Your articles
      </Link>
      <h1 className="mt-5 font-serif text-4xl font-semibold">
        {article ? "Edit article" : "New article"}
      </h1>

      {saved && article && (
        <p role="status" className="mt-6 rounded-xl bg-soft p-4 text-brand">
          {article.status === "published" ? "Article published." : "Draft saved privately."}
        </p>
      )}

      {article?.status === "published" && (
        <Link href={"/news/" + article.slug} className="mt-5 inline-block text-brand hover:underline">
          View published article →
        </Link>
      )}

      <ArticleEditor key={article?.id ?? "new"} article={article} />
    </main>
  );
}

export default function EditorPage(props: EditorPageProps) {
  return (
    <Suspense fallback={<p className="px-6 py-12 text-muted">Opening editor…</p>}>
      <EditorContent {...props} />
    </Suspense>
  );
}
