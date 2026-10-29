import type { ReactNode } from "react";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

const trustLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/editorial-policy", label: "Editorial Policy" },
  { href: "/corrections-policy", label: "Corrections Policy" },
];

type TrustPageProps = {
  currentPath: string;
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
};

export default function TrustPage({
  currentPath,
  eyebrow,
  title,
  intro,
  updated,
  children,
}: TrustPageProps) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-20">
          <article className="min-w-0">
            <header className="max-w-3xl border-b border-border pb-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand">
                {eyebrow}
              </p>
              <h1 className="mt-5 font-serif text-5xl font-semibold leading-tight md:text-6xl">
                {title}
              </h1>
              <p className="mt-6 text-xl leading-9 text-muted">{intro}</p>
              <p className="mt-5 text-sm font-medium text-muted">{updated}</p>
            </header>

            <div className="mt-10 space-y-10">{children}</div>
          </article>

          <aside className="lg:pt-2">
            <div className="rounded-xl border border-border bg-soft p-6 lg:sticky lg:top-6">
              <h2 className="font-serif text-xl font-semibold">
                Trust and transparency
              </h2>
              <nav aria-label="Trust pages" className="mt-5">
                <ul className="space-y-3 text-sm">
                  {trustLinks.map((link) => {
                    const isCurrent = link.href === currentPath;

                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={isCurrent ? "page" : undefined}
                          className={
                            isCurrent
                              ? "font-semibold text-brand"
                              : "text-muted hover:text-brand"
                          }
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <p className="mt-6 border-t border-border pt-5 text-sm leading-6 text-muted">
                These pages explain how AvenBrief works and how readers can
                raise questions or concerns.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export function TrustSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="max-w-3xl">
      <h2 className="font-serif text-3xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-8 text-muted">
        {children}
      </div>
    </section>
  );
}
