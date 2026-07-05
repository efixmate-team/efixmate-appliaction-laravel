import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Headphones,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const HERO_IMAGE = "/asssets/landing/home/hero/B-Technician.webp";

const benefits = [
  {
    title: "Earn more with steady jobs",
    text: "Get matched with nearby electrical, appliance, AC, plumbing, and home service requests.",
    icon: CircleDollarSign,
  },
  {
    title: "Flexible work schedule",
    text: "Choose your availability and accept jobs that fit your time, route, and service area.",
    icon: Clock3,
  },
  {
    title: "Fast digital payouts",
    text: "Track job earnings, incentives, and settlement updates from your technician dashboard.",
    icon: TrendingUp,
  },
  {
    title: "Support from eFixMate",
    text: "Get operational support for customer issues, booking updates, and service escalations.",
    icon: Headphones,
  },
];

const steps = [
  "Login with your mobile number",
  "Complete basic profile and address",
  "Add skills, KYC documents, selfie, and bank details",
  "Submit for approval and start receiving jobs",
];

const requirements = [
  "Valid mobile number",
  "Government ID or required KYC documents",
  "Service skill details",
  "Current service location",
  "Bank account or payout details",
];

const services = [
  "Electrical repair",
  "Fan installation",
  "Light fitting",
  "AC service",
  "Appliance repair",
  "Plumbing",
  "Cleaning",
  "General maintenance",
];

export default function TechnicianJoinPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo width={38} height={38} className="h-8 w-8" />
            <span className="text-sm font-semibold text-[#14532d]">eFixMate</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/technician/login"
              className="hidden rounded-md px-3 py-2 text-sm font-semibold text-[#334155] transition hover:bg-[#f1f5f9] sm:inline-flex"
            >
              Partner Login
            </Link>
            <Link
              href="/technician/login"
              className="inline-flex items-center gap-2 rounded-md bg-[#16a34a] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d]"
            >
              Join Now
              <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[calc(100vh-65px)] items-center overflow-hidden bg-white">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#15803d]">
              <BadgeCheck size={14} />
              Verified partner program
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-normal text-[#052e16] sm:text-5xl lg:text-6xl">
              Join as a Technician
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#475569] sm:text-lg">
              Work with eFixMate and grow your income through service bookings across homes, offices & workplaces — with transparent job flow, digital tracking, and reliable support.
            </p>
            <div className="mt-5 inline-flex max-w-xl items-center gap-3 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#16a34a] text-white">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#15803d]">Earning potential</p>
                <p className="text-lg font-bold text-[#14532d]">Earn up to ₹45,000/month</p>
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/technician/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#16a34a] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d]"
              >
                Start Registration
                <ArrowRight size={18} />
              </Link>
              <a
                href="#benefits"
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-6 text-sm font-bold text-[#0f172a] transition hover:bg-[#f8fafc]"
              >
                View Benefits
              </a>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[#e2e8f0] pt-5">
              {[
                ["50+", "Expert partners"],
                ["1,000+", "Jobs completed"],
                ["4.8", "Customer rating"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-[#14532d]">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-[#64748b]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px] -translate-y-4 lg:max-w-[720px] lg:-translate-y-6">
            <div className="relative aspect-[4/5] max-h-[calc(100vh-115px)] overflow-hidden rounded-lg">
              <Image
                src={HERO_IMAGE}
                alt="eFixMate technician partner"
                fill
                priority
                sizes="(max-width: 1024px) 95vw, 720px"
                className="object-contain object-bottom"
              />
            </div>
            <div className="absolute -bottom-5 left-4 right-4 grid grid-cols-2 gap-3 rounded-lg border border-[#dcfce7] bg-white p-3 shadow-xl shadow-[#14532d]/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#16a34a]" size={20} />
                <span className="text-xs font-bold text-[#334155]">Verified onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="text-[#16a34a]" size={20} />
                <span className="text-xs font-bold text-[#334155]">Mobile-first jobs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#16a34a]">Benefits</p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#0f172a]">Why work with eFixMate?</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#64748b]">
            Built for skilled service professionals who want more bookings, better organization, and dependable platform support.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#f0fdf4] text-[#16a34a]">
                <Icon size={21} />
              </div>
              <h3 className="text-base font-semibold text-[#0f172a]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#16a34a]">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#0f172a]">Become a partner in four steps</h2>
            <div className="mt-8 space-y-4">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#14532d] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0f172a]">{step}</h3>
                    <p className="mt-1 text-sm text-[#64748b]">
                      {index === 0
                        ? "Use OTP login to create or access your partner account."
                        : index === 1
                        ? "Tell us who you are and where you can serve customers."
                        : index === 2
                        ? "Upload documents and payout details for verification."
                        : "Once approved, manage jobs from your technician dashboard."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#dcfce7] text-[#15803d]">
                <CalendarCheck size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">What you need</h3>
                <p className="text-sm text-[#64748b]">Keep these details ready before applying.</p>
              </div>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {requirements.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-semibold text-[#334155]">
                  <CheckCircle2 size={17} className="shrink-0 text-[#16a34a]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-7 rounded-md border border-[#bbf7d0] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#14532d]">
                <Star size={17} />
                Approval note
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                Applications are reviewed by the admin team. Approval depends on document verification, service skills, and operational coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-[#052e16] px-6 py-10 text-white sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-white/10">
                <Wrench size={24} />
              </div>
              <h2 className="text-3xl font-bold tracking-normal">Services you can offer</h2>
              <p className="mt-3 text-sm leading-6 text-[#bbf7d0]">
                Add the skills you can handle during registration. Admin approval helps ensure customers get reliable service professionals.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <div key={service} className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-3 text-sm font-bold">
                  <CheckCircle2 size={17} className="text-[#86efac]" />
                  {service}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-normal text-[#0f172a]">Ready to join eFixMate?</h2>
            <p className="mt-2 text-sm text-[#64748b]">Start with OTP login and complete your technician registration today.</p>
          </div>
          <Link
            href="/technician/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#16a34a] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d]"
          >
            Join as Technician
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
