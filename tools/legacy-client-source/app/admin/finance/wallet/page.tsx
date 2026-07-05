"use client";

import { useState } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import { FinanceShell } from "../(components)/FinanceShell";
import { DateRangeFilter } from "../(components)/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";

export default function FinanceWalletPage() {
  const [ledgerType, setLedgerType] = useState("combined");
  const [customerId, setCustomerId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.finance.wallet({
      ledgerType,
      customerId: customerId || undefined,
      technicianId: technicianId || undefined,
      from: from || undefined,
      to: to || undefined,
      limit: "50",
    });
    if (res.status && res.data) setRows((res.data as { ledger: Record<string, unknown>[] }).ledger || []);
    setLoading(false);
  };

  return (
    <FinanceShell title="Wallet ledger" description="Customer and technician wallet movements.">
      <div className="grid gap-3 rounded-xl border bg-[#ffffff] p-4 md:grid-cols-2 lg:grid-cols-4">
        <Select
          title="Ledger"
          value={ledgerType}
          onChange={(e) => setLedgerType(e.target.value)}
          options={[
            { value: "combined", label: "Combined" },
            { value: "customer", label: "Customer" },
            { value: "technician", label: "Technician" },
          ]}
        />
        <Input title="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <Input title="Technician ID" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} />
        <div className="flex items-end">
          <Button onClick={() => void load()}>Search</Button>
        </div>
        <div className="lg:col-span-4">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        </div>
      </div>

      <PaginatedTable
        title="Ledger entries"
        data={rows}
        total={rows.length}
        loading={loading}
        page={1}
        limit={50}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRefresh={load}
        rowKey="ledger_id"
        showRefresh
      >
        <Column header="Type" dataKey="ledger_type" />
        <Column header="Party" dataKey="party_id" />
        <Column header="Entry" dataKey="entry_type" />
        <Column header="Amount" dataKey="amount" />
        <Column header="Date" dataKey="created_at" render={(v) => new Date(String(v)).toLocaleString()} />
      </PaginatedTable>
    </FinanceShell>
  );
}
