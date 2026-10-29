import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import NewsCard from "@/components/news-card";
import { categories } from "@/lib/categories";
import { articles } from "@/lib/news";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return { title: "Category not found | AvenBrief" };
  }

  return {
    title: `${category.name} News | AvenBrief`,
    description: category.description,
  };
}

export const instant = false;

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const categoryArticles = articles.filter(
    (article) => article.category === category.name,
  );

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/"
          className="text-sm text-muted hover:text-brand"
        >
          ← Back to home
        </Link>

        <section className="border-b border-border py-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Explore AvenBrief
          </p>

          <h1 className="mt-4 font-serif text-5xl font-semibold md:text-6xl">
            {category.name}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            {category.description}
          </p>
        </section>

        <section className="py-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="font-serif text-3xl font-semibold">
              Latest stories
            </h2>

            <p className="text-sm text-muted">
              {categoryArticles.length}{" "}
              {categoryArticles.length === 1 ? "story" : "stories"}
            </p>
          </div>

          {categoryArticles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {categoryArticles.map((article) => (
                <NewsCard key={article.slug} {...article} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-soft p-6 text-muted">
              No stories in this category yet.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}