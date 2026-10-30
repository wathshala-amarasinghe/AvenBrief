"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClientErrorRecord } from "@/lib/error-reporting.mjs";

export default function GlobalError({
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
    <html lang="en">
      <body className="m-0 bg-white font-sans text-ink antialiased">
        <main className="grid min-h-screen place-items-center px-6 py-16 text-center">
          <div role="alert" className="max-w-xl">
            <Link href="/" aria-label="AvenBrief home" className="inline-block">
              <Image src="/avenbrief-logo.png" alt="AvenBrief" width={2172} height={724} className="h-auto w-[150px]" priority />
            </Link>
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-brand">Service interruption</p>
            <h1 className="mt-4 font-serif text-[42px] font-semibold leading-tight md:text-[58px]">AvenBrief is temporarily unavailable.</h1>
            <p className="mt-5 text-base leading-7 text-muted">Try again in a moment. Your browser can safely reload the site.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={reset} className="rounded-[8px] bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">Try again</button>
              <Link href="/" className="rounded-[8px] border border-border px-5 py-3 text-sm font-medium text-ink hover:border-brand hover:text-brand">Reload home</Link>
            </div>
            {error.digest && <p className="mt-6 text-xs text-muted">Error reference: {error.digest}</p>}
          </div>
        </main>
      </body>
    </html>
  );
}
