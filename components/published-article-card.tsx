import Link from "next/link";
import Image from "next/image";
import type { ArticlePreview } from "@/lib/article-types";
import { formatPublishedDate, getArticleImage } from "@/lib/article-images";

function StoryImage({ article, sizes, className }: { article: ArticlePreview; sizes: string; className: string }) {
  const image = getArticleImage(article);
  if (image.src.startsWith("https://")) {
    // Browser-loaded editorial media avoids server-side image proxying of arbitrary URLs.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />;
  }
  return <Image src={image.src} alt={image.alt} fill sizes={sizes} className={className} />;
}

export default function PublishedArticleCard({ article, variant = "grid" }: { article: ArticlePreview; variant?: "grid" | "list" }) {
  if (variant === "list") {
    return <article className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 py-5 md:grid-cols-[232px_minmax(0,1fr)] md:gap-6 md:py-8"><Link href={`/news/${article.slug}`} className="relative h-24 overflow-hidden rounded-[10px] md:h-[150px]"><StoryImage article={article} sizes="(min-width: 768px) 232px, 112px" className="object-cover" /></Link><div className="min-w-0"><p className="text-[11px] font-semibold uppercase text-brand">{article.category}</p><h3 className="mt-2 font-serif text-lg font-semibold leading-[1.3] md:text-2xl"><Link href={`/news/${article.slug}`} className="hover:text-brand">{article.title}</Link></h3><p className="mt-3 hidden text-sm leading-6 text-muted md:block">{article.summary}</p><p className="mt-3 text-xs text-muted">{article.author_name} · {formatPublishedDate(article.published_at)}</p></div></article>;
  }

  return (
    <article className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 bg-white md:block">
      <Link href={`/news/${article.slug}`} className="relative block h-24 overflow-hidden rounded-[10px] md:h-[210px]"><StoryImage article={article} sizes="(min-width: 1024px) 421px, (min-width: 768px) 50vw, 112px" className="object-cover" /></Link>
      <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wider text-brand md:mt-5">{article.category}</p><h3 className="mt-2 font-serif text-lg font-semibold leading-[1.3] md:mt-3 md:text-2xl"><Link href={`/news/${article.slug}`} className="hover:text-brand">{article.title}</Link></h3><p className="mt-3 hidden text-sm leading-6 text-muted md:block">{article.summary}</p><p className="mt-3 text-xs text-muted">{article.author_name} · {formatPublishedDate(article.published_at)}</p></div>
    </article>
  );
}
