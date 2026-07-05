import type { Metadata } from "next";
import "./globals.css";
import { BRAND_LOGO_SRC } from "@/src/shared/constants/branding";
import { CookieConsent } from "@/components/CookieConsent";

const ogImageUrl = "https://efixmate.com/og-image.jpg";

export const metadata: Metadata = {
  title: {
    default: "eFixMate | Services for Homes, Offices & Workplaces Across India",
    template: "%s | eFixMate",
  },
  description:
    "Book verified services for homes, offices & workplaces — AC repair, plumbing, electrician, annual maintenance & more. Upfront pricing, 30-day warranty, on-time guaranteed.",
  metadataBase: new URL("https://efixmate.com"),
  alternates: { canonical: "https://efixmate.com" },
  keywords: [
    "home services", "appliance repair", "AC repair", "plumbing", "electrician",
    "annual maintenance contract", "deep cleaning", "pest control",
    "eFixMate", "home service app India",
  ],
  openGraph: {
    title: "eFixMate | Services for Homes, Offices & Workplaces Across India",
    description:
      "Verified technicians, upfront pricing, 30-day warranty. AC repair, plumbing, electrical, annual maintenance & more — for homes, offices & workplaces across India.",
    url: "https://efixmate.com",
    siteName: "eFixMate",
    images: [
      {
        url: ogImageUrl,
        secureUrl: ogImageUrl,
        type: "image/jpeg",
        width: 1200,
        height: 630,
        alt: "eFixMate — Verified Home & Office Services",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "eFixMate | Services for Homes, Offices & Workplaces Across India",
    description: "Verified technicians, upfront pricing, 30-day warranty — serving homes, offices & workplaces across India.",
    images: [
      {
        url: ogImageUrl,
        alt: "eFixMate — Verified Home & Office Services",
      },
    ],
  },
  icons: {
    icon: BRAND_LOGO_SRC,
    apple: BRAND_LOGO_SRC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}