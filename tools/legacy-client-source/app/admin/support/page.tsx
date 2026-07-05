"use client";

import Link from "next/link";
import { useSupportDashboard } from "@/src/features/support/hooks/useSupportTickets";
import { SupportShell } from "./(components)/SupportShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "./(components)/TableSkeleton";

export default function SupportOverviewPage() {
  const { stats, loading, error, refresh } = useSupportDashboard();

  return (
    <SupportShell
      title="Support Center"
      description="Customer and technician tickets, SLA tracking, escalations, and team collaboration."
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
    >
      {loading ? <TableSkeleton rows={4} /> : null}
      {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}

      {!loading && stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>SLA breached</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-[#dc2626]">{String(stats.slaBreached ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{String(stats.activeCategories ?? 0)}</p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href="/admin/support/tickets">
                <Button size="sm">All tickets</Button>
              </Link>
              <Link href="/admin/support/tickets?slaBreached=true">
                <Button variant="outline" size="sm">
                  SLA breaches
                </Button>
              </Link>
              <Link href="/admin/support/categories">
                <Button variant="outline" size="sm">
                  Categories
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </SupportShell>
  );
}
