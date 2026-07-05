import type { Metadata } from "next";
import { SimpleLegalPage } from "../../_components/SimpleLegalPage";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("privacy-policy", {
    title: "Privacy Policy | eFixMate",
    description:
      "Learn how eFixMate collects, uses, stores, and protects your personal information when using our website, mobile applications, and services.",
    canonical: "/privacy-policy",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
];

const DEFAULT_INTRO =
  "At eFixMate, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect information when you use our website, mobile applications, and services.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "When you use eFixMate, we may collect personal information including your name, mobile number, email address, service address, and profile details you voluntarily provide while creating an account or booking a service.",
      "We also collect service-related information such as booking history, technician assignments, customer reviews, support requests, and communication records to provide and improve our services.",
      "Technical information such as IP address, browser type, device information, operating system, cookies, and analytics data may be collected to improve platform performance, security, and user experience.",
      "Payments are processed through trusted third-party payment providers. eFixMate does not store complete debit card, credit card, banking credentials, or UPI PIN information on its servers.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    bullets: [
      "To create and manage your eFixMate account.",
      "To process, confirm, and manage service bookings.",
      "To assign technicians and service partners.",
      "To send booking confirmations, updates, reminders, and support responses.",
      "To process payments, refunds, and cancellations.",
      "To improve platform functionality and customer experience.",
      "To prevent fraud, misuse, and security threats.",
      "To comply with legal, regulatory, and tax obligations.",
    ],
  },
  {
    title: "3. Information Sharing",
    paragraphs: [
      "Assigned technicians and service partners may receive limited information such as your name, contact number, service address, and service request details strictly for the purpose of completing the booked service.",
      "We may share information with trusted third-party providers including payment gateways, cloud hosting providers, communication services, analytics platforms, and customer support systems that help us operate our business.",
      "We do not sell, rent, trade, or otherwise monetize your personal information to third-party advertisers or data brokers.",
      "We may disclose information when required by law, court orders, government authorities, or when necessary to protect the rights, safety, and security of eFixMate, our users, technicians, partners, or the public.",
    ],
  },
  {
    title: "4. Data Retention",
    paragraphs: [
      "We retain account information, booking history, and transaction records for as long as necessary to provide services, manage warranties, process refunds, maintain business records, and comply with applicable legal obligations. Users may request account deletion subject to legal and regulatory retention requirements.",
    ],
  },
  {
    title: "5. Your Rights and Choices",
    bullets: [
      "Access and review your personal information.",
      "Update or correct inaccurate account information.",
      "Request deletion of your account and personal data where legally permitted.",
      "Request a copy of the personal information we maintain about you.",
      "Opt out of promotional communications and marketing messages.",
      "Contact support regarding privacy-related concerns or requests.",
    ],
  },
  {
    title: "6. Cookies and Tracking Technologies",
    paragraphs: [
      "eFixMate uses cookies and similar technologies to maintain login sessions, remember user preferences, improve website functionality, analyze traffic patterns, and enhance user experience. You may control cookie settings through your browser, although disabling essential cookies may impact certain platform features.",
    ],
  },
  {
    title: "7. Data Security",
    paragraphs: [
      "We implement reasonable technical, administrative, and organizational safeguards including encryption, access controls, and secure infrastructure practices to protect personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission or storage is completely secure.",
    ],
  },
  {
    title: "8. Children's Privacy",
    paragraphs: [
      "eFixMate services are intended for individuals who are at least 18 years old. We do not knowingly collect personal information from children under the age of 18. If such information is identified, we will take appropriate steps to remove it.",
    ],
  },
  {
    title: "9. Third-Party Services",
    paragraphs: [
      "Our website and applications may contain links to third-party websites or services. eFixMate is not responsible for the privacy practices, policies, or content of external platforms. Users should review the privacy policies of such third parties independently.",
    ],
  },
  {
    title: "10. Changes to This Privacy Policy",
    paragraphs: [
      "We may update this Privacy Policy periodically to reflect changes in our services, business operations, or legal requirements. Updates will be published on this page with a revised 'Last Updated' date. Continued use of eFixMate after changes become effective constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "11. Contact Us",
    paragraphs: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact eFixMate through our official customer support channels.",
    ],
  },
];

export default async function PrivacyPage() {
  const { sections } = await fetchCmsPage("privacy-policy");
  const m = toSectionMap(sections);
  const cms = m["privacy-policy.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <SimpleLegalPage
      title={cms?.title ?? "Privacy Policy"}
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
