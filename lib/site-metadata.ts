import type { Metadata } from "next";

const productionUrl = "https://aven-brief.vercel.app";

function readSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return new URL(productionUrl);

  try {
    const url = new URL(configured);
    return url.protocol === "https:" ? url : new URL(productionUrl);
  } catch {
    return new URL(productionUrl);
  }
}

export const siteUrl = readSiteUrl();
export const feedUrl = new URL("/feed.xml", siteUrl).toString();

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  robots,
}: {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
}): Metadata {
  const canonical = absoluteUrl(path);
  const socialImage = absoluteUrl("/opengraph-image");

  return {
    title,
    description,
    alternates: {
      canonical,
      types: { "application/rss+xml": feedUrl },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "AvenBrief",
      title,
      description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: "AvenBrief — The world, made clear" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
    robots,
  };
}
