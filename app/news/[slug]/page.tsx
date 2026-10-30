import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleActions from "@/components/article-actions";
import EditorialImage from "@/components/editorial-image";
import PublishedArticleCard from "@/components/published-article-card";
import SiteHeader from "@/components/site-header";
import { getArticleImage } from "@/lib/article-images";
import { getPublishedArticles, getReaderArticle } from "@/lib/published-articles";
import { absoluteUrl } from "@/lib/site-metadata";

type ArticlePageProps = { params: Promise<{ slug: string }> };
export const instant = false;

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getReaderArticle(slug);
  if (!article) notFound();
  const canonical = absoluteUrl(`/news/${article.slug}`);
  const image = getArticleImage({
    category: article.category,
    featured_image_url: article.imageSrc,
    image_alt: article.imageAlt,
  });
  const imageUrl = absoluteUrl(image.src);

  return {
    title: article.title + " | AvenBrief",
    description: article.summary,
    alternates: { canonical },
    authors: [{ name: article.author_name }],
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "AvenBrief",
      title: article.title,
      description: article.summary,
      publishedTime: article.published_at ?? undefined,
      authors: [article.author_name],
      section: article.category,
      images: [{ url: imageUrl, alt: image.alt || article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [imageUrl],
    },
  };
}

async function ArticleContent({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getReaderArticle(slug);
  if (!article) notFound();
  const image = getArticleImage({
    category: article.category,
    featured_image_url: article.imageSrc,
    image_alt: article.imageAlt,
  });
  const published = article.published_at ? new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(article.published_at)) : "Publication date pending";
  const related = (await getPublishedArticles()).filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <main className="mx-auto max-w-[1312px] px-6 pb-14 pt-8 md:px-8 md:pt-12 xl:px-0">
      <article>
        <header className="mx-auto max-w-[980px] text-center">
          <Link href={`/category/${article.category.toLowerCase()}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-brand hover:underline">{article.category}</Link>
          <h1 className="mt-4 font-serif text-[40px] font-semibold leading-[1.08] md:text-[64px]">{article.title}</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted md:text-xl">{article.summary}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted"><span>By {article.author_name}</span><span aria-hidden="true">•</span><time dateTime={article.published_at ?? undefined}>{published}</time><span aria-hidden="true">•</span><span>{Math.max(1, Math.ceil(article.paragraphs.join(" ").split(/\s+/).length / 220))} min read</span></div>
        </header>

        <div className="relative mt-9 aspect-[16/9] overflow-hidden rounded-[10px] md:mt-12 md:aspect-[16/7.8]">
          <EditorialImage src={image.src} alt={image.alt || article.title} sizes="(min-width: 1280px) 1312px, 100vw" priority />
        </div>
        {article.imageCredit && <p className="mt-2 text-right text-xs text-muted">Image: {article.imageCredit}</p>}

        <div className="mx-auto mt-10 grid max-w-[1060px] gap-10 md:grid-cols-[72px_minmax(0,680px)_220px] md:items-start">
          <aside aria-label="Article actions" className="md:sticky md:top-5"><ArticleActions slug={article.slug} title={article.title} /></aside>
          <div className="space-y-6 text-[17px] leading-8 text-ink">
            {article.paragraphs.map((paragraph, index) => <p key={index} className={index === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.85]" : "whitespace-pre-wrap wrap-break-word"}>{paragraph}</p>)}
            {article.source_url && <p className="border-t border-border pt-6 text-sm text-muted">Original source: <a href={article.source_url} rel="noopener noreferrer" className="break-all text-brand hover:underline">{article.source_url}</a></p>}
          </div>
          <aside className="rounded-[10px] bg-soft p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">In brief</p><p className="mt-3 text-sm leading-6 text-muted">Clear reporting, useful context, and links back to original sources.</p><Link href="/editorial-policy" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">Our editorial approach →</Link></aside>
        </div>
      </article>

      {related.length > 0 && <section className="mt-16 border-t border-border pt-8" aria-labelledby="keep-reading"><h2 id="keep-reading" className="font-serif text-[32px] font-semibold">Keep reading</h2><div className="mt-7 grid gap-8 md:grid-cols-3 md:gap-6">{related.map((story) => <PublishedArticleCard key={story.id} article={story} />)}</div></section>}
    </main>
  );
}

export default function ArticlePage(props: ArticlePageProps) {
  return <div className="min-h-screen bg-white text-ink"><SiteHeader /><Suspense fallback={<p className="px-6 py-10 text-muted">Loading article…</p>}><ArticleContent {...props} /></Suspense></div>;
}
