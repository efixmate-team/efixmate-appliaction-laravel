'use client';

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, Download } from "lucide-react";
import Modal from "@/components/modals/Modal";

interface BulkUploadResult {
  success: number;
  failed: number;
  errors: string[];
}

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  columns: string[];
  exampleRow: (string | number | boolean)[];
  templateFileName: string;
  columnDescription?: string;
  /** Custom template export (e.g. status type dropdown + reference sheet). */
  onExportTemplate?: () => void;
  /** UI shown above the template download row (e.g. status type picker). */
  templateControls?: React.ReactNode;
  onUpload: (rows: Record<string, any>[]) => Promise<BulkUploadResult>;
}

export default function BulkUploadModal({
  open,
  onClose,
  columns,
  exampleRow,
  templateFileName,
  columnDescription,
  onExportTemplate,
  templateControls,
  onUpload,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([columns, exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, templateFileName);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);
      const res = await onUpload(rows);
      setResult(res);
    } catch {
      setResult({ success: 0, failed: 1, errors: ["Could not parse the file. Make sure it is a valid .xlsx file."] });
    }
    setLoading(false);
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <Modal openModal={open} setOpenModal={(v: boolean) => { if (!v) handleClose(); }}>
      <div className="p-4 bg-[#ffffff] rounded-2xl w-full max-w-lg mx-auto space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#1e293b]">Bulk Upload via Excel</h2>
          <p className="text-[12px] text-[#94a3b8] mt-0.5">
            Download the template, fill in the data, then upload the completed file.
          </p>
        </div>

        {templateControls}

        {/* Template download */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
          <div>
            <p className="text-[13px] font-semibold text-[#334155]">Download Template</p>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">
              {columnDescription ?? `Columns: ${columns.join(", ")}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onExportTemplate ?? exportTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e2e8f0] text-[12px] font-semibold text-[#334155] hover:bg-[#f8fafc] transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            .xlsx
          </button>
        </div>

        {/* File picker */}
        <div>
          <p className="text-[12px] font-semibold text-[#475569] mb-1.5">Select File</p>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[#e2e8f0] hover:border-[#93c5fd] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-5 h-5 text-[#94a3b8] shrink-0" />
            <div className="flex-1 min-w-0">
              {file
                ? <p className="text-[13px] font-semibold text-[#334155] truncate">{file.name}</p>
                : <p className="text-[13px] text-[#94a3b8]">Click to choose an .xlsx file</p>
              }
            </div>
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-[#94a3b8] hover:text-[#475569]"
              >✕</button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          />
        </div>

        {/* Result summary */}
        {result && (
          <div className={`rounded-xl p-3 text-[12px] space-y-1 ${result.failed === 0 ? "bg-[#f0fdf4] border border-[#bbf7d0]" : "bg-[#fffbeb] border border-[#fde68a]"}`}>
            <p className="font-semibold text-[#334155]">
              {result.success} created successfully
              {result.failed > 0 && `, ${result.failed} failed`}
            </p>
            {result.errors.slice(0, 5).map((e, i) => (
              <p key={i} className="text-[#dc2626]">{e}</p>
            ))}
            {result.errors.length > 5 && (
              <p className="text-[#53697e]">…and {result.errors.length - 5} more errors</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            disabled={!file || loading}
            onClick={handleUpload}
            className="flex-1 py-2.5 rounded-xl bg-[#0f172a] text-[#ffffff] font-semibold text-[13px] disabled:opacity-50 hover:bg-[#334155] transition-colors"
          >
            {loading ? "Uploading…" : "Upload & Import"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
