import Image from "next/image";
import Link from "next/link";
import { articles } from "@/lib/news";

export default function FeaturedNews() {
  const [featured, ...otherArticles] = articles;

  if (!featured) return null;

  return (
    <section className="py-10">
      <h1 className="mb-8 font-serif text-4xl font-semibold md:text-6xl">
        The world, in focus.
      </h1>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <article>
          <Link
            href={`/news/${featured.slug}`}
            className="group block"
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
              <Image
                src={featured.imageSrc}
                alt={featured.imageAlt}
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover"
                loading="eager"
              />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand">
              {featured.category}
            </p>

            <h2 className="mt-3 font-serif text-3xl font-semibold group-hover:text-brand md:text-4xl">
              {featured.title}
            </h2>

            <p className="mt-4 text-lg leading-8 text-muted">
              {featured.summary}
            </p>

            <p className="mt-5 text-xs text-muted">
              Sample story · Development preview
            </p>
          </Link>
        </article>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
          {otherArticles.slice(0, 2).map((article) => (
            <article key={article.slug}>
              <Link
                href={`/news/${article.slug}`}
                className="group block"
              >
                <div className="relative aspect-[16/8] overflow-hidden rounded-xl">
                  <Image
                    src={article.imageSrc}
                    alt={article.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand">
                  {article.category}
                </p>

                <h2 className="mt-2 font-serif text-2xl font-semibold group-hover:text-brand">
                  {article.title}
                </h2>

                <p className="mt-3 text-xs text-muted">
                  Sample story · Development preview
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}