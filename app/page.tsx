import SiteHeader from "@/components/site-header";
import NewsCard from "@/components/news-card";
import FeaturedNews from "@/components/featured-news";
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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-xl bg-soft px-5 py-4 text-sm text-brand">
          The world, made clear.
        </div>

        <FeaturedNews />

        <section id="latest" className="border-t border-border py-10">
          <h2 className="mb-8 font-serif text-3xl font-bold">
            The latest
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {stories.map((story) => (
              <NewsCard key={story.slug} {...story} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}