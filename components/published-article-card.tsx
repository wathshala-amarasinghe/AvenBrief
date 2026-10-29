import Link from "next/link";
import Image from "next/image";
import type { ArticlePreview } from "@/lib/article-types";

const categoryImages: Record<string, { src: string; alt: string }> = {
  World: { src: "/figma/city.png", alt: "City skyline and public transport" },
  Technology: { src: "/figma/tram.png", alt: "Modern tram on a tree-lined street" },
  Climate: { src: "/figma/energy.png", alt: "Wind turbines in a mountain landscape" },
  Finance: { src: "/figma/work.png", alt: "Laptop and coffee on a desk" },
  Gaming: { src: "/figma/coast.png", alt: "Town beside a mountain lake" },
};

export default function PublishedArticleCard({
  article,
  variant = "grid",
}: {
  article: ArticlePreview;
  variant?: "grid" | "list";
}) {
  const image = categoryImages[article.category] ?? categoryImages.World;

  if (variant === "list") {
    return (
      <article className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 py-6 md:grid-cols-[232px_minmax(0,1fr)] md:gap-6 md:py-8">
        <Link href={`/news/${article.slug}`} className="relative h-24 overflow-hidden rounded-[10px] md:h-[150px]">
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 232px, 96px" className="object-cover" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-brand">{article.category}</p>
          <h3 className="mt-2 font-serif text-xl font-semibold leading-[1.35] md:text-2xl">
            <Link href={`/news/${article.slug}`} className="hover:text-brand">{article.title}</Link>
          </h3>
          <p className="mt-3 hidden text-sm leading-6 text-muted md:block">{article.summary}</p>
          <p className="mt-3 text-xs text-muted">{article.author_name} · 5 min read</p>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white">
      <Link href={`/news/${article.slug}`} className="relative block h-[210px] overflow-hidden rounded-[10px]">
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 421px, 100vw" className="object-cover" />
      </Link>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-brand">
        {article.category}
      </p>
      <h3 className="mt-3 font-serif text-2xl font-semibold leading-[1.3]">
        <Link href={"/news/" + article.slug} className="hover:text-brand">
          {article.title}
        </Link>
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted">{article.summary}</p>
      <p className="mt-3 text-xs text-muted">{article.author_name} · 5 min read</p>
    </article>
  );
}
