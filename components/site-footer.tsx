import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/categories";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-soft">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" aria-label="AvenBrief home" className="inline-block">
              <Image
                src="/avenbrief-logo.png"
                alt="AvenBrief"
                width={2172}
                height={724}
                sizes="160px"
                className="h-auto w-40"
              />
            </Link>
            <p className="mt-3 text-sm text-muted">
              The world, made clear.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              Clear news summaries, useful context and direct links to original
              sources.
            </p>
          </div>

          <nav
            aria-label="Explore"
            className="text-sm"
          >
            <h2 className="font-semibold text-ink">Explore</h2>
            <div className="mt-4 grid gap-3">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="text-muted hover:text-brand"
                >
                  {category.name}
                </Link>
              ))}

              <Link href="/headlines" className="text-muted hover:text-brand">
                Headlines
              </Link>

              <Link
                href="/search"
                className="text-muted hover:text-brand"
              >
                Search
              </Link>
            </div>
          </nav>

          <nav aria-label="About and policies" className="text-sm">
            <h2 className="font-semibold text-ink">About and policies</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/about" className="text-muted hover:text-brand">
                About AvenBrief
              </Link>
              <Link href="/contact" className="text-muted hover:text-brand">
                Contact
              </Link>
              <Link href="/editorial-policy" className="text-muted hover:text-brand">
                Editorial Policy
              </Link>
              <Link href="/corrections-policy" className="text-muted hover:text-brand">
                Corrections Policy
              </Link>
              <Link href="/privacy" className="text-muted hover:text-brand">
                Privacy Policy
              </Link>
              <Link href="/feed.xml" className="text-muted hover:text-brand">
                RSS feed
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <p>© 2026 AvenBrief.</p>
          <p>Independent coverage · Review-first publishing</p>
        </div>
      </div>
    </footer>
  );
}
