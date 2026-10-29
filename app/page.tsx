import { Suspense } from "react";
import PublishedStories from "@/components/published-stories";
import SiteHeader from "@/components/site-header";
import NewsCard from "@/components/news-card";
import FeaturedNews from "@/components/featured-news";
import NewsletterSignup from "@/components/newsletter-signup";
import { categories } from "@/lib/categories";
import { articles as stories } from "@/lib/news";

export const metadata = {
  title: "AvenBrief | World News & Global Updates",
  description:
    "Explore world news, business, technology and science with clear context.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-328 px-6 pb-8 pt-6 md:px-8 lg:pt-8 xl:px-0">
        <nav aria-label="Featured sections" className="mb-6 flex gap-3 overflow-x-auto md:hidden">
          <a href="#latest" className="rounded-[10px] bg-soft px-3 py-3 text-sm text-brand">Latest</a>
          {categories.slice(0, 2).map((category) => (
            <a key={category.slug} href={`/category/${category.slug}`} className="px-3 py-3 text-sm text-muted">
              {category.name}
            </a>
          ))}
        </nav>

        <div className="rounded-[10px] bg-soft p-4">
          <div className="hidden items-center gap-4 md:flex">
            <span className="rounded-[10px] px-2 py-1 text-xs text-brand">LATEST</span>
            <p className="flex-1 text-sm text-muted">Your daily perspective on a changing world.</p>
            <p className="text-xs text-brand">Live feed&nbsp; ●</p>
          </div>
          <div className="md:hidden">
            <p className="text-xs font-semibold uppercase text-brand">Your daily perspective</p>
            <p className="mt-1 font-serif text-[28px] font-semibold">The world, in focus.</p>
            <p className="mt-1 text-xs text-muted">Friday, 30 October</p>
          </div>
        </div>

        <div className="mb-8 mt-6 hidden items-end justify-between md:flex">
          <h1 className="font-serif text-5xl font-semibold leading-tight lg:text-[56px]">The world, in focus.</h1>
          <p className="pb-2 text-xs text-muted">Friday, 30 October</p>
        </div>

        <FeaturedNews />

        <section id="latest" className="mt-10 scroll-mt-6 border-t border-border pt-8">
          <h2 className="mb-8 font-serif text-[32px] font-semibold">
            The latest
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                ...stories[2],
                category: "Climate",
                imageSrc: "/figma/coast.png",
                imageAlt: "A lakeside town beneath mountains",
                title: "Protecting the places where land meets sea",
                summary: "Researchers follow the signals of change along the world’s coastlines.",
                metadata: "Climate desk · 26 min ago",
              },
              { ...stories[1], metadata: "Technology desk · 34 min ago" },
              {
                ...stories[0],
                category: "World",
                imageSrc: "/figma/coast.png",
                imageAlt: "A lakeside town beneath mountains",
                title: "A fresh perspective from beyond the city",
                summary: "The landscapes and local stories bringing a different rhythm to daily life.",
                metadata: "World desk · 45 min ago",
              },
            ].map((story) => (
              <NewsCard key={story.title} {...story} />
            ))}
          </div>
        </section>

        <div className="mt-8">
          <NewsletterSignup />
        </div>

        <section className="mt-8" aria-labelledby="across-world-heading">
          <h2 id="across-world-heading" className="mb-8 font-serif text-[32px] font-semibold">Across the world</h2>
          <Suspense fallback={<p className="py-8 text-muted">Loading published stories…</p>}>
            <PublishedStories />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
