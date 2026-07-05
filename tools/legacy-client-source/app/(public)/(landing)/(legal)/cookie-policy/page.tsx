import type { Metadata } from "next";
import { LegalPageLayout } from "../../_components/LegalPageLayout";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("cookie-policy", {
    title: "Cookie Policy | eFixMate",
    description:
      "Learn how eFixMate uses cookies and similar tracking technologies, the types of cookies we set, how long they last, and how to control your cookie preferences.",
    canonical: "/cookie-policy",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Disclaimer", href: "/disclaimer" },
];

const DEFAULT_INTRO =
  "This Cookie Policy explains how eFixMate Pvt. Ltd. uses cookies and similar tracking technologies on our website (www.efixmate.com) and mobile applications. By continuing to use our platform, you consent to our use of cookies as described in this policy.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. What Are Cookies",
    paragraphs: [
      "Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences, keep you logged in between visits, and provide usage analytics to improve the platform.",
      "Similar technologies include local storage, session storage, pixels, and web beacons, which function in comparable ways. References to 'cookies' in this policy include all such technologies.",
    ],
  },
  {
    title: "2. Types of Cookies We Use",
    bullets: [
      "Essential Cookies: Required for the platform to function correctly. These include session authentication tokens, security cookies, and load-balancing cookies. These cannot be disabled without affecting core functionality.",
      "Functional Cookies: Used to remember your preferences such as location, language settings, and previously entered service addresses. Disabling these may degrade your experience.",
      "Analytics Cookies: Help us understand how visitors use our platform — which pages are visited, how long users stay, and where they navigate from. We use these insights to improve the platform (e.g., Google Analytics, Firebase Analytics).",
      "Marketing Cookies: Used to measure the effectiveness of advertising campaigns and deliver relevant promotions. These may be set by third-party advertising partners (e.g., Google Ads, Meta Pixel).",
    ],
  },
  {
    title: "3. Third-Party Cookies",
    paragraphs: [
      "We use select third-party services that may set their own cookies on your device. These include:",
    ],
    bullets: [
      "Google Analytics: For traffic and behaviour analysis.",
      "Firebase: For app performance monitoring and crash reporting.",
      "Razorpay: For secure payment processing — payment provider cookies are governed by Razorpay's own privacy policy.",
      "Meta (Facebook) Pixel: For advertising measurement and campaign optimisation.",
    ],
  },
  {
    title: "4. How Long Cookies Last",
    bullets: [
      "Session Cookies: Deleted automatically when you close your browser or end your app session.",
      "Persistent Cookies: Remain on your device for a fixed period (typically 30 days to 2 years) or until manually deleted.",
      "Authentication Tokens: Expire after 30 days of inactivity for security purposes.",
    ],
  },
  {
    title: "5. How to Control Cookies",
    paragraphs: [
      "You can control or delete cookies at any time using your browser settings. Most browsers allow you to block all cookies, block third-party cookies, or delete existing cookies. Please note that disabling essential cookies will impair your ability to use certain features of the eFixMate platform, including login.",
    ],
    bullets: [
      "Google Chrome: Settings → Privacy and Security → Cookies and other site data",
      "Mozilla Firefox: Options → Privacy & Security → Cookies and Site Data",
      "Safari: Preferences → Privacy → Manage Website Data",
      "Microsoft Edge: Settings → Cookies and site permissions",
    ],
  },
  {
    title: "6. Updates to This Cookie Policy",
    paragraphs: [
      "We may update this Cookie Policy from time to time to reflect changes in our use of cookies or applicable law. Updates will be posted on this page with a revised 'Last Updated' date. Your continued use of the eFixMate platform after any update constitutes acceptance of the revised policy.",
    ],
  },
];

export default async function CookiePolicyPage() {
  const { sections } = await fetchCmsPage("cookie-policy");
  const m = toSectionMap(sections);
  const cms = m["cookie-policy.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <LegalPageLayout
      title={cms?.title ?? "Cookie Policy"}
      description="Learn how eFixMate uses cookies and similar tracking technologies, the types of cookies we set, how long they last, and how to control your cookie preferences."
      canonical="/cookie-policy"
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
