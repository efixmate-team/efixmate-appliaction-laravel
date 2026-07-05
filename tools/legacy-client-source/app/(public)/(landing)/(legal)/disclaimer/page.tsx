import type { Metadata } from "next";
import { LegalPageLayout } from "../../_components/LegalPageLayout";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("disclaimer", {
    title: "Disclaimer | eFixMate",
    description:
      "Read eFixMate's disclaimer covering service quality, platform availability, third-party technicians, limitation of liability, and jurisdiction.",
    canonical: "/disclaimer",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Warranty Policy", href: "/warranty-policy" },
];

const DEFAULT_INTRO =
  "This Disclaimer outlines the limitations of eFixMate's liability in connection with the use of our website, mobile applications, and services. By accessing or using eFixMate, you agree to the terms of this Disclaimer.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. General Disclaimer",
    paragraphs: [
      "The information provided on the eFixMate platform — including service descriptions, pricing estimates, technician profiles, and availability — is provided for general informational purposes only. While we strive to keep all information accurate and current, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of any information, products, services, or related graphics on the platform.",
    ],
  },
  {
    title: "2. Service Quality and Outcomes",
    paragraphs: [
      "eFixMate acts as an intermediary platform that connects customers with independent, background-verified service technicians. While we apply strict onboarding standards and quality controls, we cannot guarantee specific outcomes, completion times, or that every service will fully resolve an underlying technical issue on the first visit.",
      "Service results may vary depending on the condition of equipment, pre-existing damage, material quality, and the nature of the reported issue. Estimates provided during booking are indicative only and may change upon on-site assessment by the technician.",
    ],
  },
  {
    title: "3. Independent Technicians",
    paragraphs: [
      "Technicians providing services through the eFixMate platform operate as independent service professionals. eFixMate provides the marketplace, booking infrastructure, and quality oversight but does not employ technicians as full-time employees.",
      "eFixMate shall not be liable for any actions, omissions, negligence, or misconduct by individual technicians beyond the remedies offered under the eFixMate Warranty Policy and Grievance Redressal Policy.",
    ],
  },
  {
    title: "4. Platform Availability",
    paragraphs: [
      "eFixMate does not warrant that the platform will be available at all times, uninterrupted, or error-free. Scheduled maintenance, technical failures, or circumstances beyond our control may result in temporary service interruptions. We will make reasonable efforts to notify users of planned downtime.",
    ],
  },
  {
    title: "5. Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by applicable law, eFixMate, its directors, officers, employees, agents, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the platform or services, even if advised of the possibility of such damages.",
      "eFixMate's total liability to any user for any claim arising from or related to the platform or a booked service shall not exceed the amount paid by the user for that specific service booking.",
    ],
  },
  {
    title: "6. External Links",
    paragraphs: [
      "The eFixMate platform may contain links to third-party websites or services for reference or convenience. These links do not constitute an endorsement by eFixMate of those sites or their content. We have no control over and accept no responsibility for the content, privacy policies, or practices of external websites.",
    ],
  },
  {
    title: "7. Governing Law and Jurisdiction",
    paragraphs: [
      "This Disclaimer and any disputes arising from or related to it shall be governed by and construed in accordance with the laws of India. Any legal proceedings arising under this Disclaimer shall be subject to the exclusive jurisdiction of the courts in Raipur, Chhattisgarh, India.",
    ],
  },
];

export default async function DisclaimerPage() {
  const { sections } = await fetchCmsPage("disclaimer");
  const m = toSectionMap(sections);
  const cms = m["disclaimer.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <LegalPageLayout
      title={cms?.title ?? "Disclaimer"}
      description="Read eFixMate's disclaimer covering service quality, platform availability, third-party technicians, limitation of liability, and jurisdiction."
      canonical="/disclaimer"
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
