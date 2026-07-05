"use client";

import { useEffect, useMemo, useState } from "react";
import { FileArchive, FileImage, FileText, Loader2, RotateCcw, Save, Video } from "lucide-react";
import { adminAPI } from "@/lib/api";

type UploadPolicy = {
  images: {
    enabled: boolean;
    maxUploadMb: number;
    targetMb: number;
    outputFormat: "webp";
    acceptedFormats: string[];
  };
  documents: {
    enabled: boolean;
    maxUploadMb: number;
    targetMb: number;
    acceptedFormats: string[];
  };
  videos: {
    maxUploadMb: number;
    acceptedFormats: string[];
  };
};

const DEFAULT_POLICY: UploadPolicy = {
  images: {
    enabled: true,
    maxUploadMb: 10,
    targetMb: 1,
    outputFormat: "webp",
    acceptedFormats: ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif", "bmp", "tiff"],
  },
  documents: {
    enabled: true,
    maxUploadMb: 10,
    targetMb: 1,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png", "webp"],
  },
  videos: {
    maxUploadMb: 10,
    acceptedFormats: ["mp4", "mov", "avi", "mkv", "webm", "m4v"],
  },
};

const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif", "bmp", "tiff"];
const DOCUMENT_FORMATS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "jpg", "jpeg", "png", "webp"];
const VIDEO_FORMATS = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];

function mergePolicy(raw: Partial<UploadPolicy> | null | undefined): UploadPolicy {
  return {
    images: { ...DEFAULT_POLICY.images, ...(raw?.images || {}) },
    documents: { ...DEFAULT_POLICY.documents, ...(raw?.documents || {}) },
    videos: { ...DEFAULT_POLICY.videos, ...(raw?.videos || {}) },
  };
}

function clampMb(value: number, min = 0.1, max = 10) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function FormatGrid({
  formats,
  selected,
  onChange,
}: {
  formats: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {formats.map((format) => {
        const checked = selectedSet.has(format);
        return (
          <label
            key={format}
            className={`flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
              checked
                ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
                : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1]"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => {
                if (event.target.checked) onChange([...selected, format]);
                else onChange(selected.filter((item) => item !== format));
              }}
              className="h-4 w-4 accent-[#2563eb]"
            />
            .{format}
          </label>
        );
      })}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix = "MB",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">{label}</span>
      <div className="flex h-10 overflow-hidden rounded-md border border-[#cbd5e1] bg-white">
        <input
          type="number"
          min="0.1"
          max="10"
          step="0.1"
          value={value}
          onChange={(event) => onChange(clampMb(Number(event.target.value)))}
          className="min-w-0 flex-1 px-3 text-sm font-semibold text-[#0f172a] outline-none"
        />
        <span className="flex w-14 items-center justify-center border-l border-[#e2e8f0] bg-[#f8fafc] text-xs font-bold text-[#64748b]">
          {suffix}
        </span>
      </div>
    </label>
  );
}

export default function AdminSettingsPage() {
  const [policy, setPolicy] = useState<UploadPolicy>(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const res = await adminAPI.getUploadSettings();
      if (!alive) return;
      if (res?.status) setPolicy(mergePolicy(res.data));
      else setMessage(res?.message || "Upload settings could not be loaded");
      setLoading(false);
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await adminAPI.updateUploadSettings(policy);
    if (res?.status) {
      setPolicy(mergePolicy(res.data));
      setMessage("Upload settings saved.");
    } else {
      setMessage(res?.message || "Upload settings could not be saved");
    }
    setSaving(false);
  }

  function update<K extends keyof UploadPolicy>(group: K, values: Partial<UploadPolicy[K]>) {
    setPolicy((current) => ({
      ...current,
      [group]: { ...current[group], ...values },
    }));
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Settings</h1>
          <p className="mt-1 text-sm text-[#64748b]">Control upload formats, size limits, and compression targets.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPolicy(DEFAULT_POLICY);
              setMessage("");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc]"
          >
            <RotateCcw className="h-4 w-4" />
            Defaults
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2563eb] px-4 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm font-medium text-[#1d4ed8]">
          {message}
        </div>
      )}

      <section className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <FileImage className="h-5 w-5 text-[#2563eb]" />
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">Images</h2>
            <p className="text-sm text-[#64748b]">Accepted image uploads are converted to WebP by the optimizer.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <NumberField label="Max upload size" value={policy.images.maxUploadMb} onChange={(maxUploadMb) => update("images", { maxUploadMb })} />
          <NumberField label="Compress target" value={policy.images.targetMb} onChange={(targetMb) => update("images", { targetMb })} />
          <label className="flex h-10 items-center gap-2 self-end rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 text-sm font-semibold text-[#334155]">
            <input
              type="checkbox"
              checked={policy.images.enabled}
              onChange={(event) => update("images", { enabled: event.target.checked })}
              className="h-4 w-4 accent-[#2563eb]"
            />
            Run image optimizer
          </label>
        </div>
        <div className="mt-4">
          <FormatGrid formats={IMAGE_FORMATS} selected={policy.images.acceptedFormats} onChange={(acceptedFormats) => update("images", { acceptedFormats })} />
        </div>
      </section>

      <section className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#0891b2]" />
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">Documents</h2>
            <p className="text-sm text-[#64748b]">Documents pass through the compressor when processing is enabled.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <NumberField label="Max upload size" value={policy.documents.maxUploadMb} onChange={(maxUploadMb) => update("documents", { maxUploadMb })} />
          <NumberField label="Compress target" value={policy.documents.targetMb} onChange={(targetMb) => update("documents", { targetMb })} />
          <label className="flex h-10 items-center gap-2 self-end rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 text-sm font-semibold text-[#334155]">
            <input
              type="checkbox"
              checked={policy.documents.enabled}
              onChange={(event) => update("documents", { enabled: event.target.checked })}
              className="h-4 w-4 accent-[#0891b2]"
            />
            Run document compressor
          </label>
        </div>
        <div className="mt-4">
          <FormatGrid formats={DOCUMENT_FORMATS} selected={policy.documents.acceptedFormats} onChange={(acceptedFormats) => update("documents", { acceptedFormats })} />
        </div>
      </section>

      <section className="rounded-lg border border-[#e2e8f0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Video className="h-5 w-5 text-[#7c3aed]" />
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">Videos</h2>
            <p className="text-sm text-[#64748b]">Videos are validated by size and format and are not sent to image or document compression.</p>
          </div>
        </div>
        <div className="mb-4 max-w-sm">
          <NumberField label="Max upload size" value={policy.videos.maxUploadMb} onChange={(maxUploadMb) => update("videos", { maxUploadMb })} />
        </div>
        <FormatGrid formats={VIDEO_FORMATS} selected={policy.videos.acceptedFormats} onChange={(acceptedFormats) => update("videos", { acceptedFormats })} />
      </section>

      <section className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-5">
        <div className="flex items-start gap-3">
          <FileArchive className="mt-0.5 h-5 w-5 text-[#475569]" />
          <p className="text-sm leading-6 text-[#475569]">
            Uploads are still protected by a hard 10 MB ceiling. Compression targets and allowed formats apply to user,
            technician, and admin API uploads that use the shared upload middleware.
          </p>
        </div>
      </section>
    </div>
  );
}
