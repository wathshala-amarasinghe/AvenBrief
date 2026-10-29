import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
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
          className="w-full rounded-xl border border-border px-4 py-3"
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
          className="w-full rounded-xl border border-border px-4 py-3"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-brand px-5 py-3 font-medium text-white hover:bg-blue-700"
      >
        Sign in
      </button>
    </form>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/" className="font-serif text-3xl font-semibold">
        AvenBrief
      </Link>

      <h1 className="mt-10 font-serif text-4xl font-semibold">
        Admin sign in
      </h1>
      <p className="mt-3 text-muted">
        Sign in to manage your articles.
      </p>

      <Suspense fallback={<p className="mt-8">Loading sign in…</p>}>
        <LoginForm {...props} />
      </Suspense>
    </main>
  );
}