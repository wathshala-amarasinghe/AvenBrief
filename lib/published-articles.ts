import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { getPublicSupabase } from "@/lib/supabase-public";
import { articles as samples } from "@/lib/news";
import type { ArticlePreview, ArticleRecord, PublishedArticlePage } from "@/lib/article-types";
import { ARTICLE_PAGE_SIZE, createPublishedArticleQuery, normalisePage } from "@/lib/article-browse.mjs";

type ReaderArticle = {
  title: string;
  slug: string;
  summary: string;
  category: string;
  paragraphs: string[];
  author_name: string;
  source_url: string | null;
  published_at: string | null;
  imageSrc: string | null;
  imageAlt: string;
  isSample: boolean;
};

// Request-scoped deduplication only; never use an authenticated client for public reads.
export const getReaderArticle = cache(async (slug: string): Promise<ReaderArticle | null> => {
  const sample = samples.find((article) => article.slug === slug);
  if (sample) {
    return {
      ...sample,
      author_name: "",
      source_url: null,
      published_at: null,
      isSample: true,
    };
  }

  await connection();
  const { data, error } = await getPublicSupabase()
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error("Could not load the article.");
  if (!data) return null;

  const article = data as ArticleRecord;
  return {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    category: article.category,
    paragraphs: article.body.split(/\n\s*\n/).filter(Boolean),
    author_name: article.author_name,
    source_url: article.source_url,
    published_at: article.published_at,
    imageSrc: null,
    imageAlt: "",
    isSample: false,
  };
});

export async function getPublishedArticlePage(
  options: { query?: string; category?: string; page?: number } = {},
): Promise<PublishedArticlePage> {
  await connection();
  const page = normalisePage(options.page);
  const { data, error, count } = await createPublishedArticleQuery(
    getPublicSupabase(),
    { ...options, page },
  );

  if (error) {
    console.error("Published article query failed:", error);
    throw new Error("Could not load published articles.");
  }

  const total = count ?? 0;
  return {
    articles: (data ?? []) as ArticlePreview[],
    count: total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ARTICLE_PAGE_SIZE)),
  };
}

export async function getPublishedArticles(): Promise<ArticlePreview[]> {
  return (await getPublishedArticlePage()).articles;
}
