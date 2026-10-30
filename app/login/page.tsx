import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "./actions";

export const metadata: Metadata = {
  title: "Admin Login | AvenBrief",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function LoginForm({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <form action={signIn} className="mt-8 space-y-5">
      {params.error === "1" && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          Unable to sign in. Check your admin email and password.
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-blue-700"
      >
        Sign in
      </button>
    </form>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <main className="admin-login grid min-h-screen bg-white md:grid-cols-2">
      <section className="flex min-h-155 items-center px-6 py-12 md:px-14 lg:px-24">
        <div className="mx-auto w-full max-w-md">
          <Link href="/"><Image src="/avenbrief-logo.png" alt="AvenBrief" width={154} height={42} className="h-auto w-37.5" priority /></Link>
          <p className="mt-14 text-xs font-semibold uppercase tracking-[0.14em] text-brand">Newsroom access</p>
          <h1 className="mt-3 font-serif text-[44px] font-semibold leading-tight">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Sign in to review sources, edit stories, and manage AvenBrief.</p>
          <Suspense fallback={<p className="mt-8">Loading sign in…</p>}><LoginForm {...props} /></Suspense>
          <Link href="/" className="mt-8 inline-block text-sm text-muted hover:text-brand">← Return to AvenBrief</Link>
        </div>
      </section>
      <section className="relative hidden min-h-screen overflow-hidden md:block">
        <Image src="/figma/city.png" alt="City skyline at dusk" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-transparent to-transparent" />
        <blockquote className="absolute bottom-14 left-14 max-w-md text-white"><p className="font-serif text-3xl leading-tight">“Clear reporting starts with a careful editorial process.”</p><footer className="mt-4 text-sm text-white/80">AvenBrief Editorial Team</footer></blockquote>
      </section>
    </main>
  );
}
