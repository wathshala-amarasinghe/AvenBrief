import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Page Not Found | AvenBrief",
  description: "The requested AvenBrief page could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-white text-ink">
      <SiteHeader />
      <main className="mx-auto grid max-w-[920px] place-items-center px-6 py-20 text-center md:py-28">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">404 · Page not found</p>
          <h1 className="mt-4 font-serif text-[44px] font-semibold leading-tight md:text-[64px]">
            This story is no longer here.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted md:text-lg">
            The address may be incorrect, or the page may have moved. You can return to the latest coverage or search AvenBrief.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-[8px] bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Read latest stories
            </Link>
            <Link href="/search" className="rounded-[8px] border border-border bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand">
              Search AvenBrief
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
