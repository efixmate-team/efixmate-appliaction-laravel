"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch } from "lucide-react";
import { BOOKING_WORKFLOW_NAV } from "@/src/features/bookings/constants";

export function BookingShell({
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
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0f172a]">{title}</h1>
            {description ? <p className="mt-0.5 text-sm text-[#53697e]">{description}</p> : null}
          </div>
        </div>
        {actions}
      </div>

      <nav className="flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-[#f1f5f9] bg-[#f8fafc]/70 p-1">
        {BOOKING_WORKFLOW_NAV.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-[#ffffff] text-[#0f172a] shadow-sm" : "text-[#53697e] hover:text-[#1e293b]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
