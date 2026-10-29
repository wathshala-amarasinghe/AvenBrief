import Image from "next/image";
import Link from "next/link";
import { articles } from "@/lib/news";

export default function FeaturedNews() {
  const [featured] = articles;

  if (!featured) return null;

  return (
    <section>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <article>
          <Link
            href={`/news/${featured.slug}`}
            className="group block"
          >
            <div className="relative aspect-342/238 overflow-hidden rounded-[10px] lg:aspect-856/365">
              <Image
                src={featured.imageSrc}
                alt={featured.imageAlt}
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover"
                loading="eager"
              />
            </div>

            <p className="mt-4 inline-flex rounded-[10px] bg-soft px-2 py-1 text-xs uppercase text-brand">
              {featured.category}
            </p>

            <h2 className="mt-4 font-serif text-[32px] font-semibold leading-tight group-hover:text-brand lg:text-5xl lg:leading-[1.16]">
              {featured.title}
            </h2>

            <p className="mt-4 text-base leading-6 text-muted">
              {featured.summary}
            </p>

            <p className="mt-4 text-xs text-muted">
              News desk · 8 min ago · 5 min read
            </p>
          </Link>
        </article>

        <div className="hidden gap-6 lg:grid">
          {[
            {
              slug: "the-next-chapter-in-clean-energy",
              category: "Climate",
              title: "The next chapter in the clean energy transition",
              imageSrc: "/figma/energy.png",
              imageAlt: "Wind turbines in a mountain landscape",
              metadata: "Climate desk · 12 min ago",
            },
            {
              slug: "search?q=work",
              category: "Finance",
              title: "Inside the changing world of work",
              imageSrc: "/figma/work.png",
              imageAlt: "A laptop and coffee on a desk",
              metadata: "Finance desk · 18 min ago",
            },
          ].map((article) => (
            <article key={article.title}>
              <Link
                href={article.slug.startsWith("search") ? `/${article.slug}` : `/news/${article.slug}`}
                className="group block"
              >
                <div className="relative h-39.5 overflow-hidden rounded-[10px]">
                  <Image
                    src={article.imageSrc}
                    alt={article.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <p className="mt-4 text-xs font-semibold uppercase text-brand">
                  {article.category}
                </p>

                <h2 className="mt-3 font-serif text-2xl font-semibold leading-[1.3] group-hover:text-brand">
                  {article.title}
                </h2>

                <p className="mt-3 text-xs text-muted">
                  {article.metadata}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
