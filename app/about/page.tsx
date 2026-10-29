import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "About AvenBrief | The World, Made Clear",
  description:
    "Meet AvenBrief, a news project focused on clear summaries and useful context about the world.",
};

const topics = [
  {
    title: "World",
    description:
      "Stories about communities, cities and the events shaping everyday life.",
    href: "/category/world",
  },
  {
    title: "Technology",
    description:
      "Ideas and innovations changing how we live, work and connect.",
    href: "/category/technology",
  },
  {
    title: "Climate",
    description:
      "The environment, clean energy and our shared future.",
    href: "/category/climate",
  },
  {
    title: "Finance",
    description:
      "Markets, economic trends and financial insights shaping global business.",
    href: "/category/finance",
  },
  {
    title: "Gaming",
    description:
      "News, industry updates and culture across the gaming universe.",
    href: "/category/gaming",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            About AvenBrief
          </p>

          <h1 className="mt-5 font-serif text-5xl font-semibold leading-tight md:text-7xl">
            The world, made clear.
          </h1>

          <p className="mt-8 text-xl leading-9 text-muted">
            Understanding the world should feel accessible.
            AvenBrief is being built to bring readers clear news
            summaries, useful context and links to original sources.
          </p>

          <p className="mt-5 text-lg leading-8 text-muted">
            Our aim is to help you discover important stories and
            explore the topics that matter to you.
          </p>
        </section>

        <section className="mt-14 border-t border-border pt-10">
          <h2 className="font-serif text-3xl font-semibold">
            Explore our topics
          </h2>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {topics.map((topic) => (
              <Link
                key={topic.href}
                href={topic.href}
                className="group rounded-xl border border-border p-6 transition-colors hover:bg-soft"
              >
                <h3 className="font-serif text-2xl font-semibold group-hover:text-brand">
                  {topic.title}
                </h3>

                <p className="mt-3 leading-7 text-muted">
                  {topic.description}
                </p>

                <p className="mt-5 font-medium text-brand">
                  Explore stories →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <aside className="mt-12 rounded-xl bg-soft p-6">
          <h2 className="font-serif text-2xl font-semibold">
            A project in progress
          </h2>
          <p className="mt-3 leading-7 text-muted">
            This preview contains sample articles and images.
            They demonstrate the website experience and should
            not be treated as current news reporting.
          </p>
        </aside>
      </main>
    </div>
  );
}
