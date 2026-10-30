"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClientErrorRecord } from "@/lib/error-reporting.mjs";

export default function AdminError({
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
    <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-6 py-12 text-ink">
      <section role="alert" className="w-full max-w-xl rounded-[12px] border border-border bg-white p-7 shadow-sm md:p-10">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <Link href="/" aria-label="View AvenBrief website">
            <Image src="/avenbrief-logo.png" alt="AvenBrief" width={2172} height={724} className="h-auto w-[124px]" priority />
          </Link>
          <span className="rounded-full bg-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand">Admin</span>
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-brand">Newsroom error</p>
        <h1 className="mt-3 font-serif text-[36px] font-semibold leading-tight">This admin page could not load.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Try the request again. If it still fails, return to the overview and check the Vercel runtime logs using the error reference below.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-[8px] bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">Try again</button>
          <Link href="/admin" className="rounded-[8px] border border-border px-5 py-3 text-sm font-medium text-ink hover:border-brand hover:text-brand">Admin overview</Link>
        </div>
        {error.digest && <p className="mt-6 break-all text-xs text-muted">Error reference: {error.digest}</p>}
      </section>
    </main>
  );
}
