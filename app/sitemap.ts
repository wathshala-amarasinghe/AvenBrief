import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { categories } from "@/lib/categories";
import { getPublishedSitemapEntries } from "@/lib/published-articles";
import { absoluteUrl } from "@/lib/site-metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const articles = await getPublishedSitemapEntries();
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/headlines"), changeFrequency: "hourly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/editorial-policy"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/corrections-policy"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    ...categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  return [
    ...staticPages,
    ...articles.map((article) => ({
      url: absoluteUrl(`/news/${article.slug}`),
      lastModified: article.published_at ? new Date(article.published_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
