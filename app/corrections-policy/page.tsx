import type { Metadata } from "next";
import Link from "next/link";
import TrustPage, { TrustSection } from "@/components/trust-page";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Corrections Policy | AvenBrief",
  description:
    "Learn how AvenBrief reviews reported errors, corrects published work and records material changes.",
  path: "/corrections-policy",
});

export default function CorrectionsPolicyPage() {
  return (
    <TrustPage
      currentPath="/corrections-policy"
      eyebrow="Corrections Policy"
      title="When we get it wrong, we fix it."
      intro="Accuracy is a continuing responsibility. We welcome specific, evidence-based concerns about anything published on AvenBrief."
      updated="Last reviewed October 30, 2026"
    >
      <TrustSection title="How to report an error">
        <p>
          Use the{" "}
          <Link href="/contact" className="font-semibold text-brand hover:underline">
            contact page
          </Link>{" "}
          and include the article URL, the statement you believe is wrong, why
          it is inaccurate and links to reliable supporting evidence. Clear,
          specific reports help us investigate more quickly.
        </p>
      </TrustSection>

      <TrustSection title="How we review concerns">
        <ol className="list-decimal space-y-2 pl-6">
          <li>Review the published article and the concern raised.</li>
          <li>Check the original source and any relevant primary material.</li>
          <li>Seek additional evidence or clarification when needed.</li>
          <li>Decide whether to correct, clarify, update or remove material.</li>
          <li>Record a material correction clearly for readers.</li>
        </ol>
        <p>
          A disagreement with a conclusion or editorial emphasis does not by
          itself establish a factual error, but we will consider whether the
          article is incomplete, unclear or unfairly framed.
        </p>
      </TrustSection>

      <TrustSection title="Types of changes">
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-ink">Minor edit</h3>
            <p>
              Spelling, grammar, formatting or other changes that do not alter
              the meaning may be fixed without a correction note.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-ink">Clarification or update</h3>
            <p>
              Added context or new information may be identified as an update
              when it meaningfully changes a reader&apos;s understanding.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-ink">Correction</h3>
            <p>
              A substantive factual error should be corrected promptly. The
              article should include a note explaining what was wrong and what
              changed.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-ink">Retraction or removal</h3>
            <p>
              Content may be retracted or removed when its central premise is
              unreliable, it creates a serious legal or safety risk, or it
              should not have been published. When appropriate, an explanatory
              notice will remain at the original URL.
            </p>
          </div>
        </div>
      </TrustSection>

      <TrustSection title="Corrections to sourced stories">
        <p>
          When a summary relies on another publisher, we will check both our
          presentation and the original source. If the source issues a
          correction, we will assess whether AvenBrief also needs an update. A
          source correction does not remove our responsibility for errors we
          introduced.
        </p>
      </TrustSection>

      <TrustSection title="Timing and transparency">
        <p>
          We aim to address significant factual errors promptly, with priority
          given to errors that could cause harm or materially mislead readers.
          Complex questions may take longer to verify. Substantive corrections
          should not be hidden through silent rewrites.
        </p>
        <p>
          We may contact the person who reported an issue for clarification,
          but we cannot promise an individual response or a particular outcome
          for every submission.
        </p>
      </TrustSection>
    </TrustPage>
  );
}
