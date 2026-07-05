import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExcel(filename: string, rows: Record<string, unknown>[], sheetName = "Report") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function downloadPdf(title: string, rows: Record<string, unknown>[], columns?: string[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  const cols = columns || (rows[0] ? Object.keys(rows[0]) : []);
  autoTable(doc, {
    head: [cols],
    body: rows.map((r) => cols.map((c) => String(r[c] ?? ""))),
    startY: 22,
    styles: { fontSize: 8 },
  });
  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export function handleServerExport(payload: {
  export_format?: string;
  filename?: string;
  content?: string;
  rows?: Record<string, unknown>[];
  columns?: string[];
  report_type?: string;
}) {
  const name = payload.filename || `${payload.report_type || "report"}_${Date.now()}`;
  if (payload.export_format === "csv" && payload.content) {
    downloadCsv(name, payload.content);
    return;
  }
  if (payload.rows?.length) {
    downloadExcel(name, payload.rows);
  }
}
