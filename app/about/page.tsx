import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "About AvenBrief | The World, Made Clear",
  description: "AvenBrief brings readers clear news summaries, useful context, and links to original sources.",
  path: "/about",
});

const principles = [
  { icon: "/figma/check.svg", title: "Clarity first", text: "We explain complex stories in direct language, without losing the context that matters." },
  { icon: "/figma/document.svg", title: "Source-led", text: "Our stories point readers toward original reporting and primary sources whenever possible." },
  { icon: "/figma/globe.svg", title: "A wider view", text: "We look beyond the loudest headlines to understand how change is felt around the world." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-328 px-6 pb-16 pt-9 md:px-8 md:pt-14 xl:px-0">
        <section className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">About AvenBrief</p>
            <h1 className="mt-5 max-w-xl font-serif text-[48px] font-semibold leading-[1.05] md:text-[68px]">The world, made clear.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted">AvenBrief is an independent news project built for readers who want the important story, the useful context, and a clear path to learn more.</p>
            <Link href="/category/world" className="mt-8 inline-flex rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">Explore our coverage</Link>
          </div>
          <div className="relative aspect-4/3 overflow-hidden rounded-[10px]">
            <Image src="/figma/work.png" alt="A calm workspace with a laptop and notebook" fill sizes="(min-width: 768px) 580px, 100vw" className="object-cover" priority />
          </div>
        </section>

        <section className="mt-16 border-t border-border pt-10 md:mt-20">
          <div className="grid gap-8 md:grid-cols-[0.72fr_1fr] md:gap-20">
            <h2 className="font-serif text-[36px] font-semibold leading-tight">News that respects your time.</h2>
            <div className="space-y-5 text-base leading-8 text-muted">
              <p>The news can be overwhelming. AvenBrief is designed to be calmer: fewer distractions, strong visual hierarchy, and concise reporting that gives you the shape of a story without flattening its nuance.</p>
              <p>Our editorial workflow remains review-first. Automated feeds help us discover stories, but people decide what is written, checked, edited, and published.</p>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-[10px] bg-soft p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">How we work</p>
          <div className="mt-7 grid gap-7 md:grid-cols-3">
            {principles.map((principle) => (
              <article key={principle.title}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white"><Image src={principle.icon} alt="" width={20} height={20} /></span>
                <h2 className="mt-5 font-serif text-2xl font-semibold">{principle.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{principle.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
