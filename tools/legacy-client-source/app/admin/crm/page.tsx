"use client";

import Link from "next/link";
import { CrmShell } from "./(components)/CrmShell";
import { useCrmDashboard } from "@/src/features/crm/hooks/useCrm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CrmDashboardPage() {
  const { stats, loading, error, refresh } = useCrmDashboard();

  const fmt = (n: number | undefined) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <CrmShell
      title="CRM Center"
      description="Customer 360°, lifetime value, loyalty, wallet, complaints, and engagement."
      actions={
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
    >
      {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}
      {!loading && stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.total_customers}</p>
              <p className="text-xs text-[#53697e]">{stats.blocked_customers} blocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lifetime value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-[#047857]">{fmt(stats.total_clv)}</p>
              <p className="text-xs text-[#53697e]">Avg {fmt(stats.avg_clv)} / customer</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Open complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-[#b45309]">{stats.open_complaints}</p>
              <Link href="/admin/crm/complaints" className="text-xs text-[#0284c7] hover:underline">
                View queue →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Spam flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.spam_flagged}</p>
              <Link href="/admin/crm/spam" className="text-xs text-[#0284c7] hover:underline">
                Review →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Loyalty points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.loyalty_points_outstanding.toLocaleString()}</p>
              <p className="text-xs text-[#53697e]">Outstanding balance</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-center">
            <CardContent className="pt-6">
              <Link href="/admin/crm/customers">
                <Button className="w-full">Browse customers</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </CrmShell>
  );
}
