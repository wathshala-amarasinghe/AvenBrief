import Link from "next/link";
import { redirect } from "next/navigation";
import PublishedArticleCard from "@/components/published-article-card";
import { getPublishedArticlePage } from "@/lib/published-articles";
import { articlePageHref } from "@/lib/article-browse.mjs";
import type { PublishedArticlePage } from "@/lib/article-types";

type ResultsProps = {
  category?: string;
  query?: string;
  page: number;
  basePath: string;
  variant?: "grid" | "list";
  showHeading?: boolean;
};

export default async function ArticleResults({
  category, query = "", page, basePath, variant = "grid", showHeading = true,
}: ResultsProps) {
  let result: PublishedArticlePage;
  try {
    result = await getPublishedArticlePage({ category, query, page });
  } catch (error) {
    console.error("Article results unavailable:", error);
    return (
      <p role="status" className="rounded-xl bg-soft p-6 text-muted">
        Stories are temporarily unavailable. Please try again later.
      </p>
    );
  }

  if (page > result.totalPages) {
    redirect(articlePageHref(basePath, query, result.totalPages));
  }

  return (
    <section aria-labelledby="results-heading" className="py-8 md:py-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        {showHeading && <h2 id="results-heading" className="font-serif text-3xl font-semibold">
          {category ? "Latest stories" : query ? "Search results" : "Recent stories"}
        </h2>}
        <p role="status" className="text-sm text-muted">
          {result.count} {result.count === 1 ? "story" : "stories"}
          {query && <> found for “{query}”</>}
        </p>
      </div>

      {result.articles.length ? (
        <div className={variant === "list" ? "divide-y divide-border" : "grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"}>
          {result.articles.map((article) => (
            <PublishedArticleCard key={article.id} article={article} variant={variant} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-soft p-6 text-muted">
          {query ? (
            <>
              <p>No stories found. Try a different keyword.</p>
              <Link href="/search" className="mt-3 inline-block text-brand hover:underline">
                Clear search
              </Link>
            </>
          ) : (
            <><p>{category ? "No published stories in this category yet." : "No published stories are available yet."}</p><div className="mt-4 flex flex-wrap gap-4"><Link href="/headlines" className="font-medium text-brand hover:underline">Browse source headlines →</Link>{category && <Link href="/search" className="font-medium text-brand hover:underline">Explore all stories →</Link>}</div></>
          )}
        </div>
      )}

      {result.totalPages > 1 && (
        <nav aria-label="Article pages" className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {page > 1 ? (
            <Link href={articlePageHref(basePath, query, page - 1)}
              className="rounded-xl border border-border px-4 py-3 text-brand hover:bg-soft">
              ← Previous
            </Link>
          ) : <span />}

          <p className="text-sm text-muted">Page {page} of {result.totalPages}</p>

          {page < result.totalPages ? (
            <Link href={articlePageHref(basePath, query, page + 1)}
              className="rounded-xl border border-border px-4 py-3 text-brand hover:bg-soft">
              Next →
            </Link>
          ) : <span />}
        </nav>
      )}
    </section>
  );
}
