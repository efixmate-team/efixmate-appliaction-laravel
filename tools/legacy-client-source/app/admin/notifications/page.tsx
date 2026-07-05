"use client";

import Link from "next/link";
import { useNotificationDashboard } from "@/src/features/notifications/hooks/useNotificationCenter";
import { NotificationShell } from "./(components)/NotificationShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "./(components)/LoadingBlock";
import { ErrorAlert } from "./(components)/ErrorAlert";

export default function NotificationCenterOverviewPage() {
  const { stats, loading, error, refresh } = useNotificationDashboard();

  return (
    <NotificationShell
      title="Notification Center"
      description="Templates, multi-channel delivery, scheduling, broadcasts, and delivery history."
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
    >
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorAlert message={error} onRetry={() => void refresh()} /> : null}

      {!loading && !error && stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Active templates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-[#0f172a]">{stats.activeTemplates}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Unread inbox</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-[#0f172a]">{stats.unreadInbox}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-[#0f172a]">
                  {stats.schedulesByStatus.find((s) => s.status === "pending")?.cnt ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Failed deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-[#dc2626]">
                  {stats.deliveryByChannel
                    .filter((d) => d.status === "failed")
                    .reduce((a, b) => a + b.cnt, 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link href="/admin/notifications/templates">
                  <Button variant="outline" size="sm">
                    Manage templates
                  </Button>
                </Link>
                <Link href="/admin/notifications/broadcast">
                  <Button size="sm">New broadcast</Button>
                </Link>
                <Link href="/admin/notifications/scheduled">
                  <Button variant="outline" size="sm">
                    Scheduled
                  </Button>
                </Link>
                <Link href="/admin/notifications/history">
                  <Button variant="outline" size="sm">
                    Delivery history
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery by channel</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.deliveryByChannel.length === 0 ? (
                  <p className="text-sm text-[#53697e]">No deliveries yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {stats.deliveryByChannel.map((row, i) => (
                      <li key={i} className="flex justify-between text-[#475569]">
                        <span>
                          {row.channel} · {row.status}
                        </span>
                        <span className="font-medium">{row.cnt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </NotificationShell>
  );
}
