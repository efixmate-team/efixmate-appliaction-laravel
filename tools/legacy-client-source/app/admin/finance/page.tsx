"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FinanceShell } from "./(components)/FinanceShell";
import { DateRangeFilter } from "./(components)/DateRangeFilter";
import { RevenueChart } from "./(components)/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinanceDashboard, useRevenueSeries } from "@/src/features/finance/hooks/useFinance";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function FinanceDashboardPage() {
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const filters = { from: from || undefined, to: to || undefined };

  const { stats, loading, error, refresh } = useFinanceDashboard(filters);
  const { series, loading: chartLoading } = useRevenueSeries({ ...filters, groupBy: "day" });

  const fmt = (n: number | string | undefined) =>
    `â‚¹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <FinanceShell
      title="Finance Center"
      description="Revenue, tax, settlements, wallet, refunds, and enterprise reporting."
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
    >
      <div className="rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      </div>

      {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}

      {!loading && stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-[#047857]">{fmt(stats.revenue.total)}</p>
                <p className="text-xs text-[#53697e]">{stats.revenue.count} payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>GST collected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{fmt(stats.gst_collected)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Refunds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-[#b45309]">{fmt(stats.refunds.total)}</p>
                <p className="text-xs text-[#53697e]">{stats.pending_refunds} pending approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Settlements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{fmt(stats.settlements.total)}</p>
                <p className="text-xs text-[#53697e]">{stats.settlements.batches} batches</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Failed payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-[#dc2626]">{stats.failed_payments}</p>
                <Link href="/admin/finance/failed" className="text-xs text-[#2563eb] hover:underline">
                  View queue
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Customer wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{fmt(stats.wallets.customer_balance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Technician credits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{fmt(stats.wallets.technician_credits)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stats.invoices_count}</p>
                <Link href="/admin/finance/invoices" className="text-xs text-[#2563eb] hover:underline">
                  Manage
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue trend</CardTitle>
            </CardHeader>
            <CardContent>{chartLoading ? <p className="text-sm text-[#94a3b8]">Loading chartâ€¦</p> : <RevenueChart series={series} />}</CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/finance/reports?type=gst">
              <Button variant="outline" size="sm">
                GST report
              </Button>
            </Link>
            <Link href="/admin/finance/reports?type=tds">
              <Button variant="outline" size="sm">
                TDS report
              </Button>
            </Link>
            <Link href="/admin/finance/reports?type=commissions">
              <Button variant="outline" size="sm">
                Commissions
              </Button>
            </Link>
            <Link href="/admin/finance/refunds">
              <Button variant="outline" size="sm">
                Refund approvals
              </Button>
            </Link>
          </div>
        </>
      ) : loading ? (
        <p className="text-sm text-[#53697e]">Loading dashboardâ€¦</p>
      ) : null}
    </FinanceShell>
  );
}

