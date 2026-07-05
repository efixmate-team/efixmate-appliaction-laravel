"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { cn } from "../utils";
import { exportTableToExcel, exportTableToPdf, slugifyExportName } from "@/app/admin/(lib)/tableExport";

/**
 * Export dropdown — Excel (.xlsx) and PDF.
 */
export function ExportMenu({
  columns = [],
  data = [],
  fileName,
  title,
  page = 1,
  limit = 10,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef(null);

  const baseName = slugifyExportName(fileName || title || "export");
  const hasData = Array.isArray(data) && data.length > 0;

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const runExport = async (type) => {
    if (!hasData || busy) return;
    setBusy(true);
    setOpen(false);
    try {
      const opts = { columns, data, fileName: baseName, title: title || fileName, page, limit };
      if (type === "excel") exportTableToExcel(opts);
      else await exportTableToPdf(opts);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || !hasData || busy}
        onClick={() => setOpen((v) => !v)}
        title={hasData ? "Export data" : "No data to export"}
        className={cn(
          "cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0]",
          "text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]",
          (disabled || !hasData) && "opacity-50 cursor-not-allowed"
        )}
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-[#e2e8f0] bg-[#ffffff] py-1 shadow-lg">
          <button
            type="button"
            onClick={() => void runExport("excel")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#334155] hover:bg-[#f8fafc]"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#16a34a]" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => void runExport("pdf")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#334155] hover:bg-[#f8fafc]"
          >
            <FileText className="w-4 h-4 text-[#7b5757]0" />
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
