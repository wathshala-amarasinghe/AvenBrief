import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { getPublicSupabase } from "@/lib/supabase-public";
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
  imageCredit: string;
};

export const getReaderArticle = cache(async (slug: string): Promise<ReaderArticle | null> => {
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
    imageSrc: article.featured_image_url ?? null,
    imageAlt: article.image_alt ?? "",
    imageCredit: article.image_credit ?? "",
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

export async function getPublishedSitemapEntries(): Promise<Array<{ slug: string; published_at: string | null }>> {
  const { data, error } = await getPublicSupabase()
    .from("articles")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Sitemap article query failed:", error);
    return [];
  }

  return data ?? [];
}
