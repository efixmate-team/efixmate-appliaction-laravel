"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Send,
  ShieldCheck,
  Tag,
  User,
  Users,
} from "lucide-react";
import {
  useState,
  type ChangeEvent,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from "react";
import { LandingHeader } from "../../_components/LandingHeader";
import { LandingFooter } from "../../_components/LandingFooter";
import {
  LandingNavHeroShell,
  landingHeroInnerClass,
  landingHeroSectionClass,
} from "../../_components/LandingNavHeroShell";
import { LandingSectionHeading } from "../../_components/LandingSectionHeading";
import { publicAPI } from "@/lib/publicApi";
import { DEFAULT_PHONE, DEFAULT_EMAIL, DEFAULT_ADDRESS } from "@/lib/siteDefaults";
import { useToast } from "@/providers/ToastProvider";

type CmsFaq = { question: string; answer: string; faq_id?: number };
type CmsWorkingHour = {
  day?: string;
  day_label?: string;
  hours?: string;
  time_text?: string;
  hour_id?: number;
};
type CmsPublicPage = {
  title: string;
  slug: string;
  content: string;
  meta_description?: string | null;
};

const HOME_ASSET = "/asssets/landing/home";

const DEFAULT_FEATURES = [
  { icon: Headphones, title: "Quick Support", desc: "We respond as fast as possible" },
  { icon: ShieldCheck, title: "Trusted Service", desc: "Your satisfaction is our priority" },
  { icon: Users, title: "Expert Team", desc: "Professional support you can count on" },
];

const DEFAULT_CONNECT_CARDS = [
  {
    icon: Phone,
    title: "Call Us",
    main: DEFAULT_PHONE,
    sub: "Mon–Sat, 9:00 AM – 8:00 PM",
    href: `tel:${DEFAULT_PHONE.replace(/\s/g, "")}`,
  },
  {
    icon: Mail,
    title: "Email Us",
    main: DEFAULT_EMAIL,
    sub: "We reply within 24 hours",
    href: `mailto:${DEFAULT_EMAIL}`,
  },
  {
    icon: MapPin,
    title: "Visit Us",
    main: DEFAULT_ADDRESS,
    sub: "Head office",
    href: "https://maps.google.com/?q=Near+DM+Tower+Kailash+Nagar+Birgaon+Raipur",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    main: "Chat with our team",
    sub: "Get instant answers to your questions",
    href: "/contact#contact-form",
  },
];

const faqs = [
  {
    q: "How can I book a service?",
    a: "Choose a service on our website or app, pick a convenient time slot, and confirm your booking. A verified technician will be assigned right away.",
  },
  {
    q: "What are your service hours?",
    a: "We operate Monday to Saturday from 9:00 AM to 8:00 PM, and Sunday from 10:00 AM to 4:00 PM. Emergency support is available 24/7.",
  },
  {
    q: "Do you offer emergency services?",
    a: "Yes. For urgent electrical issues, call our support line and we will prioritize your request with the nearest available technician.",
  },
  {
    q: "How do I track my technician?",
    a: "After booking, you receive updates when your technician is assigned, on the way, and when the job is completed.",
  },
];

function FormField({
  label,
  required,
  icon: Icon,
  children,
  multiline,
}: {
  label: string;
  required?: boolean;
  icon: ComponentType<{ size?: number; className?: string }>;
  children: ReactNode;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#0f172a]">
        {label}
        {required ? <span className="text-[#dc2626]"> *</span> : null}
      </span>
      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-3 h-4 w-4 text-[#94a3b8] ${
            multiline ? "top-3" : "top-1/2 -translate-y-1/2"
          }`}
          size={16}
        />
        {children}
      </div>
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-3 text-[14px] text-[#0f172a] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10";

type FeatureItem = {
  title: string;
  desc: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};
type ConnectItem = {
  icon: ComponentType<{ size?: number }>;
  title: string;
  main: string;
  sub: string;
  href: string;
};

const FEATURE_ICONS = [Headphones, ShieldCheck, Users];
const CONNECT_ICONS = [Phone, Mail, MapPin, MessageCircle];

interface ContactPageViewProps {
  cmsPage: CmsPublicPage;
  cmsFaqs?: CmsFaq[];
  cmsWorkingHours?: CmsWorkingHour[];
  heroHeading?: string;
  heroDescription?: string;
  features?: { title: string; description: string }[];
  connectCards?: {
    label?: string;
    title?: string;
    value: string;
    subtext?: string;
    sub?: string;
    href?: string | null;
  }[];
  bottomCta?: { heading?: string; btn_text?: string };
  navItems?: Array<{ label: string; href: string }>;
}

export default function ContactPageView({
  cmsPage,
  cmsFaqs,
  cmsWorkingHours,
  heroHeading,
  heroDescription,
  features: cmsFeatures,
  connectCards: cmsConnect,
  navItems,
}: ContactPageViewProps) {
  const displayFeatures: FeatureItem[] = (
    cmsFeatures?.length
      ? cmsFeatures
      : DEFAULT_FEATURES.map((f) => ({ title: f.title, description: f.desc }))
  ).map((f, i) => ({
    title: f.title,
    desc: "description" in f ? f.description : (f as { desc: string }).desc,
    icon: FEATURE_ICONS[i % FEATURE_ICONS.length],
  }));

  const displayConnect: ConnectItem[] = (
    cmsConnect?.length
      ? cmsConnect
      : DEFAULT_CONNECT_CARDS.map((c) => ({
          label: c.title,
          value: c.main,
          subtext: c.sub,
          href: c.href,
        }))
  ).map((c, i) => {
    const label = c.label ?? (c as { title?: string }).title ?? `Contact ${i + 1}`;
    const main = c.value;
    const sub = c.subtext ?? (c as { sub?: string }).sub ?? "";
    const href =
      c.href ??
      (label === "Call Us"
        ? `tel:${String(main).replace(/\s/g, "")}`
        : label === "Email Us"
          ? `mailto:${main}`
          : label === "Visit Us" || label === "Office"
            ? `https://maps.google.com/?q=${encodeURIComponent(main)}`
            : "/contact#contact-form");
    return {
      icon: CONNECT_ICONS[i % CONNECT_ICONS.length],
      title: label,
      main,
      sub,
      href: href ?? "/contact#contact-form",
    };
  });

  const activeFaqs =
    cmsFaqs ??
    faqs.map((f, i) => ({ faq_id: i, question: f.q, answer: f.a, order_seq: i, is_active: true }));

  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const update =
    (key: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFormError("Please fill in your name, email, and message.");
      return;
    }
    setSending(true);
    const res = await publicAPI.submitContactInquiry({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      subject: form.subject.trim() || undefined,
      message: form.message.trim(),
    });
    setSending(false);
    if (res.status) {
      setSent(true);
      toast.success(res.message || "Message sent successfully");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } else {
      setFormError(res.message || "Unable to send message. Please try again.");
      toast.error(res.message || "Failed to send message");
    }
  };

  return (
    <main
      className="min-h-screen bg-[#f8fafc] text-[#0f172a]"
      style={{ fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif" }}
    >
      <LandingNavHeroShell>
        <LandingHeader activePath="/contact" navItems={navItems} />

        {/* Hero + form */}
        <section className={`${landingHeroSectionClass} overflow-y-auto bg-[#ffffff]`}>
          <div className={`${landingHeroInnerClass} lg:grid-cols-2`}>
            {/* Left: intro */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1d4ed8]">
                Contact Us
              </p>
              <h1 className="mt-3 text-[2rem] font-bold tracking-[-0.03em] text-[#0f172a] lg:text-[2.5rem]">
                {heroHeading ?? "We're Here to Help You."}
              </h1>
              <p className="mt-4 max-w-lg text-[15px] leading-[1.8] text-[#475569]">
                {heroDescription ??
                  cmsPage.meta_description ??
                  "Have a question about our services or need help with a booking? Our team is ready to assist you."}
              </p>

              <ul className="mt-8 space-y-5">
                {displayFeatures.map(({ icon: Icon, title, desc }, i) => (
                  <li key={`feature-${i}-${title}`} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-[15px] font-semibold text-[#0f172a]">{title}</p>
                      <p className="mt-0.5 text-[13px] text-[#64748b]">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: contact form */}
            <div
              id="contact-form"
              className="rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-sm lg:p-8"
            >
              <h2 className="text-[1.125rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
                Send Us a Message
              </h2>
              {sent ? (
                <p className="mt-5 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[14px] text-[#166534]">
                  Thank you! Your message has been sent. We&#39;ll get back to you soon.
                </p>
              ) : null}
              {formError ? (
                <p className="mt-4 rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#991b1b]">
                  {formError}
                </p>
              ) : null}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Your Name" required icon={User}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update("name")}
                      placeholder="John Doe"
                      className={inputClass}
                      required
                    />
                  </FormField>
                  <FormField label="Email Address" required icon={Mail}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder="john@example.com"
                      className={inputClass}
                      required
                    />
                  </FormField>
                </div>
                <FormField label="Phone Number" icon={Phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="+91 98765 43210"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Subject" icon={Tag}>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={update("subject")}
                    placeholder="How can we help?"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Your Message" required icon={Pencil} multiline>
                  <textarea
                    value={form.message}
                    onChange={update("message")}
                    placeholder="Tell us more about your request..."
                    rows={4}
                    className={`${inputClass} resize-none pt-2.5`}
                    required
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1d4ed8] py-3 text-[14px] font-semibold text-white transition hover:bg-[#1e40af] disabled:opacity-60"
                >
                  <Send size={16} />
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </LandingNavHeroShell>

      {cmsPage?.content && (
        <section className="mx-auto w-[90%] max-w-7xl py-6">
          <div
            className="text-[15px] leading-relaxed text-[#475569]"
            dangerouslySetInnerHTML={{ __html: cmsPage.content }}
          />
        </section>
      )}

      {/* Other ways to connect */}
      <section className="bg-[#ffffff] py-16">
        <div className="mx-auto w-[90%] max-w-7xl">
          <LandingSectionHeading title="Other Ways to Connect" align="center" />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayConnect.map(({ icon: Icon, title, main, sub, href }, i) => (
              <a
                key={`connect-${i}-${title}`}
                href={href}
                className="group rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-sm transition hover:border-[#cbd5e1] hover:shadow"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eff6ff] text-[#1d4ed8] transition group-hover:bg-[#1d4ed8] group-hover:text-white">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-[#0f172a]">{title}</h3>
                <p className="mt-1.5 text-[14px] font-medium text-[#1d4ed8]">{main}</p>
                <p className="mt-1 text-[13px] leading-5 text-[#64748b]">{sub}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Map + FAQ */}
      <section className="bg-[#f8fafc] py-16">
        <div className="mx-auto grid w-[90%] max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-[1.125rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
              Find Us
            </h2>
            <div className="mt-5 overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#ffffff] shadow-sm">
              <iframe
                title="eFixMate office location"
                src="https://maps.google.com/maps?q=Near+DM+Tower,+Kailash+Nagar,+Birgaon,+Raipur,+CG+490013&z=15&output=embed"
                className="h-[280px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div>
            <h2 className="text-[1.125rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
              Frequently Asked Questions
            </h2>
            <div className="mt-5 space-y-1.5">
              {activeFaqs.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={item.faq_id ?? i}
                    className="overflow-hidden rounded-md border border-[#e2e8f0] bg-[#ffffff]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[14px] font-semibold text-[#0f172a]"
                    >
                      {item.question}
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-[#94a3b8] transition ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open ? (
                      <p className="border-t border-[#f1f5f9] px-5 pb-4 text-[14px] leading-7 text-[#475569]">
                        {item.answer}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-md border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-sm">
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <Clock size={17} />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#0f172a]">Working Hours</p>
                  <div className="mt-2 text-[13px] leading-6 text-[#475569]">
                    {cmsWorkingHours ? (
                      cmsWorkingHours.map((h, i) => (
                        <p key={h.hour_id ?? i}>
                          <strong>{h.day_label ?? h.day}:</strong> {h.time_text ?? h.hours}
                        </p>
                      ))
                    ) : (
                      <>
                        <p>
                          <strong>Monday – Saturday:</strong> 9:00 AM – 8:00 PM
                        </p>
                        <p>
                          <strong>Sunday:</strong> 10:00 AM – 4:00 PM
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
