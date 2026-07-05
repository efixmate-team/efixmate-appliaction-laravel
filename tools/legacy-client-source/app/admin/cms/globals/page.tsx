"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Globe,
  Loader2,
  AlertCircle,
  RefreshCw,
  Save,
  CheckCircle,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { GET, PUT, PATCH } from "@/lib/api/coreClient";

type CmsSection = {
  section_id: number;
  section_key: string;
  label: string;
  section_type: string;
  is_active: boolean;
  content: unknown;
  sort_order: number;
  updated_at: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const TYPE_COLOR: Record<string, string> = {
  hero:         "bg-[#eff6ff] text-[#2563eb]",
  stats:        "bg-[#f0fdf4] text-[#16a34a]",
  contact:      "bg-[#f0f9ff] text-[#0284c7]",
  navigation:   "bg-[#f8fafc] text-[#475569]",
  other:        "bg-[#f1f5f9] text-[#64748b]",
};

const GLOBAL_DESCRIPTIONS: Record<string, string> = {
  "global.contact_info":          "Phone number, email address, and office address shown in the footer and contact page.",
  "global.social_links":          "Instagram, LinkedIn, and X (Twitter) links shown in the footer.",
  "global.brand":                 "Brand name, tagline, and footer description.",
  "global.stats":                 "Key stats shown on the home page and about page (customers, technicians, jobs, rating).",
  "global.footer_quick_links":    "Main nav links shown in the footer (Home, Services, About, etc.).",
  "global.footer_support_links":  "Support/policy links shown in the footer.",
  "global.service_areas":         "Cities where eFixMate is active.",
};

// ─── Contact Info Form ────────────────────────────────────────────────────────
function ContactInfoEditor({
  content,
  onContentChange,
}: {
  content: Record<string, string>;
  onContentChange: (c: Record<string, string>) => void;
}) {
  const field = (
    key: string,
    label: string,
    hint: string,
    type: "text" | "email" | "tel" | "textarea" = "text",
  ) => (
    <div>
      <label className="block text-xs font-semibold text-[#374151] mb-1">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={content[key] ?? ""}
          onChange={(e) => onContentChange({ ...content, [key]: e.target.value })}
          rows={3}
          placeholder={hint}
          className="w-full resize-none rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
        />
      ) : (
        <input
          type={type}
          value={content[key] ?? ""}
          onChange={(e) => onContentChange({ ...content, [key]: e.target.value })}
          placeholder={hint}
          className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
        />
      )}
      <p className="mt-1 text-[11px] text-[#9ca3af]">{hint}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {field("phone", "Mobile Number", "e.g. +91 99930 61058 — shown in footer, contact page & FAQs", "tel")}
      {field("email", "Email Address", "e.g. support@efixmate.com — shown in footer & contact page", "email")}
      {field("address", "Office Address", "Full address shown in footer & contact page", "textarea")}
    </div>
  );
}

function GlobalSectionCard({ section, onSave, onToggle }: {
  section: CmsSection;
  onSave: (key: string, content: unknown) => Promise<void>;
  onToggle: (key: string, active: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState(() => JSON.stringify(section.content, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const isContactInfo = section.section_key === "global.contact_info";

  const handleChange = (text: string) => {
    setRaw(text);
    setParseError(null);
    setSaveState("idle");
  };

  const handleContactChange = (updated: Record<string, string>) => {
    setRaw(JSON.stringify(updated, null, 2));
    setParseError(null);
    setSaveState("idle");
  };

  const handleSave = async () => {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch (e) { setParseError((e as Error).message); return; }
    setSaveState("saving");
    try {
      await onSave(section.section_key, parsed);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch { setSaveState("error"); }
  };

  const colorClass = TYPE_COLOR[section.section_type] ?? TYPE_COLOR.other;
  const isDirty = raw !== JSON.stringify(section.content, null, 2);
  const desc = GLOBAL_DESCRIPTIONS[section.section_key] ?? "";

  let parsedContact: Record<string, string> = {};
  if (isContactInfo) {
    try { parsedContact = JSON.parse(raw) as Record<string, string>; } catch { /* keep empty */ }
  }

  return (
    <div className={`rounded-xl border bg-[#ffffff] transition-all ${open ? "border-[#93c5fd] shadow-md" : "border-[#e5e7eb]"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colorClass}`}>
          {section.section_type.replace(/_/g, " ")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#111827]">{section.label}</p>
          {desc && <p className="truncate text-xs text-[#9ca3af]">{desc}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!section.is_active && (
            <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-semibold text-[#92400e]">Inactive</span>
          )}
          {isDirty && !open && <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />}
          {open ? <ChevronDown size={14} className="text-[#6b7280]" /> : <ChevronRight size={14} className="text-[#6b7280]" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#e5e7eb] px-5 pb-5 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6b7280]">
              Key: <code className="rounded bg-[#f1f5f9] px-1 text-[#374151]">{section.section_key}</code>
              {section.updated_at && (
                <> · Last saved {new Date(section.updated_at).toLocaleDateString()}</>
              )}
            </p>
            <button
              type="button"
              onClick={() => onToggle(section.section_key, !section.is_active)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280] hover:text-[#374151]"
            >
              {section.is_active
                ? <><ToggleRight size={16} className="text-[#16a34a]" /> Active</>
                : <><ToggleLeft size={16} className="text-[#9ca3af]" /> Inactive</>}
            </button>
          </div>

          {isContactInfo ? (
            <ContactInfoEditor content={parsedContact} onContentChange={handleContactChange} />
          ) : (
            <textarea
              value={raw}
              onChange={(e) => handleChange(e.target.value)}
              rows={12}
              spellCheck={false}
              className={`w-full rounded-lg border bg-[#0f172a] p-4 font-mono text-[12.5px] leading-relaxed text-[#e2e8f0] outline-none transition focus:ring-2 ${
                parseError ? "border-[#ef4444] focus:ring-[#ef4444]/20" : "border-[#334155] focus:ring-[#3b82f6]/30"
              }`}
            />
          )}
          {parseError && (
            <p className="flex items-center gap-1.5 text-xs text-[#ef4444]">
              <AlertCircle size={12} /> {parseError}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setRaw(JSON.stringify(section.content, null, 2)); setParseError(null); setSaveState("idle"); }}
              className="text-xs text-[#9ca3af] hover:text-[#374151] underline"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving" || !!parseError}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                saveState === "saved" ? "bg-[#dcfce7] text-[#16a34a]"
                : saveState === "error" ? "bg-[#fee2e2] text-[#b91c1c]"
                : "bg-[#2563eb] text-[#ffffff] hover:bg-[#1d4ed8]"
              }`}
            >
              {saveState === "saving" ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
               : saveState === "saved" ? <><CheckCircle size={14} /> Saved</>
               : saveState === "error" ? <><AlertCircle size={14} /> Error</>
               : <><Save size={14} /> Save</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CmsGlobalsPage() {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GET("/admin/cms/globals") as { status: boolean; data: CmsSection[] };
      if (res.status && Array.isArray(res.data)) {
        setSections(res.data);
      } else {
        setError("Failed to load global sections.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (key: string, content: unknown) => {
    const res = await PUT(`/admin/cms/sections/${key}`, { content }) as { status: boolean };
    if (!res.status) throw new Error("Save failed");
    setSections((prev) =>
      prev.map((s) => s.section_key === key ? { ...s, content, updated_at: new Date().toISOString() } : s),
    );
  };

  const handleToggle = async (key: string, active: boolean) => {
    const res = await PATCH(`/admin/cms/sections/${key}/toggle`, { is_active: active }) as { status: boolean };
    if (!res.status) throw new Error("Toggle failed");
    setSections((prev) => prev.map((s) => s.section_key === key ? { ...s, is_active: active } : s));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6b7280]">
        <Link href="/admin/cms" className="flex items-center gap-1 hover:text-[#2563eb]">
          <ArrowLeft size={14} /> CMS
        </Link>
        <ChevronRight size={12} />
        <span className="font-semibold text-[#111827]">Global Sections</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#2563eb] text-[#ffffff]">
            <Globe size={18} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[#111827]">Global Sections</h1>
            <p className="text-sm text-[#6b7280]">Shared across all public pages — footer, brand, contact info, social links.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#ffffff] px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[#6b7280]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}
      {!loading && !error && (
        <div className="space-y-3">
          {sections.map((s) => (
            <GlobalSectionCard key={s.section_key} section={s} onSave={handleSave} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
