"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const CONSENT_KEY = "efm_cookie_consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setShow(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1e293b] bg-[#0f172a] px-4 py-4 shadow-2xl sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
        <p className="flex-1 text-[13px] leading-relaxed text-[#cbd5e1]">
          We use cookies to improve your experience and analyse site usage.{" "}
          <Link href="/privacy-policy" className="font-semibold text-[#60a5fa] hover:underline">
            Learn more
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-lg border border-[#334155] px-4 py-2 text-[12px] font-semibold text-[#94a3b8] transition-colors hover:border-[#475569] hover:text-[#e2e8f0]"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-[12px] font-semibold text-[#ffffff] transition-colors hover:bg-[#1d4ed8]"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={reject}
            aria-label="Close"
            className="ml-1 rounded-lg p-1.5 text-[#475569] hover:text-[#94a3b8]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
