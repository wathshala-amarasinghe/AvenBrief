import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import ContactForm from "@/components/contact-form";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Contact AvenBrief",
  description: "Contact AvenBrief with editorial feedback, correction requests, source concerns, or general questions.",
  path: "/contact",
});

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1312px] px-6 pb-16 pt-10 md:px-8 md:pt-14 xl:px-0">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Contact</p>
          <h1 className="mt-4 font-serif text-[48px] font-semibold leading-tight md:text-[64px]">Let’s talk.</h1>
          <p className="mt-5 text-lg leading-8 text-muted">Questions, careful feedback, and correction requests help us make AvenBrief clearer and more useful.</p>
        </header>

        <div className="mt-12 grid gap-12 border-t border-border pt-10 md:grid-cols-[0.7fr_1.3fr] md:gap-20">
          <aside className="space-y-8">
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-soft"><Image src="/figma/mail.svg" alt="" width={20} height={20} /></span>
              <h2 className="mt-5 font-serif text-2xl font-semibold">Editorial and general</h2>
              <p className="mt-3 text-sm leading-6 text-muted">Tell us which page is involved and include reliable supporting sources when possible.</p>
              {contactEmail && <a href={`mailto:${contactEmail}`} className="mt-3 inline-block text-sm text-brand hover:underline">{contactEmail}</a>}
            </div>
            <div className="border-t border-border pt-7">
              <h2 className="font-serif text-2xl font-semibold">Corrections</h2>
              <p className="mt-3 text-sm leading-6 text-muted">Read how we assess, document, and correct material errors.</p>
              <Link href="/corrections-policy" className="mt-3 inline-block text-sm text-brand hover:underline">Corrections policy →</Link>
            </div>
          </aside>

          <section className="rounded-[10px] bg-soft p-6 md:p-8" aria-labelledby="send-message">
            <h2 id="send-message" className="font-serif text-[32px] font-semibold">Send a message</h2>
            <p className="mt-2 text-sm leading-6 text-muted">This form opens your email app; it does not transmit information through the website.</p>
            <div className="mt-7"><ContactForm email={contactEmail} /></div>
          </section>
        </div>
      </main>
    </div>
  );
}
