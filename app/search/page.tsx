import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import SiteHeader from "@/components/site-header";
import NewsSearch from "@/components/news-search";
import ArticleResults from "@/components/article-results";
import { normalisePage, normaliseQuery } from "@/lib/article-browse.mjs";

export const metadata: Metadata = {
  title: "Search | AvenBrief",
  description: "Search published AvenBrief stories about world news, technology and climate.",
};

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
        <ArticleResults query={query} page={page} basePath="/search" />
      </Suspense>
    </>
  );
}

export default function SearchPage(props: SearchPageProps) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="border-b border-border pb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Explore AvenBrief</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold">Find your next story.</h1>
          <p className="mt-5 text-lg text-muted">Search published AvenBrief articles.</p>
        </div>
        <Suspense fallback={<p className="py-10 text-muted">Opening search…</p>}>
          <SearchContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}
