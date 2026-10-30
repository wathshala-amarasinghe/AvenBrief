import { getPublishedFeedEntries } from "@/lib/published-articles";
import { absoluteUrl, feedUrl } from "@/lib/site-metadata";
import { escapeXml } from "@/lib/structured-data.mjs";

function rssDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toUTCString();
}

export async function GET() {
  const articles = await getPublishedFeedEntries();
  const lastBuildDate = rssDate(articles[0]?.published_at ?? null) ?? new Date().toUTCString();
  const items = articles.map((article) => {
    const url = absoluteUrl(`/news/${article.slug}`);
    const published = rssDate(article.published_at);

    return [
      "<item>",
      `<title>${escapeXml(article.title)}</title>`,
      `<link>${escapeXml(url)}</link>`,
      `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `<description>${escapeXml(article.summary)}</description>`,
      `<category>${escapeXml(article.category)}</category>`,
      `<dc:creator>${escapeXml(article.author_name)}</dc:creator>`,
      published ? `<pubDate>${escapeXml(published)}</pubDate>` : "",
      "</item>",
    ].filter(Boolean).join("");
  }).join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "<channel>",
    "<title>AvenBrief</title>",
    `<link>${escapeXml(absoluteUrl("/"))}</link>`,
    "<description>The world, made clear. Independent news summaries and useful context.</description>",
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    "<language>en</language>",
    `<lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
