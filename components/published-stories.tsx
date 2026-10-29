import { io } from "next/cache";
import { getPublishedArticles } from "@/lib/published-articles";
import type { ArticlePreview } from "@/lib/article-types";
import PublishedArticleCard from "@/components/published-article-card";

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
    <div className="grid gap-8 md:grid-cols-3 md:gap-6">
      {articles.map((article) => (
        <PublishedArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
