"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Home,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Users,
  Wrench,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { LandingHeader } from "../../_components/LandingHeader";
import { LandingFooter } from "../../_components/LandingFooter";

const ABOUT_ICON_MAP: Record<string, LucideIcon> = {
  Award, BadgeCheck, Briefcase, Clock, Eye, Heart, MapPin, MessageCircle,
  ShieldCheck, Star, Target, TrendingUp, Users, Zap,
};

/* ─────────────────────────────────────────────────────────────────
   Governance-style design tokens
───────────────────────────────────────────────────────────────── */
const btnPrimary =
  "inline-flex items-center justify-center gap-2 px-[1.375rem] py-[0.6875rem] rounded-[4px] text-[14px] font-semibold bg-[#1d4ed8] text-white border border-[#1d4ed8] transition hover:bg-[#1e40af] hover:border-[#1e40af]";
const btnGhost =
  "inline-flex items-center justify-center gap-2 px-[1.375rem] py-[0.6875rem] rounded-[4px] text-[14px] font-semibold bg-[rgba(241,245,249,0.04)] text-[#cbd5e1] border border-[rgba(241,245,249,0.18)] transition hover:border-[rgba(241,245,249,0.4)] hover:text-[#f1f5f9] hover:bg-[rgba(241,245,249,0.08)]";
const eb      = "block text-[11px] font-bold tracking-[0.1em] uppercase text-[#1d4ed8] mb-2.5";
const ebDark  = "block text-[11px] font-bold tracking-[0.1em] uppercase text-[#60a5fa] mb-2.5";
const h2Class = "text-[clamp(1.375rem,2.5vw,1.875rem)] font-bold tracking-[-0.02em] text-[#0a1628]";
const wrap    = "mx-auto w-[90%] max-w-[1200px]";
const cg      = "grid gap-px bg-[#e2e8f0] border border-[#e2e8f0] rounded-[8px] overflow-hidden";
const TIMELINE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];

/* ─────────────────────────────────────────────────────────────────
   Static copy — home services marketplace
───────────────────────────────────────────────────────────────── */
const STATS: { value: string; label: string }[] = [
  { value: "10,000+", label: "Customers Served"        },
  { value: "500+",    label: "Verified Professionals"  },
  { value: "50+",     label: "Service Categories"      },
  { value: "4.8★",    label: "Customer Rating"         },
];

const COMPARISON: { bad: string; good: string }[] = [
  { bad: "Unverified strangers entering your home",   good: "Every professional is identity & skill verified"  },
  { bad: "Pricing invented after the job starts",     good: "Fixed, upfront quotes — agreed before we begin"   },
  { bad: "No warranty, no recourse if work is poor",  good: "Service guarantee backed by our support team"     },
  { bad: "Missed appointments, no accountability",    good: "Confirmed slots, real-time tracking, reliable ETA" },
  { bad: "Professionals with no path forward",        good: "Career platform — steady work, training, growth"   },
  { bad: "Calls, cash, and WhatsApp messages",        good: "Book, pay, and rate — all in under 60 seconds"    },
];

const TRUST: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: BadgeCheck,    title: "Background Verification", desc: "Every professional is identity-verified and skill-assessed before they go live on the platform."       },
  { Icon: Eye,           title: "Transparent Pricing",     desc: "Fixed upfront quotes — you agree to the price before the first tool comes out."                       },
  { Icon: Clock,         title: "Reliable Scheduling",     desc: "Book a confirmed time slot and track your professional in real time. No more waiting around."         },
  { Icon: ShieldCheck,   title: "Service Guarantee",       desc: "Every job is backed by our post-service warranty. If something isn't right, we fix it."               },
  { Icon: Star,          title: "Rated Professionals",     desc: "Real reviews after every job. Only the best professionals stay and grow on our platform."             },
  { Icon: MessageCircle, title: "24/7 Support",          desc: "Our team is always on — for booking changes, feedback, or anything that needs a human response."      },
];

const PRO_BENEFITS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Briefcase,  title: "Steady Work",          desc: "Access a consistent stream of verified service requests in your city — no more chasing clients."     },
  { Icon: TrendingUp, title: "Better Earnings",       desc: "Transparent pay, performance bonuses, and demand that grows with your reputation on the platform."   },
  { Icon: Star,       title: "A Profile That Works",  desc: "Build a verified reputation backed by real customer reviews and a growing star rating."              },
  { Icon: Award,      title: "Skill Development",     desc: "Access training, certification programmes, and product knowledge that make you more competitive."   },
  { Icon: Users,      title: "A Community",           desc: "Join 500+ professionals who support each other, share knowledge, and grow together."                 },
  { Icon: Target,     title: "Business Ownership",    desc: "We give you the tools, the trust, and the demand to build something that's truly yours."            },
];

const VALUES: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: ShieldCheck, title: "Trust is Built, Not Claimed", desc: "We earn trust through actions — verification, accountability, and radical transparency."             },
  { Icon: Users,       title: "Professionals are Partners",  desc: "Every technician on our platform is a partner we invest in, not a resource we extract from."       },
  { Icon: Zap,         title: "Technology for People",       desc: "We build tools that simplify lives, not platforms that complicate them."                             },
  { Icon: Eye,         title: "Transparency Always",         desc: "From pricing to performance — we believe you deserve to know exactly what you're getting."           },
  { Icon: Award,       title: "Quality Has No Shortcuts",    desc: "We refuse to compromise on the standard of professionals or the standard of service they deliver."  },
  { Icon: Heart,       title: "Every Home Matters",          desc: "Whether it's a studio apartment or a corporate office — every customer deserves the same excellence." },
];

const AHEAD: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: MapPin,      title: "100+ Cities by 2027",       desc: "Taking reliable, verified home services from metro cities to every major urban centre in India."        },
  { Icon: TrendingUp,  title: "1 Million Professionals",   desc: "Empowering a million skilled workers with steady income, career growth, and a platform they own."       },
  { Icon: Target,      title: "India's Service OS",        desc: "Beyond bookings — financing, insurance, skill certification, and tools to power the service economy."   },
];

/* ─────────────────────────────────────────────────────────────────
   Leadership
───────────────────────────────────────────────────────────────── */
const LEADERS = [
  {
    name:     "Aman Sahu",
    role:     "Co-Founder & Chief Executive Officer",
    badge:    "CEO",
    bio:      "Aman leads Efixmate's vision, strategy, and growth. With a strong focus on innovation and customer experience, he is driving the company's mission to transform how people discover and access trusted home services. His leadership is centred on building a scalable platform that creates value for customers, service professionals, and communities alike.",
    photo:    "/asssets/Leaders/Aman.jpeg",
    linkedin: "https://www.linkedin.com/in/aman-k-codes/",
    initials: "AS",
    color:    "#1d4ed8",
  },
  {
    name:     "Radheshyam Sahu",
    role:     "Co-Founder & Chief Operating Officer",
    badge:    "COO",
    bio:      "Radheshyam oversees operations and service delivery across the Efixmate ecosystem. He works closely with service professionals and operational teams to ensure consistent quality, reliability, and customer satisfaction. His commitment to operational excellence helps maintain the trust that customers place in Efixmate every day.",
    photo:    "/asssets/Leaders/Radhe.png",
    linkedin: "https://www.linkedin.com/in/radheshyam-sahu-8b1309346/",
    initials: "RS",
    color:    "#4f46e5",
  },
  {
    name:     "Karan Verma",
    role:     "Co-Founder & Chief Technology & Product Officer",
    badge:    "CTPO",
    bio:      "Karan leads technology, product development, and platform innovation. He is responsible for creating seamless digital experiences that connect customers with trusted service professionals. His focus is on building technology that simplifies service booking, improves transparency, and enhances the overall customer journey.",
    photo:    "/asssets/Leaders/Karan.jpeg",
    linkedin: "https://www.linkedin.com/in/karan-verma-73093b216/",
    initials: "KV",
    color:    "#7c3aed",
  },
] as const;

function LeaderPhoto({
  src, name, initials, color,
}: { src: string; name: string; initials: string; color: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="h-[80px] w-[80px] rounded-full border-2 border-[#e2e8f0] flex items-center justify-center text-white text-[18px] font-bold select-none"
        style={{ background: color }}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={80}
      height={80}
      className="h-[80px] w-[80px] rounded-full object-cover object-top border-2 border-[#e2e8f0]"
      onError={() => setFailed(true)}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
   Props — CMS-overridable fields only
───────────────────────────────────────────────────────────────── */
type CmsIconItem     = { iconName: string; title: string; desc: string };
type CmsStoryItem    = { year: string; tag: string; desc: string };
type CmsLeaderItem   = { name: string; role: string; badge: string; bio: string; photo: string; linkedin: string; initials: string; color: string };
type CmsProblemItem  = { num: string; title: string; desc: string };
type CmsComparisonItem = { bad: string; good: string };

export interface AboutPageViewProps {
  heroHeading?:           string;
  heroDescription?:       string;
  heroCta?:               string;
  mission?:               { heading?: string; body?: string };
  vision?:                { heading?: string; body?: string };
  bottomCta?:             { heading?: string; subtext?: string; btn_text?: string };
  navItems?:              Array<{ label: string; href: string }>;
  // section overrides
  cmsStats?:              Array<{ value: string; label: string }>;
  cmsComparison?:         CmsComparisonItem[];
  trustPillars?:          CmsIconItem[];
  professionalBenefits?:  CmsIconItem[];
  cmsValues?:             CmsIconItem[];
  cmsStory?:              CmsStoryItem[];
  cmsLeadership?:         CmsLeaderItem[];
  futureVision?:          CmsIconItem[];
  problemSection?:        { heading?: string; items?: CmsProblemItem[] };
}

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────── */
export default function AboutPageView({
  heroHeading, heroDescription, heroCta, mission, vision, bottomCta, navItems,
  cmsStats, cmsComparison, trustPillars, professionalBenefits, cmsValues,
  cmsStory, cmsLeadership, futureVision, problemSection,
}: AboutPageViewProps) {
  const resolvedStats      = cmsStats      ?? STATS;
  const resolvedComparison = cmsComparison ?? COMPARISON;
  const resolvedTrust      = trustPillars
    ? trustPillars.map(i => ({ Icon: ABOUT_ICON_MAP[i.iconName] ?? ShieldCheck,  title: i.title, desc: i.desc }))
    : TRUST;
  const resolvedBenefits   = professionalBenefits
    ? professionalBenefits.map(i => ({ Icon: ABOUT_ICON_MAP[i.iconName] ?? Briefcase, title: i.title, desc: i.desc }))
    : PRO_BENEFITS;
  const resolvedValues     = cmsValues
    ? cmsValues.map(i => ({ Icon: ABOUT_ICON_MAP[i.iconName] ?? ShieldCheck,      title: i.title, desc: i.desc }))
    : VALUES;
  const resolvedAhead      = futureVision
    ? futureVision.map(i => ({ Icon: ABOUT_ICON_MAP[i.iconName] ?? Target,         title: i.title, desc: i.desc }))
    : AHEAD;
  const resolvedStory      = cmsStory ?? [
    { year: "2022",  tag: "Founded",                 desc: "eFixMate is born from a shared frustration with how broken home services were for both customers and professionals alike." },
    { year: "2023",  tag: "First Bookings",          desc: "We onboard our first 500 verified professionals and serve our first 1,000 customers. The feedback is clear: this is what the market needed." },
    { year: "2024",  tag: "Scaling Fast",            desc: "10,000+ customers served. 500+ verified professionals. Expanding city by city with a playbook that makes trust repeatable." },
    { year: "2025+", tag: "Building Infrastructure", desc: "Going beyond bookings — career tools for professionals, smarter matching, and the foundation for India's services economy." },
  ];
  const resolvedLeaders    = cmsLeadership ? [...cmsLeadership] : [...LEADERS];
  const resolvedProblemItems = problemSection?.items ?? [
    { num: "01", title: "Who Can You Trust?",     desc: "There was no way to verify if the person entering your home was qualified, legitimate, or even safe. Trust came down to hope." },
    { num: "02", title: "What Will It Cost?",     desc: "Quotes that arrived after the work started. Prices that doubled by the time the job was done. No transparency, no predictability." },
    { num: "03", title: "What If It Goes Wrong?", desc: "No warranty. No accountability. No one to call. Just frustration, poor work, and the same search starting over again." },
  ];
  const resolvedProblemHeading = problemSection?.heading ?? "Home services were broken.\nAnd everyone knew it.";

  return (
    <main
      className="min-h-screen bg-[#f8fafc] text-[#0a1628]"
      style={{ fontFamily: "-apple-system,'Inter','Segoe UI',system-ui,sans-serif" }}
    >
      <LandingHeader activePath="/about" navItems={navItems} />

      {/* ══════════════════════════════════════════════════════════
          1 · HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0a1628] py-16 lg:py-24">
        <div className={wrap}>
          <span className={ebDark}>About eFixMate</span>
          <h1 className="mt-1 text-[#f1f5f9] text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] leading-[1.12] max-w-[720px]">
            {heroHeading ?? "We Didn't Fix the Service.\nWe Fixed the System."}
          </h1>
          <p className="mt-5 text-[#94a3b8] text-[1.0625rem] leading-[1.75] max-w-[580px]">
            {heroDescription ??
              "eFixMate is a technology platform connecting customers with background-verified service professionals — transparently priced, reliably scheduled, and fully accountable."}
          </p>
          <p className="mt-3 text-[#475569] text-[12px] font-bold tracking-[0.06em] uppercase">
            Building India&apos;s Most Trusted Services Marketplace — Homes, Offices &amp; Workplaces
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#services" className={btnPrimary}>
              {heroCta ?? "Book a Service"} <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className={btnGhost}>
              Join as a Professional
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2 · THE PROBLEM
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f8fafc]">
        <div className={wrap}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className={eb}>The Problem</span>
              <h2 className={`${h2Class} mb-5`}>
                {resolvedProblemHeading.split("\n").map((line, i) => (
                  <span key={i}>{line}{i < resolvedProblemHeading.split("\n").length - 1 && <br />}</span>
                ))}
              </h2>
              <div className="space-y-4 text-[15px] leading-[1.8] text-[#475569]">
                <p>
                  You need an electrician. You don&apos;t know who to call. You ask a neighbour,
                  get a number, and hope for the best. A stranger shows up at your door — unverified,
                  unaccountable, and charging whatever they decide.
                </p>
                <p>
                  For decades, India&apos;s home services industry ran entirely on word of mouth,
                  guesswork, and luck. Millions of customers had no reliable way to find a trustworthy
                  professional. Millions of skilled workers had no reliable way to build a stable career.
                </p>
                <p className="font-semibold text-[#0a1628]">
                  Both sides deserved better. We built eFixMate to give it to them.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {resolvedProblemItems.map(({ num, title, desc }) => (
                <div key={num} className="bg-white border border-[#e2e8f0] rounded-[8px] p-6 flex gap-4">
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase font-mono text-[#1d4ed8] shrink-0 mt-0.5">
                    {num}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#0a1628] mb-1">{title}</h3>
                    <p className="text-[13.5px] leading-[1.65] text-[#475569]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3 · WHY WE EXIST
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f1f5f9]">
        <div className={wrap}>
          <div className="max-w-[600px] mb-12">
            <span className={eb}>Our Story</span>
            <h2 className={h2Class}>
              We built eFixMate because the industry never built trust.
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-4 text-[15px] leading-[1.8] text-[#475569]">
              <p>
                The home services industry in India is one of the largest unorganised sectors in the country.
                Hundreds of millions of households. Tens of millions of skilled workers. And almost no
                infrastructure connecting them reliably, safely, or fairly.
              </p>
              <p>
                eFixMate was founded on a simple conviction: that technology could do what the old system
                never did. That verification, transparency, and accountability weren&apos;t premium features —
                they were baseline expectations that every customer and every professional deserved.
              </p>
              <p>
                We didn&apos;t build a service company. We built a marketplace that makes the entire
                ecosystem work better — for the person booking a service, and for the professional
                whose livelihood depends on doing great work.
              </p>
            </div>
            <div className={`${cg} grid-cols-1`}>
              {resolvedStory.map(({ year, tag, desc }, idx) => (
                <div key={year} className="bg-white p-5 flex gap-4 items-start relative">
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 bottom-0 w-[2px]"
                    style={{ background: TIMELINE_COLORS[idx] }}
                  />
                  <div className="pl-4">
                    <span className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#94a3b8] mb-1">{year} · {tag}</span>
                    <p className="text-[13.5px] leading-[1.65] text-[#475569]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4 · MISSION & VISION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f8fafc]">
        <div className={wrap}>
          <div className="max-w-[600px] mb-12">
            <span className={eb}>Mission & Vision</span>
            <h2 className={h2Class}>Guided by purpose. Built for scale.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white border border-[#e2e8f0] rounded-[8px] p-8">
              <span className={eb}>{mission?.heading ?? "Our Mission"}</span>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[#0a1628] mb-3">
                Make trusted services accessible to every household.
              </h3>
              <p className="text-[14px] leading-[1.75] text-[#475569]">
                {mission?.body ??
                  "To build a technology marketplace that makes verified, fairly priced, and accountable home services accessible to every customer in India — while creating sustainable livelihoods for the professionals who deliver them."}
              </p>
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-[8px] p-8">
              <span className={eb}>{vision?.heading ?? "Our Vision"}</span>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[#0a1628] mb-3">
                Become India&apos;s most trusted services infrastructure.
              </h3>
              <p className="text-[14px] leading-[1.75] text-[#475569]">
                {vision?.body ??
                  "A future where every skilled professional has the platform to build a thriving career, and every home, office, and workplace has instant access to the quality services it deserves — with the trust that was always missing."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5 · THE CHANGE WE'RE CREATING
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f1f5f9]">
        <div className={wrap}>
          <div className="max-w-[600px] mb-12">
            <span className={eb}>The eFixMate Difference</span>
            <h2 className={h2Class}>Traditional home services weren&apos;t built for you.</h2>
          </div>
          <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="bg-[#f1f5f9] px-6 py-4 border-b border-r border-[#e2e8f0]">
                <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#94a3b8]">
                  Traditional Home Services
                </p>
              </div>
              <div className="bg-[#eff6ff] px-6 py-4 border-b border-[#e2e8f0]">
                <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#1d4ed8]">
                  The eFixMate Experience
                </p>
              </div>
            </div>
            {resolvedComparison.map(({ bad, good }, i) => (
              <div key={i} className={`grid grid-cols-2 ${i < resolvedComparison.length - 1 ? "border-b border-[#e2e8f0]" : ""}`}>
                <div className="bg-white px-6 py-4 border-r border-[#e2e8f0] flex items-start gap-3">
                  <XCircle size={14} className="text-[#dc2626] shrink-0 mt-0.5" />
                  <p className="text-[13.5px] text-[#64748b] leading-snug">{bad}</p>
                </div>
                <div className="bg-white px-6 py-4 flex items-start gap-3">
                  <CheckCircle size={14} className="text-[#16a34a] shrink-0 mt-0.5" />
                  <p className="text-[13.5px] font-medium text-[#0a1628] leading-snug">{good}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6 · IMPACT AT SCALE — dark metric band
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0a1628]">
        <div className={wrap}>
          <div className="py-5 border-b border-[rgba(255,255,255,0.07)]">
            <p className="text-[#475569] text-[13px]">
              The numbers don&apos;t tell the whole story — but they&apos;re a start.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {resolvedStats.map(({ value, label }, i) => (
              <div
                key={label}
                className={`py-10 px-4 text-center ${i < STATS.length - 1 ? "border-r border-[rgba(255,255,255,0.07)]" : ""}`}
              >
                <strong className="block text-[2.375rem] font-bold tracking-[-0.03em] text-[#f1f5f9] leading-none">
                  {value}
                </strong>
                <span className="block mt-2 text-[12px] text-[#475569] tracking-[0.03em]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7 · EMPOWERING SERVICE PROFESSIONALS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f8fafc]">
        <div className={wrap}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className={eb}>For Professionals</span>
              <h2 className={`${h2Class} mb-5`}>
                The platform that works as hard as you do.
              </h2>
              <div className="space-y-4 text-[15px] leading-[1.8] text-[#475569]">
                <p>
                  India&apos;s service professionals are the backbone of home and office life across the country.
                  Electricians, plumbers, AC technicians, carpenters — they&apos;re some of the most skilled workers
                  in the economy. And they&apos;ve been underserved for too long.
                </p>
                <p>
                  eFixMate isn&apos;t just a platform for customers. It&apos;s a career platform for the professionals
                  who power it. We give them the technology, the trust, and the demand to build
                  something that is genuinely theirs.
                </p>
                <p className="font-semibold text-[#0a1628]">
                  On eFixMate, professionals aren&apos;t workers. They&apos;re entrepreneurs.
                </p>
              </div>
              <div className="mt-8">
                <Link href="/contact" className={btnPrimary}>
                  Join as a Professional <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className={`${cg} grid-cols-1`}>
              {resolvedBenefits.map(({ Icon, title, desc }) => (
                <div key={title} className="bg-white p-6 flex gap-4 items-start">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-[#eff6ff] text-[#1d4ed8]">
                    <Icon size={17} strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0a1628] mb-0.5">{title}</h3>
                    <p className="text-[13px] leading-[1.65] text-[#475569]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8 · BUILT ON TRUST
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f1f5f9]">
        <div className={wrap}>
          <div className="max-w-[600px] mb-12">
            <span className={eb}>Built on Trust</span>
            <h2 className={h2Class}>
              We earned your trust the hard way — one booking at a time.
            </h2>
          </div>
          <div className={`${cg} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
            {resolvedTrust.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white p-7 flex flex-col gap-3">
                <span className="text-[#1d4ed8]">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0a1628]">{title}</h3>
                <p className="text-[13.5px] leading-[1.65] text-[#475569] flex-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9 · LEADERSHIP
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f8fafc]">
        <div className={wrap}>
          <div className="max-w-[600px] mb-4">
            <span className={eb}>Our Leadership</span>
            <h2 className={h2Class}>Meet the people building eFixMate.</h2>
          </div>
          <p className="text-[15px] text-[#475569] leading-[1.75] max-w-[700px] mb-12">
            Behind eFixMate is a team united by a shared conviction: that trusted services should
            be accessible, reliable, and effortless — for every home, office, and workplace in India.
            Together, they bring expertise across technology, operations, product, and growth.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resolvedLeaders.map(({ name, role, badge, bio, photo, linkedin, initials, color }) => (
              <div key={name} className="bg-white border border-[#e2e8f0] rounded-[8px] p-7 flex flex-col">
                {/* Photo */}
                <div className="mb-4">
                  <LeaderPhoto src={photo} name={name} initials={initials} color={color} />
                </div>

                {/* Badge */}
                <span
                  className="self-start mb-2 inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold tracking-[0.08em] uppercase border"
                  style={{
                    color,
                    background: `${color}12`,
                    borderColor: `${color}28`,
                  }}
                >
                  {badge}
                </span>

                {/* Name + role */}
                <h3 className="text-[16px] font-bold tracking-[-0.01em] text-[#0a1628] leading-snug">
                  {name}
                </h3>
                <p className="mt-0.5 text-[12.5px] font-medium text-[#64748b] leading-snug mb-3">
                  {role}
                </p>

                {/* Bio */}
                <p className="text-[13px] leading-[1.7] text-[#475569] flex-1">{bio}</p>

                {/* LinkedIn */}
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1d4ed8] hover:underline"
                  >
                    LinkedIn <ArrowUpRight size={12} strokeWidth={2.5} />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Closing statement */}
          <div className="mt-8 bg-white border border-[#e2e8f0] rounded-[8px] px-8 py-6">
            <p className="text-[14px] leading-[1.8] text-[#475569] max-w-[800px]">
              At eFixMate, leadership goes beyond titles. Our team is committed to creating a future
              where finding trusted services — for homes, offices, workplaces, or annual maintenance — is simple, transparent, and dependable. Every decision
              we make is guided by our mission to improve everyday life through technology, trust, and
              exceptional service experiences.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          10 · OUR VALUES
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f1f5f9]">
        <div className={wrap}>
          <div className="max-w-[600px] mb-12">
            <span className={eb}>Our Values</span>
            <h2 className={h2Class}>Six beliefs that guide every decision we make.</h2>
          </div>
          <div className={`${cg} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
            {resolvedValues.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white p-7 flex flex-col gap-2.5">
                <span className="text-[#1d4ed8] mb-1">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0a1628]">{title}</h3>
                <p className="text-[13.5px] leading-[1.65] text-[#475569] flex-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          11 · LOOKING AHEAD
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f8fafc]">
        <div className={wrap}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className={eb}>Looking Ahead</span>
              <h2 className={`${h2Class} mb-5`}>
                We&apos;re building something that will last decades.
              </h2>
              <div className="space-y-4 text-[15px] leading-[1.8] text-[#475569]">
                <p>
                  Booking a service was never the destination. It was the beginning.
                </p>
                <p>
                  Over the next decade, eFixMate&apos;s ambition is to become the operating system for
                  India&apos;s home services economy. Not just a marketplace — but the infrastructure that
                  powers how millions of households access services, and how millions of professionals
                  build their livelihoods.
                </p>
                <p>
                  We want to create a world where trust is the default — not the exception. Where a skilled
                  worker from any city in India can build a thriving business. Where a household never has
                  to settle for poor service because there was no better option.
                </p>
                <p className="font-semibold text-[#0a1628]">
                  That world is what eFixMate is building. And we&apos;re just getting started.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {resolvedAhead.map(({ Icon, title, desc }) => (
                <div key={title} className="bg-white border border-[#e2e8f0] rounded-[8px] p-6 flex gap-5 items-start">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-[#eff6ff] text-[#1d4ed8]">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#0a1628] mb-1">{title}</h3>
                    <p className="text-[13.5px] leading-[1.65] text-[#475569]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          12 · FINAL CTA — dual (customers + professionals)
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0a1628] py-16">
        <div className={wrap}>
          <div className="text-center mb-10">
            <h2 className="text-[clamp(1.5rem,3vw,2.125rem)] font-bold tracking-[-0.02em] text-[#f1f5f9] mb-3">
              {bottomCta?.heading ?? "Join the Platform That's Changing Home Services."}
            </h2>
            <p className="text-[15px] text-[#64748b] leading-[1.75] max-w-lg mx-auto">
              {bottomCta?.subtext ??
                "Whether you need a service done right or you're a professional ready to grow — eFixMate is built for you."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[680px] mx-auto">
            {/* Customer CTA */}
            <div className="bg-white rounded-[8px] p-7 flex flex-col gap-3">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#64748b]">For Customers</span>
              <h3 className="text-[17px] font-bold text-[#0a1628] leading-snug">
                Book a verified professional today.
              </h3>
              <p className="text-[13px] text-[#475569] leading-snug flex-1">
                Trusted professionals, upfront pricing, service guarantee.
              </p>
              <Link href="/#services" className={`${btnPrimary} mt-2 w-full`}>
                {bottomCta?.btn_text ?? "Book a Service"} <ArrowRight size={16} />
              </Link>
            </div>

            {/* Professional CTA */}
            <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-7 flex flex-col gap-3">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#60a5fa]">For Professionals</span>
              <h3 className="text-[17px] font-bold text-[#f1f5f9] leading-snug">
                Grow your career with eFixMate.
              </h3>
              <p className="text-[13px] text-[#64748b] leading-snug flex-1">
                Steady work, better earnings, and a platform that invests in you.
              </p>
              <Link href="/contact" className={`${btnGhost} mt-2 w-full`}>
                Join as a Professional <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
