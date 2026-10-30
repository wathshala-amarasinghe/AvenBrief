"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClientErrorRecord } from "@/lib/error-reporting.mjs";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify(createClientErrorRecord(error, window.location.pathname)));
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-white text-ink">
      <header className="border-b border-border px-6 py-6 md:px-8">
        <div className="mx-auto max-w-[1312px]">
          <Link href="/" aria-label="AvenBrief home" className="inline-block">
            <Image src="/avenbrief-logo.png" alt="AvenBrief" width={2172} height={724} className="h-auto w-[130px]" priority />
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-[920px] place-items-center px-6 py-20 text-center md:py-28">
        <div role="alert">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Something went wrong</p>
          <h1 className="mt-4 font-serif text-[44px] font-semibold leading-tight md:text-[64px]">We could not open this page.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted md:text-lg">
            This may be a temporary problem. Try the page again, or return to the latest AvenBrief coverage.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="rounded-[8px] bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Try again
            </button>
            <Link href="/" className="rounded-[8px] border border-border bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand">
              Return home
            </Link>
          </div>
          {error.digest && <p className="mt-6 text-xs text-muted">Error reference: {error.digest}</p>}
        </div>
      </main>
    </div>
  );
}
