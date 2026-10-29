"use client";

import { FormEvent, useState } from "react";

export default function NewsletterSignup() {
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="grid gap-6 rounded-[10px] bg-soft p-5 lg:grid-cols-2 lg:items-center lg:p-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold lg:text-[32px]">
          A world of news. A moment of clarity.
        </h2>
        <p className="mt-3 text-sm text-muted lg:text-base">
          Start your morning with the stories that matter.
        </p>
      </div>

      {submitted ? (
        <p role="status" className="rounded-[10px] bg-white p-4 text-sm text-brand">
          Thanks for your interest. Newsletter subscriptions are coming soon.
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_168px] sm:items-end">
          <label className="text-sm">
            <span className="mb-2 block">Email address</span>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm"
            />
          </label>
          <button type="submit" className="h-11 rounded-[10px] bg-brand px-6 font-medium text-white hover:bg-blue-700">
            Subscribe
          </button>
        </form>
      )}
    </section>
  );
}
