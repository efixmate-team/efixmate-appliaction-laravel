/** @format */

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import type { LandingPageData } from "../_data/pages";
import { LandingSectionHeading } from "./LandingSectionHeading";

type LandingSubPageProps = {
  data: LandingPageData;
};

export default function LandingSubPage({ data }: LandingSubPageProps) {
  return (
    <main className="min-h-screen bg-[#ffffff] text-[#06113f]" style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <header className="border-b border-[#e6eeff] bg-[#ffffff]">
        <div className="mx-auto flex h-[78px] w-[90%] items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Back to eFixMate home">
            <BrandLogo width={40} height={40} className="h-10 w-10" priority />
            <span className="text-[28px] font-black text-[#0e55d9]">eFixMate</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#cfe0ff] px-4 py-2 text-[13px] font-bold text-[#0e55d9] transition hover:bg-[#eef5ff]">
            <ArrowLeft size={16} />
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-[90%] gap-10 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.18em] text-[#0e55d9]">{data.eyebrow}</p>
          <h1 className="mt-5 max-w-[720px] text-[42px] font-black leading-tight text-[#06113f] lg:text-[54px]">
            {data.title}
          </h1>
          <p className="mt-6 max-w-[660px] text-[17px] font-medium leading-8 text-[#44516b]">{data.summary}</p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/#services"
              className="inline-flex items-center gap-3 rounded-[8px] bg-[#0e55d9] px-6 py-4 text-[14px] font-black text-[#ffffff] shadow-[0_16px_30px_rgba(14,85,217,0.22)]">
              {data.ctaLabel || "Explore Services"}
              <ArrowRight size={17} />
            </Link>
            <a
              href="tel:+919993061058"
              className="inline-flex items-center gap-3 rounded-[8px] border border-[#0e55d9] px-6 py-4 text-[14px] font-black text-[#0e55d9]">
              <Phone size={17} />
              Call Support
            </a>
          </div>
        </div>

        <div className="rounded-[18px] bg-[#eef5ff] p-6 shadow-[0_14px_35px_rgba(15,41,92,0.08)] lg:p-10">
          <LandingSectionHeading title="What you get" />
          <ul className="mt-7 space-y-5">
            {data.points.map((point) => (
              <li key={point} className="flex gap-4 text-[15px] font-medium leading-7 text-[#26314f]">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#0e55d9]" size={22} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
