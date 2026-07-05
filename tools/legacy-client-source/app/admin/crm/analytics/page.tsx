"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CrmShell } from "../(components)/CrmShell";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CrmAnalyticsPage() {
  const [topClv, setTopClv] = useState<Record<string, unknown>[]>([]);
  const [referralTotals, setReferralTotals] = useState<Record<string, unknown> | null>(null);
  const [referralSeries, setReferralSeries] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [clvRes, refRes] = await Promise.all([
      adminOperationalAPI.crm.analyticsClv({ limit: "15" }),
      adminOperationalAPI.crm.analyticsReferrals(),
    ]);
    if (clvRes.status && clvRes.data) {
      setTopClv((clvRes.data as { top_customers?: Record<string, unknown>[] }).top_customers || []);
    }
    if (refRes.status && refRes.data) {
      const d = refRes.data as { totals?: Record<string, unknown>; series?: Record<string, unknown>[] };
      setReferralTotals(d.totals || null);
      setReferralSeries(d.series || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CrmShell
      title="CRM Analytics"
      description="Customer lifetime value leaders and referral program performance."
      actions={
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      }
    >
      {loading ? <p className="text-sm text-[#53697e]">Loading analytics…</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referral program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Total events: <strong>{Number(referralTotals?.total_events || 0)}</strong>
            </p>
            <p>
              Active referrers: <strong>{Number(referralTotals?.referrers || 0)}</strong>
            </p>
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-[#475569]">
              {referralSeries.map((row, i) => (
                <li key={i} className="flex justify-between border-b border-[#f1f5f9] py-1">
                  <span>{new Date(String(row.day)).toLocaleDateString()}</span>
                  <span>
                    {String(row.events)} events · {String(row.points)} pts
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top customers by CLV</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {topClv.map((c) => (
                <li key={String(c.customer_id)} className="flex items-center justify-between border-b border-[#f1f5f9] py-2">
                  <Link href={`/admin/crm/customers/${c.customer_id}`} className="font-medium text-[#0284c7] hover:underline">
                    {String(c.first_name)} {String(c.last_name || "")}
                  </Link>
                  <span className="font-semibold text-[#047857]">
                    ₹{Number(c.lifetime_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </li>
              ))}
              {!topClv.length ? <p className="text-[#53697e]">No CLV data yet — open customer profiles to compute.</p> : null}
            </ul>
          </CardContent>
        </Card>
      </div>
    </CrmShell>
  );
}
