"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, BadgeIndianRupee, Bell, BriefcaseBusiness, CheckCircle2,
  LayoutDashboard, Loader2, LogOut, User,
} from "lucide-react";
import { getDashboard, getUnreadJobCount } from "@/lib/api/technicianClient";
import { useTechnicianAuthStore } from "@/store/technicianAuth.store";
import { decodeId, encodeId } from "@/lib/idEncoder";

type DashboardHeader = {
  first_name?: string;
  last_name?: string;
  technician_unique_id?: string | null;
  is_active?: boolean;
  is_online?: boolean;
};

const NAV = [
  { label: "Dashboard",      href: "dashboard",      icon: LayoutDashboard },
  { label: "Profile",        href: "profile",        icon: User },
  { label: "Job Requests",   href: "Job-Requests",   icon: BriefcaseBusiness },
  { label: "Completed Jobs", href: "Completed-Jobs", icon: CheckCircle2 },
  { label: "Earnings",       href: "Earnings",       icon: BadgeIndianRupee },
];

export default function TechnicianPanelLayout({ children }: { children: React.ReactNode }) {
  const { technicianId } = useParams<{ technicianId: string }>();
  const pathname = usePathname();
  const router   = useRouter();

  const { token, technician, isHydrated, isRegistered, logout } = useTechnicianAuthStore();
  const [header, setHeader]           = useState<DashboardHeader | null>(null);
  const [loading, setLoading]         = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    // Not logged in → go to login
    if (!token) {
      router.replace("/technician/login");
      return;
    }

    // Wrong technician ID in URL → redirect to correct panel
    const decodedId = decodeId(technicianId);
    if (technician && decodedId !== technician.technician_id) {
      router.replace(`/technician/${encodeId(technician.technician_id)}/dashboard`);
      return;
    }

    // Not approved yet → back to registration
    if (isRegistered === false) {
      router.replace("/technician/register");
      return;
    }

    // Load live header (online status, unique ID)
    (async () => {
      try {
        const res = await getDashboard() as { status: boolean; data?: { header?: DashboardHeader } };
        if (res?.status && res.data?.header) {
          setHeader(res.data.header);
        } else {
          setHeader({
            first_name: technician?.first_name,
            last_name: technician?.last_name ?? "",
            is_active: technician?.is_active ?? false,
            is_online: false,
          });
        }
      } catch {
        setHeader({
          first_name: technician?.first_name,
          last_name: technician?.last_name ?? "",
          is_active: technician?.is_active ?? false,
          is_online: false,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [isHydrated, token, technician, isRegistered, technicianId, router]);

  // Poll job count + header status every 30 s so sidebar stays in sync with dashboard toggles
  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      const [countRes, dashRes] = await Promise.allSettled([
        getUnreadJobCount(),
        getDashboard() as Promise<{ status: boolean; data?: { header?: DashboardHeader } }>,
      ]);
      if (countRes.status === "fulfilled") {
        const r = countRes.value as { status: boolean; data?: { count: number } };
        if (r?.status && r.data) setPendingCount(r.data.count ?? 0);
      }
      if (dashRes.status === "fulfilled") {
        const r = dashRes.value;
        if (r?.status && r.data?.header) {
          setHeader(prev => ({ ...prev, ...r.data!.header }));
        }
      }
    };
    poll();
    pollRef.current = setInterval(poll, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token]);

  if (!isHydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0fdf4]">
        <Loader2 className="h-7 w-7 animate-spin text-[#16a34a]" />
      </div>
    );
  }

  const techName = header
    ? `${header.first_name ?? ""} ${header.last_name ?? ""}`.trim()
    : technician
      ? technician.first_name
      : `Technician #${decodeId(technicianId) ?? technicianId}`;

  const base = `/technician/${technicianId}`;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="sticky top-0 flex h-screen w-56 flex-col border-r border-[#d1fae5] bg-white">
        {/* Back */}
        <div className="flex items-center gap-2 border-b border-[#f0fdf4] px-4 py-3">
          <button
            onClick={() => router.push("/technician/register")}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6b7280] hover:text-[#14532d]"
          >
            <ArrowLeft size={13} /> Home
          </button>
        </div>

        {/* Identity */}
        <div className="border-b border-[#f0fdf4] px-4 py-3">
          <p className="truncate text-[13px] font-bold text-[#14532d]">{techName}</p>
          {header?.technician_unique_id && (
            <span className="mt-0.5 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
              {header.technician_unique_id}
            </span>
          )}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${header?.is_active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-red-200 bg-red-50 text-red-600"}`}>
              {header?.is_active ? "Active" : "Inactive"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${header?.is_online ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${header?.is_online ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
              {header?.is_online ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV.map(({ label, href, icon: Icon }) => {
            const fullHref = `${base}/${href}`;
            const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);
            return (
              <Link
                key={href}
                href={fullHref}
                className={`mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? "bg-[#16a34a] text-white"
                    : "text-[#4b5563] hover:bg-[#f0fdf4] hover:text-[#14532d]"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#f0fdf4] px-3 py-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-semibold text-[#dc2626] transition-colors hover:bg-red-50"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-end border-b border-[#d1fae5] bg-white px-6 py-2.5">
          <button
            onClick={() => router.push(`${base}/Job-Requests`)}
            className="relative rounded-xl p-2 text-[#4b5563] transition-colors hover:bg-[#f0fdf4] hover:text-[#16a34a]"
            title="Job Requests"
          >
            <Bell size={20} />
            {pendingCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* ── Logout confirmation modal ─────────────────────────────── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <LogOut size={18} className="text-[#dc2626]" />
              </span>
              <h2 className="text-[15px] font-bold text-[#111827]">Confirm Logout</h2>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-[#6b7280]">
              Are you sure you want to logout from the partner portal? You will need to verify your mobile number to sign back in.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-[#e5e7eb] bg-white py-2.5 text-[13px] font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
              <button
                onClick={() => { logout(); router.replace("/technician/login"); }}
                className="flex-1 rounded-xl bg-[#dc2626] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#b91c1c]"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
