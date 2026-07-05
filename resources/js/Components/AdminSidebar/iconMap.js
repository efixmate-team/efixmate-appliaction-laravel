import {
    Activity, AlertCircle, AlertTriangle, ArrowUpRight, BarChart2, Bell, Building,
    Calendar, CalendarClock, CalendarDays, Circle, ClipboardList, Clock,
    ContactRound, Copy, CreditCard, DollarSign, ExternalLink, FileText, GitBranch, Globe,
    Headphones, History, Home, Image, Info, Key, KeyRound, Landmark, Languages,
    LayoutDashboard, LayoutGrid, LayoutTemplate, List, Mail, Map, MapPin, MapPinned,
    Megaphone, Menu, MessageCircle, Monitor, Percent, Phone, Radio, Receipt, RefreshCw,
    Scale, Search, Settings2, Share2, Shield, ShieldAlert, ShieldCheck, Sparkles, Tags, Ticket,
    TrendingUp, User, Users, Wallet, Wrench, XCircle, Zap,
} from '@lucide/vue';

// Direct port of Sidebar.tsx's ICON_MAP — same lucide icon set, keyed by the
// AdminMenu.menu_icon string stored in the database so this stays diffable
// against the Next.js source.
export const ICON_MAP = {
    Activity, AlertCircle, AlertTriangle, ArrowUpRight, BarChart2, Bell, Building,
    Calendar, CalendarClock, CalendarDays, Circle, ClipboardList, Clock,
    ContactRound, Copy, CreditCard, DollarSign, ExternalLink, FileText, GitBranch, Globe,
    Headphones, History, Home, Image, Info, Key, KeyRound, Landmark, Languages,
    LayoutDashboard, LayoutGrid, LayoutTemplate, List, Mail, Map, MapPin, MapPinned,
    Megaphone, Menu, MessageCircle, Monitor, Percent, Phone, Radio, Receipt, RefreshCw,
    Scale, Search, Settings2, Share2, Shield, ShieldAlert, ShieldCheck, Sparkles, Tags, Ticket,
    TrendingUp, User, Users, Wallet, Wrench, XCircle, Zap,
};

export function resolveIcon(name) {
    return ICON_MAP[name] ?? Circle;
}

/** Direct port of Sidebar.tsx's buildMenuTree(). */
export function buildMenuTree(menus) {
    const parents = [];
    const independents = [];
    const childrenMap = {};

    menus.forEach((m) => {
        if (m.menu_type === 'C' && m.menu_parent_id != null) {
            if (!childrenMap[m.menu_parent_id]) childrenMap[m.menu_parent_id] = [];
            childrenMap[m.menu_parent_id].push(m);
        } else if (m.menu_type === 'P') {
            parents.push(m);
        } else {
            independents.push(m);
        }
    });

    return [...independents, ...parents].map((m) =>
        m.menu_type === 'P' ? { ...m, children: childrenMap[m.menu_id] ?? [] } : m
    );
}
