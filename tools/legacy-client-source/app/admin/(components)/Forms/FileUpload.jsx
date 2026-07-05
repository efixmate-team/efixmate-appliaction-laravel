'use client';

import { useEffect, useRef, useState } from "react";
import {
  UploadCloud, FilePlus, X, FileText, AlertCircle,
  Image as ImageIcon, Link2,
} from "lucide-react";
import { cn, Label, ErrorMsg } from "./formUtils";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtAcceptHint(accept) {
  if (!accept) return null;
  return accept
    .split(",")
    .map((a) => a.trim().replace(/^image\//, "").replace(/^\./, "").toUpperCase())
    .filter(Boolean)
    .join(", ");
}

function isImageType(accept) {
  return !accept || accept.includes("image");
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * FileUpload — premium drop-zone component.
 *
 * Props
 * ─────
 * @param {string}            title        - Label shown above the drop zone
 * @param {boolean}           required     - Marks field as required (shows error on submit)
 * @param {string}            error        - External error message
 * @param {string}            accept       - MIME / ext filter  e.g. "image/*"  ".pdf,.docx"
 * @param {boolean}           multiple     - Allow selecting multiple files at once
 * @param {number}            maxSizeMB    - Per-file size cap in MB
 * @param {number}            maxFiles     - Max total files (multiple mode)
 * @param {File|File[]|null}  value        - Controlled value (omit for uncontrolled)
 * @param {string}            previewUrl   - Existing URL shown as preview (single image)
 * @param {()=>void}          onClearUrl   - Called when user removes the previewUrl image
 * @param {Function}          onChange     - (file | File[] | null) => void
 * @param {boolean}           disabled
 * @param {string}            className
 */
export default function FileUpload({
  title,
  required = false,
  error,
  accept = "image/*",
  multiple = false,
  maxSizeMB,
  maxFiles,
  value,
  previewUrl,
  onClearUrl,
  onChange,
  name,
  id,
  disabled = false,
  className,
  // legacy compat — accepted but unused
  placeholder: _placeholder,
}) {
  const isImage    = isImageType(accept);
  const isMultiple = multiple || (maxFiles != null && maxFiles > 1);
  const fileLimit  = maxFiles ?? (isMultiple ? 10 : 1);
  const maxBytes   = maxSizeMB ? maxSizeMB * 1024 * 1024 : null;

  const inputRef             = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touched,    setTouched]    = useState(false);
  const [sizeError,  setSizeError]  = useState(null);

  // ── controlled / uncontrolled value → normalise to array ─────────────────
  const [internalFiles, setInternalFiles] = useState([]);
  const isControlled = value !== undefined;
  const files = isControlled
    ? (value ? (Array.isArray(value) ? value : [value]) : [])
    : internalFiles;

  // ── single-mode blob URL ──────────────────────────────────────────────────
  const [blobUrl, setBlobUrl] = useState(null);
  useEffect(() => {
    if (files[0] && isImage && !isMultiple) {
      const url = URL.createObjectURL(files[0]);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBlobUrl(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files[0]?.name, files[0]?.size, isImage, isMultiple]);

  const singlePreview = blobUrl || (!isMultiple ? previewUrl || "" : "");

  // ── multiple-mode blob URLs ───────────────────────────────────────────────
  const [multiUrls, setMultiUrls] = useState([]);
  useEffect(() => {
    if (!isImage || !isMultiple || !files.length) { setMultiUrls([]); return; }
    const urls = files.map((f) => URL.createObjectURL(f));
    setMultiUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.map((f) => f.name + f.size).join("|"), isImage, isMultiple]);

  // ── add files ─────────────────────────────────────────────────────────────
  const handleFiles = (incoming) => {
    if (!incoming?.length) return;
    setSizeError(null);
    setTouched(true);
    const arr = Array.from(incoming);

    if (maxBytes) {
      const tooBig = arr.find((f) => f.size > maxBytes);
      if (tooBig) {
        setSizeError(`"${tooBig.name}" exceeds the ${maxSizeMB} MB limit.`);
        return;
      }
    }

    if (!isMultiple) {
      const file = arr[0] ?? null;
      if (!isControlled) setInternalFiles(file ? [file] : []);
      onChange?.(file);
    } else {
      const merged = [...files, ...arr].slice(0, fileLimit);
      if (!isControlled) setInternalFiles(merged);
      onChange?.(merged);
    }
  };

  // ── remove a file ─────────────────────────────────────────────────────────
  const removeFile = (idx) => {
    setSizeError(null);
    if (inputRef.current) inputRef.current.value = "";
    if (!isMultiple) {
      if (!isControlled) setInternalFiles([]);
      onChange?.(null);
    } else {
      const next = files.filter((_, i) => i !== idx);
      if (!isControlled) setInternalFiles(next);
      onChange?.(next);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const canAddMore    = isMultiple ? files.length < fileLimit : !files[0] && !singlePreview;
  const showRequired  = touched && required && !files.length && !singlePreview;
  const errorMsg      = sizeError || error;
  const hint          = [
    fmtAcceptHint(accept),
    maxSizeMB  ? `Max ${maxSizeMB} MB`       : null,
    isMultiple ? `Up to ${fileLimit} files`  : null,
  ].filter(Boolean).join("  ·  ");

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col gap-3", className)}>

      <Label title={title} required={required} htmlFor={id ?? name} />

      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      {canAddMore && !disabled && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e)  => { e.preventDefault(); setIsDragging(true);  }}
          onDragLeave={()  => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed",
            "px-6 py-8 text-center transition-all duration-200 focus:outline-none",
            isDragging              ? "border-[#60a5fa] bg-[#eff6ff]/70"
            : errorMsg || showRequired ? "border-[#fca5a5] bg-[#fef2f2]/40"
            : "border-[#e2e8f0] bg-[#f8fafc]/60 hover:border-[#93c5fd] hover:bg-[#eff6ff]/30",
          )}
        >
          {/* Icon pill */}
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
            isDragging ? "bg-[#dbeafe]" : "border border-[#e2e8f0] bg-[#ffffff] shadow-sm",
          )}>
            {isImage
              ? <UploadCloud className={cn("h-5 w-5", isDragging ? "text-[#eff6ff]0" : "text-[#94a3b8]")} />
              : <FilePlus    className={cn("h-5 w-5", isDragging ? "text-[#eff6ff]0" : "text-[#94a3b8]")} />
            }
          </div>

          {/* Copy */}
          <div>
            <p className="text-sm font-medium text-[#334155]">
              {isDragging ? "Drop it here" : "Drag & drop or click to browse"}
            </p>
            {hint && <p className="mt-1 text-xs text-[#94a3b8]">{hint}</p>}
          </div>
        </div>
      )}

      {/* "Replace" trigger — single mode, file already set */}
      {!canAddMore && !isMultiple && !disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 self-start text-xs font-medium text-[#eff6ff]0 transition-colors hover:text-[#2563eb]"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Replace file
        </button>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        id={id ?? name}
        name={name}
        type="file"
        accept={accept}
        multiple={isMultiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* ── Validation errors ───────────────────────────────────────────── */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-[#7b5757]0">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ── Single preview ──────────────────────────────────────────────── */}
      {!isMultiple && singlePreview && (
        <div className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm">
          {isImage ? (
            <img
              src={singlePreview}
              alt="Preview"
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-28 items-center justify-center gap-3 bg-[#f8fafc] px-4">
              <FileText className="h-10 w-10 shrink-0 text-[#cbd5e1]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#334155]">
                  {files[0]?.name ?? "File"}
                </p>
                {files[0] && (
                  <p className="text-xs text-[#94a3b8]">{fmtSize(files[0].size)}</p>
                )}
              </div>
            </div>
          )}

          {/* Remove */}
          <button
            type="button"
            onClick={() => (files[0] ? removeFile(0) : onClearUrl?.())}
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#000000]/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:bg-[#000000]/70"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Info bar — file */}
          {files[0] && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-[#000000]/60 to-transparent px-3 py-2.5">
              {isImage
                ? <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[#ffffff]/70" />
                : <FileText  className="h-3.5 w-3.5 shrink-0 text-[#ffffff]/70" />
              }
              <span className="truncate text-[11px] font-medium text-[#ffffff]/90">
                {files[0].name}
              </span>
              <span className="ml-auto shrink-0 text-[11px] text-[#ffffff]/60">
                {fmtSize(files[0].size)}
              </span>
            </div>
          )}

          {/* Info bar — URL */}
          {!files[0] && previewUrl && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-[#000000]/60 to-transparent px-3 py-2">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-[#ffffff]/70" />
              <span className="truncate text-[11px] text-[#ffffff]/80">{previewUrl}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Multiple — image grid ───────────────────────────────────────── */}
      {isMultiple && isImage && files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="group relative aspect-square overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] shadow-sm"
            >
              {multiUrls[idx] && (
                <img
                  src={multiUrls[idx]}
                  alt={file.name}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-[#000000]/0 transition-colors group-hover:bg-[#000000]/20" />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#000000]/50 text-[#ffffff] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-[#000000]/70"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-[#000000]/60 to-transparent px-2 py-1.5 transition-transform group-hover:translate-y-0">
                <p className="truncate text-[10px] text-[#ffffff]/90">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Multiple — document list ────────────────────────────────────── */}
      {isMultiple && !isImage && files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-3 py-2.5 shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff]">
                <FileText className="h-4 w-4 text-[#eff6ff]0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#334155]">
                  {file.name}
                </p>
                <p className="text-[11px] text-[#94a3b8]">{fmtSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-[#fef2f2] hover:text-[#7b5757]0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File count hint */}
      {isMultiple && files.length > 0 && (
        <p className="text-[11px] text-[#94a3b8]">
          {files.length} of {fileLimit} file{fileLimit !== 1 ? "s" : ""} added
          {files.length >= fileLimit ? "  ·  Limit reached" : ""}
        </p>
      )}

      <ErrorMsg show={showRequired} message="Please upload a file" />
    </div>
  );
}
