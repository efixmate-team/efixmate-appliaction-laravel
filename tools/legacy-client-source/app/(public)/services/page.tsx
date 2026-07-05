/** @format */

import { Suspense } from "react";
import ServicesPageView from "./ServicesPageView";
import type { HomePageViewProps } from "./ServicesPageView";
import { LandingChromeProvider } from "../(landing)/_components/LandingChromeProvider";
import { DEFAULT_FOOTER_VISIBILITY } from "../(landing)/_components/LandingChromeProvider";
import HomeAuthShell from "../(landing)/_components/HomeAuthShell";
import LocationProvider from "@/providers/LocationProvider";
import { fetchCmsPage, fetchCmsGlobals, toSectionMap, extractChromeFromGlobals } from "@/lib/serverCms";
import { DEFAULT_PHONE } from "@/lib/siteDefaults";

export const dynamic = "force-dynamic";

const S = "/asssets/landing/services";
const H = "/asssets/landing/home";

const DEFAULT_PROPS: HomePageViewProps = {
  hero: {
    heading: "Expert Home Services, On Demand",
    subheading: "Verified technicians for electrical, AC, plumbing, cleaning & more - at your doorstep.",
    badge_items: ["Background-verified", "Transparent pricing", "On-time guarantee"],
    cta_primary: "Book a Service",
    cta_secondary: "How It Works",
  },
  rating: { value: "4.8", label: "25,000+ happy customers" },
  contactBanner: {
    heading: "Need help right now?",
    subtext: "Our support team is available 8 AM - 8 PM, Monday to Saturday.",
    phone: DEFAULT_PHONE,
    cta_call: "Call Us",
    cta_chat: "Chat with Us",
  },
  serviceCards: [
    { icon: `${S}/Icons-33.webp`, title: "Electrical Installations", desc: "Switches, sockets, MCB & more", href: "/services" },
    { icon: `${S}/Icons-34.webp`, title: "Fan Installation", desc: "Ceiling, exhaust & decorative fans", href: "/services" },
    { icon: `${S}/Icons-35.webp`, title: "Light Installation", desc: "LED, tube lights, chandeliers", href: "/services" },
    { icon: `${S}/Icons-36.webp`, title: "Appliance Installation", desc: "Geysers, water purifiers & more", href: "/services" },
    { icon: `${S}/Icons-37.webp`, title: "Electrical Repair", desc: "Fault repair, wiring, short circuits", href: "/services" },
  ],
  stats: [
    { iconName: "BadgeCheck",  value: "5,000+", label: "Happy Customers" },
    { iconName: "Wrench",      value: "50+",    label: "Expert Technicians" },
    { iconName: "Sparkles",    value: "1,000+", label: "Jobs Completed" },
    { iconName: "ShieldCheck", value: "98%",    label: "Customer Satisfaction" },
  ],
  promiseItems: [
    { icon: `${H}/why-choose/Icons-11.webp`, title: "Trust & Safety",   desc: "Every technician is background-verified before joining our platform." },
    { icon: `${H}/why-choose/Icons-13.webp`, title: "Transparency",     desc: "Clear pricing with no hidden charges - you know what you pay upfront." },
    { icon: `${H}/why-choose/Icons-14.webp`, title: "Quality Service",  desc: "We maintain high standards on every job, from booking to completion." },
    { icon: `${H}/why-choose/Icons-15.webp`, title: "Customer First",   desc: "Your convenience and satisfaction drive every decision we make." },
  ],
  steps: [
    { title: "Book a Service",          desc: "Choose your service and pick a convenient slot in under 2 minutes." },
    { title: "We Assign a Technician",  desc: "A verified, experienced technician is matched to your job." },
    { title: "Get It Fixed",            desc: "Technician arrives on time and completes the job professionally." },
    { title: "Satisfaction Guaranteed", desc: "Rate your experience. All work backed by a service warranty." },
  ],
  customerTypes: [
    { icon: `${H}/who-we-serve/Icons-20.webp`, label: "Homes" },
    { icon: `${H}/who-we-serve/Icons-21.webp`, label: "Offices" },
    { icon: `${H}/who-we-serve/Icons-22.webp`, label: "Shops" },
    { icon: `${H}/who-we-serve/Icons-23.webp`, label: "Commercial Spaces" },
  ],
  testimonials: [
    { text: "Excellent service! The technician was punctual, polite and fixed the issue in no time.", name: "Rahul Sharma", city: "Raipur" },
    { text: "Very professional team and transparent pricing. Highly recommended!",                   name: "Priya Verma",  city: "Raipur" },
    { text: "Booking was easy and the service quality exceeded my expectations.",                    name: "Amit Sahu",    city: "Raipur" },
  ],
  serviceAreas: [
    { name: "Bangalore", active: true },
    { name: "Hyderabad", active: true },
    { name: "Pune",      active: true },
    { name: "Chennai",   active: true },
    { name: "Mumbai",    active: true },
  ],
};

const DEFAULT_CHROME = {
  quickLinks: [
    { label: "Home",         href: "/" },
    { label: "Services",     href: "/services" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About Us",     href: "/about" },
    { label: "Careers",      href: "/careers" },
    { label: "Contact",      href: "/contact" },
  ],
  supportLinks: [
    { label: "Privacy Policy",      href: "/privacy-policy" },
    { label: "Terms & Conditions",  href: "/terms-and-conditions" },
    { label: "Refund Policy",       href: "/refund-policy" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
    { label: "Support",             href: "/contact" },
  ],
  socialLinks: [
    { iconName: "Instagram", href: "https://www.instagram.com/e_fixmate/", label: "Instagram" },
    { iconName: "Linkedin",  href: "https://www.linkedin.com/company/efixmate/?viewAsMember=true", label: "LinkedIn" },
    { iconName: "Twitter",   href: "https://x.com/efixmate", label: "X" },
  ],
  brandDescription: "Trusted home service experts - verified technicians, transparent pricing, and guaranteed satisfaction.",
  contactPhone:   DEFAULT_PHONE,
  contactEmail:   "support@efixmate.com",
  contactAddress: "eFixMate, Near DM Tower, Kailash Nagar, Birgaon, Raipur, CG 490013",
  servicesLinks: [],
  professionalLinks: [],
  trustBadges: [],
  workingHours: [],
  footerCta: null,
  appDownloadLinks: null,
  companyInfo: null,
  visibility: DEFAULT_FOOTER_VISIBILITY,
};

export default async function ServicesPage() {
  const [{ sections: pageSections }, globalSections] = await Promise.all([
    fetchCmsPage("services"),
    fetchCmsGlobals(),
  ]);

  const allSections = [...pageSections, ...globalSections];
  const m = toSectionMap(allSections);

  // Merge CMS data over defaults
  const hero         = m["services.hero"]           as Partial<HomePageViewProps["hero"]>           | undefined;
  const rating       = m["services.rating"]         as HomePageViewProps["rating"]                  | undefined;
  const cBanner      = m["services.contact_banner"] as Partial<HomePageViewProps["contactBanner"]>  | undefined;
  const serviceCards = m["services.service_cards"]  as HomePageViewProps["serviceCards"]            | undefined;
  const promiseItems = m["services.promise_items"]  as HomePageViewProps["promiseItems"]            | undefined;
  const steps        = m["services.steps"]          as HomePageViewProps["steps"]                   | undefined;
  const customerTypes = m["services.customer_types"] as HomePageViewProps["customerTypes"]          | undefined;
  const testimonials = m["services.testimonials"]   as HomePageViewProps["testimonials"]            | undefined;
  const cmsStats     = m["global.stats"]        as HomePageViewProps["stats"]                   | undefined;
  const serviceAreas = m["global.service_areas"] as HomePageViewProps["serviceAreas"]           | undefined;
  const ci           = m["global.contact_info"] as Record<string, string>                       | undefined;

  const props: HomePageViewProps = {
    ...DEFAULT_PROPS,
    hero: hero ? { ...DEFAULT_PROPS.hero, ...hero } : DEFAULT_PROPS.hero,
    rating: rating ?? DEFAULT_PROPS.rating,
    contactBanner: cBanner
      ? { ...DEFAULT_PROPS.contactBanner, ...cBanner, phone: ci?.phone ?? DEFAULT_PROPS.contactBanner.phone }
      : { ...DEFAULT_PROPS.contactBanner, phone: ci?.phone ?? DEFAULT_PROPS.contactBanner.phone },
    serviceCards: serviceCards ?? DEFAULT_PROPS.serviceCards,
    stats: cmsStats ?? DEFAULT_PROPS.stats,
    promiseItems: promiseItems ?? DEFAULT_PROPS.promiseItems,
    steps: steps ?? DEFAULT_PROPS.steps,
    customerTypes: customerTypes ?? DEFAULT_PROPS.customerTypes,
    testimonials: testimonials ?? DEFAULT_PROPS.testimonials,
    serviceAreas: serviceAreas ?? DEFAULT_PROPS.serviceAreas,
  };

  const chrome = extractChromeFromGlobals(globalSections) ?? DEFAULT_CHROME;

  return (
    <LandingChromeProvider value={chrome}>
      <HomeAuthShell>
        <LocationProvider>
          <Suspense fallback={null}>
            <ServicesPageView {...props} />
          </Suspense>
        </LocationProvider>
      </HomeAuthShell>
    </LandingChromeProvider>
  );
}
