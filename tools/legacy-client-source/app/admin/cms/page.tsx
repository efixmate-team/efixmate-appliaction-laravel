"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Globe,
  LayoutTemplate,
  Loader2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Home,
  Users,
  Phone,
  Briefcase,
  HelpCircle,
  Shield,
  FileCheck,
} from "lucide-react";
import { GET } from "@/lib/api/coreClient";

const PAGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  home: Home,
  about: Users,
  contact: Phone,
  careers: Briefcase,
  services: Briefcase,
  "how-it-works": HelpCircle,
  "privacy-policy": Shield,
  "terms-and-conditions": FileCheck,
  "refund-policy": FileCheck,
  "cancellation-policy": FileCheck,
};

type CmsPage = {
  page_id: number;
  slug: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  section_count: number;
};

export default function CmsHubPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GET("/admin/cms/pages") as { status: boolean; data: CmsPage[] };
      if (res.status && Array.isArray(res.data)) {
        setPages(res.data);
      } else {
        setError("Failed to load CMS pages.");
      }
    } catch {
      setError("Network error. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutTemplate size={20} className="text-[#2563eb]" />
            <h1 className="text-xl font-bold text-[#111827]">Content Management</h1>
          </div>
          <p className="text-sm text-[#6b7280]">
            Edit dynamic text, stats, links, and section content for every public-facing page.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchPages}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#ffffff] px-3 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Global sections banner */}
      <Link
        href="/admin/cms/globals"
        className="flex items-center justify-between rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-5 py-4 hover:bg-[#dbeafe] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#2563eb] text-[#ffffff]">
            <Globe size={18} />
          </span>
          <div>
            <p className="font-semibold text-[#1e40af]">Global Sections</p>
            <p className="text-xs text-[#3b82f6]">
              Contact info · Social links · Brand description · Stats · Footer links · Service areas
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#3b82f6]" />
      </Link>

      {/* Pages grid */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[#6b7280]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading pages…</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            Pages — click to edit sections
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => {
              const Icon = PAGE_ICONS[page.slug] ?? FileText;
              return (
                <Link
                  key={page.page_id}
                  href={`/admin/cms/${page.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-4 shadow-sm transition hover:border-[#93c5fd] hover:shadow-md"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eff6ff] text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-[#ffffff]">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#111827]">{page.name}</p>
                    <p className="truncate text-xs text-[#9ca3af]">
                      /{page.slug} · {page.section_count} section{page.section_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!page.is_active && (
                      <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-semibold text-[#92400e]">
                        Inactive
                      </span>
                    )}
                    <ChevronRight size={14} className="text-[#d1d5db] transition group-hover:text-[#2563eb]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Info footer */}
      <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-5 py-4 text-sm text-[#6b7280]">
        <p className="font-medium text-[#374151] mb-1">How this works</p>
        <ul className="space-y-1 list-disc list-inside text-xs">
          <li>Each page has content <strong>sections</strong> — hero text, stats, testimonials, FAQs, etc.</li>
          <li><strong>Global sections</strong> (footer, social links, contact info) are shared across all pages.</li>
          <li>Changes are live immediately after saving — no redeploy needed.</li>
          <li>The frontend falls back to hardcoded defaults if a section is missing or inactive.</li>
        </ul>
      </div>
    </div>
  );
}
