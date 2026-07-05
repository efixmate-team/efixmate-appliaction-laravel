"use client";

import { useState } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import Input from "@/app/admin/(components)/Forms/Input";
import { FinanceShell } from "../(components)/FinanceShell";
import { DateRangeFilter } from "../(components)/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { downloadPdf } from "@/src/features/finance/export";

export default function FinanceInvoicesPage() {
  const toast = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.finance.invoices({
      from: from || undefined,
      to: to || undefined,
      search: search || undefined,
      limit: "50",
    });
    if (res.status && res.data) setRows((res.data as { rows: Record<string, unknown>[] }).rows || []);
    setLoading(false);
  };

  const generate = async () => {
    if (!bookingId) return toast.error("Enter booking ID");
    const res = await adminOperationalAPI.finance.generateInvoice({ bookingId: Number(bookingId) });
    if (res.status) {
      toast.success("Invoice generated");
      void load();
    } else toast.error(res.message || "Generation failed");
  };

  return (
    <FinanceShell title="Invoices" description="GST invoice generation and registry.">
      <div className="grid gap-3 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4 lg:grid-cols-2">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <div className="space-y-2">
          <Input title="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Invoice # or booking" />
          <Input title="Booking ID (generate)" value={bookingId} onChange={(e) => setBookingId(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={() => void load()}>List</Button>
            <Button variant="outline" onClick={() => void generate()}>
              Generate
            </Button>
          </div>
        </div>
      </div>

      <PaginatedTable
        title="Invoices"
        data={rows}
        total={rows.length}
        loading={loading}
        page={1}
        limit={50}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRefresh={load}
        rowKey="invoice_id"
        showRefresh
      >
        <Column header="Number" dataKey="invoice_number" />
        <Column header="Booking" dataKey="booking_uid" />
        <Column header="Amount" dataKey="amount" />
        <Column header="GST" dataKey="gst_amount" />
        <Column header="Status" dataKey="status" />
        <Column
          header="PDF"
          dataKey="invoice_id"
          render={(_v, row: Record<string, unknown>) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadPdf(`Invoice ${row.invoice_number}`, [
                  {
                    invoice_number: row.invoice_number,
                    amount: row.amount,
                    gst: row.gst_amount,
                    booking: row.booking_uid,
                  },
                ])
              }
            >
              PDF
            </Button>
          )}
        />
      </PaginatedTable>
    </FinanceShell>
  );
}

