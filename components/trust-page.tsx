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

      <main className="mx-auto max-w-[1312px] px-6 py-10 md:px-8 md:py-14 xl:px-0">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-between lg:gap-20">
          <aside className="order-2 lg:order-1 lg:pt-1">
            <div className="border-t border-border pt-5 lg:sticky lg:top-6 lg:border-t-0 lg:pt-0">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">Trust and transparency</h2>
              <nav aria-label="Trust pages" className="mt-4">
                <ul className="space-y-3 text-sm">
                  {trustLinks.map((link) => {
                    const isCurrent = link.href === currentPath;
                    return <li key={link.href}><Link href={link.href} aria-current={isCurrent ? "page" : undefined} className={isCurrent ? "font-semibold text-brand" : "text-muted hover:text-brand"}>{link.label}</Link></li>;
                  })}
                </ul>
              </nav>
            </div>
          </aside>

          <article className="order-1 min-w-0 lg:order-2">
            <header className="max-w-3xl border-b border-border pb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-serif text-[46px] font-semibold leading-tight md:text-[60px]">
                {title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted">{intro}</p>
              <p className="mt-5 text-sm font-medium text-muted">{updated}</p>
            </header>

            <div className="mt-10 space-y-10">{children}</div>
          </article>
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
      <h2 className="font-serif text-[30px] font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-8 text-muted">
        {children}
      </div>
    </section>
  );
}
