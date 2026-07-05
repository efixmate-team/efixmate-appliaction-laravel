"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Clock,
  FileText,
  Headphones,
  IndianRupee,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { LandingHeader } from "./LandingHeader";
import { LandingFooter } from "./LandingFooter";
import { useLandingChrome } from "./LandingChromeProvider";
import { DEFAULT_PHONE } from "@/lib/siteDefaults";

// ── Icon map ────────────────────────────────────────────────────────────────────

const PARTNER_ICON_MAP: Record<string, LucideIcon> = {
  BadgeCheck, Banknote, BookOpen, CalendarCheck, Clock, FileText,
  Headphones, IndianRupee, MapPin, Phone, ShieldCheck, Smartphone,
  Star, TrendingUp, Users, Wrench, Zap,
};

// ── CMS-facing types ────────────────────────────────────────────────────────────

export interface PartnerBenefitItem  { iconName: string; color: string; bg: string; title: string; desc: string }
export interface PartnerStepItem     { num: string; title: string; desc: string }
export interface PartnerDocumentItem { iconName: string; text: string }
export interface PartnerTrainingItem { iconName: string; title: string; desc: string }
export interface PartnerSupportItem  { iconName: string; title: string; detail: string }
export interface PartnerHeroStat     { iconName: string; value: string; label: string }

export interface BecomeAPartnerViewProps {
  heroBadge?:        string;
  heroHeading?:      string;
  heroSubtext?:      string;
  heroCtaPrimary?:   string;
  heroCtaSecondary?: string;
  heroStats?:        PartnerHeroStat[];
  benefits?:         PartnerBenefitItem[];
  steps?:            PartnerStepItem[];
  documents?:        PartnerDocumentItem[];
  training?:         PartnerTrainingItem[];
  support?:          PartnerSupportItem[];
  ctaHeading?:       string;
  ctaSubtext?:       string;
}

// ── Earnings Calculator ────────────────────────────────────────────────────────

const JOB_VALUES = [
  { label: "₹300 (small repair)", value: 300 },
  { label: "₹500 (standard service)", value: 500 },
  { label: "₹700 (complex job)", value: 700 },
  { label: "₹1,000 (premium / AC service)", value: 1000 },
];

function EarningsCalculator() {
  const [jobsPerDay, setJobsPerDay] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [avgJobValue, setAvgJobValue] = useState(500);

  const monthly = Math.round(jobsPerDay * daysPerWeek * avgJobValue * 4.3);
  const annual  = monthly * 12;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a1628]/70 p-6 sm:p-8">
      <h3 className="mb-6 text-[17px] font-bold text-white">
        Earnings Potential Calculator
      </h3>

      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[13px] text-[#94a3b8]">Jobs per day</label>
            <span className="text-[15px] font-bold text-[#60a5fa]">{jobsPerDay}</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            value={jobsPerDay}
            onChange={(e) => setJobsPerDay(Number(e.target.value))}
            className="w-full accent-[#1d4ed8]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-[#475569]">
            <span>1</span><span>8</span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[13px] text-[#94a3b8]">Days per week</label>
            <span className="text-[15px] font-bold text-[#60a5fa]">{daysPerWeek}</span>
          </div>
          <input
            type="range"
            min={1}
            max={7}
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            className="w-full accent-[#1d4ed8]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-[#475569]">
            <span>1</span><span>7</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] text-[#94a3b8]">
            Average job value
          </label>
          <select
            value={avgJobValue}
            onChange={(e) => setAvgJobValue(Number(e.target.value))}
            className="w-full rounded-lg border border-white/[0.1] bg-[#0d1b2e] px-3 py-2.5 text-[13px] text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
          >
            {JOB_VALUES.map((jv) => (
              <option key={jv.value} value={jv.value}>
                {jv.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#1d4ed8]/10 p-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#60a5fa]">
            Monthly
          </p>
          <p className="mt-1 text-[26px] font-black text-white">
            ₹{monthly.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl bg-[#10b981]/10 p-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#34d399]">
            Annual
          </p>
          <p className="mt-1 text-[26px] font-black text-white">
            ₹{annual.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-[11.5px] text-[#334155]">
        Estimated based on completed jobs. Actual earnings may vary.
      </p>
    </div>
  );
}

// ── Default content ────────────────────────────────────────────────────────────

const DEFAULT_HERO_STATS: PartnerHeroStat[] = [
  { iconName: "Users",       value: "5,000+",    label: "Active Partners" },
  { iconName: "IndianRupee", value: "₹30,000+",  label: "Avg Monthly Earning" },
  { iconName: "MapPin",      value: "10+ Cities", label: "Across India" },
];

const DEFAULT_BENEFITS: PartnerBenefitItem[] = [
  { iconName: "IndianRupee", color: "#10b981", bg: "#052e16", title: "Earn on Your Terms",   desc: "Set your own availability. Accept bookings that fit your schedule — no fixed shifts, no minimum commitment." },
  { iconName: "Zap",         color: "#f59e0b", bg: "#1c1100", title: "Steady Booking Flow", desc: "eFixMate sends verified customers directly to you. No cold calling, no door-to-door, no waiting for referrals." },
  { iconName: "Banknote",    color: "#60a5fa", bg: "#0c1f3f", title: "Weekly Payouts",      desc: "Earnings from completed bookings are settled weekly to your registered bank account — no delays, no deductions." },
  { iconName: "BookOpen",    color: "#a78bfa", bg: "#1a0f3f", title: "Free Skill Training", desc: "Access in-person and digital training to sharpen your trade skills, improve ratings, and unlock higher-value jobs." },
  { iconName: "ShieldCheck", color: "#f43f5e", bg: "#1f0714", title: "Backed by eFixMate", desc: "Your identity and work are covered under our platform guarantee. We handle disputes, customer issues, and support." },
  { iconName: "TrendingUp",  color: "#fb923c", bg: "#1f0d00", title: "Grow Your Career",   desc: "Top-rated partners unlock premium categories, priority booking slots, and higher earning potential over time." },
];

const DEFAULT_STEPS: PartnerStepItem[] = [
  { num: "01", title: "Apply Online",     desc: "Fill in the partner registration form with your basic details, service category, and preferred work area. Takes under 5 minutes." },
  { num: "02", title: "Submit Documents", desc: "Upload your ID proof, police verification certificate, and trade certificate through the app or partner portal." },
  { num: "03", title: "Skill Assessment", desc: "Complete a short in-person or remote skill test in your trade category. Our assessors evaluate practical competence." },
  { num: "04", title: "Get Activated",    desc: "Once verified, your account is activated. You immediately start receiving bookings in your service area." },
];

const DEFAULT_DOCUMENTS: PartnerDocumentItem[] = [
  { iconName: "BadgeCheck",  text: "Government Photo ID — Aadhaar, PAN, or Driving Licence" },
  { iconName: "ShieldCheck", text: "Police Verification Certificate or Character Certificate (not older than 12 months)" },
  { iconName: "FileText",    text: "Trade Certificate — ITI, NCVT, or equivalent (or 2+ years of documented experience)" },
  { iconName: "MapPin",      text: "Current Address Proof matching your declared service area" },
  { iconName: "Banknote",    text: "Active Bank Account details for weekly payout settlement" },
  { iconName: "Smartphone",  text: "Smartphone (Android or iOS) for the eFixMate Partner App" },
];

const DEFAULT_TRAINING: PartnerTrainingItem[] = [
  { iconName: "BookOpen",     title: "Onboarding Orientation",   desc: "A 2-hour session covering the eFixMate platform, booking lifecycle, app usage, and quality standards." },
  { iconName: "ShieldCheck",  title: "Safety & Code of Conduct", desc: "Training on customer safety protocols, professional behaviour at service locations, and emergency procedures." },
  { iconName: "Wrench",       title: "Trade Skill Verification", desc: "Practical assessment by a certified evaluator in your primary service category. Free remedial training if needed." },
  { iconName: "Star",         title: "Quality Benchmarking",     desc: "Introduction to eFixMate's rating system and how customer feedback impacts booking priority and earnings." },
  { iconName: "CalendarCheck",title: "Annual Re-Verification",   desc: "Police verification and skill certifications are re-checked annually to maintain platform standards." },
];

const DEFAULT_SUPPORT: PartnerSupportItem[] = [
  { iconName: "Phone",      title: "Partner Helpline",    detail: `${DEFAULT_PHONE} · Mon–Sat, 8 AM – 8 PM` },
  { iconName: "Headphones", title: "In-App Chat Support", detail: "Raise issues or queries directly from the partner app." },
  { iconName: "Users",      title: "Partner Community",   detail: "Access our WhatsApp partner group for tips, updates, and peer support." },
  { iconName: "Clock",      title: "Response Time",       detail: "Partner support tickets are resolved within 4 business hours." },
];

// ── Main view ──────────────────────────────────────────────────────────────────

export function BecomeAPartnerView({
  heroBadge        = "Service Partner Programme",
  heroHeading,
  heroSubtext,
  heroCtaPrimary   = "Apply Now",
  heroCtaSecondary = "How It Works",
  heroStats,
  benefits,
  steps,
  documents,
  training,
  support,
  ctaHeading,
  ctaSubtext,
}: BecomeAPartnerViewProps = {}) {
  const chrome = useLandingChrome();
  const contactPhone = chrome?.contactPhone ?? DEFAULT_PHONE;

  const fallbackSupport = DEFAULT_SUPPORT.map(s =>
    s.iconName === "Phone"
      ? { ...s, detail: `${contactPhone} · Mon–Sat, 8 AM – 8 PM` }
      : s,
  );

  const resolvedHeroStats = (heroStats   ?? DEFAULT_HERO_STATS).map(s => ({ Icon: (PARTNER_ICON_MAP[s.iconName] ?? Users)   as LucideIcon, ...s }));
  const resolvedBenefits  = (benefits    ?? DEFAULT_BENEFITS).map(b =>  ({ Icon: (PARTNER_ICON_MAP[b.iconName] ?? Zap)      as LucideIcon, ...b }));
  const resolvedSteps     = steps        ?? DEFAULT_STEPS;
  const resolvedDocuments = (documents   ?? DEFAULT_DOCUMENTS).map(d => ({ Icon: (PARTNER_ICON_MAP[d.iconName] ?? FileText) as LucideIcon, ...d }));
  const resolvedTraining  = (training    ?? DEFAULT_TRAINING).map(t =>  ({ Icon: (PARTNER_ICON_MAP[t.iconName] ?? BookOpen) as LucideIcon, ...t }));
  const resolvedSupport   = (support     ?? fallbackSupport).map(s =>   ({ Icon: (PARTNER_ICON_MAP[s.iconName] ?? Phone)    as LucideIcon, ...s }));

  return (
    <div className="min-h-screen bg-[#060e1f]">
      <LandingHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="bg-[#0a1628]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(29,78,216,0.16) 0%, transparent 70%)",
        }}
      >
        <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#60a5fa]">
                {heroBadge}
              </p>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                {heroHeading ?? (
                  <>
                    Turn Your Skills Into a{" "}
                    <span className="text-[#60a5fa]">Steady Income</span>
                  </>
                )}
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#64748b]">
                {heroSubtext ?? "Join thousands of verified technicians on eFixMate. Earn weekly, work flexibly, and grow your career with India's trusted home services platform."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-[6px] bg-[#1d4ed8] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#1e40af]"
                >
                  {heroCtaPrimary} <ChevronRight size={16} />
                </Link>
                <a
                  href="#process"
                  className="inline-flex items-center gap-2 rounded-[6px] border border-white/[0.15] px-6 py-3 text-[14px] font-semibold text-[#cbd5e1] transition hover:border-white/30 hover:text-white"
                >
                  {heroCtaSecondary}
                </a>
              </div>
              {/* Stats */}
              <div className="mt-10 flex flex-wrap gap-8">
                {resolvedHeroStats.map(({ Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon size={16} className="shrink-0 text-[#60a5fa]" />
                    <div>
                      <p className="text-[15px] font-bold text-white">{value}</p>
                      <p className="text-[11.5px] text-[#475569]">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculator */}
            <div>
              <EarningsCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#60a5fa]">
            Why Join
          </p>
          <h2 className="text-[28px] font-black text-white sm:text-3xl">
            Benefits of Joining eFixMate
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedBenefits.map(({ Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.07] bg-[#0a1628]/60 p-5 transition hover:border-white/[0.14]"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <p className="mb-1.5 font-semibold text-white">{title}</p>
              <p className="text-[13px] leading-relaxed text-[#64748b]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Registration Process ──────────────────────────────────────────── */}
      <section
        id="process"
        className="border-t border-white/[0.06] bg-[#0a1628]/40"
      >
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#60a5fa]">
              Get Started
            </p>
            <h2 className="text-[28px] font-black text-white sm:text-3xl">
              Registration Process
            </h2>
          </div>
          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {resolvedSteps.map(({ num, title, desc }, i) => (
              <div key={num} className="relative">
                {i < resolvedSteps.length - 1 && (
                  <span
                    className="absolute left-[52px] top-5 hidden h-px w-[calc(100%-28px)] bg-white/[0.07] lg:block"
                    aria-hidden
                  />
                )}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#1d4ed8]/20 text-[13px] font-black text-[#60a5fa] ring-1 ring-[#1d4ed8]/40">
                  {num}
                </div>
                <p className="mb-1.5 font-semibold text-white">{title}</p>
                <p className="text-[13px] leading-relaxed text-[#64748b]">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#1d4ed8] px-7 py-3 text-[14px] font-semibold text-white transition hover:bg-[#1e40af]"
            >
              Start Your Application <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Required Documents ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#60a5fa]">
              Documentation
            </p>
            <h2 className="mb-4 text-[28px] font-black text-white sm:text-3xl">
              Required Documents
            </h2>
            <p className="mb-8 text-[14px] leading-relaxed text-[#64748b]">
              Have these ready before starting your application. All documents are
              reviewed by our compliance team within 48–72 hours and are stored
              securely in compliance with the DPDP Act 2023.
            </p>
            <ul className="space-y-4">
              {resolvedDocuments.map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon size={16} className="mt-0.5 shrink-0 text-[#60a5fa]" />
                  <span className="text-[13.5px] leading-snug text-[#94a3b8]">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Training & Verification */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#818cf8]">
              Verification
            </p>
            <h2 className="mb-4 text-[28px] font-black text-white sm:text-3xl">
              Training & Verification
            </h2>
            <p className="mb-8 text-[14px] leading-relaxed text-[#64748b]">
              All training is free of charge. eFixMate invests in your skills
              because better technicians mean better ratings, more bookings, and
              higher earnings for you.
            </p>
            <div className="space-y-5">
              {resolvedTraining.map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a1f3f]">
                    <Icon size={16} className="text-[#818cf8]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[#64748b]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner Support ───────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-[#0a1628]/40">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#60a5fa]">
              We&apos;ve Got Your Back
            </p>
            <h2 className="text-[28px] font-black text-white sm:text-3xl">
              Partner Support
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14px] text-[#64748b]">
              You are never alone on the platform. Our dedicated partner support
              team is available to help with bookings, payments, disputes, and
              anything else you need.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {resolvedSupport.map(({ Icon, title, detail }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.07] bg-[#060e1f] p-5"
              >
                <Icon size={20} className="mb-3 text-[#60a5fa]" />
                <p className="mb-1 text-[14px] font-semibold text-white">{title}</p>
                <p className="text-[13px] leading-relaxed text-[#64748b]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section
        className="border-t border-white/[0.06] bg-[#0a1628]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(29,78,216,0.10) 0%, transparent 70%)",
        }}
      >
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            {ctaHeading ?? "Ready to Start Earning?"}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[#64748b]">
            {ctaSubtext ?? "Join eFixMate today — no joining fee, no hidden charges. Just bring your skills and we'll handle the rest."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#1d4ed8] px-7 py-3.5 text-[14px] font-semibold text-white transition hover:bg-[#1e40af]"
            >
              Apply Now — It&apos;s Free <ChevronRight size={16} />
            </Link>
            <Link
              href="/safety-and-verification"
              className="inline-flex items-center gap-2 rounded-[6px] border border-white/[0.15] px-7 py-3.5 text-[14px] font-semibold text-[#cbd5e1] transition hover:border-white/30 hover:text-white"
            >
              Verification Process
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
