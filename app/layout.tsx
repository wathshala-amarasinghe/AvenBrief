import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import SiteFooter from "@/components/site-footer";
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
  title: "AvenBrief | World News & Global Updates",
  description:
    "Explore world news, business, technology, science and culture with clear summaries and useful context.",
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
      </body>
    </html>
  );
}