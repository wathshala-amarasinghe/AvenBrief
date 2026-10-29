import Image from "next/image";
import Link from "next/link";

type NewsCardProps = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
  metadata?: string;
};

export default function NewsCard({
  slug,
  category,
  title,
  summary,
  imageSrc,
  imageAlt,
  metadata = "AvenBrief desk  ·  5 min read",
}: NewsCardProps) {
  return (
    <article className="bg-white">
      <Link
        href={`/news/${slug}`}
        aria-label={`Read ${title}`}
        className="group block h-full"
      >
        <div className="relative h-[210px] overflow-hidden rounded-[10px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            {category}
          </p>

          <h3 className="mt-3 font-serif text-2xl font-semibold leading-[1.3] group-hover:text-brand">
            {title}
          </h3>

          <p className="mt-3 text-sm leading-[1.5] text-muted">
            {summary}
          </p>

          <p className="mt-3 text-xs text-muted">
            {metadata}
          </p>
        </div>
      </Link>
    </article>
  );
}
