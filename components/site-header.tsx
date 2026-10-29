import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/categories";

export default function SiteHeader() {
  return (
    <header className="bg-white px-6 md:px-8">
      <div className="mx-auto flex max-w-[1312px] items-center justify-between gap-8 border-b border-border py-6 lg:pt-16 lg:pb-8">
        <Link href="/" aria-label="AvenBrief home" className="shrink-0">
          <Image
            src="/avenbrief-logo.png"
            alt="AvenBrief"
            width={2172}
            height={724}
            sizes="(max-width: 767px) 104px, 150px"
            className="h-auto w-[104px] md:w-[150px]"
            loading="eager"
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden min-w-0 flex-1 items-center justify-center gap-7 text-sm font-medium md:flex"
        >
          <Link
            href="/#latest"
            className="text-muted transition-colors hover:text-brand"
          >
            Latest
          </Link>

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="text-muted transition-colors hover:text-brand"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <Link
          href="/search"
          className="hidden w-[196px] shrink-0 items-center gap-3 rounded-[10px] bg-soft px-3 py-3 text-sm text-muted transition-colors hover:text-brand md:flex"
        >
          <Image src="/figma/search.svg" alt="" width={18} height={18} />
          <span>Search news</span>
        </Link>

        <div className="flex items-center gap-5 md:hidden">
          <Link href="/search" aria-label="Search news">
            <Image src="/figma/search.svg" alt="" width={18} height={18} />
          </Link>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center" aria-label="Open navigation">
              <Image src="/figma/menu.svg" alt="" width={18} height={18} />
            </summary>
            <nav className="absolute right-0 z-50 mt-4 grid min-w-48 gap-1 rounded-[10px] border border-border bg-white p-3 text-sm shadow-lg">
              <Link href="/#latest" className="rounded-lg px-3 py-2 hover:bg-soft">Latest</Link>
              {categories.map((category) => (
                <Link key={category.slug} href={`/category/${category.slug}`} className="rounded-lg px-3 py-2 hover:bg-soft">
                  {category.name}
                </Link>
              ))}
              <Link href="/headlines" className="rounded-lg px-3 py-2 hover:bg-soft">Headlines</Link>
              <Link href="/about" className="rounded-lg px-3 py-2 hover:bg-soft">About</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
