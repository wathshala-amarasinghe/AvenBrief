import "server-only";
import Parser from "rss-parser";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { cacheLife } from "next/cache";
import { suggestRssCategory } from "@/lib/rss-category.mjs";

const GLOBAL_VOICES_FEED = "https://globalvoices.org/feed/";
const MAX_FEED_BYTES = 2_000_000;

export type Headline = {
  title: string;
  url: string;
  author: string;
  publishedAt: string;
  suggestedCategory: string;
};

function isPrivateAddress(address: string) {
  const value = address.toLowerCase();

  if (isIP(value) === 4) {
    const [first, second] = value.split(".").map(Number);
    return first === 10 ||
      first === 127 ||
      first === 0 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 100 && second >= 64 && second <= 127) ||
      first >= 224;
  }

  if (isIP(value) === 6) {
    return value === "::" ||
      value === "::1" ||
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      /^fe[89ab]/.test(value);
  }

  return true;
}

async function assertPublicFeedUrl(url: URL) {
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    throw new Error("Feed URL must be a public HTTPS address.");
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Feed URL resolved to a private or unsupported address.");
  }
}

async function fetchFeed(feedUrl: string) {
  let currentUrl = new URL(feedUrl);

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    await assertPublicFeedUrl(currentUrl);

    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "AvenBrief RSS importer/1.0" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === 3) {
        throw new Error("RSS feed redirected too many times.");
      }
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) {
      throw new Error(`RSS request failed with status ${response.status}.`);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("text/html")) {
      throw new Error("The URL returned a web page instead of an RSS or Atom feed.");
    }

    const declaredSize = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_FEED_BYTES) {
      throw new Error("RSS feed is larger than the allowed import limit.");
    }

    const body = await response.text();
    if (body.length > MAX_FEED_BYTES) {
      throw new Error("RSS feed is larger than the allowed import limit.");
    }

    return body;
  }

  throw new Error("Could not load RSS feed.");
}

export async function getHeadlinesFromSource(feedUrl: string): Promise<Headline[]> {
  const parser = new Parser();
  const feed = await parser.parseString(await fetchFeed(feedUrl));
  const headlines = new Map<string, Headline>();

  for (const item of feed.items) {
    const title = item.title?.trim().slice(0, 300);
    if (!title || !item.link) continue;

    let url: URL;

    try {
      url = new URL(item.link);
    } catch {
      continue;
    }

    if (url.protocol !== "https:" || url.username || url.password) continue;
    url.hash = "";

    headlines.set(url.href, {
      title,
      url: url.href,
      author: (item.creator ?? "").trim().slice(0, 200),
      publishedAt: item.pubDate ?? "",
      suggestedCategory: suggestRssCategory({
        title,
        categories: item.categories,
      }),
    });
  }

  return Array.from(headlines.values()).slice(0, 12);
}

export async function getHeadlines(): Promise<Headline[]> {
  "use cache";

  cacheLife({
    stale: 60,
    revalidate: 300,
    expire: 3600,
  });

  return getHeadlinesFromSource(GLOBAL_VOICES_FEED);
}
