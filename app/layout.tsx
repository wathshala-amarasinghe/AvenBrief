import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import JsonLd from "@/components/json-ld";
import Observability from "@/components/observability";
import SiteFooter from "@/components/site-footer";
import { absoluteUrl, feedUrl, siteUrl } from "@/lib/site-metadata";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "AvenBrief | World News & Global Updates",
  description:
    "Explore world news, business, technology, science and culture with clear summaries and useful context.",
  applicationName: "AvenBrief",
  authors: [{ name: "AvenBrief Editorial Team" }],
  creator: "AvenBrief",
  publisher: "AvenBrief",
  category: "news",
  referrer: "origin-when-cross-origin",
  keywords: ["world news", "technology", "climate", "finance", "gaming", "global updates"],
  alternates: {
    types: { "application/rss+xml": feedUrl },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable}`}
    >
      <body className="font-sans antialiased">
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              "@id": absoluteUrl("/#organization"),
              name: "AvenBrief",
              url: absoluteUrl("/"),
              logo: {
                "@type": "ImageObject",
                url: absoluteUrl("/avenbrief-logo.png"),
                width: 2172,
                height: 724,
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": absoluteUrl("/#website"),
              name: "AvenBrief",
              url: absoluteUrl("/"),
              publisher: { "@id": absoluteUrl("/#organization") },
            },
          ]}
        />
        {children}
        <SiteFooter />
        <Observability />
      </body>
    </html>
  );
}
