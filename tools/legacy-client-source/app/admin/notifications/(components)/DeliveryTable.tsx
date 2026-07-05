"use client";

import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";
import { usePermission } from "@/hooks/usePermission";
import type { NotificationDelivery } from "@/src/features/notifications/types";
import { ChannelBadge } from "./ChannelBadge";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";
export function DeliveryTable({
  rows,
  total,
  page,
  limit,
  loading,
  onPageChange,
  onLimitChange,
  onRefresh,
  showRetry = true,
}: {
  rows: NotificationDelivery[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onRefresh: () => void;
  showRetry?: boolean;
}) {
  const toast = useToast();
  const canSend = usePermission("/admin/notifications", "SEND");
  const retry = async (row: NotificationDelivery) => {
    if (!canSend) {
      toast.error("Permission denied", "You need NOTIFICATION_SEND to retry.");
      return;
    }
    const res = await adminOperationalAPI.notifications.retryDelivery(row.delivery_id);
    if (res.status) {
      toast.success("Retry queued", `Delivery #${row.delivery_id}`);
      onRefresh();
    } else toast.error("Retry failed", res.message);
  };

  return (
    <PaginatedTable
      title="Deliveries"
      data={rows}
      total={total}
      loading={loading}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      onRefresh={onRefresh}
      rowKey="delivery_id"
      showRefresh
    >
      <Column header="ID" dataKey="delivery_id" width="80" />
      <Column
        header="Channel"
        dataKey="channel"
        render={(_v, row: NotificationDelivery) => <ChannelBadge channel={row.channel} />}
      />
      <Column header="Recipient" dataKey="recipient_address" />
      <Column header="Subject" dataKey="subject" />
      <Column
        header="Status"
        dataKey="status"
        render={(_v, row: NotificationDelivery) => <DeliveryStatusBadge status={row.status} />}
      />
      <Column header="Retries" dataKey="retry_count" width="70" />
      <Column
        header="Sent"
        dataKey="sent_at"
        render={(v) => (v ? new Date(String(v)).toLocaleString() : "—")}
      />
      {showRetry ? (
        <Column
          header="Actions"
          dataKey="_actions"
          type="actions"
          align="right"
          actions={
            [
              {
                label: "Retry",
                requiredPermission: "NOTIFICATION_SEND",
                hidden: (row: NotificationDelivery) => row.status !== "failed",
                onClick: (row: NotificationDelivery) => {
                  void retry(row);
                },
              },
            ] as Array<Record<string, unknown>>
          }
        />
      ) : null}
    </PaginatedTable>
  );
}
