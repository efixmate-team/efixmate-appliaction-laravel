"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ContactRound } from "lucide-react";
import { CRM_NAV } from "@/src/features/crm/constants";

export function CrmShell({
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f9ff] text-[#0284c7]">
            <ContactRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0f172a]">{title}</h1>
            {description ? <p className="mt-0.5 text-sm text-[#53697e]">{description}</p> : null}
          </div>
        </div>
        {actions}
      </div>

      <nav className="flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1">
        {CRM_NAV.map((item) => {
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
