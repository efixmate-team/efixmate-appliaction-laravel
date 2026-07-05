import * as XLSX from "xlsx";
import { formatCellValue } from "../(components)/Table/formatDisplayValue";

export type ExportColumn = {
  header?: string;
  dataKey?: string;
  type?: string;
  render?: (value: unknown, row: Record<string, unknown>, index: number) => unknown;
};

const SKIP_TYPES = new Set(["actions"]);

export function getExportableColumns(columns: ExportColumn[]): ExportColumn[] {
  return columns.filter((col) => col.header && !SKIP_TYPES.has(col.type || ""));
}

export function getExportCellValue(
  col: ExportColumn,
  row: Record<string, unknown>,
  index: number,
  page = 1,
  limit = 10
): string | number {
  if (col.type === "serial") return (page - 1) * limit + index + 1;

  const value = col.dataKey ? row[col.dataKey] : undefined;

  if (col.type === "toggle") return value ? "Yes" : "No";

  if (col.render) {
    try {
      const rendered = col.render(value, row, index);
      if (rendered == null) return "";
      if (typeof rendered === "string" || typeof rendered === "number" || typeof rendered === "boolean") {
        return String(rendered);
      }
    } catch {
      /* fall through to raw value */
    }
  }

  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);

  const formatted = formatCellValue(value, {
    dataKey: col.dataKey,
    type: col.type,
    header: col.header,
  });
  if (formatted != null) return formatted;

  return String(value);
}

function buildRows(
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  page: number,
  limit: number
) {
  const exportCols = getExportableColumns(columns);
  const headers = exportCols.map((c) => c.header as string);
  const rows = data.map((row, i) =>
    exportCols.map((col) => getExportCellValue(col, row, i, page, limit))
  );
  return { exportCols, headers, rows };
}

export function exportTableToExcel(options: {
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  fileName: string;
  page?: number;
  limit?: number;
  sheetName?: string;
}) {
  const { columns, data, fileName, page = 1, limit = data.length || 10, sheetName = "Export" } = options;
  const { headers, rows } = buildRows(columns, data, page, limit);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

export async function exportTableToPdf(options: {
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  fileName: string;
  title?: string;
  page?: number;
  limit?: number;
}) {
  const { columns, data, fileName, title, page = 1, limit = data.length || 10 } = options;
  const { headers, rows } = buildRows(columns, data, page, limit);

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait", unit: "pt" });
  const margin = 40;

  if (title) {
    doc.setFontSize(14);
    doc.text(title, margin, margin);
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? margin + 18 : margin,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
  });

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

export function slugifyExportName(name: string): string {
  return (name || "export")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
