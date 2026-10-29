import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import ArticleResults from "@/components/article-results";
import { categories } from "@/lib/categories";
import { normalisePage } from "@/lib/article-browse.mjs";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export const instant = false;

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  return {
    title: category.name + " News | AvenBrief",
    description: category.description,
  };
}

async function CategoryContent({ params, searchParams }: CategoryPageProps) {
  await connection();
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const page = normalisePage(search.page);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-brand">← Back to home</Link>
      <section className="border-b border-border py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Explore AvenBrief</p>
        <h1 className="mt-4 font-serif text-5xl font-semibold md:text-6xl">{category.name}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{category.description}</p>
      </section>
      <Suspense key={slug + ":" + page} fallback={<p className="py-10 text-muted">Loading stories…</p>}>
        <ArticleResults category={category.name} page={page} basePath={"/category/" + category.slug} />
      </Suspense>
    </main>
  );
}

export default function CategoryPage(props: CategoryPageProps) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />
      <Suspense fallback={<p className="px-6 py-10 text-muted">Opening category…</p>}>
        <CategoryContent {...props} />
      </Suspense>
    </div>
  );
}
