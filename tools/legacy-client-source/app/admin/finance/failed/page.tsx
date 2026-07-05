"use client";

import { useState } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import Input from "@/app/admin/(components)/Forms/Input";
import { FinanceShell } from "../(components)/FinanceShell";
import { DateRangeFilter } from "../(components)/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";

export default function FinanceFailedPaymentsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.finance.failedPayments({
      from: from || undefined,
      to: to || undefined,
      search: search || undefined,
      limit: "50",
    });
    if (res.status && res.data) setRows((res.data as { rows: Record<string, unknown>[] }).rows || []);
    setLoading(false);
  };

  return (
    <FinanceShell title="Failed transactions" description="Track failed payment attempts and gateway errors.">
      <div className="grid gap-3 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4 md:grid-cols-2 lg:grid-cols-4">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <Input title="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Payment ID or booking" />
        <div className="flex items-end">
          <Button onClick={() => void load()}>Load</Button>
        </div>
      </div>

      <PaginatedTable
        title="Failed payments"
        data={rows}
        total={rows.length}
        loading={loading}
        page={1}
        limit={50}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRefresh={load}
        rowKey="log_id"
        showRefresh
      >
        <Column header="Log" dataKey="log_id" />
        <Column header="Booking" dataKey="booking_uid" />
        <Column header="Payment ID" dataKey="payment_id" />
        <Column header="Amount" dataKey="amount" />
        <Column header="Gateway" dataKey="gateway_type" />
        <Column header="Status" dataKey="status" render={(v) => <Badge variant="danger">{String(v)}</Badge>} />
        <Column header="When" dataKey="created_at" render={(v) => new Date(String(v)).toLocaleString()} />
      </PaginatedTable>
    </FinanceShell>
  );
}

