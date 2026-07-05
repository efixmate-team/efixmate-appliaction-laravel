"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Mail, MapPin, Phone, ShieldCheck, Wrench } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { DEFAULT_PHONE, DEFAULT_EMAIL, DEFAULT_ADDRESS } from "@/lib/siteDefaults";

const DEFAULTS = {
  phone:   DEFAULT_PHONE,
  email:   DEFAULT_EMAIL,
  address: DEFAULT_ADDRESS,
};

const partnerLinks = [
  { label: "Partner Home", href: "/technician" },
  { label: "Partner Login", href: "/technician/login" },
  { label: "Start Registration", href: "/technician/login" },
  { label: "My Profile", href: "/technician/register" },
];

const supportLinks = [
  { label: "Contact Support", href: "/contact-us" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Service Partner Agreement", href: "/service-partner-agreement" },
];

const highlights = [
  { label: "Verified onboarding", icon: ShieldCheck },
  { label: "Skill-based jobs", icon: Wrench },
  { label: "Partner workspace", icon: BriefcaseBusiness },
];

export function TechnicianFooter() {
  const currentYear = new Date().getFullYear();
  const [contact, setContact] = useState(DEFAULTS);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    fetch(`${apiBase}/public/cms/globals`)
      .then((r) => r.json())
      .then((json) => {
        const sections: Array<{ section_key: string; content: unknown }> =
          json?.data?.sections ?? [];
        const ci = sections.find((s) => s.section_key === "global.contact_info")
          ?.content as Record<string, string> | undefined;
        if (ci)
          setContact({
            phone:   ci.phone   || DEFAULTS.phone,
            email:   ci.email   || DEFAULTS.email,
            address: ci.address || DEFAULTS.address,
          });
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-[#d1fae5] bg-white text-[#334155]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href="/technician" className="inline-flex items-center gap-2">
              <BrandLogo width={32} height={32} className="h-8 w-8" />
              <span className="text-lg font-semibold  text-[#14532d]">eFixMate Partners</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#64748b]">
              A single workspace for technician onboarding, job requests, service updates, and partner support.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {highlights.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[11px] font-bold text-[#15803d]"
                >
                  <Icon size={13} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16a34a]">Technician</h3>
            <ul className="mt-4 space-y-2.5">
              {partnerLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm font-semibold text-[#475569] transition hover:text-[#16a34a]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16a34a]">Support</h3>
            <ul className="mt-4 space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm font-semibold text-[#475569] transition hover:text-[#16a34a]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16a34a]">Get In Touch</h3>
            <ul className="mt-4 space-y-3.5">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />
                <span className="text-sm leading-6 text-[#64748b]">{contact.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-[#16a34a]" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-sm font-semibold text-[#475569] hover:text-[#16a34a]">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-[#16a34a]" />
                <a href={`mailto:${contact.email}`} className="text-sm font-semibold text-[#475569] hover:text-[#16a34a]">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#e2e8f0] pt-5 text-center sm:flex-row sm:text-left">
          <p className="text-xs font-medium text-[#94a3b8]">
            &copy; {currentYear} eFixMate. Technician partner portal.
          </p>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#16a34a]">
            Secure OTP access
          </p>
        </div>
      </div>
    </footer>
  );
}
