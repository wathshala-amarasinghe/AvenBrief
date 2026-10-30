import type { Metadata } from "next";
import Link from "next/link";
import TrustPage, { TrustSection } from "@/components/trust-page";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Editorial Policy | AvenBrief",
  description:
    "Read AvenBrief's standards for accuracy, sourcing, attribution, editorial review and automation.",
  path: "/editorial-policy",
});

export default function EditorialPolicyPage() {
  return (
    <TrustPage
      currentPath="/editorial-policy"
      eyebrow="Editorial Policy"
      title="Clarity with accountability."
      intro="AvenBrief aims to help readers understand important stories through concise summaries, useful context and clear links to original reporting."
      updated="Last reviewed October 30, 2026"
    >
      <TrustSection title="Our editorial purpose">
        <p>
          We select stories for their public relevance, informational value and
          connection to the topics AvenBrief covers. Our goal is to make complex
          developments easier to follow without stripping away important
          context or overstating what is known.
        </p>
        <p>
          News, analysis, opinion and promotional material should be clearly
          distinguishable. Headlines and summaries should accurately reflect
          the underlying article rather than rely on misleading or sensational
          framing.
        </p>
      </TrustSection>

      <TrustSection title="Sourcing and attribution">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            We prefer original reporting, primary documents and identifiable,
            reputable sources.
          </li>
          <li>
            Summaries should name or link to the original publisher whenever a
            story is based on another organization&apos;s reporting.
          </li>
          <li>
            Material facts should be checked against the cited source and, when
            appropriate, corroborated with additional reliable sources.
          </li>
          <li>
            Images, quotations and other third-party material should be used
            with appropriate permission, context and credit.
          </li>
        </ul>
      </TrustSection>

      <TrustSection title="Review before publication">
        <p>
          AvenBrief uses RSS feeds and other tools to discover potential
          stories. Imported items enter a private review inbox; they are not
          published automatically. An editor must choose the category, review
          the source, prepare the article and deliberately publish it.
        </p>
        <p>
          Before publication, editors should confirm that the headline,
          summary, body, category, byline and source URL belong to the same
          story. Draft or sample material must not be presented as current
          reporting.
        </p>
      </TrustSection>

      <TrustSection title="Automation and artificial intelligence">
        <p>
          Automation may assist with discovery, organization, categorization or
          drafting. It does not replace editorial responsibility. Any material
          prepared with automated assistance should be checked for factual
          accuracy, unsupported claims, misattribution, bias and invented
          details before publication.
        </p>
        <p>
          AvenBrief will not knowingly present an automated summary as original
          on-the-ground reporting. The responsible editor remains accountable
          for what appears on the site.
        </p>
      </TrustSection>

      <TrustSection title="Fairness, independence and conflicts">
        <p>
          Coverage should represent relevant context and avoid discrimination,
          dehumanizing language or unnecessary harm. People and organizations
          facing serious criticism should be treated fairly, and uncertainty
          should be stated when facts remain disputed or incomplete.
        </p>
        <p>
          Editorial decisions should not be dictated by advertisers, sponsors
          or personal relationships. A material conflict of interest should be
          avoided or disclosed to readers.
        </p>
      </TrustSection>

      <TrustSection title="Updates and accountability">
        <p>
          We update stories when meaningful new information emerges and correct
          material errors transparently. Readers can review the{" "}
          <Link
            href="/corrections-policy"
            className="font-semibold text-brand hover:underline"
          >
            Corrections Policy
          </Link>{" "}
          or raise a concern through the{" "}
          <Link href="/contact" className="font-semibold text-brand hover:underline">
            contact page
          </Link>
          .
        </p>
      </TrustSection>
    </TrustPage>
  );
}
