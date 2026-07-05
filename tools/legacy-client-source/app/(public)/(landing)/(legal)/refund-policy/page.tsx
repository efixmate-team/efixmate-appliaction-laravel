/** @format */

import type { Metadata } from "next";
import { SimpleLegalPage } from "../../_components/SimpleLegalPage";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("refund-policy", {
    title: "Refund Policy | eFixMate",
    description: "eFixMate refund eligibility, process, and timelines.",
    canonical: "/refund-policy",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
];

const DEFAULT_INTRO =
  "At eFixMate, customer satisfaction is important to us. This Refund Policy explains when refunds may be issued, how refund requests are reviewed, and the timelines involved in processing approved refunds.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. Refund Eligibility",
    paragraphs: [
      "eFixMate strives to provide high-quality repair, installation, maintenance, and cleaning services. If a service does not meet expected standards, customers may be eligible for a refund subject to review and verification.",
    ],
    bullets: [
      "The assigned technician failed to arrive for the scheduled service appointment.",
      "The booking was cancelled by eFixMate or the assigned service partner.",
      "A payment was charged incorrectly due to a billing or technical error.",
      "The requested service could not be completed due to reasons attributable to eFixMate or the service partner.",
      "The service delivered significantly differed from the booked service and was reported within 24 hours of completion.",
    ],
  },
  {
    title: "2. Situations Where Refunds May Not Apply",
    paragraphs: ["Refund requests may be declined in the following situations:"],
    bullets: [
      "The service was completed successfully and approved by the customer.",
      "The customer was unavailable at the scheduled time or denied access to the service location.",
      "The issue falls outside the scope of the booked service.",
      "Additional work or spare parts were approved by the customer during service.",
      "Refund requests are submitted more than 7 days after service completion.",
      "Damage or service issues result from customer misuse, negligence, or third-party intervention after completion.",
    ],
  },
  {
    title: "3. Re-Service Before Refund",
    paragraphs: [
      "In many cases, eFixMate may first offer a free re-service, revisit, or corrective action before approving a monetary refund. This allows us to resolve service-related concerns quickly and fairly.",
    ],
  },
  {
    title: "4. How to Request a Refund",
    paragraphs: [
      "To request a refund, customers must contact eFixMate support within 7 days of the service date and provide relevant booking details.",
      "Our support team may request photographs, videos, invoices, or additional information to assist in the investigation process.",
    ],
    bullets: [
      "Booking ID",
      "Description of the issue",
      "Supporting photographs or evidence (if applicable)",
      "Preferred contact details",
    ],
  },
  {
    title: "5. Review and Approval Process",
    paragraphs: [
      "Each refund request is reviewed individually by our support team. Depending on the complexity of the case, additional verification with the assigned technician or service partner may be required.",
      "Most refund reviews are completed within 2–5 business days.",
    ],
  },
  {
    title: "6. Refund Processing Time",
    paragraphs: ["Once approved, refunds are issued to the original payment method used during booking."],
    bullets: [
      "UPI and digital wallets: typically 1–3 business days",
      "Debit and credit cards: typically 5–10 business days",
      "Net banking transactions: typically 5–7 business days",
      "Processing times may vary depending on the customer's bank or payment provider.",
    ],
  },
  {
    title: "7. Partial Refunds",
    paragraphs: [
      "Depending on the nature of the issue, eFixMate may offer a partial refund instead of a full refund. Factors considered include service completion status, materials used, technician time invested, and the severity of the reported issue.",
    ],
  },
  {
    title: "8. Duplicate or Incorrect Charges",
    paragraphs: [
      "If a customer is charged multiple times or notices an incorrect charge due to a technical or payment processing error, eFixMate will investigate the issue and issue an appropriate refund once verified.",
    ],
  },
  {
    title: "9. Contact Us",
    paragraphs: [
      "For refund-related questions or requests, please contact eFixMate customer support through our official support channels. We are committed to resolving concerns fairly, transparently, and as quickly as possible.",
    ],
  },
];

export default async function RefundPolicyPage() {
  const { sections } = await fetchCmsPage("refund-policy");
  const m = toSectionMap(sections);
  const cms = m["refund-policy.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <SimpleLegalPage
      title={cms?.title ?? "Refund Policy"}
      lastUpdated={cms?.lastUpdated ?? "June 2025"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
