"use client";

import { useState } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import Input from "@/app/admin/(components)/Forms/Input";
import { FinanceShell } from "../(components)/FinanceShell";
import { DateRangeFilter } from "../(components)/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";

export default function FinancePayoutsPage() {
  const toast = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.finance.payouts({ from: from || undefined, to: to || undefined, limit: "50" });
    if (res.status && res.data) setRows((res.data as { rows: Record<string, unknown>[] }).rows || []);
    setLoading(false);
  };

  const runSettlement = async () => {
    if (!periodStart || !periodEnd) return toast.error("Select settlement period");
    const res = await adminOperationalAPI.finance.processSettlement({ periodStart, periodEnd });
    if (res.status) {
      toast.success("Settlement processed");
      void load();
    } else toast.error(res.message || "Settlement failed");
  };

  return (
    <FinanceShell title="Vendor payouts" description="Technician and vendor payout queue with batch settlement.">
      <div className="grid gap-3 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4 lg:grid-cols-2">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#334155]">Process settlement batch</p>
          <Input title="Period start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          <Input title="Period end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          <Button onClick={() => void runSettlement()}>Run settlement</Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => void load()}>
          Refresh payouts
        </Button>
      </div>

      <PaginatedTable
        title="Payouts"
        data={rows}
        total={rows.length}
        loading={loading}
        page={1}
        limit={50}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRefresh={load}
        rowKey="payout_id"
        showRefresh
      >
        <Column header="ID" dataKey="payout_id" />
        <Column header="Vendor" dataKey="vendor_name" />
        <Column header="Amount" dataKey="amount" />
        <Column header="TDS" dataKey="tds_amount" />
        <Column header="Status" dataKey="status" render={(v) => <Badge variant="secondary">{String(v)}</Badge>} />
        <Column header="Created" dataKey="created_at" render={(v) => new Date(String(v)).toLocaleDateString()} />
      </PaginatedTable>
    </FinanceShell>
  );
}

