"use client";

import { createContext, useContext } from "react";

export type FooterLink = { label: string; href: string };
export type SocialLink = { iconName: string; href: string; label: string };

export type FooterVisibility = {
  show_phone: boolean;
  show_email: boolean;
  show_address: boolean;
  show_social_links: boolean;
  show_brand_description: boolean;
  show_company_column: boolean;
  show_support_column: boolean;
  show_get_in_touch: boolean;
};

export const DEFAULT_FOOTER_VISIBILITY: FooterVisibility = {
  show_phone: true,
  show_email: true,
  show_address: true,
  show_social_links: true,
  show_brand_description: true,
  show_company_column: true,
  show_support_column: true,
  show_get_in_touch: true,
};

export type TrustBadge = { iconName: string; text: string };
export type WorkingHour = { day_label: string; time_text: string };
export type FooterCta = {
  tag: string;
  heading: string;
  subtext: string;
  btn_text: string;
  btn_href: string;
};

export type PublicChromeData = {
  quickLinks: FooterLink[];
  supportLinks: FooterLink[];
  socialLinks: SocialLink[];
  servicesLinks: FooterLink[];
  professionalLinks: FooterLink[];
  trustBadges: TrustBadge[];
  workingHours: WorkingHour[];
  footerCta: { customer: FooterCta; professional: FooterCta } | null;
  appDownloadLinks: { google_play: string; app_store: string } | null;
  companyInfo: { company_name: string; cin: string; gst: string } | null;
  brandDescription: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  servingTagline?: string;
  madeInTagline?: string;
  visibility: FooterVisibility;
};

const PublicChromeContext = createContext<PublicChromeData | null>(null);

export function PublicChromeProvider({
  value,
  children,
}: {
  value: PublicChromeData | null;
  children: React.ReactNode;
}) {
  return <PublicChromeContext.Provider value={value}>{children}</PublicChromeContext.Provider>;
}

export function usePublicChrome() {
  return useContext(PublicChromeContext);
}

export type LandingChromeData = PublicChromeData;
export const LandingChromeProvider = PublicChromeProvider;
export const useLandingChrome = usePublicChrome;
