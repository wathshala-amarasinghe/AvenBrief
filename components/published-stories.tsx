import Link from "next/link";
import { io } from "next/cache";
import { getPublishedArticles } from "@/lib/published-articles";
import type { ArticlePreview } from "@/lib/article-types";

export default async function PublishedStories() {
  // Suspend outside the error handler so Next.js can build the static shell.
  await io();

  let articles: ArticlePreview[];
  try {
    articles = await getPublishedArticles();
  } catch (error) {
    console.error("Published stories unavailable:", error);
    return (
      <p role="status" className="my-8 rounded-xl bg-soft p-5 text-muted">
      Published stories are temporarily unavailable. Please try again later.
      </p>
    );
  }

  if (!articles.length) {
    return (
      <p role="status" className="rounded-xl bg-soft p-6 text-muted">
      No published articles are available yet.
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {articles.map((article) => (
        <article key={article.id} className="rounded-xl border border-border p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            {article.category}
          </p>
          <h3 className="mt-4 font-serif text-2xl font-semibold">
            <Link href={"/news/" + article.slug} className="hover:text-brand">
              {article.title}
            </Link>
          </h3>
          <p className="mt-4 leading-7 text-muted">{article.summary}</p>
          <p className="mt-5 text-xs text-muted">By {article.author_name}</p>
        </article>
      ))}
    </div>
  );
}
