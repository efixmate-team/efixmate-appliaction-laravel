"use client";

import { useState } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import Select from "@/app/admin/(components)/Forms/Select";
import { FinanceShell } from "../(components)/FinanceShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { REFUND_STATUS_OPTIONS } from "@/src/features/finance/constants";

export default function FinanceRefundsPage() {
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.finance.refunds({ status, page: String(page), limit: String(limit) });
    if (res.status && res.data) setRows((res.data as { rows: Record<string, unknown>[] }).rows || []);
    setLoading(false);
  };

  const approve = async (refundId: number, approved: boolean) => {
    const res = await adminOperationalAPI.finance.approveRefund({ refundId, approved, note: approved ? "Approved" : "Rejected" });
    if (res.status) {
      toast.success(approved ? "Refund approved" : "Refund rejected");
      void load();
    } else toast.error(res.message || "Action failed");
  };

  return (
    <FinanceShell title="Refund approvals" description="Review and approve customer refund requests.">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4">
        <Select title="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={REFUND_STATUS_OPTIONS} />
        <Button onClick={() => void load()}>Load</Button>
      </div>

      <PaginatedTable
        title="Refunds"
        data={rows}
        total={rows.length}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={load}
        rowKey="refund_id"
        showRefresh
      >
        <Column header="ID" dataKey="refund_id" />
        <Column header="Booking" dataKey="booking_uid" />
        <Column header="Customer" dataKey="customer_name" />
        <Column header="Amount" dataKey="amount" />
        <Column header="Status" dataKey="refund_status_id" render={(v) => <Badge variant="secondary">{String(v)}</Badge>} />
        <Column
          header="Actions"
          dataKey="refund_id"
          render={(_v, row: Record<string, unknown>) =>
            status === "pending" ? (
              <div className="flex gap-1">
                <Button size="sm" onClick={() => void approve(Number(row.refund_id), true)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => void approve(Number(row.refund_id), false)}>
                  Reject
                </Button>
              </div>
            ) : null
          }
        />
      </PaginatedTable>
    </FinanceShell>
  );
}

