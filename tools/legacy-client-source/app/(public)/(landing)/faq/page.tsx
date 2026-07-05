import type { Metadata } from "next";
import { FaqView, type FaqCategory } from "../_components/FaqView";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("faq", {
    title: "Frequently Asked Questions | eFixMate",
    description:
      "Answers to common questions about booking a service, technician verification, refunds, warranty, tracking your booking, and becoming an eFixMate service partner.",
    canonical: "/faq",
    ogType: "website",
  });
}

const DEFAULT_FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "How It Works",
    items: [
      {
        id: "how-works",
        question: "How does eFixMate work?",
        answer:
          "eFixMate connects you with verified, skilled technicians for home and office services in just a few steps. Browse the service you need, choose a convenient time slot, and confirm your booking. We assign a background-verified technician to your appointment. The technician arrives at your address, completes the work, and you pay on completion. Every booking is backed by eFixMate's service warranty.",
      },
      {
        id: "track-booking",
        question: "How can I track my booking?",
        answer:
          "Once your booking is confirmed, open the eFixMate app or website and go to My Bookings. You can see the current status — Confirmed, Technician Assigned, En Route, or Completed. When the technician is on the way, you receive a notification with their live location and ETA. You can also call or message the technician directly through the app.",
      },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      {
        id: "technician-verified",
        question: "How are technicians verified?",
        answer:
          "Every technician on eFixMate goes through a four-step verification before accepting bookings: (1) Government-issued ID check — Aadhaar, PAN, or Driving Licence; (2) Police background verification or character certificate; (3) Trade certification check — ITI, NCVT, or equivalent with minimum 2 years of hands-on experience; (4) In-person skill assessment and safety training. Technicians who do not meet all criteria are not activated. For full details, visit our Safety & Verification page.",
      },
      {
        id: "no-arrive",
        question: "What happens if a technician does not arrive?",
        answer:
          "If your technician does not arrive within 30 minutes of the scheduled time without prior notice, contact eFixMate support through the app or helpline. We will immediately reassign another verified technician or reschedule your appointment at no extra charge. If we cannot arrange a replacement within a reasonable time, you are entitled to a full refund to your original payment method.",
      },
    ],
  },
  {
    title: "Payments & Refunds",
    items: [
      {
        id: "refunds",
        question: "How do refunds work?",
        answer:
          "Refunds are processed in these situations: (a) Booking cancelled before technician assignment — full refund in 5–7 business days; (b) Technician does not arrive — full refund in 5–7 business days; (c) Service quality issue acknowledged by eFixMate — partial or full refund. Refunds are credited back to the original payment method. For prepaid bookings, the refund is initiated within 48 hours and takes 5–7 banking days to reflect. See our Refund Policy for complete terms.",
      },
      {
        id: "payment-methods",
        question: "What payment methods does eFixMate accept?",
        answer:
          "eFixMate accepts UPI (all major apps including GPay, PhonePe, Paytm), debit and credit cards (Visa, Mastercard, RuPay), net banking, and cash on service completion for select categories. All digital payments are processed securely through Razorpay. eFixMate never stores your card details or UPI PIN.",
      },
    ],
  },
  {
    title: "Services & Warranty",
    items: [
      {
        id: "warranty",
        question: "What services are covered under warranty?",
        answer:
          "All eFixMate services come with a workmanship warranty. If the same issue recurs within the warranty period, we arrange a free re-service visit. Warranty periods by category: General electrical repairs and plumbing — 7 days; Appliance installation, AC service, fan and light installation, painting, and carpentry — 30 days. The warranty covers labour only and excludes parts, consumables, or damage caused after service completion. Full details are in our Warranty Policy.",
      },
      {
        id: "services-offered",
        question: "Which services does eFixMate offer?",
        answer:
          "eFixMate currently offers: Electrical (installation, repair, and fault-finding), AC service and repair, Plumbing (leaks, fitting, and drainage), Appliance installation (geysers, water purifiers, chimneys), Fan and light installation, Home and office deep cleaning, Painting, and Carpentry and furniture repair. Service availability may vary by city. We regularly add new categories — check the app for the latest list in your area.",
      },
    ],
  },
  {
    title: "For Service Partners",
    items: [
      {
        id: "become-partner",
        question: "How can I become a service partner?",
        answer:
          "To join eFixMate as a technician, contact our partner onboarding team or tap 'Join as a Professional' in the footer. You will need to complete KYC verification (government ID and address proof), submit a police verification certificate, demonstrate your trade certification or relevant work experience, and pass our skill assessment. Once approved, you can accept bookings in your preferred service area and earn per completed job. There is no joining fee.",
      },
    ],
  },
];

export default async function FaqPage() {
  const { sections } = await fetchCmsPage("faq");
  const m = toSectionMap(sections);

  const cmsCategories = m["faq.categories"] as FaqCategory[] | undefined;
  const categories = (cmsCategories?.length ? cmsCategories : null) ?? DEFAULT_FAQ_CATEGORIES;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((cat) =>
      cat.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FaqView categories={categories} />
    </>
  );
}
