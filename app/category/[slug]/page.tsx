import type { Metadata } from "next";
import { Suspense } from "react";
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
    <main className="mx-auto max-w-328 px-6 pb-12 pt-8 md:px-8 xl:px-0">
      <section className="border-b border-border pb-8 md:pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">In focus</p>
        <div className="mt-3 grid items-end gap-5 md:grid-cols-[1fr_420px]">
          <h1 className="font-serif text-[44px] font-semibold leading-none md:text-[64px]">{category.name}</h1>
          <p className="max-w-xl text-sm leading-6 text-muted md:pb-1 md:text-base">{category.description}</p>
        </div>
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
