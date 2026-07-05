/** @format */

import type { Metadata } from "next";
import { SimpleLegalPage } from "../../_components/SimpleLegalPage";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("cancellation-policy", {
    title: "Cancellation Policy | eFixMate",
    description:
      "Learn how eFixMate handles booking cancellations, rescheduling requests, cancellation fees, and refunds.",
    canonical: "/cancellation-policy",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const DEFAULT_INTRO =
  "At eFixMate, we understand that plans can change. This Cancellation Policy explains how customers can cancel or reschedule service bookings, any applicable cancellation charges, and how refunds are handled.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. Customer Cancellation Requests",
    paragraphs: [
      "Customers may cancel a service booking before the scheduled service time through the eFixMate platform or by contacting customer support.",
      "Cancellation eligibility and any applicable charges depend on the timing of the cancellation and the status of the assigned service professional.",
    ],
  },
  {
    title: "2. Free Cancellation",
    paragraphs: [
      "Customers may cancel a booking without any cancellation charges if the cancellation request is submitted at least 2 hours before the scheduled service time.",
    ],
    bullets: [
      "No cancellation fee will be charged.",
      "Any prepaid amount will be eligible for a full refund.",
      "Refunds will be processed according to the Refund Policy.",
    ],
  },
  {
    title: "3. Late Cancellation",
    paragraphs: [
      "If a booking is cancelled less than 2 hours before the scheduled service time, eFixMate may charge a cancellation fee to compensate for technician scheduling and travel arrangements.",
    ],
    bullets: [
      "Cancellation fee may be up to ₹100 or 10% of the booking value, whichever is lower.",
      "The applicable fee may be deducted from any refund amount.",
      "The remaining balance, if applicable, will be refunded according to the Refund Policy.",
    ],
  },
  {
    title: "4. No-Show or Unavailable Customer",
    paragraphs: [
      "If the assigned technician arrives at the service location at the scheduled time but cannot reach the customer, gain access to the premises, or begin work due to customer-related reasons, the booking may be treated as a no-show.",
    ],
    bullets: [
      "A no-show fee may be applied.",
      "The booking may be marked as completed or cancelled.",
      "Additional charges may apply if a new booking is required.",
    ],
  },
  {
    title: "5. Rescheduling Requests",
    paragraphs: [
      "Customers may request to reschedule a booking instead of cancelling it.",
      "Rescheduling requests are subject to technician availability and service area coverage.",
    ],
    bullets: [
      "Rescheduling requested at least 2 hours before the appointment is generally free.",
      "Last-minute rescheduling requests may be treated as cancellations.",
      "New appointment times are subject to availability.",
    ],
  },
  {
    title: "6. Cancellation by eFixMate",
    paragraphs: [
      "In rare circumstances, eFixMate may need to cancel a booking due to technician unavailability, operational constraints, safety concerns, weather conditions, technical issues, or other unforeseen circumstances.",
    ],
    bullets: [
      "Customers will be notified as soon as reasonably possible.",
      "Any prepaid amount will be refunded in full.",
      "Where possible, eFixMate will assist with rescheduling the service.",
    ],
  },
  {
    title: "7. Emergency and Special Services",
    paragraphs: [
      "Certain emergency, same-day, custom, or special-order services may have different cancellation terms due to technician allocation, material procurement, or operational requirements.",
      "Any service-specific cancellation conditions will be disclosed during booking where applicable.",
    ],
  },
  {
    title: "8. Refunds After Cancellation",
    paragraphs: [
      "Refunds resulting from cancelled bookings are processed according to eFixMate's Refund Policy.",
      "The actual time required for funds to appear in the customer's account depends on the payment method and financial institution involved.",
    ],
  },
  {
    title: "9. Abuse of Cancellation Privileges",
    paragraphs: [
      "Repeated excessive cancellations, fraudulent bookings, abuse of technicians' time, or misuse of the booking system may result in temporary restrictions, additional verification requirements, or suspension of the user's account.",
    ],
  },
  {
    title: "10. Contact Us",
    paragraphs: [
      "If you need assistance with cancelling or rescheduling a booking, please contact eFixMate customer support through our official support channels.",
    ],
  },
];

export default async function CancellationPolicyPage() {
  const { sections } = await fetchCmsPage("cancellation-policy");
  const m = toSectionMap(sections);
  const cms = m["cancellation-policy.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <SimpleLegalPage
      title={cms?.title ?? "Cancellation Policy"}
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
