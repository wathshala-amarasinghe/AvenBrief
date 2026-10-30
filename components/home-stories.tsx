import Link from "next/link";
import { connection } from "next/server";
import EditorialImage from "@/components/editorial-image";
import PublishedArticleCard from "@/components/published-article-card";
import { formatPublishedDate, getArticleImage } from "@/lib/article-images";
import { getPublishedArticles } from "@/lib/published-articles";

export default async function HomeStories() {
  await connection();
  let articles;
  try {
    articles = await getPublishedArticles();
  } catch (error) {
    console.error("Homepage stories unavailable:", error);
    return <p role="status" className="rounded-[10px] bg-soft p-6 text-muted">Stories are temporarily unavailable. Please try again shortly.</p>;
  }

  if (!articles.length) {
    return (
      <section className="rounded-[10px] bg-soft p-7 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">The newsroom is preparing</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold">The world, in focus.</h1>
        <p className="mt-4 max-w-xl leading-7 text-muted">Published reporting will appear here after it completes AvenBrief’s review-first editorial workflow.</p>
        <Link href="/headlines" className="mt-6 inline-block font-medium text-brand hover:underline">Browse current source headlines →</Link>
      </section>
    );
  }

  const [lead, ...latest] = articles;
  const image = getArticleImage(lead);

  return (
    <>
      <section aria-labelledby="lead-story-heading">
        <Link href={`/news/${lead.slug}`} className="group grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)] lg:items-center lg:gap-10">
          <div className="relative aspect-[342/238] overflow-hidden rounded-[10px] lg:aspect-[856/480]">
            <EditorialImage src={image.src} alt={image.alt} sizes="(min-width: 1024px) 66vw, 100vw" priority />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{lead.category}</p>
            <h1 id="lead-story-heading" className="mt-3 font-serif text-[34px] font-semibold leading-tight group-hover:text-brand md:text-[48px]">{lead.title}</h1>
            <p className="mt-4 text-base leading-7 text-muted">{lead.summary}</p>
            <p className="mt-5 text-xs text-muted">{lead.author_name} · {formatPublishedDate(lead.published_at)}</p>
          </div>
        </Link>
      </section>

      <section id="latest" className="mt-10 scroll-mt-6 border-t border-border pt-8">
        <div className="flex items-end justify-between gap-4"><h2 className="font-serif text-[32px] font-semibold">The latest</h2><Link href="/search" className="text-sm text-brand hover:underline">Browse all stories →</Link></div>
        {latest.length ? (
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {latest.slice(0, 6).map((article) => <PublishedArticleCard key={article.id} article={article} />)}
          </div>
        ) : (
          <div className="mt-6 rounded-[10px] bg-soft p-6 text-sm text-muted">This is the newest published story. More reviewed coverage will appear here as it is published.</div>
        )}
      </section>
    </>
  );
}
