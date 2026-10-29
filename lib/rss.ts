import "server-only";
import Parser from "rss-parser";
import { cacheLife } from "next/cache";

export type Headline = {
  title: string;
  url: string;
  author: string;
  publishedAt: string;
};

export async function getHeadlines(): Promise<Headline[]> {
  "use cache";

  cacheLife({
    stale: 60,
    revalidate: 300,
    expire: 3600,
  });

  const response = await fetch("https://globalvoices.org/feed/", {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`RSS request failed: ${response.status}`);
  }

  const parser = new Parser();
  const feed = await parser.parseString(await response.text());
  const headlines = new Map<string, Headline>();

  for (const item of feed.items) {
    if (!item.title || !item.link) continue;

    let url: URL;

    try {
      url = new URL(item.link);
    } catch {
      continue;
    }

    const allowedHost =
      url.hostname === "globalvoices.org" ||
      url.hostname.endsWith(".globalvoices.org");

    if (url.protocol !== "https:" || !allowedHost) continue;

    headlines.set(url.href, {
      title: item.title,
      url: url.href,
      author: item.creator ?? "",
      publishedAt: item.pubDate ?? "",
    });
  }

  return Array.from(headlines.values()).slice(0, 12);
}