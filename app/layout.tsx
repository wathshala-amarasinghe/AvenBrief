import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import Observability from "@/components/observability";
import SiteFooter from "@/components/site-footer";
import { siteUrl } from "@/lib/site-metadata";
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
        {children}
        <SiteFooter />
        <Observability />
      </body>
    </html>
  );
}
