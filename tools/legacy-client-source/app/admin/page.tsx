"use client";

import React from "react";
import {
  ArrowRight,
  Sparkles,
  Store,
  Zap,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

export default function WelcomeScreen() {
  const { user } = useAuthStore();
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Main Hero Card */}
        <div className="relative overflow-hidden bg-[#ffffff] rounded-[2.5rem] border border-[#e2e8f0] shadow-2xl shadow-[#dbeafe]/50 p-8 md:p-16">

          {/* Background Decorative Elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#eff6ff] rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#6f7790] rounded-full blur-3xl opacity-60" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Animated Icon Header */}
            <div className="mb-8 relative">
              <div className="bg-linear-to-tr from-[#2563eb] to-[#eef2ff] p-5 rounded-3xl shadow-xl shadow-[#bfdbfe] rotate-3 hover:rotate-0 transition-transform duration-500">
                <Sparkles className="w-10 h-10 text-[#ffffff]" />
              </div>
              <div className="absolute -top-2 -right-2 bg-[#fbbf24] p-1.5 rounded-full border-4 border-[#ffffff] animate-bounce">
                <Zap className="w-3 h-3 text-[#ffffff] fill-current" />
              </div>
            </div>

            {/* Typography */}
            <h1 className="text-4xl md:text-5xl font-black text-[#0f172a]  mb-4">
              Your store is <span className="text-[#2563eb]">ready to fly.</span>
            </h1>
            <p className="text-lg text-[#475569] max-w-xl leading-relaxed mb-10">
              Welcome to FixMate, {user?.first_name ?? "Admin"}. We've set up your workspace with everything
              you need to manage vendors, track orders, and scale your retail business.
            </p>
          </div>
        </div>

        {/* Footer Hint */}
        <p className="text-center mt-8 text-[#5c6a7f]  text-[13px]  ">
          Need help getting started? <span className="text-[#2563eb] cursor-pointer hover:underline">Visit our Help Center</span>
        </p>
      </div>
    </div>
  );
}

// Sub-component for the 1-2-3 steps
function OnboardingStep({ icon, title, desc, status }: { icon: React.ReactNode, title: string, desc: string, status: 'completed' | 'pending' | 'upcoming' }) {
  const styles = {
    completed: "bg-[#ecfdf5] border-[#d1fae5] text-[#059669]",
    pending: "bg-[#eff6ff] border-[#dbeafe] text-[#2563eb] ring-2 ring-[#eff6ff] ring-offset-4",
    upcoming: "bg-[#f8fafc] border-[#f1f5f9] text-[#5c6a7f] opacity-60"
  };

  return (
    <div className={`flex flex-col items-center p-5 rounded-3xl border transition-all ${styles[status]}`}>
      <div className="mb-3">{icon}</div>
      <h4 className="text-[13px] font-bold uppercase tracking-wider">{title}</h4>
      <p className="text-[11px]   opacity-80 mt-1">{desc}</p>
    </div>
  );
}