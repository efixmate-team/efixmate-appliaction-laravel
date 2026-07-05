"use client";

import { useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { usePermission } from "@/hooks/usePermission";
import { usePaginatedDelivery } from "@/src/features/notifications/hooks/useNotificationCenter";
import { DELIVERY_STATUS_OPTIONS, NOTIFICATION_CHANNELS } from "@/src/features/notifications/constants";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import { NotificationShell } from "../(components)/NotificationShell";
import { DeliveryTable } from "../(components)/DeliveryTable";
import { ErrorAlert } from "../(components)/ErrorAlert";
import { Button } from "@/components/ui/button";

export default function NotificationHistoryPage() {
  const toast = useToast();
  const canSend = usePermission("/admin/notifications", "SEND");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [bulkRetrying, setBulkRetrying] = useState(false);

  const { data, loading, error, refresh } = usePaginatedDelivery({
    page,
    limit,
    channel: channel || undefined,
    status: status || undefined,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const bulkRetry = async () => {
    if (!canSend) {
      toast.error("Permission denied");
      return;
    }
    setBulkRetrying(true);
    const res = await adminOperationalAPI.notifications.bulkRetry({ channel: channel || undefined });
    setBulkRetrying(false);
    if (res.status) {
      toast.success("Bulk retry complete", `${(res.data as { retried?: number })?.retried ?? 0} items processed`);
      refresh();
    } else toast.error("Bulk retry failed", res.message);
  };

  return (
    <NotificationShell
      title="Notification history"
      description="Full delivery log with filters, pagination, and retry for failed messages."
      actions={
        <Button variant="outline" size="sm" loading={bulkRetrying} onClick={() => void bulkRetry()} disabled={!canSend}>
          Retry all failed
        </Button>
      }
    >
      <div className="grid gap-3 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4 md:grid-cols-2 lg:grid-cols-6">
        <Select title="Channel" value={channel} onChange={(e) => setChannel(e.target.value)} options={[{ value: "", label: "All" }, ...NOTIFICATION_CHANNELS]} />
        <Select title="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={DELIVERY_STATUS_OPTIONS} />
        <Input title="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Recipient or subject" />
        <Input title="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input title="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setPage(1);
              refresh();
            }}
          >
            Apply filters
          </Button>
        </div>
      </div>

      {error ? <ErrorAlert message={error} onRetry={refresh} /> : null}

      <DeliveryTable
        rows={data?.rows || []}
        total={data?.total || 0}
        page={page}
        limit={limit}
        loading={loading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={refresh}
      />
    </NotificationShell>
  );
}

