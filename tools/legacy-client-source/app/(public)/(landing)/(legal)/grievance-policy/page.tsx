import type { Metadata } from "next";
import { LegalPageLayout } from "../../_components/LegalPageLayout";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchCmsGlobals, fetchPageMeta, toSectionMap } from "@/lib/serverCms";
import { DEFAULT_PHONE } from "@/lib/siteDefaults";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("grievance-policy", {
    title: "Grievance & Redressal Policy | eFixMate",
    description:
      "Learn how to file a complaint with eFixMate, our Grievance Officer contact details, resolution timelines, and our compliance with the IT Act 2000, Consumer Protection Act, and DPDP Act 2023.",
    canonical: "/grievance-policy",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Account Deletion Policy", href: "/account-deletion-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

const DEFAULT_INTRO =
  "eFixMate is committed to addressing user grievances promptly and transparently. This Grievance & Redressal Policy outlines our complaint handling mechanism in compliance with the Information Technology Act 2000, the Consumer Protection Act 2019, and the Digital Personal Data Protection Act 2023 (DPDP Act).";

function buildDefaultSections(phone: string): SimpleLegalSection[] {
  return [
  {
    title: "1. How to File a Grievance",
    paragraphs: [
      "If you have a complaint regarding a service, booking, technician behaviour, billing, data privacy, or any other matter related to eFixMate, you may raise a grievance through any of the following channels:",
    ],
    bullets: [
      "In-App Support: Use the 'Help & Support' section within the eFixMate app.",
      "Website Chat: Use the live chat or contact form at www.efixmate.com/contact.",
      "Email: Write to our support team at support@efixmate.com, clearly describing the issue and including your booking ID where applicable.",
      `Phone: Call our customer support line at ${phone} (Monday to Saturday, 8 AM – 8 PM).`,
    ],
  },
  {
    title: "2. Grievance Officer",
    paragraphs: [
      "In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021 and the DPDP Act 2023, eFixMate has designated a Grievance Officer to receive and handle complaints.",
    ],
    bullets: [
      "Name: Designated Grievance Officer, eFixMate Pvt. Ltd.",
      "Address: Near DM Tower, Kailash Nagar, Birgaon, Raipur, Chhattisgarh — 490013",
      "Email: grievance@efixmate.com",
      "Response Hours: Monday to Saturday, 9 AM – 6 PM (excluding public holidays)",
    ],
  },
  {
    title: "3. Resolution Timeline",
    bullets: [
      "Acknowledgement of your grievance: Within 24 hours of receipt.",
      "Initial response or status update: Within 3 business days.",
      "Resolution of service-related grievances: Within 7 business days.",
      "Resolution of data privacy or DPDP Act grievances: Within 30 days as mandated by law.",
      "Resolution of financial disputes (refunds, billing): Within 10 business days.",
    ],
  },
  {
    title: "4. Escalation Mechanism",
    paragraphs: [
      "If your grievance is not resolved to your satisfaction within the timelines stated above, you may escalate it by writing to our Grievance Officer directly at grievance@efixmate.com with the subject line 'ESCALATION — [Your Booking ID or Case Reference]'.",
      "Unresolved disputes may also be referred to the Consumer Disputes Redressal Commission (CDRC) under the Consumer Protection Act 2019, or the Data Protection Board of India once constituted under the DPDP Act 2023.",
    ],
  },
  {
    title: "5. Data Privacy Grievances (DPDP Act 2023)",
    paragraphs: [
      "Users who wish to exercise their rights under the Digital Personal Data Protection Act 2023 — including the right to access data, correct inaccuracies, request erasure, or withdraw consent — may do so by contacting our Grievance Officer at grievance@efixmate.com.",
      "Data-related requests will be processed in accordance with the DPDP Act and applicable rules. Where a request cannot be fulfilled due to legal or regulatory obligations, we will provide a written explanation.",
    ],
  },
  {
    title: "6. Non-Discrimination Policy",
    paragraphs: [
      "eFixMate does not discriminate against any user who files a grievance in good faith. Filing a complaint will not result in any adverse action against your account, bookings, or access to our platform. We take all complaints seriously and ensure impartial handling of every grievance.",
    ],
  },
];}

export default async function GrievancePolicyPage() {
  const [{ sections }, globalSections] = await Promise.all([
    fetchCmsPage("grievance-policy"),
    fetchCmsGlobals(),
  ]);
  const m = toSectionMap(sections);
  const gm = toSectionMap(globalSections);
  const cms = m["grievance-policy.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;
  const ci = gm["global.contact_info"] as Record<string, string> | undefined;
  const phone = ci?.phone ?? DEFAULT_PHONE;

  return (
    <LegalPageLayout
      title={cms?.title ?? "Grievance & Redressal Policy"}
      description="Learn how to file a complaint with eFixMate, our Grievance Officer contact details, resolution timelines, and our compliance with the IT Act 2000, Consumer Protection Act, and DPDP Act 2023."
      canonical="/grievance-policy"
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : buildDefaultSections(phone)}
    />
  );
}
