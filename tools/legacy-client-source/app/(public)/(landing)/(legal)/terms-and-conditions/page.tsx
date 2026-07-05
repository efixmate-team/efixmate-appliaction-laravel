/** @format */

import type { Metadata } from "next";
import { SimpleLegalPage } from "../../_components/SimpleLegalPage";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("terms-and-conditions", {
    title: "Terms & Conditions | eFixMate",
    description:
      "Terms and conditions governing the use of eFixMate's website, mobile applications, and home & office service platform.",
    canonical: "/terms-and-conditions",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
];

const DEFAULT_INTRO =
  "Welcome to eFixMate. These Terms & Conditions govern your access to and use of eFixMate's website, mobile applications, and services. By accessing or using our platform, you agree to comply with these terms.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. About eFixMate",
    paragraphs: [
      "eFixMate is a technology platform that connects customers with independent service professionals for home and office repair, installation, maintenance, cleaning, and related services.",
      "eFixMate facilitates bookings, payments, customer support, and service coordination. Service professionals operating through the platform are independent contractors and are not employees, agents, or representatives of eFixMate unless explicitly stated otherwise.",
    ],
  },
  {
    title: "2. Eligibility",
    paragraphs: [
      "By using eFixMate, you represent and warrant that you are at least 18 years of age and legally capable of entering into binding agreements.",
    ],
  },
  {
    title: "3. User Responsibilities",
    bullets: [
      "Provide accurate, current, and complete account information.",
      "Provide correct service location details and contact information.",
      "Ensure safe and reasonable access to the service location.",
      "Cooperate with assigned service professionals during service delivery.",
      "Pay all applicable fees and charges associated with booked services.",
      "Use the platform only for lawful purposes.",
      "Avoid abusive, fraudulent, threatening, or inappropriate behavior toward technicians, partners, or support staff.",
    ],
  },
  {
    title: "4. Account Registration",
    paragraphs: [
      "Certain features may require account registration. Users are responsible for maintaining the confidentiality of their account credentials and for all activities conducted through their accounts.",
      "eFixMate reserves the right to suspend or terminate accounts involved in fraudulent, unauthorized, or suspicious activities.",
    ],
  },
  {
    title: "5. Service Bookings",
    paragraphs: [
      "Service requests submitted through eFixMate are subject to technician availability and service area coverage.",
      "Booking confirmations, estimated arrival times, and service details will be communicated through the platform or registered contact details.",
      "eFixMate reserves the right to decline, reschedule, or cancel bookings when necessary due to operational, technical, safety, or availability reasons.",
    ],
  },
  {
    title: "6. Pricing and Payments",
    paragraphs: [
      "Service pricing may vary depending on the service type, location, complexity of work, materials required, and applicable taxes.",
      "Additional charges may apply if extra work, replacement parts, or services are approved by the customer during the service visit.",
      "Payments are processed through authorized payment providers. By making a payment, you agree to the applicable payment provider's terms and conditions.",
    ],
  },
  {
    title: "7. Cancellations and Refunds",
    paragraphs: [
      "Booking cancellations and refund requests are governed by eFixMate's Cancellation Policy and Refund Policy.",
      "Customers are encouraged to review these policies before placing a booking.",
    ],
  },
  {
    title: "8. Service Warranty",
    paragraphs: [
      "Certain services may include a limited service warranty where explicitly stated. Warranty coverage, duration, and exclusions vary by service category.",
      "Warranty claims may be denied where damage results from misuse, unauthorized repairs, normal wear and tear, environmental factors, or third-party intervention.",
    ],
  },
  {
    title: "9. Intellectual Property",
    paragraphs: [
      "All content, trademarks, logos, software, designs, graphics, text, and platform features are owned by or licensed to eFixMate and are protected under applicable intellectual property laws.",
      "Users may not reproduce, distribute, modify, reverse engineer, or commercially exploit any part of the platform without prior written permission.",
    ],
  },
  {
    title: "10. Prohibited Activities",
    bullets: [
      "Submitting false or misleading information.",
      "Attempting unauthorized access to platform systems or data.",
      "Interfering with platform operations or security mechanisms.",
      "Using automated tools to scrape or collect platform data.",
      "Engaging in fraudulent, abusive, or unlawful activities.",
      "Circumventing payment systems or platform processes.",
    ],
  },
  {
    title: "11. Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by applicable law, eFixMate shall not be liable for indirect, incidental, consequential, special, or punitive damages arising from the use of the platform or services.",
      "eFixMate's total liability relating to any service booking shall not exceed the amount paid by the customer for the specific booking giving rise to the claim.",
      "Nothing in these terms excludes rights that cannot be limited under applicable consumer protection laws.",
    ],
  },
  {
    title: "12. Indemnification",
    paragraphs: [
      "Users agree to indemnify and hold harmless eFixMate, its directors, employees, affiliates, partners, and service providers from claims, damages, liabilities, losses, and expenses arising from misuse of the platform, violation of these terms, or violation of applicable laws.",
    ],
  },
  {
    title: "13. Suspension and Termination",
    paragraphs: [
      "eFixMate may suspend, restrict, or terminate user accounts at its sole discretion if users violate these Terms & Conditions, engage in fraudulent conduct, abuse platform personnel, or create security risks.",
    ],
  },
  {
    title: "14. Privacy",
    paragraphs: [
      "The collection, use, and protection of personal information are governed by eFixMate's Privacy Policy.",
    ],
  },
  {
    title: "15. Changes to These Terms",
    paragraphs: [
      "eFixMate may revise these Terms & Conditions from time to time to reflect operational, legal, or regulatory changes.",
      "Updated versions will be posted on this page with a revised 'Last Updated' date. Continued use of the platform after such updates constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "16. Contact Us",
    paragraphs: [
      "If you have questions regarding these Terms & Conditions, please contact eFixMate through our official customer support channels.",
    ],
  },
];

export default async function TermsPage() {
  const { sections } = await fetchCmsPage("terms-and-conditions");
  const m = toSectionMap(sections);
  const cms = m["terms-and-conditions.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <SimpleLegalPage
      title={cms?.title ?? "Terms & Conditions"}
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
