'use client';

import { FileSpreadsheet, Plus } from "lucide-react";

export const bulkUploadBtnClass =
  "cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]";

export function parseBulkIsActive(value: unknown): boolean {
  return String(value ?? "TRUE").toUpperCase() !== "FALSE";
}

export function parseBulkMandatory(value: unknown): boolean {
  return String(value ?? "TRUE").toUpperCase() !== "FALSE";
}

export function parseCommaIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value == null || value === "") return [];
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseCommaIdsAsNumbers(value: unknown): number[] {
  return parseCommaIds(value).map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
}

export async function runBulkUploadRows(
  rows: Record<string, any>[],
  create: (row: Record<string, any>) => Promise<{ status?: boolean; message?: string } | null | undefined>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    try {
      const res = await create(rows[i]);
      if (res?.status) success++;
      else errors.push(`Row ${rowNum}: ${res?.message || "Failed"}`);
    } catch (err: any) {
      errors.push(`Row ${rowNum}: ${err?.message || "Error"}`);
    }
  }
  return { success, failed: errors.length, errors };
}

export function BulkUploadHeaderActions({
  onUpload,
  onAdd,
  addLabel = "Add New",
}: {
  onUpload: () => void;
  onAdd: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onUpload} className={bulkUploadBtnClass}>
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Upload via Excel
      </button>
      <button type="button" onClick={onAdd} className={bulkUploadBtnClass}>
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}
