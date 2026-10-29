import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import NewsSearch from "@/components/news-search";

export const metadata: Metadata = {
  title: "Search | AvenBrief",
  description:
    "Search AvenBrief stories about world news, technology and climate.",
};

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="border-b border-border pb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Explore AvenBrief
          </p>

          <h1 className="mt-4 font-serif text-5xl font-semibold">
            Find your next story.
          </h1>

          <p className="mt-5 text-lg text-muted">
            Search our collection of stories and ideas.
          </p>
        </div>

        <NewsSearch />
      </main>
    </div>
  );
}