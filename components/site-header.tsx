import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/categories";

export default function SiteHeader() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" aria-label="AvenBrief home">
          <Image
            src="/avenbrief-logo.png"
            alt="AvenBrief"
            width={2172}
            height={724}
            sizes="(max-width: 640px) 160px, 192px"
            className="h-auto w-40 sm:w-48"
            loading="eager"
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex w-full items-center gap-6 overflow-x-auto py-2 text-sm font-medium sm:w-auto"
        >
          <Link
            href="/#latest"
            className="shrink-0 text-muted hover:text-brand"
          >
            Latest
          </Link>

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="shrink-0 text-muted hover:text-brand"
            >
              {category.name}
            </Link>
          ))}

          <Link
            href="/headlines"
            className="shrink-0 text-muted hover:text-brand"
          >
            Headlines
          </Link>

          <Link
            href="/search"
            className="shrink-0 text-muted hover:text-brand"
          >
            Search
          </Link>

          <Link
            href="/about"
            className="shrink-0 text-muted hover:text-brand"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}