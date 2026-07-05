"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Globe,
  ToggleLeft,
  ToggleRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { GET, PUT, PATCH, POST } from "@/lib/api/coreClient";

type CmsSection = {
  section_id: number;
  page_id?: number | null;
  section_key: string;
  label: string;
  section_type: string;
  is_global: boolean;
  is_active: boolean;
  content: unknown;
  sort_order: number;
  updated_at: string | null;
  updated_by: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const TYPE_COLOR: Record<string, string> = {
  hero:         "bg-[#eff6ff] text-[#2563eb]",
  stats:        "bg-[#f0fdf4] text-[#16a34a]",
  testimonials: "bg-[#fdf4ff] text-[#9333ea]",
  faq:          "bg-[#fff7ed] text-[#ea580c]",
  cta:          "bg-[#fefce8] text-[#ca8a04]",
  contact:      "bg-[#f0f9ff] text-[#0284c7]",
  navigation:   "bg-[#f8fafc] text-[#475569]",
  rich_text:    "bg-[#fdf2f8] text-[#db2777]",
  other:        "bg-[#f1f5f9] text-[#64748b]",
};

function sectionTypeLabel(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function JsonEditor({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        spellCheck={false}
        className={`w-full rounded-lg border bg-[#0f172a] p-4 font-mono text-[12.5px] leading-relaxed text-[#e2e8f0] outline-none transition focus:ring-2 ${
          error
            ? "border-[#ef4444] focus:ring-[#ef4444]/20"
            : "border-[#334155] focus:ring-[#3b82f6]/30"
        }`}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-[#ef4444]">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  section,
  onSave,
  onToggle,
}: {
  section: CmsSection;
  onSave: (key: string, content: unknown) => Promise<void>;
  onToggle: (key: string, active: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState(() => JSON.stringify(section.content, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const validate = (text: string): unknown | null => {
    try {
      return JSON.parse(text);
    } catch (e) {
      setParseError((e as Error).message);
      return null;
    }
  };

  const handleChange = (text: string) => {
    setRaw(text);
    setParseError(null);
    setSaveState("idle");
  };

  const handleSave = async () => {
    const parsed = validate(raw);
    if (parsed === null) return;
    setSaveState("saving");
    try {
      await onSave(section.section_key, parsed);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
    }
  };

  const handleToggle = async () => {
    await onToggle(section.section_key, !section.is_active);
  };

  const colorClass = TYPE_COLOR[section.section_type] ?? TYPE_COLOR.other;
  const isDirty = raw !== JSON.stringify(section.content, null, 2);

  return (
    <div className={`rounded-xl border bg-[#ffffff] transition-all ${open ? "border-[#93c5fd] shadow-md" : "border-[#e5e7eb]"}`}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colorClass}`}>
          {sectionTypeLabel(section.section_type)}
        </span>
        {section.is_global && (
          <span className="flex items-center gap-1 shrink-0 rounded-md bg-[#f0f9ff] px-1.5 py-0.5 text-[10px] font-bold text-[#0284c7]">
            <Globe size={9} /> Global
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#111827]">{section.label}</p>
          <p className="text-xs text-[#9ca3af]">{section.section_key}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!section.is_active && (
            <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-semibold text-[#92400e]">Inactive</span>
          )}
          {isDirty && !open && (
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" title="Unsaved changes" />
          )}
          {open ? <ChevronDown size={14} className="text-[#6b7280]" /> : <ChevronRight size={14} className="text-[#6b7280]" />}
        </div>
      </button>

      {/* Editor panel */}
      {open && (
        <div className="border-t border-[#e5e7eb] px-5 pb-5 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6b7280]">
              Edit the JSON content below. Arrays use <code className="rounded bg-[#f1f5f9] px-1">[]</code>, objects use{" "}
              <code className="rounded bg-[#f1f5f9] px-1">{"{}"}</code>.
              {section.updated_at && (
                <> Last saved {new Date(section.updated_at).toLocaleDateString()} by {section.updated_by ?? "—"}</>
              )}
            </p>
            <button
              type="button"
              onClick={handleToggle}
              className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280] hover:text-[#374151]"
            >
              {section.is_active ? (
                <><ToggleRight size={16} className="text-[#16a34a]" /> Active</>
              ) : (
                <><ToggleLeft size={16} className="text-[#9ca3af]" /> Inactive</>
              )}
            </button>
          </div>

          <JsonEditor value={raw} onChange={handleChange} error={parseError} />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setRaw(JSON.stringify(section.content, null, 2)); setParseError(null); setSaveState("idle"); }}
              className="text-xs text-[#9ca3af] hover:text-[#374151] underline"
            >
              Reset to saved
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving" || !!parseError}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                saveState === "saved"
                  ? "bg-[#dcfce7] text-[#16a34a]"
                  : saveState === "error"
                  ? "bg-[#fee2e2] text-[#b91c1c]"
                  : "bg-[#2563eb] text-[#ffffff] hover:bg-[#1d4ed8]"
              }`}
            >
              {saveState === "saving" ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : saveState === "saved" ? (
                <><CheckCircle size={14} /> Saved</>
              ) : saveState === "error" ? (
                <><AlertCircle size={14} /> Error</>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CmsPageEditor() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const [sections, setSections] = useState<CmsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageName, setPageName] = useState(slug);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newKey, setNewKey] = useState(`${slug}.`);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("other");
  const [newContent, setNewContent] = useState("{}");
  const [creating, setCreating] = useState(false);

  const loadSections = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await GET(`/admin/cms/pages/${slug}/sections`) as { status: boolean; data: CmsSection[] };
      if (res.status && Array.isArray(res.data)) {
        setSections(res.data);
        setPageName(slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      } else {
        setError("Failed to load sections.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadSections(); }, [loadSections]);

  const handleSave = async (key: string, content: unknown) => {
    const res = await PUT(`/admin/cms/sections/${key}`, { content }) as { status: boolean };
    if (!res.status) throw new Error("Save failed");
    setSections((prev) =>
      prev.map((s) => (s.section_key === key ? { ...s, content, updated_at: new Date().toISOString() } : s)),
    );
  };

  const handleToggle = async (key: string, active: boolean) => {
    const res = await PATCH(`/admin/cms/sections/${key}/toggle`, { is_active: active }) as { status: boolean };
    if (!res.status) throw new Error("Toggle failed");
    setSections((prev) =>
      prev.map((s) => (s.section_key === key ? { ...s, is_active: active } : s)),
    );
  };

  const handleCreate = async () => {
    if (!newKey.trim() || !newLabel.trim()) return;
    let parsedContent: unknown;
    try { parsedContent = JSON.parse(newContent); } catch { return; }
    setCreating(true);
    try {
      const res = await POST("/admin/cms/sections", {
        section_key: newKey.trim(),
        label: newLabel.trim(),
        section_type: newType,
        page_slug: slug,
        is_global: false,
        content: parsedContent,
        sort_order: sections.length + 1,
      }) as { status: boolean; data: CmsSection };
      if (res.status && res.data) {
        setSections((prev) => [...prev, res.data]);
        setShowNewForm(false);
        setNewKey(`${slug}.`);
        setNewLabel("");
        setNewContent("{}");
      }
    } finally {
      setCreating(false);
    }
  };

  const pageSections = sections.filter((s) => !s.is_global);
  const globalSections = sections.filter((s) => s.is_global);

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6b7280]">
        <Link href="/admin/cms" className="flex items-center gap-1 hover:text-[#2563eb]">
          <ArrowLeft size={14} /> CMS
        </Link>
        <ChevronRight size={12} />
        <span className="font-semibold text-[#111827]">{pageName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">{pageName} — Sections</h1>
          <p className="text-sm text-[#6b7280]">
            Edit each section&apos;s content. Changes go live immediately after saving.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSections}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#ffffff] px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => setShowNewForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#1d4ed8]"
          >
            <Plus size={14} /> New Section
          </button>
        </div>
      </div>

      {/* New section form */}
      {showNewForm && (
        <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-5 space-y-3">
          <p className="font-semibold text-[#1e40af]">Create New Section</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Section Key</label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={`${slug}.my_section`}
                className="w-full rounded-lg border border-[#d1d5db] bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#eff6ff]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Label</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Human-readable name"
                className="w-full rounded-lg border border-[#d1d5db] bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#eff6ff]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-lg border border-[#d1d5db] bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#3b82f6]"
            >
              {["hero","stats","testimonials","faq","cta","contact","navigation","rich_text","other"].map((t) => (
                <option key={t} value={t}>{sectionTypeLabel(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#374151]">Initial Content (JSON)</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[#d1d5db] bg-[#0f172a] p-3 font-mono text-[12px] text-[#e2e8f0] outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[#6b7280]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading sections...</span>
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
          {/* Page-specific sections */}
          {pageSections.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
                Page Sections ({pageSections.length})
              </h2>
              {pageSections.map((s) => (
                <SectionCard key={s.section_key} section={s} onSave={handleSave} onToggle={handleToggle} />
              ))}
            </div>
          )}

          {/* Global sections (read context) */}
          {globalSections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
                  Global Sections - also shown on this page
                </h2>
                <Link
                  href="/admin/cms/globals"
                  className="text-xs text-[#2563eb] hover:underline"
                >
                  Edit globals
                </Link>
              </div>
              {globalSections.map((s) => (
                <SectionCard key={s.section_key} section={s} onSave={handleSave} onToggle={handleToggle} />
              ))}
            </div>
          )}

          {sections.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-12 text-center text-sm text-[#9ca3af]">
              No sections found for this page. Use &quot;New Section&quot; to add one.
            </div>
          )}
        </>
      )}
    </div>
  );
}
