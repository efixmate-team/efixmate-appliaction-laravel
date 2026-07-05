/**
 * Server-side CMS fetch utilities.
 * Used in Next.js server components (async page.tsx files).
 * Falls back to empty data on any error so pages render with hardcoded defaults.
 */

import { cache } from "react";
import type { Metadata } from "next";
import { DEFAULT_PHONE, DEFAULT_EMAIL, DEFAULT_ADDRESS } from "./siteDefaults";

type CmsSection = { section_key: string; section_type: string; content: unknown; is_global: boolean };
type CmsPageResult = { page: object | null; sections: CmsSection[] };

function getApiBase(): string {
  // INTERNAL_API_URL is for server-side (Docker service name, etc.)
  // Falls back to NEXT_PUBLIC_API_URL, then localhost.
  const raw =
    process.env.INTERNAL_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:5000";
  // If it's a relative path like "/api", use localhost (can't do relative fetches in Node)
  if (raw.startsWith("/")) return "http://localhost:5000";
  return raw.replace(/\/+$/, "");
}

function isCmsSection(value: unknown): value is CmsSection {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as CmsSection).section_key === "string"
  );
}

function normalizeSections(value: unknown): CmsSection[] {
  return Array.isArray(value) ? value.filter(isCmsSection) : [];
}

/**
 * Fetches all sections for a page slug (page-specific + global).
 * Memoized with React cache() so generateMetadata and the page body share one fetch.
 * Never throws — returns empty on error.
 */
export const fetchCmsPage = cache(async function fetchCmsPageInner(slug: string): Promise<CmsPageResult> {
  try {
    const url = `${getApiBase()}/public/cms/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { page: null, sections: [] };
    const json = await res.json() as { status: boolean; data?: CmsPageResult };
    if (!json.status || !json.data) return { page: null, sections: [] };
    return {
      page: json.data.page && typeof json.data.page === "object" ? json.data.page : null,
      sections: normalizeSections(json.data.sections),
    };
  } catch {
    return { page: null, sections: [] };
  }
});

/**
 * Fetches all global sections (footer, brand, social links, stats, etc.).
 * Never throws — returns empty on error.
 */
export async function fetchCmsGlobals(): Promise<CmsSection[]> {
  try {
    const url = `${getApiBase()}/public/cms/globals`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json() as { status: boolean; data?: { sections: CmsSection[] } };
    if (!json.status || !json.data?.sections) return [];
    return normalizeSections(json.data.sections);
  } catch {
    return [];
  }
}

/**
 * Reduces a section array to a map: { [section_key]: content }.
 * Convenient for looking up content by key.
 */
export function toSectionMap(sections: CmsSection[]): Record<string, unknown> {
  return Object.fromEntries(normalizeSections(sections).map((s) => [s.section_key, s.content]));
}

/**
 * Extracts the global chrome data (footer) from a globals sections array.
 * Returns undefined if no global sections found (frontend will use hardcoded defaults).
 */
export function extractChromeFromGlobals(sections: CmsSection[]) {
  const m = toSectionMap(normalizeSections(sections));

  const ci             = m["global.contact_info"]              as Record<string, string> | undefined;
  const brand          = m["global.brand"]                     as Record<string, string> | undefined;
  const social         = m["global.social_links"]              as Array<{ platform: string; url: string; icon_name: string; label: string }> | undefined;
  const quickLinks     = m["global.footer_quick_links"]        as Array<{ label: string; href: string }> | undefined;
  const supportLinks   = m["global.footer_support_links"]      as Array<{ label: string; href: string }> | undefined;
  const servicesLinks  = m["global.footer_services_links"]     as Array<{ label: string; href: string }> | undefined;
  const profLinks      = m["global.footer_professional_links"] as Array<{ label: string; href: string }> | undefined;
  const trustBadges    = m["global.footer_trust_badges"]       as Array<{ iconName: string; text: string }> | undefined;
  const footerCtaRaw   = m["global.footer_cta"]               as Record<string, unknown> | undefined;
  const appLinks       = m["global.app_download_links"]        as { google_play?: string; app_store?: string } | undefined;
  const workingHours   = m["global.working_hours"]             as Array<{ day_label: string; time_text: string }> | undefined;
  const companyInfo    = m["global.company_info"]              as { company_name?: string; cin?: string; gst?: string } | undefined;

  if (!ci && !brand && !social && !quickLinks && !supportLinks) return null;

  type CtaBlock = { tag: string; heading: string; subtext: string; btn_text: string; btn_href: string };
  const footerCta = (footerCtaRaw?.customer && footerCtaRaw?.professional)
    ? { customer: footerCtaRaw.customer as CtaBlock, professional: footerCtaRaw.professional as CtaBlock }
    : null;

  return {
    contactPhone:      ci?.phone   ?? DEFAULT_PHONE,
    contactEmail:      ci?.email   ?? DEFAULT_EMAIL,
    contactAddress:    ci?.address ?? DEFAULT_ADDRESS,
    brandDescription:  brand?.description ?? "Trusted home service experts — verified technicians, transparent pricing, and guaranteed satisfaction.",
    servingTagline:    brand?.serving_tagline as string | undefined,
    madeInTagline:     brand?.made_in_tagline  as string | undefined,
    socialLinks: (social ?? []).map((s) => ({ iconName: s.icon_name, href: s.url, label: s.label })),
    quickLinks:        quickLinks        ?? [],
    supportLinks:      supportLinks      ?? [],
    servicesLinks:     servicesLinks     ?? [],
    professionalLinks: profLinks         ?? [],
    trustBadges:       trustBadges       ?? [],
    footerCta,
    appDownloadLinks: (appLinks && (appLinks.google_play !== undefined || appLinks.app_store !== undefined))
      ? { google_play: appLinks.google_play ?? "", app_store: appLinks.app_store ?? "" }
      : null,
    workingHours:  workingHours  ?? [],
    companyInfo: (companyInfo?.company_name || companyInfo?.cin)
      ? { company_name: companyInfo.company_name ?? "", cin: companyInfo.cin ?? "", gst: companyInfo.gst ?? "" }
      : null,
    visibility: {
      show_phone: true, show_email: true, show_address: true,
      show_social_links: true, show_brand_description: true,
      show_company_column: true, show_support_column: true, show_get_in_touch: true,
    },
  };
}

// ── Metadata helper ──────────────────────────────────────────────────────────

type CmsPageMeta = { meta_title?: string | null; meta_description?: string | null };

/**
 * Builds a Next.js Metadata object for a CMS-backed page.
 * CMS fields (meta_title / meta_description) override the hardcoded defaults.
 * Call this from generateMetadata() — fetchCmsPage is memoized so no double fetch.
 */
export async function fetchPageMeta(
  slug: string,
  defaults: {
    title: string;
    description: string;
    canonical: string;
    ogType?: "website" | "article";
  },
): Promise<Metadata> {
  const { page } = await fetchCmsPage(slug);
  const p = page as CmsPageMeta | null;

  const title       = p?.meta_title?.trim()       || defaults.title;
  const description = p?.meta_description?.trim() || defaults.description;
  const ogType      = defaults.ogType ?? "website";

  return {
    title,
    description,
    alternates: { canonical: defaults.canonical },
    openGraph: { title, description, url: defaults.canonical, type: ogType },
  };
}
