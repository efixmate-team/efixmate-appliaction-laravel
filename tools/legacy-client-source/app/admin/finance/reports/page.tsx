"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import Select from "@/app/admin/(components)/Forms/Select";
import { FinanceShell } from "../(components)/FinanceShell";
import { DateRangeFilter } from "../(components)/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { REPORT_TYPES } from "@/src/features/finance/constants";
import { downloadExcel, downloadPdf, handleServerExport } from "@/src/features/finance/export";

const fetchers: Record<string, (p: Record<string, string | undefined>) => ReturnType<typeof adminOperationalAPI.finance.gst>> = {
  gst: (p) => adminOperationalAPI.finance.gst(p),
  tds: (p) => adminOperationalAPI.finance.tds({ ...p, sync: "true" }),
  settlements: (p) => adminOperationalAPI.finance.settlements(p),
  commissions: (p) => adminOperationalAPI.finance.commissions(p),
  wallet: (p) => adminOperationalAPI.finance.wallet(p),
  payouts: (p) => adminOperationalAPI.finance.payouts(p),
  refunds: (p) => adminOperationalAPI.finance.refunds(p),
  failed: (p) => adminOperationalAPI.finance.failedPayments(p),
  invoices: (p) => adminOperationalAPI.finance.invoices(p),
  revenue: (p) => adminOperationalAPI.finance.revenue(p),
};

function FinanceReportsContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [reportType, setReportType] = useState(searchParams.get("type") || "gst");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, unknown>[]>([]);

  const params = useMemo(
    () => ({ from: from || undefined, to: to || undefined, page: String(page), limit: String(limit) }),
    [from, to, page, limit]
  );

  const load = async () => {
    const fn = fetchers[reportType];
    if (!fn) return;
    setLoading(true);
    const res = await fn(params);
    if (res.status && res.data) {
      const d = res.data as { rows?: Record<string, unknown>[]; total?: number; summary?: Record<string, unknown>[]; gateway?: Record<string, unknown>[] };
      setRows(d.rows || d.gateway || []);
      setTotal(d.total || (d.rows || d.gateway || []).length);
      setSummary(d.summary || []);
    } else toast.error(res.message || "Failed to load report");
    setLoading(false);
  };

  const exportReport = async (format: "csv" | "json") => {
    const res = await adminOperationalAPI.finance.exportReport({
      reportType,
      format,
      from: from || undefined,
      to: to || undefined,
    });
    if (!res.status || !res.data) return toast.error(res.message || "Export failed");
    handleServerExport(res.data as Parameters<typeof handleServerExport>[0]);
    toast.success("Export downloaded");
  };

  const columns = rows[0] ? Object.keys(rows[0]).slice(0, 8) : ["id"];

  return (
    <FinanceShell title="Financial reports" description="GST, TDS, settlements, commissions, and ledger exports.">
      <div className="grid gap-3 rounded-xl border bg-[#ffffff] p-4 lg:grid-cols-4">
        <Select
          title="Report"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          options={REPORT_TYPES}
        />
        <div className="lg:col-span-2">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={() => void load()}>Run</Button>
          <Button variant="outline" onClick={() => void exportReport("csv")}>
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (rows.length) downloadExcel(`${reportType}_report`, rows);
            }}
          >
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (rows.length) downloadPdf(`${reportType} report`, rows, columns);
            }}
          >
            PDF
          </Button>
        </div>
      </div>

      {summary.length ? (
        <div className="rounded-xl border bg-[#f8fafc] p-3 text-sm">
          <p className="mb-2 font-medium text-[#334155]">Summary</p>
          <pre className="overflow-auto text-xs">{JSON.stringify(summary, null, 2)}</pre>
        </div>
      ) : null}

      <PaginatedTable
        title={`${reportType} report`}
        data={rows}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={load}
        rowKey={columns[0]}
        showRefresh
      >
        {columns.map((key) => (
          <Column key={key} header={key} dataKey={key} />
        ))}
      </PaginatedTable>
    </FinanceShell>
  );
}

export default function FinanceReportsPage() {
  return (
    <Suspense
      fallback={
        <FinanceShell title="Financial reports" description="Loading…">
          <p className="text-sm text-[#53697e]">Loading report…</p>
        </FinanceShell>
      }
    >
      <FinanceReportsContent />
    </Suspense>
  );
}
