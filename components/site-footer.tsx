import Link from "next/link";
import { categories } from "@/lib/categories";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-soft">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <Link href="/" className="font-serif text-3xl font-semibold">
              AvenBrief
            </Link>
            <p className="mt-3 text-sm text-muted">
              The world, made clear.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-start gap-x-6 gap-y-4 text-sm"
          >
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="text-muted hover:text-brand"
              >
                {category.name}
              </Link>
            ))}

            <Link href="/search" className="text-muted hover:text-brand">
              Search
            </Link>

            <Link href="/about" className="text-muted hover:text-brand">
              About
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <p>© 2026 AvenBrief.</p>
          <p>Development preview · Includes sample stories</p>
        </div>
      </div>
    </footer>
  );
}