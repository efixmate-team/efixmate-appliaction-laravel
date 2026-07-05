"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { LandingHeader } from "./LandingHeader";
import { LandingFooter } from "./LandingFooter";
import { useLandingChrome } from "./LandingChromeProvider";
import { DEFAULT_PHONE } from "@/lib/siteDefaults";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqCategory = {
  title: string;
  items: FaqItem[];
};

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/[0.07] last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-medium leading-snug text-white">
          {item.question}
        </span>
        <ChevronDown
          size={18}
          className={`mt-0.5 shrink-0 text-[#60a5fa] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <p className="pb-5 text-[14px] leading-[1.75] text-[#94a3b8]">
          {item.answer}
        </p>
      )}
    </div>
  );
}

export function FaqView({ categories }: { categories: FaqCategory[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const chrome = useLandingChrome();
  const contactPhone = chrome?.contactPhone ?? DEFAULT_PHONE;

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-[#060e1f]">
      <LandingHeader />

      {/* Hero */}
      <section
        className="bg-[#0a1628]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(29,78,216,0.14) 0%, transparent 70%)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-20 text-center sm:px-6 sm:pb-14 sm:pt-24">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#60a5fa]">
            Help Centre
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#64748b]">
            Everything you need to know about booking, verification, payments, and
            services on eFixMate.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-10">
          {categories.map((cat) => (
            <section key={cat.title}>
              <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#60a5fa]">
                {cat.title}
              </h2>
              <div className="mt-3 rounded-2xl border border-white/[0.08] bg-[#0a1628]/60 px-6">
                {cat.items.map((item) => (
                  <AccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openId === item.id}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-14 rounded-2xl border border-white/[0.08] bg-[#0a1628]/60 px-6 py-8 text-center">
          <MessageCircle size={28} className="mx-auto mb-3 text-[#60a5fa]" />
          <p className="text-[15px] font-semibold text-white">
            Still have a question?
          </p>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Our support team is available Monday – Saturday, 8 AM – 8 PM.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#1d4ed8] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1e40af]"
            >
              Contact Support
            </Link>
            <a
              href={`tel:${contactPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-[6px] border border-white/[0.15] px-5 py-2.5 text-[13px] font-semibold text-[#cbd5e1] transition hover:border-white/30 hover:text-white"
            >
              {contactPhone}
            </a>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
