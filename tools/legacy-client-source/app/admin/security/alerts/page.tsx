"use client";

import { useEffect, useState } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { SecurityShell } from "../(components)/SecurityShell";
import { Badge } from "@/components/ui/badge";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";

export default function SecurityAlertsPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.security.alerts({ limit: "50" });
    if (res.status && res.data) setRows((res.data as { rows: Record<string, unknown>[] }).rows || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <SecurityShell title="Security alerts" description="Failed logins, lockouts, IP blocks, and 2FA changes.">
      <PaginatedTable
        title="Alerts"
        data={rows}
        total={rows.length}
        loading={loading}
        page={1}
        limit={50}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRefresh={load}
        rowKey="event_id"
        showRefresh
      >
        <Column header="Type" dataKey="event_type" />
        <Column
          header="Severity"
          dataKey="severity"
          render={(v) => (
            <Badge variant={v === "critical" || v === "high" ? "danger" : "secondary"}>{String(v)}</Badge>
          )}
        />
        <Column header="Description" dataKey="description" />
        <Column header="IP" dataKey="ip_address" />
        <Column header="When" dataKey="created_at" render={(v) => new Date(String(v)).toLocaleString()} />
      </PaginatedTable>
    </SecurityShell>
  );
}
