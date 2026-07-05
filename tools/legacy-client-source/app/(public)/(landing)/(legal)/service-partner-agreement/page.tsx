import type { Metadata } from "next";
import { SimpleLegalPage } from "../../_components/SimpleLegalPage";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("service-partner-agreement", {
    title: "Service Partner Agreement | eFixMate",
    description:
      "Service Partner Agreement for technicians and independent service professionals using the eFixMate platform.",
    canonical: "/service-partner-agreement",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const DEFAULT_INTRO =
  "This Service Partner Agreement explains the terms that apply when independent technicians and service professionals register, accept jobs, and deliver services through eFixMate.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. Independent Partner Relationship",
    paragraphs: [
      "Service partners operate as independent professionals and are not employees, agents, or legal representatives of eFixMate.",
      "Partners are responsible for their own skills, conduct, tools, tax obligations, and compliance with applicable laws.",
    ],
  },
  {
    title: "2. Registration and Verification",
    paragraphs: [
      "Partners must provide accurate profile, identity, skill, document, location, and payout information during onboarding.",
      "eFixMate may verify submitted information, request additional documents, approve, reject, suspend, or deactivate partner access based on operational, safety, quality, or compliance requirements.",
    ],
  },
  {
    title: "3. Service Standards",
    bullets: [
      "Arrive within accepted service windows or promptly communicate delays.",
      "Perform only services the partner is qualified and approved to deliver.",
      "Maintain professional conduct with customers and eFixMate staff.",
      "Use safe tools, reasonable care, and applicable industry practices.",
      "Avoid collecting off-platform payments unless explicitly authorized.",
    ],
  },
  {
    title: "4. Job Acceptance and Completion",
    paragraphs: [
      "Partners may receive service requests based on location, availability, category, performance, and platform allocation rules.",
      "Accepted jobs must be completed through the eFixMate workflow, including updates, media, customer confirmation, and closure steps where applicable.",
    ],
  },
  {
    title: "5. Payments, Commission, and Settlements",
    paragraphs: [
      "Partner payouts are calculated according to applicable pricing, commission, incentive, deduction, refund, cancellation, and settlement rules configured by eFixMate.",
      "Settlement timelines may vary depending on payment method, reconciliation, disputes, refunds, and operational review.",
    ],
  },
  {
    title: "6. Customer Data and Confidentiality",
    paragraphs: [
      "Partners may access limited customer information only for fulfilling assigned services.",
      "Customer phone numbers, addresses, booking details, photographs, or other personal data must not be misused, copied, sold, retained, or shared outside the service requirement.",
    ],
  },
  {
    title: "7. Safety, Damage, and Disputes",
    paragraphs: [
      "Partners must follow safe work practices and immediately report incidents, damage, disputes, unsafe premises, or customer misconduct.",
      "eFixMate may investigate service complaints and may withhold payouts, apply penalties, require re-service, or restrict access where misconduct, negligence, fraud, or repeated quality issues are identified.",
    ],
  },
  {
    title: "8. Platform Rules and Suspension",
    bullets: [
      "Do not bypass eFixMate bookings or solicit customers outside the platform.",
      "Do not falsify location, job status, invoices, documents, images, or completion details.",
      "Do not share accounts or allow unauthorized people to perform assigned jobs.",
      "Do not engage in harassment, threats, discrimination, theft, fraud, or unsafe conduct.",
    ],
  },
  {
    title: "9. Updates to This Agreement",
    paragraphs: [
      "eFixMate may update this agreement to reflect business, legal, operational, safety, or technology changes.",
      "Continued platform use after publication or acceptance of an updated version constitutes agreement to the revised terms.",
    ],
  },
  {
    title: "10. Contact",
    paragraphs: [
      "For questions about partner onboarding, service rules, settlements, or this agreement, contact eFixMate through official support channels.",
    ],
  },
];

export default async function ServicePartnerAgreementPage() {
  const { sections } = await fetchCmsPage("service-partner-agreement");
  const m = toSectionMap(sections);
  const cms = m["service-partner-agreement.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <SimpleLegalPage
      title={cms?.title ?? "Service Partner Agreement"}
      lastUpdated={cms?.lastUpdated ?? "June 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
