"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Twitter,
  Youtube,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLandingChrome } from "@/components/PublicChromeProvider";
import { DEFAULT_PHONE, DEFAULT_EMAIL } from "@/lib/siteDefaults";
import type React from "react";

// ─── icon map for CMS icon name strings ───────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  BadgeCheck, Clock, ExternalLink, Facebook, Globe, Instagram, Linkedin,
  Mail, MapPin, MessageCircle, Phone, ShieldCheck, Twitter, Youtube,
};

// ─── hardcoded defaults (always used as fallback when CMS has no data) ────────

const DEFAULT_SOCIAL: { Icon: React.ElementType; href: string; label: string }[] = [
  { Icon: Instagram, href: "https://www.instagram.com/e_fixmate/",                              label: "Instagram" },
  { Icon: Linkedin,  href: "https://www.linkedin.com/company/efixmate/?viewAsMember=true",       label: "LinkedIn"  },
  { Icon: Twitter,   href: "https://x.com/efixmate",                                             label: "X"         },
];

const SERVICES: [string, string][] = [
  ["AC Service & Repair", "/services"],
  ["Electrician",         "/services"],
  ["Plumbing",            "/services"],
  ["Appliance Repair",    "/services"],
  ["Home Cleaning",       "/services"],
  ["Carpentry",           "/services"],
  ["Painting",            "/services"],
];

const DEFAULT_COMPANY: [string, string][] = [
  ["About Us",           "/about-us"],
  ["Contact Us",         "/contact"],
  ["Governance",         "https://investorrelation.efixmate.com/governance/"],
  ["Investor Relations", "https://investorrelation.efixmate.com/"],
];

const DEFAULT_LEGAL: [string, string][] = [
  ["Terms & Conditions",        "/terms-and-conditions"],
  ["Privacy Policy",            "/privacy-policy"],
  ["Refund & Cancellation",     "/refund-policy"],
  ["Warranty Policy",           "/warranty-policy"],
  ["Service Partner Agreement", "/service-partner-agreement"],
  ["Disclaimer",                "/disclaimer"],
];

const DEFAULT_SUPPORT: [string, string][] = [
  ["FAQ",                      "/faq"],
  ["Safety & Verification",    "/safety-and-verification"],
  ["Help & Contact",           "/contact"],
  ["Grievance Policy",         "/grievance-policy"],
  ["Account Deletion",         "/account-deletion-policy"],
  ["Cookie Policy",            "/cookie-policy"],
];

const FOR_PROFESSIONALS: [string, string][] = [
  ["Become a Partner",        "/become-a-partner"],
  ["How it Works",            "/become-a-partner#process"],
  ["Earnings Calculator",     "/become-a-partner"],
  ["Training & Verification", "/become-a-partner"],
  ["Partner Support",         "/contact"],
];

const DEFAULT_BOTTOM_LINKS: [string, string][] = [
  ["Terms",        "/terms-and-conditions"],
  ["Privacy",      "/privacy-policy"],
  ["Refund Policy","/refund-policy"],
];

const TRUST_BADGES: { Icon: React.ElementType; text: string }[] = [
  { Icon: BadgeCheck,   text: "Background-Verified Professionals" },
  { Icon: ShieldCheck,  text: "Upfront Transparent Pricing"       },
  { Icon: BadgeCheck,   text: "Service Guarantee on Every Job"    },
  { Icon: ShieldCheck,  text: "DPDP Act Compliant"                },
  { Icon: MessageCircle,text: "24/7 Customer Support"             },
];

const DEFAULT_BRAND_DESC = "India's trusted services marketplace for homes, offices & workplaces — verified professionals, transparent pricing, and annual maintenance contracts.";

// ─── component ───────────────────────────────────────────────────────────────

interface SiteFooterProps {
  mobileNav?: boolean;
}

export function SiteFooter({ mobileNav = false }: SiteFooterProps) {
  // CMS context — null when no LandingChromeProvider is in the tree (non-landing pages)
  const chrome = useLandingChrome();

  // Additive overlay: use CMS value when non-empty, otherwise keep hardcoded default
  const brandDescription = chrome?.brandDescription || DEFAULT_BRAND_DESC;
  const contactPhone     = chrome?.contactPhone     || DEFAULT_PHONE;
  const contactEmail     = chrome?.contactEmail     || DEFAULT_EMAIL;
  // contactAddress: CMS provides a plain string; null means fall back to hardcoded JSX (with <br />)
  const contactAddressCms = chrome?.contactAddress || null;

  const socialLinks = chrome?.socialLinks?.length
    ? chrome.socialLinks.map(({ iconName, href, label }) => ({
        Icon: ICON_MAP[iconName] ?? Globe,
        href,
        label,
      }))
    : DEFAULT_SOCIAL;

  const companyLinks: [string, string][] = chrome?.quickLinks?.length
    ? chrome.quickLinks.map(({ label, href }) => [label, href])
    : DEFAULT_COMPANY;

  const legalLinks: [string, string][] = chrome?.supportLinks?.length
    ? chrome.supportLinks.map(({ label, href }) => [label, href])
    : DEFAULT_LEGAL;

  const servicesLinks: [string, string][] = chrome?.servicesLinks?.length
    ? chrome.servicesLinks.map(({ label, href }) => [label, href])
    : SERVICES;

  const professionalLinks: [string, string][] = chrome?.professionalLinks?.length
    ? chrome.professionalLinks.map(({ label, href }) => [label, href])
    : FOR_PROFESSIONALS;

  const trustBadges = chrome?.trustBadges?.length
    ? chrome.trustBadges.map(({ iconName, text }) => ({ Icon: ICON_MAP[iconName] ?? BadgeCheck, text }))
    : TRUST_BADGES;

  const footerCta     = chrome?.footerCta     ?? null;
  const appLinks      = chrome?.appDownloadLinks ?? null;
  const workingHours  = chrome?.workingHours?.length ? chrome.workingHours : null;
  const companyInfo   = chrome?.companyInfo   ?? null;

  const supportLinks: [string, string][] = DEFAULT_SUPPORT;

  // Bottom bar links mirror legalLinks (first 3 entries)
  const bottomLinks = legalLinks.slice(0, 3);

  return (
    <footer
      className={`bg-[#060e1f] ${mobileNav ? "pb-24 lg:pb-0" : ""}`}
      style={{ backgroundImage: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(29,78,216,0.08) 0%, transparent 70%)" }}
    >

      {/* ── Trust badge strip ─────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-[#0a1628]/60">
        <div className="mx-auto max-w-[1440px] px-3 py-3 sm:px-4 lg:px-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
            {trustBadges.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon size={13} className="text-[#60a5fa] shrink-0" strokeWidth={2} />
                <span className="text-[11.5px] font-medium text-[#64748b] whitespace-nowrap">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Dual CTA strip ────────────────────────────────────────── */}
      <div className="border-b border-white/[0.07]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-px sm:grid-cols-2">

          {/* Customer CTA */}
          <div className="flex flex-col items-start justify-between gap-4 px-3 py-9 sm:flex-row sm:items-center sm:px-4 lg:px-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#60a5fa]">
                {footerCta?.customer.tag ?? "For Customers"}
              </p>
              <p className="mt-1 text-[1.05rem] font-bold text-white leading-snug">
                {footerCta?.customer.heading ?? "Book a verified professional today."}
              </p>
              <p className="mt-0.5 text-[12.5px] text-[#475569]">
                {footerCta?.customer.subtext ?? "Transparent pricing · Service guarantee"}
              </p>
            </div>
            <Link
              href={footerCta?.customer.btn_href ?? "/#services"}
              className="inline-flex shrink-0 items-center gap-2 rounded-[4px] bg-[#1d4ed8] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1e40af]"
            >
              {footerCta?.customer.btn_text ?? "Book a Service"} <ArrowUpRight size={15} />
            </Link>
          </div>

          {/* Professional CTA */}
          <div className="flex flex-col items-start justify-between gap-4 border-t border-white/[0.07] px-3 py-9 sm:flex-row sm:items-center sm:border-l sm:border-t-0 sm:px-4 lg:px-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#818cf8]">
                {footerCta?.professional.tag ?? "For Professionals"}
              </p>
              <p className="mt-1 text-[1.05rem] font-bold text-white leading-snug">
                {footerCta?.professional.heading ?? "Grow your career with eFixMate."}
              </p>
              <p className="mt-0.5 text-[12.5px] text-[#475569]">
                {footerCta?.professional.subtext ?? "Steady work · Better earnings · Real growth"}
              </p>
            </div>
            <Link
              href={footerCta?.professional.btn_href ?? "/contact"}
              className="inline-flex shrink-0 items-center gap-2 rounded-[4px] border border-white/[0.18] bg-[rgba(255,255,255,0.04)] px-5 py-2.5 text-[13px] font-semibold text-[#cbd5e1] transition hover:border-white/30 hover:text-white"
            >
              {footerCta?.professional.btn_text ?? "Join Now"} <ArrowUpRight size={15} />
            </Link>
          </div>

        </div>
      </div>

      {/* ── Main columns ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1440px] px-3 py-14 sm:px-4 lg:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1.1fr_1.3fr]">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <BrandLogo variant="onDark" />
              <span className="text-[17px] font-black tracking-tight text-white">eFixMate</span>
            </Link>
            <p className="max-w-[260px] text-[13px] leading-[1.75] text-[#94a3b8]">
              {brandDescription}
            </p>

            {/* App download */}
            <div className="mt-5 flex flex-col gap-2">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#475569]">
                Get the App
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={appLinks?.google_play || "#"}
                  aria-label="Download on Google Play"
                  className="inline-flex items-center gap-2 rounded-[4px] border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-[12px] font-semibold text-[#cbd5e1] transition hover:border-white/25 hover:text-white"
                >
                  <svg width="13" height="13" viewBox="0 0 512 512" aria-hidden="true">
                    <path d="M64 44v424l228-212L64 44z" fill="#00D6FF" />
                    <path d="M64 44l280 142-52 70L64 44z" fill="#00F076" />
                    <path d="M64 468l228-212 52 70L64 468z" fill="#FFC900" />
                    <path d="M344 186l92 47c22 11 22 35 0 46l-92 47-52-70 52-70z" fill="#FF3D00" />
                  </svg>
                  Google Play
                </a>
                <a
                  href={appLinks?.app_store || "#"}
                  aria-label="Download on App Store"
                  className="inline-flex items-center gap-2 rounded-[4px] border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-[12px] font-semibold text-[#cbd5e1] transition hover:border-white/25 hover:text-white"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  App Store
                </a>
              </div>
            </div>

            {/* Social */}
            <div className="mt-5 flex gap-2">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-8 w-8 place-items-center rounded-[4px] border border-white/[0.1] text-[#94a3b8] transition hover:border-[#1d4ed8] hover:bg-[#1d4ed8] hover:text-white"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>

            <p className="mt-5 text-[11.5px] text-[#334155]">
              {chrome?.servingTagline ?? "Serving homes across India"}
            </p>
          </div>

          {/* Services — CMS global.footer_services_links */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#60a5fa]">
              Services
            </p>
            <ul className="space-y-2.5">
              {servicesLinks.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#94a3b8] transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company — CMS quick links override if provided */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#60a5fa]">
              Company
            </p>
            <ul className="space-y-2.5">
              {companyLinks.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#94a3b8] transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal — CMS support links override if provided */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#60a5fa]">
              Legal
            </p>
            <ul className="space-y-2.5">
              {legalLinks.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#94a3b8] transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#60a5fa]">
              Support
            </p>
            <ul className="space-y-2.5">
              {supportLinks.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#94a3b8] transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Professionals — CMS global.footer_professional_links */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#818cf8]">
              For Professionals
            </p>
            <ul className="space-y-2.5">
              {professionalLinks.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#94a3b8] transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — CMS overrides phone/email/address individually */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#60a5fa]">
              Contact
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#60a5fa]" />
                {contactAddressCms ? (
                  <p className="text-[13px] leading-[1.65] text-[#94a3b8]">{contactAddressCms}</p>
                ) : (
                  <p className="text-[13px] leading-[1.65] text-[#94a3b8]">
                    Near DM Tower, Kailash Nagar,<br />
                    Birgaon, Raipur, CG 490013
                  </p>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Phone size={14} className="shrink-0 text-[#60a5fa]" />
                <a
                  href={`tel:${contactPhone.replace(/\s/g, "")}`}
                  className="text-[13px] text-white transition hover:text-[#94a3b8]"
                >
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={14} className="shrink-0 text-[#60a5fa]" />
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-[13px] text-[#94a3b8] transition hover:text-white"
                >
                  {contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={14} className="mt-0.5 shrink-0 text-[#60a5fa]" />
                <div>
                  {workingHours
                    ? workingHours.map(({ day_label, time_text }, i) => (
                        <p key={i} className={`text-[${i === 0 ? "13" : "12"}px] text-[${i === 0 ? "#94a3b8" : "#475569"}]`}>
                          {day_label}: {time_text}
                        </p>
                      ))
                    : <>
                        <p className="text-[13px] text-[#94a3b8]">Mon – Sat: 8 AM – 8 PM</p>
                        <p className="text-[12px] text-[#475569]">Sun: 9 AM – 6 PM</p>
                      </>
                  }
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-3 py-5 sm:flex-row sm:px-4 lg:px-6">
          <div className="flex flex-col items-center gap-0.5 sm:items-start">
            <p className="text-[12px] text-[#475569]">
              © {new Date().getFullYear()} {companyInfo?.company_name ?? "eFixMate Pvt. Ltd."} All rights reserved.
            </p>
            {(companyInfo?.cin || companyInfo?.gst) && (
              <p className="text-[11px] text-[#334155]">
                {companyInfo.cin && <>CIN: {companyInfo.cin}</>}
                {companyInfo.cin && companyInfo.gst && <>&nbsp;·&nbsp;</>}
                {companyInfo.gst && <>GST: {companyInfo.gst}</>}
              </p>
            )}
            {/* CIN / GSTIN shown only when provided via CMS companyInfo */}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            {bottomLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-[12px] text-[#475569] transition hover:text-[#94a3b8]"
              >
                {label}
              </Link>
            ))}
            <span className="hidden text-[#334155] sm:inline">·</span>
            <span className="text-[12px] text-[#334155]">{chrome?.madeInTagline ?? "Made in India 🇮🇳"}</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
