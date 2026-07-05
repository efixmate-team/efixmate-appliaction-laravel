"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Clock, FileText, ShieldCheck } from "lucide-react";

export type LegalSection = {
  id: string;
  heading: string;
  content: string;
};

type RelatedPolicy = {
  title: string;
  href: string;
  description: string;
};

type Props = {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  sections: LegalSection[];
  related?: RelatedPolicy[];
};

export function LegalDocumentPage({
  title,
  subtitle,
  lastUpdated = "January 2025",
  sections,
  related,
}: Props) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -60% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden px-4 py-14 text-[#ffffff] sm:px-6 lg:px-8"
        style={{
          background:
            "linear-gradient(135deg, #06113f 0%, #0e3a8c 55%, #1a5fc8 100%)",
        }}
      >
        {/* dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#ffffff]/20 bg-[#ffffff]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Legal Document
          </span>
          <h1 className="text-[30px] font-black leading-tight text-[#ffffff] sm:text-[22px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#dbeafe]">
              {subtitle}
            </p>
          )}
          <div className="mt-5 flex items-center gap-1.5 text-[12px] text-[#93c5fd]">
            <Clock className="h-3.5 w-3.5" />
            Last updated: {lastUpdated}
          </div>
        </div>
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ffffff]/5" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-[#ffffff]/5" />
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="gap-8 lg:flex">
          {/* Sidebar TOC */}
          <aside className="mb-8 w-full shrink-0 lg:mb-0 lg:w-[220px]">
            <div className="lg:sticky lg:top-6">
              <p className="mb-3 text-[10.5px] font-bold uppercase tracking-widest text-[#9ca3af]">
                On this page
              </p>
              <nav className="space-y-0.5">
                {sections.map((s) => {
                  const isActive = active === s.id;
                  return (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-all ${
                        isActive
                          ? "bg-[#eff6ff] text-[#1d4ed8] font-semibold"
                          : "text-[#6b7280] hover:bg-[#ffffff] hover:text-[#1f2937]"
                      }`}
                    >
                      {isActive && (
                        <div className="h-4 w-[3px] shrink-0 rounded-full bg-[#2563eb]" />
                      )}
                      <span className={isActive ? "" : "pl-[7px]"}>
                        {s.heading}
                      </span>
                    </a>
                  );
                })}
              </nav>

              {/* Quick links */}
              <div className="mt-8 rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                  Need Help?
                </p>
                <a
                  href="mailto:support@efixmate.com"
                  className="block text-[12.5px] font-semibold text-[#2563eb] hover:underline"
                >
                  support@efixmate.com
                </a>
                <a
                  href="tel:+919876543210"
                  className="mt-1 block text-[12.5px] font-semibold text-[#2563eb] hover:underline"
                >
                  +91 98765 43210
                </a>
              </div>
            </div>
          </aside>

          {/* Sections */}
          <article className="min-w-0 flex-1 space-y-5">
            {sections.map((s, i) => (
              <section
                id={s.id}
                key={s.id}
                className="scroll-mt-6 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#ffffff] shadow-sm"
              >
                {/* Section header */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-6 py-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-black text-[#ffffff]">
                    {i + 1}
                  </span>
                  <h2 className="text-[16px] font-black text-[#111827]">
                    {s.heading}
                  </h2>
                </div>
                {/* Section body */}
                <div
                  className="px-6 py-5 text-[14px] leading-relaxed text-[#4b5563] [&_em]:text-[#9ca3af] [&_li]:mt-1.5 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:before:mt-[7px] [&_li]:before:block [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:shrink-0 [&_li]:before:rounded-full [&_li]:before:bg-[#eff6ff] [&_p+p]:mt-2 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-none [&_ul]:space-y-0 [&_ul]:pl-0"
                  dangerouslySetInnerHTML={{ __html: s.content }}
                />
              </section>
            ))}

            {/* Footer note */}
            <div className="flex items-start gap-3 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-5 py-4">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#1d4ed8]" />
              <p className="text-[13px] text-[#1d4ed8]">
                If you have any questions about this document, contact us at{" "}
                <a
                  href="mailto:support@efixmate.com"
                  className="font-bold underline"
                >
                  support@efixmate.com
                </a>
                .
              </p>
            </div>
          </article>
        </div>

        {/* Related policies */}
        {related && related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-5 text-[18px] font-black text-[#111827]">
              Related Policies
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group flex flex-col gap-1.5 rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-5 shadow-sm transition-all hover:border-[#93c5fd] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#1f2937] group-hover:text-[#2563eb]">
                      {p.title}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#9ca3af] transition-transform group-hover:translate-x-0.5 group-hover:text-[#2563eb]" />
                  </div>
                  <p className="text-[12px] leading-snug text-[#6b7280]">
                    {p.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
