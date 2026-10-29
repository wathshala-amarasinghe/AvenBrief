import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { articles as samples } from "@/lib/news";
import { getReaderArticle } from "@/lib/published-articles";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export const instant = false;

export function generateStaticParams() {
  return samples.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getReaderArticle(slug);
  if (!article) notFound();

  return {
    title: article.title + " | AvenBrief",
    description: article.summary,
  };
}

async function ArticleContent({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getReaderArticle(slug);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-brand">← Back to home</Link>
      <article className="mt-8">
        <Link href={"/category/" + article.category.toLowerCase()}
          className="text-sm font-semibold uppercase tracking-wider text-brand hover:underline">
          {article.category}
        </Link>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-6xl">
          {article.title}
        </h1>
        <p className="mt-6 text-xl leading-8 text-muted">{article.summary}</p>

        {article.isSample ? (
          <p className="mt-5 text-sm text-muted">Sample article · Development preview</p>
        ) : (
          <p className="mt-5 text-sm text-muted">
            By {article.author_name}
            {article.published_at && (
              <>
                {" · "}
                <time dateTime={article.published_at}>
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  }).format(new Date(article.published_at))}
                </time>
              </>
            )}
          </p>
        )}

        {article.imageSrc && (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-xl">
            <Image src={article.imageSrc} alt={article.imageAlt} fill
              sizes="(min-width: 1024px) 976px, 100vw"
              className="object-cover" loading="eager" />
          </div>
        )}

        <div className="mx-auto mt-10 max-w-3xl space-y-6 text-lg leading-8">
          {article.paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-wrap break-words">{paragraph}</p>
          ))}

          {article.source_url && (
            <p className="border-t border-border pt-6 text-sm">
              Source:{" "}
              <a href={article.source_url} rel="noopener noreferrer"
                className="break-all text-brand hover:underline">
                {article.source_url}
              </a>
            </p>
          )}
        </div>
      </article>
    </main>
  );
}

export default function ArticlePage(props: ArticlePageProps) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />
      <Suspense fallback={<p className="px-6 py-10 text-muted">Loading article…</p>}>
        <ArticleContent {...props} />
      </Suspense>
    </div>
  );
}
