"use client";

import Link from "next/link";
import { Bell, Building, Calculator, Clock, Globe, Map, MapPin, Megaphone, Percent, Receipt, Star, Tags, Ticket, TrendingUp, Wrench, Zap } from "lucide-react";

const sections = [
  {
    group: "Geography",
    items: [
      { label: "Countries", href: "/admin/masters/geography/countries", icon: Globe },
      { label: "States", href: "/admin/masters/geography/states", icon: Map },
      { label: "Cities", href: "/admin/masters/geography/cities", icon: Building },
      { label: "Areas", href: "/admin/masters/geography/areas", icon: MapPin },
    ],
  },
  {
    group: "Services",
    items: [
      { label: "Service Categories", href: "/admin/masters/services-management/service-categories", icon: Tags },
      { label: "Services", href: "/admin/masters/services-management/services", icon: Wrench },
      { label: "Skills", href: "/admin/masters/services-management/skills", icon: Star },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Charges", href: "/admin/masters/finance-management/charges", icon: Zap },
      { label: "Taxes", href: "/admin/masters/finance-management/taxes", icon: Receipt },
      { label: "Pricing Rules", href: "/admin/masters/pricing-rules", icon: Calculator },
      { label: "Discounts", href: "/admin/masters/finance-management/discounts", icon: Percent },
      { label: "Commissions", href: "/admin/masters/finance-management/commissions", icon: TrendingUp },
    ],
  },
  {
    group: "Other",
    items: [
      { label: "Time Slots", href: "/admin/masters/time-slot-management/time-slots", icon: Clock },
      { label: "Coupons", href: "/admin/masters/coupon-management/coupons", icon: Ticket },
      { label: "Promotions", href: "/admin/masters/announcement-management/promotions", icon: Megaphone },
      { label: "Announcements", href: "/admin/masters/announcement-management/announcements", icon: Bell },
    ],
  },
];

export default function MastersHubPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Masters</h1>
        <p className="mt-1 text-sm text-[#344352]">Configure geography, services, pricing, and promotions.</p>
      </div>
      {sections.map(({ group, items }) => (
        <div key={group}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">{group}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-4 shadow-sm transition hover:border-[#93c5fd] hover:shadow-md"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eff6ff] text-[#2563eb]">
                  <Icon size={20} />
                </span>
                <span className="font-semibold text-[#111827]">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
