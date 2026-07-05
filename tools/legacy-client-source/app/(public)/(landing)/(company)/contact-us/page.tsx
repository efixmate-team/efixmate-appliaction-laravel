import type { Metadata } from "next";
import ContactPageView from "./ContactPageView";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";
import { DEFAULT_PHONE, DEFAULT_EMAIL, DEFAULT_ADDRESS } from "@/lib/siteDefaults";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("contact", {
    title: "Contact Us | eFixMate",
    description: "Reach eFixMate support for bookings, service help, and partnerships.",
    canonical: "/contact-us",
  });
}

const DEFAULT_FAQS = [
  { question: "How do I book a service?", answer: "Use the app or website — choose your service, pick a slot, and confirm. A technician is assigned instantly." },
  { question: "Are technicians verified?", answer: "Yes. Every technician goes through background verification and skill assessment before being onboarded." },
  { question: "Can I cancel or reschedule?", answer: "Yes, free of charge up to 2 hours before your scheduled slot. See our Cancellation Policy for details." },
  { question: "What if I'm not satisfied?", answer: "Contact support within 24 hours of service completion. We'll investigate and resolve it promptly." },
  { question: "Where do you provide services?", answer: "eFixMate operates across India. We have a growing network of verified professionals in cities nationwide." },
];

const DEFAULT_HOURS = [
  { day: "Monday – Friday", hours: "8:00 AM – 8:00 PM" },
  { day: "Saturday",        hours: "9:00 AM – 6:00 PM" },
  { day: "Sunday",          hours: "10:00 AM – 4:00 PM" },
];

const FEATURES = [
  { title: "Fast Response",     description: "We respond to all queries within 2 hours during working hours." },
  { title: "Dedicated Support", description: "Our team is trained to resolve booking and service issues quickly." },
  { title: "Follow-up",         description: "We follow up after every support interaction to ensure satisfaction." },
];

export default async function ContactUsPage() {
  const { sections } = await fetchCmsPage("contact");
  const m = toSectionMap(sections);

  const hero     = m["contact.hero"]          as Record<string, string>                               | undefined;
  const faqs     = m["contact.faqs"]          as Array<{ question: string; answer: string }>          | undefined;
  const hours    = m["contact.working_hours"] as Array<{ day_label: string; time_text: string }>      | undefined;
  const ci       = m["global.contact_info"]   as Record<string, string>                               | undefined;
  const cmsFeatures  = m["contact.features"]  as Array<{ title: string; description: string }>        | undefined;
  const cmsBottomCta = m["contact.bottom_cta"] as { heading?: string; btn_text?: string }             | undefined;
  const nav      = m["global.header_nav"]     as Array<{ label: string; href: string }>               | undefined;

  const phone   = ci?.phone   ?? DEFAULT_PHONE;
  const email   = ci?.email   ?? DEFAULT_EMAIL;
  const address = ci?.address ?? DEFAULT_ADDRESS;

  return (
    <ContactPageView
      cmsPage={{ title: "Contact Us", slug: "contact", meta_description: null, content: "" }}
      cmsFaqs={(faqs ?? DEFAULT_FAQS).map((f) => ({
        question: (f as { question: string }).question,
        answer:   (f as { answer: string }).answer,
      }))}
      cmsWorkingHours={(hours ?? DEFAULT_HOURS).map((h) => ({
        day_label: (h as { day_label?: string; day?: string }).day_label ?? (h as { day?: string }).day ?? "",
        time_text: (h as { time_text?: string; hours?: string }).time_text ?? (h as { hours?: string }).hours ?? "",
      }))}
      heroHeading={hero?.heading ?? "We're Here to Help"}
      heroDescription={hero?.description ?? "Our support team is ready to assist you with bookings, technician queries, and anything else you need."}
      features={cmsFeatures ?? FEATURES}
      connectCards={[
        { label: "Call Us",   value: phone,   subtext: "Mon–Sat, 9:00 AM – 8:00 PM",  href: `tel:${phone.replace(/\s/g, "")}` },
        { label: "Email Us",  value: email,   subtext: "We reply within 24 hours",     href: `mailto:${email}` },
        { label: "Office",    value: address, subtext: "Head office",                  href: "#" },
        { label: "Live Chat", value: "Chat with our team", subtext: "Available 8 AM – 8 PM", href: "/contact-us#contact-form" },
      ]}
      bottomCta={cmsBottomCta ?? { heading: "Still have questions?", btn_text: "Book a Service" }}
      navItems={nav}
    />
  );
}
