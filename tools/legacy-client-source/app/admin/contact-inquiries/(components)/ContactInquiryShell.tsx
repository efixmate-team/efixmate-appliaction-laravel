"use client";

import { Mail } from "lucide-react";

export function ContactInquiryShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f9ff] text-[#0284c7]">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0f172a]">{title}</h1>
            {description ? <p className="mt-0.5 text-sm text-[#53697e]">{description}</p> : null}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
