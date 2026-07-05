"use client";

import React from "react";
import { LayoutGrid, Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PlaceholderPageProps {
  title: string;
  badge?: string;
  subtitle?: string;
}

export default function PlaceholderPage({ title, badge, subtitle }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="p-6 bg-[#eff6ff] rounded-[2.5rem] relative z-10">
          <Construction className="w-16 h-16 text-[#2563eb] animate-pulse" />
        </div>
        <div className="absolute -inset-4 bg-[#dbeafe]/50 rounded-[3rem] blur-2xl -z-10" />
      </div>

      <div className="space-y-2">
        {badge && (
          <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-[#dbeafe] text-[#1d4ed8] rounded-full">
            {badge}
          </span>
        )}
        <h1 className="text-3xl font-black text-[#0f172a]  capitalize">
          {title.replace(/-/g, " ")}
        </h1>
        <p className="text-[#53697e] max-w-md mx-auto leading-relaxed">
          {subtitle || "We are currently building this section to provide you with a powerful management experience. Stay tuned!"}
        </p>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link 
          href="/admin/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-[#ffffff] rounded-2xl font-bold text-sm hover:shadow-xl hover:shadow-[#e2e8f0] transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
