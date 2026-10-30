import { Suspense } from "react";
import Link from "next/link";
import HomeStories from "@/components/home-stories";
import CurrentDate from "@/components/current-date";
import SiteHeader from "@/components/site-header";
import { categories } from "@/lib/categories";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "AvenBrief | World News & Global Updates",
  description: "Explore world news, business, technology, climate, finance and gaming with clear context.",
  path: "/",
});

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-328 px-6 pb-10 pt-6 md:px-8 lg:pt-8 xl:px-0">
        <nav aria-label="Featured sections" className="-mx-2 mb-6 flex gap-1 overflow-x-auto px-2 pb-1 md:hidden">
          <a href="#latest" className="shrink-0 rounded-[10px] bg-soft px-3 py-3 text-sm text-brand">Latest</a>
          {categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} className="shrink-0 px-3 py-3 text-sm text-muted">{category.name}</Link>)}
        </nav>

        <div className="mb-7 rounded-[10px] bg-soft p-4">
          <div className="flex items-center gap-4">
            <span className="rounded-[10px] px-2 py-1 text-xs font-semibold uppercase text-brand">Today</span>
            <p className="flex-1 text-sm text-muted">Your daily perspective on a changing world.</p>
            <p className="hidden text-xs text-muted sm:block"><Suspense fallback="Today"><CurrentDate /></Suspense></p>
          </div>
          <p className="mt-2 text-xs text-muted sm:hidden"><Suspense fallback="Today"><CurrentDate /></Suspense></p>
        </div>

        <Suspense fallback={<div className="h-[460px] animate-pulse rounded-[10px] bg-soft" aria-label="Loading stories" />}>
          <HomeStories />
        </Suspense>
      </main>
    </div>
  );
}
