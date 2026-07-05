import type { Metadata } from "next";
import { LegalPageLayout } from "../../_components/LegalPageLayout";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("warranty-policy", {
    title: "Warranty Policy | eFixMate",
    description:
      "Understand eFixMate's service warranty — what's covered, warranty periods by service type, and how to claim a free re-service if the same issue recurs.",
    canonical: "/warranty-policy",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
];

const DEFAULT_INTRO =
  "eFixMate stands behind every completed service. Our warranty guarantees that if the same issue recurs within the applicable warranty period, we will arrange a re-service at no additional cost to you — subject to the terms below.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. What Our Warranty Covers",
    paragraphs: [
      "The eFixMate service warranty applies to workmanship defects and faults that arise directly from the service performed by our technician. If the exact same fault reappears after a completed booking within the warranty window, you are entitled to a free follow-up visit.",
      "The warranty is linked to the original booking and the same service address. It covers the labour component of the service. Parts, consumables, or any additional work required beyond the original scope of the booking are not included.",
    ],
  },
  {
    title: "2. Warranty Periods by Service Type",
    bullets: [
      "General Electrical Repairs & Fault-Finding: 7 days",
      "Appliance Installation (Geysers, Water Purifiers, etc.): 30 days",
      "Fan & Light Installation: 30 days",
      "AC Service & Repair (Gas Refill excluded): 30 days",
      "Plumbing Repairs: 7 days",
      "Deep Cleaning Services: 7 days",
      "Painting Services: 30 days",
      "Carpentry & Furniture Repairs: 30 days",
    ],
  },
  {
    title: "3. What is Not Covered",
    bullets: [
      "Damage caused by the customer or third parties after service completion.",
      "Consumables, spare parts, or materials supplied during the service.",
      "Issues arising from pre-existing conditions unrelated to the work performed.",
      "Damage due to power surges, flooding, fire, or other external events beyond normal use.",
      "Services where the warranty window has lapsed.",
      "Bookings that were disputed or for which a full refund was already processed.",
      "Gas refilling or refrigerant recharging in AC services.",
    ],
  },
  {
    title: "4. How to Claim Your Warranty",
    paragraphs: [
      "To raise a warranty claim, contact eFixMate customer support within the applicable warranty period, quoting your original booking ID. Our team will verify eligibility and schedule a re-service visit at no additional charge.",
      "Warranty claims must be raised by the registered account holder associated with the original booking. The service address must be the same as the original booking.",
    ],
  },
  {
    title: "5. Warranty Exclusions and Limitations",
    paragraphs: [
      "The warranty applies only to completed bookings where the service was fully rendered and payment was made. It does not apply to bookings that were cancelled, partially completed, or where the technician was denied access.",
      "eFixMate's liability under this warranty is limited to a single free re-service visit. If the issue cannot be resolved on the re-visit, eFixMate may, at its discretion, offer a partial refund or credit equivalent to the original service fee.",
      "The warranty is non-transferable and applies solely to the original customer and service address.",
    ],
  },
  {
    title: "6. Contact Us",
    paragraphs: [
      "For warranty claims or queries, please contact eFixMate customer support through the app, website, or by calling our support line during business hours (Monday to Saturday, 8 AM – 8 PM).",
    ],
  },
];

export default async function WarrantyPolicyPage() {
  const { sections } = await fetchCmsPage("warranty-policy");
  const m = toSectionMap(sections);
  const cms = m["warranty-policy.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <LegalPageLayout
      title={cms?.title ?? "Warranty Policy"}
      description="Understand eFixMate's service warranty — what's covered, warranty periods by service type, and how to claim a free re-service if the same issue recurs."
      canonical="/warranty-policy"
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
