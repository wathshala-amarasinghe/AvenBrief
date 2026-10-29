import Image from "next/image";
import Link from "next/link";

type NewsCardProps = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
};

export default function NewsCard({
  slug,
  category,
  title,
  summary,
  imageSrc,
  imageAlt,
}: NewsCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-white">
      <Link
        href={`/news/${slug}`}
        aria-label={`Read ${title}`}
        className="group block h-full"
      >
        <div className="relative aspect-16/10">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            {category}
          </p>

          <h3 className="mt-4 font-serif text-2xl font-semibold group-hover:text-brand">
            {title}
          </h3>

          <p className="mt-4 leading-7 text-muted">
            {summary}
          </p>

          <p className="mt-6 text-xs text-muted">
            Sample story · Development preview
          </p>
        </div>
      </Link>
    </article>
  );
}