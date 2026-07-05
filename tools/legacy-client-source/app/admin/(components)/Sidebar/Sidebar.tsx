import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, AlertCircle, AlertTriangle, ArrowUpRight, BarChart2, Bell, Building,
  Calendar, CalendarClock, CalendarDays, ChevronDown, Circle, ClipboardList, Clock,
  ContactRound, Copy, CreditCard, DollarSign, ExternalLink, FileText, GitBranch, Globe,
  Headphones, History, Home, Image, Info, Key, KeyRound, Landmark, Languages,
  LayoutDashboard, LayoutTemplate, List, LogOut, Mail, Map, MapPin, MapPinned,
  Megaphone, Menu, MessageCircle, Monitor, Percent, Phone, Radio, Receipt, RefreshCw,
  Scale, Search, SearchX, Share2, Shield, ShieldAlert, ShieldCheck, Tags, Ticket,
  TrendingUp, User, Users, Wallet, Wrench, X, XCircle, Zap,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>> = {
  Activity, AlertCircle, AlertTriangle, ArrowUpRight, BarChart2, Bell, Building,
  Calendar, CalendarClock, CalendarDays, Circle, ClipboardList, Clock,
  ContactRound, Copy, CreditCard, DollarSign, ExternalLink, FileText, GitBranch, Globe,
  Headphones, History, Home, Image, Info, Key, KeyRound, Landmark, Languages,
  LayoutDashboard, LayoutTemplate, List, Mail, Map, MapPin, MapPinned,
  Megaphone, Menu, MessageCircle, Monitor, Percent, Phone, Radio, Receipt, RefreshCw,
  Scale, Search, Share2, Shield, ShieldAlert, ShieldCheck, Tags, Ticket,
  TrendingUp, User, Users, Wallet, Wrench, XCircle, Zap,
};
import { BrandLogo } from "@/components/BrandLogo";
import { useSettings } from "@/providers/SettingsProvider";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAdminPermissionContext } from "@/providers/AdminPermissionProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Menu {
    menu_id: number;
    menu_name: string;
    menu_path: string;
    menu_icon: string;
    menu_type: "P" | "C" | "I";
    menu_parent_id?: number;
    children?: Menu[];
    order?: number;
}

interface MenuGroup {
    menu_group_id: number;
    menu_group: string;
    menus: Menu[];
}

interface SidebarProps {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setOpenModal: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMenuTree(menus: Menu[]): Menu[] {
    const parents: Menu[] = [];
    const independents: Menu[] = [];
    const childrenMap: Record<number, Menu[]> = {};

    menus.forEach((m) => {
        if (m.menu_type === "C" && m.menu_parent_id != null) {
            if (!childrenMap[m.menu_parent_id]) childrenMap[m.menu_parent_id] = [];
            childrenMap[m.menu_parent_id].push(m);
        } else if (m.menu_type === "P") {
            parents.push(m);
        } else {
            independents.push(m);
        }
    });

    const tree = [...independents, ...parents].map((m) =>
        m.menu_type === "P"
            ? { ...m, children: childrenMap[m.menu_id] ?? [] }
            : m
    );

    return tree;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavIcon({ name, className }: { name: string; className?: string }) {
    const IconComponent = ICON_MAP[name] ?? Circle;
    return <IconComponent className={className} />;
}

/** Single independent or standalone nav link */
function IndependentItem({
    menu,
    isActive,
    collapsed,
}: {
    menu: Menu;
    isActive: boolean;
    collapsed: boolean;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const buttonRef = React.useRef<HTMLAnchorElement>(null);

    const handleMouseEnter = () => {
        if (collapsed) {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (rect) {
                setMenuPos({ top: rect.top, left: rect.right + 10 });
                setIsHovered(true);
            }
        }
    };

    return (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsHovered(false)}>
            <Link
                ref={buttonRef}
                href={menu.menu_path}
                data-sidebar-active={isActive ? "true" : undefined}
                className={`
                    group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 select-none
                    ${isActive
                        ? "bg-[#0f172a] text-white shadow-sm"
                        : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                    }
                `}
            >
                <NavIcon
                    name={menu.menu_icon}
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? "text-white" : "text-[#94a3b8] group-hover:text-[#475569]"}`}
                />

                {!collapsed && (
                    <span className={`text-[13.5px] leading-none  truncate ${isActive ? "font-semibold" : ""}`}>
                        {menu.menu_name}
                    </span>
                )}

                {/* Active indicator dot when collapsed */}
                {collapsed && isActive && (
                    <span className="absolute right-1.5 top-1.5 w-2 h-2 bg-white rounded-full shadow" />
                )}

                {/* Floating Label for Collapsed State */}
                {collapsed && isHovered && (
                    <div
                        className="fixed z-[9999] bg-[#ffffff] border border-[#f1f5f9] rounded-xl shadow-2xl shadow-[#e2e8f0]/50 px-4 py-2.5 animate-in fade-in slide-in-from-left-2 duration-200"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        <div className="absolute top-0 -left-4 w-4 h-full" />
                        <span className="text-[13px] font-bold text-[#0f172a] whitespace-nowrap">{menu.menu_name}</span>
                    </div>
                )}
            </Link>
        </div>
    );
}

/** Parent menu with collapsible children */
function ParentItem({
    menu,
    activeCheck,
    collapsed: sidebarCollapsed,
}: {
    menu: Menu;
    activeCheck: (path: string) => boolean;
    collapsed: boolean;
}) {
    const children = menu.children ?? [];
    const hasChildren = children.length > 0;
    const anyChildActive = children.some((c) => activeCheck(c.menu_path));
    const [open, setOpen] = useState(anyChildActive);
    const [isHovered, setIsHovered] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setOpen(anyChildActive);
    }, [anyChildActive]);

    const toggle = useCallback(() => {
        if (!sidebarCollapsed && hasChildren) {
            setOpen((v) => !v);
        }
    }, [sidebarCollapsed, hasChildren]);

    const handleMouseEnter = () => {
        if (sidebarCollapsed) {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (rect) {
                setMenuPos({ top: rect.top, left: rect.right + 10 });
                setIsHovered(true);
            }
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Parent trigger */}
            <button
                ref={buttonRef}
                onClick={toggle}
                disabled={!hasChildren && !sidebarCollapsed}
                title={(sidebarCollapsed && !hasChildren) ? menu.menu_name : undefined}
                className={`
          group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200 select-none
          ${anyChildActive
                        ? "bg-[#f1f5f9] text-[#0f172a] font-semibold"
                        : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                    }
          ${!hasChildren && !sidebarCollapsed ? "cursor-default" : ""}
        `}
            >
                <NavIcon
                    name={menu.menu_icon}
                    className={`w-[18px] h-[18px] shrink-0 ${anyChildActive ? "text-[#0f172a]" : "text-[#94a3b8] group-hover:text-[#475569]"}`}
                />

                {!sidebarCollapsed && (
                    <>
                        <span className="flex-1 text-left text-[13.5px] leading-none  truncate">
                            {menu.menu_name}
                        </span>
                        {hasChildren && (
                            <ChevronDown
                                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""} ${anyChildActive ? "text-[#0f172a]" : "text-[#94a3b8]"}`}
                            />
                        )}
                    </>
                )}

                {/* Floating Menu for Collapsed State */}
                {sidebarCollapsed && isHovered && (
                    <div
                        className="fixed z-[9999] bg-[#ffffff] border border-[#f1f5f9] rounded-2xl shadow-2xl shadow-[#e2e8f0]/50 py-2.5 min-w-[180px] animate-in fade-in slide-in-from-left-2 duration-200"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        <div className="absolute top-0 -left-4 w-4 h-full" />

                        <div className="px-4 py-2 border-b border-[#f8fafc] mb-1.5">
                            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">{menu.menu_name}</span>
                        </div>

                        <div className="px-1.5 space-y-0.5">
                            {hasChildren ? (
                                children.map((child) => {
                                    const active = activeCheck(child.menu_path);
                                    return (
                                        <Link
                                            key={child.menu_id}
                                            href={child.menu_path}
                                            className={`
                                                group flex items-center gap-2.5 px-3 py-2 rounded-lg
                                                transition-all duration-200 select-none
                                                ${active
                                                    ? "bg-[#0f172a] text-white font-semibold"
                                                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                                                }
                                            `}
                                        >
                                            <NavIcon
                                                name={child.menu_icon}
                                                className={`w-3.5 h-3.5 shrink-0 ${active ? "text-white" : "text-[#94a3b8] group-hover:text-[#475569]"}`}
                                            />
                                            <span className="text-[13px] leading-none truncate">
                                                {child.menu_name}
                                            </span>
                                            {active && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                            )}
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-2 text-[12px] italic text-[#94a3b8] select-none">
                                    No child items
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </button>

            {/* Children (Expanded State) */}
            {!sidebarCollapsed && (
                <div
                    className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${open || !hasChildren ? "max-h-[600px] opacity-100 mt-0.5" : "max-h-0 opacity-0"}
          `}
                >
                    <div className="ml-4 pl-4 border-l-2 border-[#e2e8f0] space-y-0.5 py-0.5">
                        {hasChildren ? (
                            children.map((child) => {
                                const active = activeCheck(child.menu_path);
                                return (
                                    <Link
                                        key={child.menu_id}
                                        href={child.menu_path}
                                        data-sidebar-active={active ? "true" : undefined}
                                        className={`
                      group flex items-center gap-2.5 px-3 py-2 rounded-lg
                      transition-all duration-200 select-none
                      ${active
                                                ? "bg-[#0f172a] text-white font-semibold shadow-sm"
                                                : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                                            }
                    `}
                                    >
                                        <NavIcon
                                            name={child.menu_icon}
                                            className={`w-3.5 h-3.5 shrink-0 ${active ? "text-white" : "text-[#94a3b8] group-hover:text-[#475569]"}`}
                                        />
                                        <span className="text-[13px] leading-none truncate">
                                            {child.menu_name}
                                        </span>
                                        {active && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                                        )}
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="px-3 py-2 text-[12px] italic text-[#94a3b8] select-none">
                                No child
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({ sidebarOpen, toggleSidebar, setOpenModal }: SidebarProps) {
    const { groups: ctxGroups, loading: permissionLoading } = useAdminPermissionContext();
    const [groups, setGroups] = useState<MenuGroup[]>([]);
    const pathname = usePathname();

    const isActive = useCallback(
        (path: string) => pathname === path,
        [pathname]
    );

    const { settings, updateSettings } = useSettings();
    const setSidebar = useSidebarStore((state) => state.setSidebar);

    useEffect(() => {
        if (settings.appearance.sidebarStyle === "collapsed") {
            setSidebar(false);
        } else {
            setSidebar(true);
        }
    }, [settings.appearance.sidebarStyle, setSidebar]);

    useEffect(() => {
        setGroups((ctxGroups as MenuGroup[]) ?? []);
    }, [ctxGroups]);

    // Scroll the active menu item into view whenever the route changes
    useEffect(() => {
        const el = document.querySelector<HTMLElement>('[data-sidebar-active="true"]');
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [pathname]);

    const isLoading = permissionLoading;

    return (
        <>
            <aside
                className={`
                    flex flex-col h-full bg-[#ffffff] border-r border-[#f1f5f9]
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${sidebarOpen ? "w-58" : "w-[68px]"}
                `}
            >
                {/* Logo Section */}
                <div className={`flex items-center justify-between h-[64px] border-b border-[#f1f5f9] px-4 shrink-0`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <BrandLogo width={32} height={32} className="h-8 w-8 shrink-0 rounded-xl object-contain" />
                        {sidebarOpen && (
                            <span className="text-[15px] font-bold  text-[#475569] truncate">
                                eFixMate
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-2 no-scrollbar">
                    {!isLoading && groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <SearchX className="w-8 h-8 text-[#cbd5e1] mb-2" />
                            {sidebarOpen && (
                                <p className="text-xs text-[#94a3b8] font-medium">No menus found</p>
                            )}
                        </div>
                    ) : (
                        groups.map((group) => {
                            const tree = buildMenuTree(group.menus);

                            return (
                                <section key={group.menu_group_id} className="mb-4">
                                    {/* Group label */}
                                    {sidebarOpen && (
                                        <p className="px-3 mb-2 text-[10.5px] font-semibold tracking-widest uppercase text-[#94a3b8]">
                                            {group.menu_group}
                                        </p>
                                    )}
                                    {!sidebarOpen && (
                                        <div className="mb-2 border-t border-[#f1f5f9] mx-1" />
                                    )}

                                    <div className="space-y-0.5">
                                        {tree.length === 0 ? (
                                            <p className="px-3 py-2 text-[11px] italic text-[#94a3b8]">
                                                {sidebarOpen ? "No items in this group" : "..."}
                                            </p>
                                        ) : (
                                            tree.map((menu) => (
                                                menu.menu_type === "P" ? (
                                                    <ParentItem
                                                        key={menu.menu_id}
                                                        menu={menu}
                                                        activeCheck={isActive}
                                                        collapsed={!sidebarOpen}
                                                    />
                                                ) : (
                                                    <IndependentItem
                                                        key={menu.menu_id}
                                                        menu={menu}
                                                        isActive={isActive(menu.menu_path)}
                                                        collapsed={!sidebarOpen}
                                                    />
                                                )
                                            ))
                                        )}
                                    </div>
                                </section>
                            );
                        })
                    )}
                </nav>

                {/* Profile */}
                <div className={`shrink-0 px-3 pt-4 border-t border-[#f1f5f9]`}>
                    <Link
                        href="/admin/settings/profile"
                        title={!sidebarOpen ? "Profile" : undefined}
                        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            transition-all duration-200 select-none
                            ${isActive("/admin/settings/profile")
                                ? "bg-[#0f172a] text-white shadow-sm"
                                : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                            }
                        `}
                    >
                        <User className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive("/admin/settings/profile") ? "text-white" : "text-[#94a3b8] group-hover:text-[#475569]"}`} />
                        {sidebarOpen && (
                            <span className="text-[13.5px] leading-none">
                                Profile
                            </span>
                        )}
                        {!sidebarOpen && (
                            <div className="
                                pointer-events-none absolute left-full ml-3 z-50
                                bg-[#1e293b] text-[#ffffff] text-xs
                                px-2.5 py-1.5 rounded-lg whitespace-nowrap
                                opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                                transition-all duration-150 shadow-lg
                            ">
                                Profile
                            </div>
                        )}
                    </Link>
                </div>

                {/* Sign out */}
                <div className={`shrink-0 px-3 pb-4 pt-2`}>
                    <button
                        onClick={() => setOpenModal(true)}
                        title={!sidebarOpen ? "Sign Out" : undefined}
                        className="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-[#475569] hover:bg-[#fef2f2] hover:text-[#dc2626]
                            transition-all duration-200 select-none cursor-pointer"
                    >
                        <LogOut className="w-[18px] h-[18px] shrink-0 text-[#94a3b8] group-hover:text-[#dc2626] transition-colors" />
                        {sidebarOpen && (
                            <span className="text-[13.5px] leading-none">
                                Sign Out
                            </span>
                        )}
                        {!sidebarOpen && (
                            <div className="
                                pointer-events-none absolute left-full ml-3 z-50
                                bg-[#1e293b] text-[#ffffff] text-xs
                                px-2.5 py-1.5 rounded-lg whitespace-nowrap
                                opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                                transition-all duration-150 shadow-lg
                            ">
                                Sign Out
                            </div>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
