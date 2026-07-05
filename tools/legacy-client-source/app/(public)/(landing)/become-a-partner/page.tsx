import type { Metadata } from "next";
import { BecomeAPartnerView } from "../_components/BecomeAPartnerView";
import type {
  BecomeAPartnerViewProps,
  PartnerBenefitItem,
  PartnerStepItem,
  PartnerDocumentItem,
  PartnerTrainingItem,
  PartnerSupportItem,
  PartnerHeroStat,
} from "../_components/BecomeAPartnerView";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("become-a-partner", {
    title: "Become a Service Partner | eFixMate",
    description:
      "Join eFixMate as a verified service technician. Earn ₹30,000+ per month, work flexibly, get free training, and receive weekly payouts. Apply today — no joining fee.",
    canonical: "/become-a-partner",
    ogType: "website",
  });
}

export default async function BecomeAPartnerPage() {
  const { sections } = await fetchCmsPage("become-a-partner");
  const m = toSectionMap(sections);

  const hero      = m["become_partner.hero"]      as Record<string, string>  | undefined;
  const cmsStats  = m["become_partner.stats"]     as PartnerHeroStat[]       | undefined;
  const benefits  = m["become_partner.benefits"]  as PartnerBenefitItem[]    | undefined;
  const steps     = m["become_partner.steps"]     as PartnerStepItem[]       | undefined;
  const documents = m["become_partner.documents"] as PartnerDocumentItem[]   | undefined;
  const training  = m["become_partner.training"]  as PartnerTrainingItem[]   | undefined;
  const support   = m["become_partner.support"]   as PartnerSupportItem[]    | undefined;
  const cta       = m["become_partner.cta"]       as Record<string, string>  | undefined;

  const props: BecomeAPartnerViewProps = {
    heroBadge:        hero?.badge,
    heroHeading:      hero?.heading,
    heroSubtext:      hero?.subtext,
    heroCtaPrimary:   hero?.cta_primary,
    heroCtaSecondary: hero?.cta_secondary,
    heroStats:        cmsStats,
    benefits,
    steps,
    documents,
    training,
    support,
    ctaHeading: cta?.heading,
    ctaSubtext:  cta?.subtext,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Become a Service Partner | eFixMate",
    description:
      "Join eFixMate as a verified service technician. Earn ₹30,000+ per month, work flexibly, get free training, and receive weekly payouts.",
    url: "https://efixmate.com/become-a-partner",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://efixmate.com" },
        { "@type": "ListItem", position: 2, name: "Become a Partner", item: "https://efixmate.com/become-a-partner" },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BecomeAPartnerView {...props} />
    </>
  );
}
