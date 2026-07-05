"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { LandingHeader } from "./LandingHeader";
import { LandingFooter } from "./LandingFooter";

export type SimpleLegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type RelatedLink = { label: string; href: string };

type Props = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: SimpleLegalSection[];
  contactEmail?: string;
  relatedLinks?: RelatedLink[];
};

export function SimpleLegalPage({
  title,
  lastUpdated,
  intro,
  sections,
  contactEmail = "support@efixmate.com",
  relatedLinks = [],
}: Props) {
  const sectionIds = sections.map((section, index) => ({
    ...section,
    id: `${index + 1}-${section.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`,
  }));

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            dateModified: lastUpdated,
            publisher: {
              "@type": "Organization",
              name: "eFixMate",
            },
          }),
        }}
      />
      <LandingHeader />

      {/* Professional dark hero */}
      <div className="bg-[#0a1628] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">
            Legal Document
          </p>
          <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-white sm:text-[2.5rem]">
            {title}
          </h1>
          <div className="mt-4 flex items-center gap-1.5 text-[13px] text-[#64748b]">
            <Clock className="h-3.5 w-3.5" />
            Last updated: {lastUpdated}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
              On this page
            </p>
            <nav className="space-y-0.5">
              {sectionIds.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-md px-3 py-2 text-[13px] font-medium leading-snug text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                >
                  {section.title.replace(/^\d+\.\s*/, "")}
                </a>
              ))}
            </nav>

            <div className="mt-6 border-t border-[#e2e8f0] pt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
                Need help?
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="block text-[13px] font-medium text-[#1d4ed8] hover:underline"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <article className="min-w-0">
          <header className="border-b border-[#e2e8f0] pb-8">
            <p className="text-[15px] leading-7 text-[#475569]">{intro}</p>
          </header>

          <div className="space-y-8 py-8">
            {sectionIds.map((section) => (
              <section id={section.id} key={section.title} className="scroll-mt-24">
                <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-[#0f172a]">
                  {section.title}
                </h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="mt-3 text-[15px] leading-7 text-[#475569]">
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-[#475569]">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <footer className="border-t border-[#e2e8f0] pt-8 text-[15px] leading-7 text-[#475569]">
            <p>
              Questions about this policy? Email{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="font-medium text-[#1d4ed8] hover:underline"
              >
                {contactEmail}
              </a>
              .
            </p>
            {relatedLinks.length > 0 && (
              <p className="mt-4 text-[14px] text-[#64748b]">
                See also:{" "}
                {relatedLinks.map((link, i) => (
                  <span key={link.href}>
                    {i > 0 && (i < relatedLinks.length - 1 ? ", " : " and ")}
                    <Link href={link.href} className="text-[#1d4ed8] hover:underline">
                      {link.label}
                    </Link>
                  </span>
                ))}
                .
              </p>
            )}
          </footer>
        </article>
      </div>

      <LandingFooter />
    </main>
  );
}
