import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import SiteHeader from "@/components/site-header";
import NewsSearch from "@/components/news-search";
import ArticleResults from "@/components/article-results";
import { normalisePage, normaliseQuery } from "@/lib/article-browse.mjs";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Search | AvenBrief",
  description: "Search published AvenBrief stories about world news, technology, climate, finance and gaming.",
  path: "/search",
  robots: { index: false, follow: true },
});

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

async function SearchContent({ searchParams }: SearchPageProps) {
  await connection();
  const params = await searchParams;
  const query = normaliseQuery(params.q);
  const page = normalisePage(params.page);

  return (
    <>
      <NewsSearch query={query} />
      <Suspense key={query + ":" + page} fallback={<p className="py-10 text-muted">Searching stories…</p>}>
        <ArticleResults query={query} page={page} basePath="/search" variant="list" />
      </Suspense>
    </>
  );
}

export default function SearchPage(props: SearchPageProps) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1312px] px-6 pb-12 pt-8 md:px-8 md:pt-12 xl:px-0">
        <div className="border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Explore AvenBrief</p>
          <h1 className="mt-4 font-serif text-[44px] font-semibold leading-tight md:text-[56px]">Search the world.</h1>
          <p className="mt-3 text-base text-muted">Find stories by topic, place, category, or keyword.</p>
        </div>
        <Suspense fallback={<p className="py-10 text-muted">Opening search…</p>}>
          <SearchContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}
