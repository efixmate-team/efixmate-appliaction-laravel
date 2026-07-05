"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { usePaginatedDelivery } from "@/src/features/notifications/hooks/useNotificationCenter";
import { CHANNEL_LOG_TABS, DELIVERY_STATUS_OPTIONS } from "@/src/features/notifications/constants";
import type { NotificationChannel } from "@/src/features/notifications/types";
import Select from "@/app/admin/(components)/Forms/Select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationShell } from "../(components)/NotificationShell";
import { DeliveryTable } from "../(components)/DeliveryTable";
import { ErrorAlert } from "../(components)/ErrorAlert";

function NotificationChannelLogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelParam = (searchParams.get("channel") || "push") as NotificationChannel;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");

  const { data, loading, error, refresh } = usePaginatedDelivery(
    { page, limit, channel: channelParam, status: status || undefined },
    true
  );

  const setChannel = (ch: string) => {
    router.replace(`/admin/notifications/logs?channel=${ch}`);
    setPage(1);
  };

  const tabLabel = CHANNEL_LOG_TABS.find((t) => t.channel === channelParam)?.label || "Logs";

  return (
    <NotificationShell
      title={`${tabLabel} logs`}
      description="Per-channel delivery logs for SMS, email, WhatsApp, and push."
    >
      <Tabs value={channelParam} onValueChange={setChannel}>
        <TabsList>
          {CHANNEL_LOG_TABS.map((t) => (
            <TabsTrigger key={t.channel} value={t.channel}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="max-w-xs">
        <Select title="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={DELIVERY_STATUS_OPTIONS} />
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

export default function NotificationChannelLogsPage() {
  return (
    <Suspense
      fallback={
        <NotificationShell title="Channel logs">
          <p className="text-sm text-[#53697e]">Loading logs…</p>
        </NotificationShell>
      }
    >
      <NotificationChannelLogsContent />
    </Suspense>
  );
}
