"use client";

import Link from "next/link";
import { Bell, Megaphone } from "lucide-react";

const items = [
  {
    label: "Promotions",
    href: "/admin/masters/announcement-management/promotions",
    icon: Megaphone,
    desc: "Banners, carousel slides, and offer banners for the mobile app",
  },
  {
    label: "Announcements",
    href: "/admin/masters/announcement-management/announcements",
    icon: Bell,
    desc: "In-app announcements and broadcast messages",
  },
];

export default function AnnouncementManagementPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Announcement Management</h1>
        <p className="mt-1 text-sm text-[#344352]">Manage promotions and announcements shown to users and technicians.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ label, href, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-4 rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-5 shadow-sm transition hover:border-[#93c5fd] hover:shadow-md"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#fdf2f8] text-[#db2777]">
              <Icon size={20} />
            </span>
            <div>
              <p className="font-semibold text-[#111827]">{label}</p>
              <p className="mt-1 text-sm text-[#344352]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
