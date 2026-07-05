"use client";

import { useEffect, useState } from "react";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { SecurityShell } from "../(components)/SecurityShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { useToast } from "@/providers/ToastProvider";

export default function SecuritySessionsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminOperationalAPI.security.sessions({ limit: "50" });
    if (res.status && res.data) setRows((res.data as { rows: Record<string, unknown>[] }).rows || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const revoke = async (id: number) => {
    const res = await adminOperationalAPI.security.revokeSession(id);
    if (res.status) {
      toast.success("Session revoked");
      void load();
    } else toast.error(res.message || "Failed");
  };

  const revokeAll = async () => {
    const res = await adminOperationalAPI.security.revokeAllSessions({ keepCurrent: true });
    if (res.status) {
      toast.success("Other sessions revoked");
      void load();
    } else toast.error(res.message || "Failed");
  };

  return (
    <SecurityShell title="Session management" description="Active devices and sign-in sessions.">
      <div className="mb-3 flex gap-2">
        <Button variant="outline" onClick={() => void revokeAll()}>
          Revoke other sessions
        </Button>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <PaginatedTable
        title="Sessions"
        data={rows}
        total={rows.length}
        loading={loading}
        page={1}
        limit={50}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRefresh={load}
        rowKey="session_id"
        showRefresh
      >
        <Column header="Device" dataKey="device_name" render={(_v, r) => String(r.device_name || r.platform || "Unknown")} />
        <Column header="IP" dataKey="ip_address" />
        <Column header="Last seen" dataKey="last_seen_at" render={(v) => new Date(String(v)).toLocaleString()} />
        <Column
          header="Status"
          dataKey="is_active"
          render={(v) => (v ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Revoked</Badge>)}
        />
        <Column
          header=""
          dataKey="session_id"
          render={(_v, r) =>
            r.is_active ? (
              <Button size="sm" variant="outline" onClick={() => void revoke(Number(r.session_id))}>
                Revoke
              </Button>
            ) : null
          }
        />
      </PaginatedTable>
    </SecurityShell>
  );
}
