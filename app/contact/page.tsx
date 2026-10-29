import type { Metadata } from "next";
import Link from "next/link";
import TrustPage, { TrustSection } from "@/components/trust-page";

export const metadata: Metadata = {
  title: "Contact AvenBrief",
  description:
    "Contact AvenBrief with editorial feedback, correction requests, source concerns or general questions.",
};

const repositoryUrl = "https://github.com/wathshala-amarasinghe/AvenBrief";

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <TrustPage
      currentPath="/contact"
      eyebrow="Contact"
      title="Talk to AvenBrief."
      intro="Reader questions and careful feedback help us make our work clearer, more accurate and more useful."
      updated="We review messages as soon as practical."
    >
      <section className="grid max-w-3xl gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-6">
          <h2 className="font-serif text-2xl font-semibold">
            Corrections and accuracy
          </h2>
          <p className="mt-3 leading-7 text-muted">
            Tell us which article is affected, what appears incorrect and any
            reliable evidence that can help us review it.
          </p>
          <Link
            href="/corrections-policy"
            className="mt-5 inline-block font-medium text-brand hover:underline"
          >
            Read our corrections process →
          </Link>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="font-serif text-2xl font-semibold">
            Sources and rights
          </h2>
          <p className="mt-3 leading-7 text-muted">
            Contact us about attribution, a source link, image rights or a
            concern involving material associated with your work.
          </p>
        </div>

        <div className="rounded-xl border border-border p-6 sm:col-span-2">
          <h2 className="font-serif text-2xl font-semibold">
            General questions
          </h2>
          <p className="mt-3 leading-7 text-muted">
            We also welcome questions about AvenBrief, its editorial approach
            and potential collaboration.
          </p>
        </div>
      </section>

      <TrustSection title="How to reach us">
        {contactEmail ? (
          <p>
            Email us at{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="font-semibold text-brand hover:underline"
            >
              {contactEmail}
            </a>
            . For a correction request, please include the article URL and a
            concise description of the concern.
          </p>
        ) : (
          <p>
            A public contact email is currently being configured. In the
            meantime, you can reach the project through the{" "}
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand hover:underline"
            >
              AvenBrief project repository
            </a>
            . Please avoid posting private or sensitive information in a public
            issue.
          </p>
        )}
      </TrustSection>

      <TrustSection title="What to include">
        <ul className="list-disc space-y-2 pl-6">
          <li>The page or article URL, when your message concerns content.</li>
          <li>A clear explanation of the question or requested change.</li>
          <li>Links to primary documents or other reliable supporting sources.</li>
          <li>A safe way to follow up if more detail is needed.</li>
        </ul>
        <p>
          Please do not send passwords, financial details, identity documents
          or other highly sensitive personal information.
        </p>
      </TrustSection>
    </TrustPage>
  );
}
