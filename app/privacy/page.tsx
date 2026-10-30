import type { Metadata } from "next";
import Link from "next/link";
import TrustPage, { TrustSection } from "@/components/trust-page";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy | AvenBrief",
  description:
    "Learn what information AvenBrief may collect, why it is used and the choices available to readers.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <TrustPage
      currentPath="/privacy"
      eyebrow="Privacy Policy"
      title="Your privacy matters."
      intro="This policy explains the information AvenBrief may receive when you visit the site or contact us, and how that information is handled."
      updated="Effective October 30, 2026"
    >
      <TrustSection title="Information we may receive">
        <p>
          You can read AvenBrief without creating a public reader account. We
          may still receive limited technical information needed to deliver and
          protect the site, such as an IP address, browser and device details,
          requested pages, timestamps and diagnostic logs.
        </p>
        <p>
          If you contact us, we receive the information you choose to provide,
          such as your name, email address, message and any supporting links.
          Authorized administrators also provide account information to sign in
          to the private publishing area.
        </p>
      </TrustSection>

      <TrustSection title="How information is used">
        <ul className="list-disc space-y-2 pl-6">
          <li>Operate, secure and troubleshoot AvenBrief.</li>
          <li>Respond to questions, correction requests and rights concerns.</li>
          <li>Understand reliability and prevent abuse.</li>
          <li>Maintain the private editorial and publishing workflow.</li>
          <li>Meet legal obligations and protect legitimate rights.</li>
        </ul>
        <p>
          AvenBrief does not sell personal information. We do not use reader
          information to make automated decisions with legal or similarly
          significant effects.
        </p>
      </TrustSection>

      <TrustSection title="Cookies and similar storage">
        <p>
          The public reading experience does not require an AvenBrief account.
          Essential cookies or similar storage may be used for security,
          session management and site operation. The private administrator area
          uses authentication data to keep authorized users signed in.
        </p>
        <p>
          Browser controls can remove or block cookies, though doing so may
          prevent protected features from working correctly.
        </p>
      </TrustSection>

      <TrustSection title="Service providers and external sites">
        <p>
          AvenBrief relies on service providers, including Vercel for website
          hosting and Supabase for database and administrator authentication.
          Those providers may process limited information under their own terms
          and privacy practices while delivering their services.
        </p>
        <p>
          Articles may link to original publishers and other external websites.
          AvenBrief does not control those sites or their privacy practices, so
          readers should review the policies of the sites they visit.
        </p>
      </TrustSection>

      <TrustSection title="Retention and security">
        <p>
          Information is kept only as long as reasonably necessary for the
          purposes described here, including security, recordkeeping and legal
          requirements. We use reasonable safeguards, but no online service can
          guarantee absolute security.
        </p>
      </TrustSection>

      <TrustSection title="Your choices">
        <p>
          Depending on where you live, you may have rights to ask about, access,
          correct or delete personal information associated with you. You may
          also object to or restrict certain processing. We may need to verify a
          request before acting on it.
        </p>
        <p>
          AvenBrief is a general-audience news site and is not directed to
          children under 13. If you believe a child has provided personal
          information, please tell us.
        </p>
      </TrustSection>

      <TrustSection title="Changes and contact">
        <p>
          We may update this policy as the site and its services develop. The
          effective date above will change when a material revision is made.
        </p>
        <p>
          For a privacy question or request, use the{" "}
          <Link href="/contact" className="font-semibold text-brand hover:underline">
            contact page
          </Link>
          .
        </p>
      </TrustSection>
    </TrustPage>
  );
}
