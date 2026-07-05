/** @format */
"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, Search, LogOut, Command, X, ChevronDown, Sparkles, ChevronRight,
  Users, Calendar, Wrench, LayoutDashboard, ArrowRight, Bell,
} from "lucide-react";

import Modal from "../../components/modals/Modal";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAuthStore } from "@/store/auth.store";
import { commonAPIs, adminAPI, masterAPI, customerAdminAPI, bookingAdminAPI, technicianAdminAPI } from "@/lib/api";
import AuthProvider from "@/providers/AuthProvider";
import { SettingsProvider, useSettings } from "@/providers/SettingsProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import Sidebar from "./(components)/Sidebar/Sidebar";
import { collectMenuPaths, isAdminPathAllowed, restrictedPermissionsForAdminPath } from "./(lib)/menuRouteAccess";
import { AdminPermissionProvider, useAdminPermissionContext } from "@/providers/AdminPermissionProvider";
import { ADMIN_TYPES } from "@/src/shared/constants/adminTypes";
import { AdminNotificationBell } from "./notifications/(components)/AdminNotificationBell";
import ScopeSelector from "./(components)/ScopeSelector";
import SetupGuideButton from "./(components)/SetupGuideButton";
import { BrandLogo } from "@/components/BrandLogo";

// ─── Command Search Trigger ───────────────────────────────────────────────────

function CommandSearch({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl border
        bg-[#f8fafc] border-[#e2e8f0]/60 w-56 hover:border-[#bfdbfe] hover:bg-[#ffffff]
        transition-all duration-200 group text-left"
    >
      <Search className="w-3.5 h-3.5 shrink-0 text-[#94a3b8] group-hover:text-[#60a5fa] transition-colors" />
      <span className="flex-1 text-[13px] text-[#94a3b8] select-none">Search anything...</span>
      <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-[#94a3b8] bg-[#ffffff] border border-[#e2e8f0] rounded px-1 py-0.5 shrink-0">
        <Command className="w-2.5 h-2.5" />K
      </kbd>
    </button>
  );
}

// ─── Global Search Modal ──────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: "Dashboard",   href: "/admin/dashboard",                                          Icon: LayoutDashboard, cls: "text-[#eff6ff] bg-[#eff6ff]"    },
  { label: "Bookings",    href: "/admin/booking-management/bookings",                        Icon: Calendar,        cls: "text-[#f5f3ff] bg-[#f5f3ff]" },
  { label: "Users",       href: "/admin/user-management/users",                              Icon: Users,           cls: "text-[#ecfdf5] bg-[#ecfdf5]" },
  { label: "Technicians", href: "/admin/technician-management/technicians",                  Icon: Wrench,          cls: "text-[#fffbeb] bg-[#fffbeb]"   },
  { label: "Services",    href: "/admin/masters/services-management/services",               Icon: Wrench,          cls: "text-[#53697e] bg-[#f1f5f9]"  },
  { label: "Promotions",  href: "/admin/masters/announcement-management/promotions",         Icon: Bell,            cls: "text-[#fdf2f8] bg-[#fdf2f8]"     },
];

function ResultGroup({
  title, textCls, bgCls, icon, onViewAll, hideViewAll = false, children,
}: {
  title: string; textCls: string; bgCls: string; icon: React.ReactNode;
  onViewAll: () => void; hideViewAll?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-1.5">
        <div className={`flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider ${textCls}`}>
          <span className={`w-4 h-4 rounded flex items-center justify-center ${bgCls} ${textCls}`}>{icon}</span>
          {title}
        </div>
        {!hideViewAll && (
          <button onClick={onViewAll}
            className="flex items-center gap-0.5 text-[11px] text-[#eff6ff] hover:text-[#2563eb] transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function extractList(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res.slice(0, 5);
  return (res.data ?? res.users ?? res.bookings ?? res.services ?? res.items ?? res.list ?? []).slice(0, 5);
}

type NavMenu = { name: string; path: string; group: string };

function GlobalSearchModal({
  open,
  onClose,
  navMenus = [],
}: {
  open: boolean;
  onClose: () => void;
  navMenus?: NavMenu[];
}) {
  const [query,       setQuery]       = useState("");
  const [menuResults, setMenuResults] = useState<NavMenu[]>([]);
  const [users,       setUsers]       = useState<any[]>([]);
  const [bookings,    setBookings]    = useState<any[]>([]);
  const [services,    setServices]    = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [admins,      setAdmins]      = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched,    setSearched]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  const resetAll = () => {
    setMenuResults([]); setUsers([]); setBookings([]); setServices([]);
    setTechnicians([]); setAdmins([]); setSearched(false);
  };

  // Reset + focus on open
  useEffect(() => {
    if (!open) return;
    setQuery(""); resetAll();
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  // Instant client-side menu filter
  useEffect(() => {
    if (!query.trim()) { setMenuResults([]); return; }
    const q = query.toLowerCase();
    setMenuResults(
      navMenus.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.path.toLowerCase().includes(q) ||
        m.group.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [query, navMenus]);

  // Debounced search across all entity types
  useEffect(() => {
    if (!query.trim()) { resetAll(); return; }
    const body = { search: query, limit: 5, page: 1 };
    const timer = setTimeout(async () => {
      setIsSearching(true); setSearched(false);
      const [ur, br, sr, tr, ar] = await Promise.allSettled([
        customerAdminAPI.getUsers(body),
        bookingAdminAPI.getBookings(body),
        masterAPI.getServices({ search: query, limit: 5 }),
        technicianAdminAPI.getTechnicians(body),
        adminAPI.getAdmins(body),
      ]);
      setUsers      (ur.status === "fulfilled" ? extractList(ur.value) : []);
      setBookings   (br.status === "fulfilled" ? extractList(br.value) : []);
      setServices   (sr.status === "fulfilled" ? extractList(sr.value) : []);
      setTechnicians(tr.status === "fulfilled" ? extractList(tr.value) : []);
      setAdmins     (ar.status === "fulfilled" ? extractList(ar.value) : []);
      setIsSearching(false); setSearched(true);
    }, 350);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const go = (href: string) => { router.push(href); onClose(); };
  const hasResults = menuResults.length > 0 || users.length > 0 || bookings.length > 0
    || services.length > 0 || technicians.length > 0 || admins.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] px-4 sm:px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-[#ffffff] rounded-2xl shadow-2xl shadow-[#0f172a]/20 border border-[#e2e8f0]/80 overflow-hidden">

        {/* ── Input ── */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f1f5f9]">
          <Search className="w-4 h-4 text-[#94a3b8] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search users, bookings, services..."
            className="flex-1 text-[14px] text-[#334155] placeholder-[#94a3b8] outline-none bg-transparent"
          />
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-[#bfdbfe] border-t-blue-500 rounded-full animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0] transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="hidden sm:flex items-center text-[10px] text-[#94a3b8] bg-[#f8fafc] border border-[#e2e8f0] rounded px-1.5 py-1 hover:bg-[#f1f5f9] transition-colors shrink-0"
          >
            Esc
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto max-h-[58vh]">

          {/* Quick links — no query */}
          {!query && (
            <div className="p-4">
              <p className="text-[10.5px] font-semibold text-[#94a3b8] uppercase tracking-widest px-1 mb-3">
                Quick Links
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => go(link.href)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#f8fafc] border border-[#f1f5f9] hover:border-[#e2e8f0] text-left transition-all group"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${link.cls}`}>
                      <link.Icon className="w-3 h-3" />
                    </div>
                    <span className="text-[12.5px] font-medium text-[#475569] group-hover:text-[#1e293b] transition-colors whitespace-nowrap">
                      {link.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query && searched && !isSearching && !hasResults && (
            <div className="flex flex-col items-center justify-center gap-2 py-14 px-6">
              <Search className="w-8 h-8 text-[#e2e8f0]" />
              <p className="text-[13.5px] font-medium text-[#53697e]">No results for <span className="text-[#334155]">"{query}"</span></p>
              <p className="text-[12px] text-[#94a3b8]">Try a different keyword</p>
            </div>
          )}

          {/* Results */}
          {query && (hasResults || (isSearching && !searched)) && (
            <div className="p-4 space-y-5">

              {/* Menus — instant client-side results */}
              {menuResults.length > 0 && (
                <ResultGroup
                  title="Navigation" textCls="text-[#4f46e5]" bgCls="bg-[#6f7790]"
                  icon={<LayoutDashboard className="w-3 h-3" />}
                  onViewAll={() => {}}
                  hideViewAll
                >
                  {menuResults.map((m, i) => (
                    <button key={m.path + i} onClick={() => go(m.path)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-[#f8fafc] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#6f7790] flex items-center justify-center shrink-0">
                        <ChevronRight className="w-3.5 h-3.5 text-[#818cf8]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#334155] truncate">{m.name}</p>
                        <p className="text-[11px] text-[#94a3b8] truncate">{m.group}{m.path ? ` · ${m.path}` : ""}</p>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              )}

              {/* Users */}
              {users.length > 0 && (
                <ResultGroup
                  title="Users" textCls="text-[#059669]" bgCls="bg-[#ecfdf5]"
                  icon={<Users className="w-3 h-3" />}
                  onViewAll={() => go("/admin/user-management/users")}
                >
                  {users.map((u, i) => (
                    <button key={u.customer_id ?? u.id ?? i} onClick={() => go(`/admin/user-management/users/${u.customer_id ?? u.id ?? ""}`)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-[#f8fafc] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] flex items-center justify-center shrink-0 text-[11px] font-bold text-[#059669]">
                        {(u.first_name?.[0] ?? u.name?.[0] ?? "U").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#334155] truncate">
                          {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : (u.name ?? "User")}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] truncate">{u.email ?? u.mobile ?? ""}</p>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              )}

              {/* Bookings */}
              {bookings.length > 0 && (
                <ResultGroup
                  title="Bookings" textCls="text-[#7c3aed]" bgCls="bg-[#f5f3ff]"
                  icon={<Calendar className="w-3 h-3" />}
                  onViewAll={() => go("/admin/booking-management/bookings")}
                >
                  {bookings.map((b, i) => (
                    <button key={b.booking_id ?? b.id ?? i} onClick={() => go(`/admin/booking-management/workflow/${b.booking_id ?? b.id ?? ""}`)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-[#f8fafc] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#f5f3ff] flex items-center justify-center shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-[#f5f3ff]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#334155] truncate">
                          #{b.booking_id ?? b.id ?? "—"}  {b.service_name ?? ""}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] truncate">
                          {b.customer_name ?? b.user_name ?? ""}{b.status ? ` · ${b.status}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              )}

              {/* Services */}
              {services.length > 0 && (
                <ResultGroup
                  title="Services" textCls="text-[#d97706]" bgCls="bg-[#fffbeb]"
                  icon={<Wrench className="w-3 h-3" />}
                  onViewAll={() => go("/admin/masters/services-management/services")}
                >
                  {services.map((s, i) => (
                    <button key={s.service_id ?? s.id ?? i} onClick={() => go(`/admin/masters/services-management/services`)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-[#f8fafc] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#fffbeb] flex items-center justify-center shrink-0">
                        <Wrench className="w-3.5 h-3.5 text-[#fffbeb]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#334155] truncate">
                          {s.service_name ?? s.name ?? "Service"}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] truncate">
                          {s.category_name ?? s.service_category ?? ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              )}

              {/* Technicians */}
              {technicians.length > 0 && (
                <ResultGroup
                  title="Technicians" textCls="text-[#ea580c]" bgCls="bg-[#fff7ed]"
                  icon={<Wrench className="w-3 h-3" />}
                  onViewAll={() => go("/admin/technician-management/technicians")}
                >
                  {technicians.map((t, i) => (
                    <button key={t.technician_id ?? t.id ?? i} onClick={() => go("/admin/technician-management/technicians")}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-[#f8fafc] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#fff7ed] flex items-center justify-center shrink-0 text-[11px] font-bold text-[#ea580c]">
                        {(t.first_name?.[0] ?? t.name?.[0] ?? "T").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#334155] truncate">
                          {t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : (t.name ?? "Technician")}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] truncate">{t.email ?? t.mobile ?? t.phone ?? ""}</p>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              )}

              {/* Admins */}
              {admins.length > 0 && (
                <ResultGroup
                  title="Admins" textCls="text-[#2563eb]" bgCls="bg-[#eff6ff]"
                  icon={<Users className="w-3 h-3" />}
                  onViewAll={() => go("/admin/admin-management/admins")}
                >
                  {admins.map((a, i) => (
                    <button key={a.admin_id ?? a.id ?? i} onClick={() => go(`/admin/admin-management/admins/${a.admin_id ?? a.id ?? ""}`)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-[#f8fafc] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0 text-[11px] font-bold text-[#2563eb]">
                        {(a.first_name?.[0] ?? a.name?.[0] ?? "A").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#334155] truncate">
                          {a.first_name && a.last_name ? `${a.first_name} ${a.last_name}` : (a.name ?? "Admin")}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] truncate">{a.email ?? ""}</p>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2.5 border-t border-[#f1f5f9] flex items-center gap-4 text-[11px] text-[#94a3b8]">
          <span className="flex items-center gap-1">
            <kbd className="bg-[#f1f5f9] border border-[#e2e8f0] rounded px-1 py-0.5 text-[10px]">↵</kbd>select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-[#f1f5f9] border border-[#e2e8f0] rounded px-1 py-0.5 text-[10px]">Esc</kbd>close
          </span>
          <span className="ml-auto opacity-60">Powered by eFixMate</span>
        </div>
      </div>
    </div>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu({
  user,
  onLogout,
  onChangePassword,
  canOpenSettings,
}: {
  user: any;
  onLogout: () => void;
  onChangePassword: () => void;
  canOpenSettings: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarUrl = (user?.profile_image || user?.avatar || "").trim();
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}` || "AD";

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl
          hover:bg-[#f8fafc] border border-transparent hover:border-[#e2e8f0]
          transition-all duration-150 group"
      >
        {/* Avatar: photo when available, else initials */}
        <div
          className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-sm shadow-[#bfdbfe] border border-[#e2e8f0]/60
            bg-gradient-to-br from-[#eff6ff] to-[#4f46e5] flex items-center justify-center text-[#ffffff] text-[11px] font-bold"
        >
          {avatarUrl && !avatarFailed ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            initials
          )}
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-[12.5px] font-semibold text-[#475569] leading-none">
            {user?.first_name ?? "Admin"}
          </p>
          <p className="text-[10.5px] text-[#94a3b8]   mt-0.5 leading-none">
            {user?.admin_type === ADMIN_TYPES.SUPER_ADMIN ? "Super Admin" : "Admin"}
          </p>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-[#94a3b8] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
          <div className="absolute right-0 mt-2 w-52 z-40 bg-[#ffffff] rounded-2xl shadow-xl shadow-[#e2e8f0]/80 border border-[#f1f5f9] overflow-hidden py-1.5">
            <div className="px-4 py-2.5 border-b border-[#f1f5f9] mb-1">
              <p className="text-[12px] font-semibold text-[#475569]">{user?.first_name} {user?.last_name}</p>
              <p className="text-[11px] text-[#94a3b8]">{user?.email ?? "admin@fixmate.com"}</p>
            </div>
            {[
              { label: "Profile Settings", href: "/admin/settings/profile" },
              ...(canOpenSettings ? [{ label: "Preferences", href: "/admin/settings" }] : []),
              { label: "Change Password", onClick: () => { setOpen(false); onChangePassword(); } },
            ].map((item: any) => (
              item.href ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center px-4 py-1 text-[13px] text-[#475569]
                    hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center px-4 py-1 text-[13px] text-[#475569]
                    hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors"
                >
                  {item.label}
                </button>
              )
            ))}
            <div className="border-t border-[#f1f5f9] mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2 px-4 py-1 text-[13px]
                  text-[#7b5757] hover:bg-[#fef2f2] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
      )}
    </div>
  );
}

function formatBreadcrumbLabel(segment: string) {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).slice(1); // Remove 'admin'

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-[12.5px] text-[#94a3b8] font-medium min-w-0">
      <Link
        href="/admin/dashboard"
        className="flex shrink-0 items-center gap-1.5 text-[#475569] transition-colors hover:text-[#2563eb]"
      >
        <BrandLogo width={18} height={18} className="h-[18px] w-[18px] object-contain" />
        eFixMate
      </Link>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/admin/${segments.slice(0, index + 1).join("/")}`;
        const label = formatBreadcrumbLabel(segment);

        return (
          <div key={`${href}-${index}`} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="w-3 h-3 shrink-0 text-[#cbd5e1]" aria-hidden />
            {isLast ? (
              <span className="truncate capitalize text-[#1e293b] font-semibold" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="truncate capitalize text-[#53697e] transition-colors hover:text-[#2563eb]"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
      {segments.length === 0 && (
        <div className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-[#cbd5e1]" aria-hidden />
          <span className="text-[#1e293b] font-semibold" aria-current="page">
            Dashboard
          </span>
        </div>
      )}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AdminPermissionProvider>
          <AdminContent>{children}</AdminContent>
        </AdminPermissionProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const pathname = usePathname();
  const sidebarOpen = useSidebarStore((state) => state.sidebarOpen);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const setSidebar = useSidebarStore((state) => state.setSidebar);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { hasPermission, isSuperAdmin, loading: permissionsLoading } = useAdminPermissionContext();

  /** After successful GET /admin/menus, block direct URLs to routes absent from visible navigation. */
  const [menuRouteGuardReady, setMenuRouteGuardReady] = useState(false);
  const [menuRoutesOk, setMenuRoutesOk] = useState(false);
  const [allowedMenuPaths, setAllowedMenuPaths] = useState<string[]>([]);
  const [navMenus, setNavMenus] = useState<NavMenu[]>([]);

  useEffect(() => {
    let cancelled = false;
    adminAPI
      .getMenus()
      .then((res: { status?: boolean; isSuperAdmin?: boolean; group?: any[] }) => {
        if (cancelled) return;
        if (res.status && Array.isArray(res.group)) {
          // Build flat menu list for global search
          const flat: NavMenu[] = res.group.flatMap((g: any) =>
            (g.menus ?? []).map((m: any) => ({
              name:  m.menu_name  ?? "",
              path:  m.menu_path  ?? "",
              group: g.group_name ?? g.menu_group ?? g.group ?? "",
            }))
          ).filter((m: NavMenu) => m.name && m.path);
          setNavMenus(flat);
          setAllowedMenuPaths(collectMenuPaths(res.group, Boolean(res.isSuperAdmin)));
          setMenuRoutesOk(true);
        } else {
          setMenuRoutesOk(false);
        }
        setMenuRouteGuardReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setMenuRoutesOk(false);
          setMenuRouteGuardReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!menuRouteGuardReady || !menuRoutesOk || permissionsLoading || !pathname) return;
    if (!pathname.startsWith("/admin")) return;
    const restrictedPermissions = restrictedPermissionsForAdminPath(pathname);
    if (
      !isSuperAdmin &&
      restrictedPermissions.length > 0 &&
      !restrictedPermissions.some((permission) => hasPermission(permission))
    ) {
      router.replace("/admin");
      return;
    }
    if (!isAdminPathAllowed(pathname, allowedMenuPaths)) {
      router.replace("/admin");
    }
  }, [menuRouteGuardReady, menuRoutesOk, permissionsLoading, pathname, allowedMenuPaths, router, hasPermission, isSuperAdmin]);

  const handleLogout = async () => {
    await commonAPIs.logout();
    useAuthStore.getState().setUser(null);
    setIsLogoutOpen(false);
    router.push("/login");
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.new !== passwordForm.confirm) {
      return setPasswordError("New passwords do not match");
    }

    if (passwordForm.new.length < 6) {
      return setPasswordError("Password must be at least 6 characters");
    }

    try {
      setPasswordLoading(true);
      await adminAPI.changePassword({
        newPassword: passwordForm.new
      });
      setIsPasswordOpen(false);
      setPasswordForm({ new: "", confirm: "" });
      // Optional: Show success toast
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─── Global Behaviors ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Keyboard Shortcut: Ctrl+F / Cmd+F / Ctrl+K / Cmd+K / / to open search
      if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F" || e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      const inInput = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      if (settings.productivity.keyboardShortcuts && !inInput && e.key === "/") {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      // 2. Disable Inspect (Security)
      if (settings.security.disableInspect) {
        if (e.key === "F12") e.preventDefault();
        if (e.ctrlKey && e.shiftKey && ["i", "I", "j", "J", "c", "C"].includes(e.key)) e.preventDefault();
        if (e.ctrlKey && (e.key === "u" || e.key === "U")) e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (settings.security.disableInspect) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [settings.productivity.keyboardShortcuts, settings.security.disableInspect]);

  return (
    <div className={`min-h-screen font-[system-ui] transition-colors duration-300 ${settings.appearance.theme === "dark" ? "bg-[#020617]" : "bg-[#F5F7FA]"
      }`}>

      {/* ── Mobile Overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0f172a]/25 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          bg-[#ffffff] border-r border-[#f1f5f9]
          transition-all duration-300 ease-in-out will-change-transform
          ${sidebarOpen ? "w-[230px]" : "w-[68px]"}
        `}
      >
        <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} setOpenModal={setIsLogoutOpen} />
      </aside>

      {/* ── Content Shell ───────────────────────────────────────────────── */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:pl-[230px]" : "pl-[68px]"
          }`}
      >

        {/* ── Topbar ────────────────────────────────────────────────────── */}
        <header className={`${settings.uiBehavior.stickyHeader ? "sticky" : "relative"} top-0 z-30 h-[60px] flex items-center px-5 gap-4
          bg-[#ffffff]/80 backdrop-blur-lg border-b border-[#f1f5f9]/80`}>

          {/* Left: Toggle + Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={toggleSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-xl
                bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569] hover:text-[#334155]
                border border-[#e2e8f0]/60 transition-all duration-150 shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb-style page indicator */}
            <DynamicBreadcrumbs />
          </div>

          {/* Center: Search */}
          <div className="hidden md:block">
            <CommandSearch onOpen={() => setIsSearchOpen(true)} />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ScopeSelector />
            <AdminNotificationBell />
            <div className="w-px h-6 bg-[#e2e8f0] mx-1" />
            <UserMenu
              user={user}
              onLogout={() => setIsLogoutOpen(true)}
              onChangePassword={() => setIsPasswordOpen(true)}
              canOpenSettings={isSuperAdmin || hasPermission("SYSTEM_SETTINGS")}
            />
          </div>
        </header>

        {/* ── Page Content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-3 lg:p-4">
          {/* Floating page wrapper with subtle polish */}
          <div className={`mx-auto transition-all duration-300 ${settings.appearance.layoutWidth === "boxed" ? "max-w-[1200px]" : "max-w-[1600px]"
            }`}>
            <AuthProvider>{children}</AuthProvider>
          </div>
        </main>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="px-8 py-3 border-t border-[#f1f5f9] flex items-center justify-between">
          <p className="text-[11.5px] text-[#94a3b8]  ">
            © {new Date().getFullYear()} FixMate Admin
          </p>
          <div className="flex items-center gap-1 text-[11.5px] text-[#94a3b8]">
            <Sparkles className="w-3 h-3 text-[#60a5fa]" />
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>

      {/* ── Setup guide (lookups & masters) ─────────────────────────────── */}
      <SetupGuideButton />

      {/* ── Global Search Modal ─────────────────────────────────────────── */}
      <GlobalSearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} navMenus={navMenus} />

      {/* ── Logout Modal ────────────────────────────────────────────────── */}
      <Modal openModal={isLogoutOpen} setOpenModal={setIsLogoutOpen}>
        <div className="bg-white rounded-2xl w-full max-w-sm mx-auto overflow-hidden shadow-2xl">
          {/* Red header strip */}
          <div className="relative bg-gradient-to-br from-[#dc2626] to-[#991b1b] px-6 pt-7 pb-10">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
            />
            <div className="relative flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-4 ring-white/30">
                <LogOut className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h2 className="mt-3.5 text-[17px] font-bold text-white tracking-tight">
                Sign out?
              </h2>
              <p className="mt-1 text-[12px] text-red-200 text-center leading-relaxed">
                You'll need to sign in again to access the admin panel.
              </p>
            </div>
          </div>

          {/* Admin identity card — floats over the strip */}
          <div className="relative -mt-5 mx-5">
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#dc2626] to-[#991b1b] flex items-center justify-center text-white text-[13px] font-bold shrink-0 shadow">
                {user?.first_name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#0f172a] truncate leading-tight">
                  {user?.first_name} {user?.last_name ?? ""}
                </p>
                <p className="text-[11px] text-[#94a3b8] truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pt-4 pb-5 flex gap-2.5">
            <button
              onClick={() => setIsLogoutOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold
                text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] transition-colors border border-[#e2e8f0]"
            >
              Stay
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold
                text-white bg-[#dc2626] hover:bg-[#b91c1c] transition-all
                shadow-md shadow-red-100 active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
              Sign Out
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Change Password Modal ────────────────────────────────────────── */}
      <Modal openModal={isPasswordOpen} setOpenModal={setIsPasswordOpen}>
        <form onSubmit={handleChangePassword} className="p-2 bg-[#ffffff] rounded-2xl mx-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#0f172a]">Change Password</h2>
              <p className="text-[11px] text-[#94a3b8]">Update your account security</p>
            </div>
            <button type="button" onClick={() => setIsPasswordOpen(false)} className="text-[#94a3b8] hover:text-[#475569]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 px-2">
            <div>
              <label className="block text-[11px] font-medium text-[#53697e] mb-1">New Password</label>
              <input
                required
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                className="w-full px-3 py-2 text-[13px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:bg-[#ffffff] transition-all outline-none focus:ring-2 focus:ring-[#dbeafe]"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#53697e] mb-1">Confirm New Password</label>
              <input
                required
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full px-3 py-2 text-[13px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:bg-[#ffffff] transition-all outline-none focus:ring-2 focus:ring-[#dbeafe]"
                placeholder="••••••••"
              />
            </div>

            {passwordError && (
              <p className="text-[11px] text-[#7b5757] font-medium px-1">{passwordError}</p>
            )}
          </div>

          <div className="mt-6 flex gap-2.5 px-2">
            <button
              type="button"
              onClick={() => setIsPasswordOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={passwordLoading}
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-[#ffffff] bg-[#2563eb] hover:bg-[#1d4ed8] shadow-sm shadow-[#dbeafe] disabled:opacity-50 transition-all"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
