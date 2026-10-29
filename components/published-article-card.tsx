import Link from "next/link";
import type { ArticlePreview } from "@/lib/article-types";

export default function PublishedArticleCard({ article }: { article: ArticlePreview }) {
  return (
    <article className="rounded-xl border border-border bg-white p-6">
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
  );
}
