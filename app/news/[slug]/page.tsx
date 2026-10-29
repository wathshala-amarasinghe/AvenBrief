import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { articles } from "@/lib/news";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);

  if (!article) {
    return { title: "Article not found | AvenBrief" };
  }

  return {
    title: `${article.title} | AvenBrief`,
    description: article.summary,
  };
}

export const instant = false;

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/"
          className="text-sm text-muted hover:text-brand"
        >
          ← Back to home
        </Link>

        <article className="mt-8">
          <Link
            href={`/category/${article.category.toLowerCase()}`}
            className="inline-block text-sm font-semibold uppercase tracking-wider text-brand hover:underline"
          >
            {article.category}
          </Link>

          <h1 className="mt-4 font-serif text-4xl leading-tight font-semibold md:text-6xl">
            {article.title}
          </h1>

          <p className="mt-6 text-xl leading-8 text-muted">
            {article.summary}
          </p>

          <p className="mt-5 text-sm text-muted">
            Sample article · Development preview
          </p>

          <div className="relative mt-8 aspect-video overflow-hidden rounded-xl">
            <Image
              src={article.imageSrc}
              alt={article.imageAlt}
              fill
              sizes="(min-width: 1024px) 976px, 100vw"
              className="object-cover"
              loading="eager"
            />
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-6 text-lg leading-8">
            {article.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>

        <div className="mt-12 border-t border-border pt-6">
          <Link
            href="/#latest"
            className="font-medium text-brand hover:underline"
          >
            Explore more stories →
          </Link>
        </div>
      </main>
    </div>
  );
}