import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeader from "@/components/site-header";
import { getHeadlines, type Headline } from "@/lib/rss";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Latest Headlines | AvenBrief",
  description:
    "Explore recent Global Voices headlines with links to the original reporting.",
  path: "/headlines",
});

async function HeadlinesList() {
  let headlines: Headline[];

  try {
    headlines = await getHeadlines();
  } catch (error) {
    console.error("Could not load RSS headlines:", error);

    return (
      <p className="rounded-xl bg-soft p-6 text-muted">
        Headlines are temporarily unavailable. Please try again later.
      </p>
    );
  }

  if (headlines.length === 0) {
    return (
      <p className="rounded-xl bg-soft p-6 text-muted">
        No headlines are available right now.
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {headlines.map((story) => (
        <article
          key={story.url}
          className="rounded-xl border border-border p-6"
        >
          <p className="text-sm text-muted">
            {story.author && `${story.author} · `}
            <a
              href="https://globalvoices.org/"
              className="text-brand hover:underline"
            >
              Global Voices
            </a>
          </p>

          <h2 className="mt-4 font-serif text-2xl font-semibold">
            <a
              href={story.url}
              className="hover:text-brand"
            >
              {story.title}
            </a>
          </h2>

          {story.publishedAt && (
            <p className="mt-4 text-xs text-muted">
              Published: {story.publishedAt}
            </p>
          )}

          <a
            href={story.url}
            className="mt-5 inline-block font-medium text-brand hover:underline"
          >
            Read on Global Voices →
          </a>

          <p className="mt-5 text-xs text-muted">
            Headline only ·{" "}
            <a
              href="https://creativecommons.org/licenses/by/3.0/"
              className="underline"
            >
              CC BY 3.0
            </a>
          </p>
        </article>
      ))}
    </div>
  );
}

export default function HeadlinesPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-serif text-5xl font-semibold">
          Latest headlines
        </h1>

        <p className="mt-5 max-w-2xl leading-8 text-muted">
          Recent stories from Global Voices. Follow each link
          to read the original reporting.
        </p>

        <section aria-label="Recent headlines" className="mt-10">
          <Suspense
            fallback={
              <p className="text-muted">Loading headlines…</p>
            }
          >
            <HeadlinesList />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
