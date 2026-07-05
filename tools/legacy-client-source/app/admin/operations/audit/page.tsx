"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";

type AuditRow = {
  log_id: number;
  actor_admin_id: number | null;
  actor_name: string | null;
  email: string | null;
  target_entity: string | null;
  action_type: string;
  action_label: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

function formatJson(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "-";
  try {
    return JSON.stringify(value, null, 0);
  } catch {
    return String(value);
  }
}

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const res = await adminOperationalAPI.audit.logs({ page, limit });
    if (res.status && res.data) {
      const d = res.data as { rows?: AuditRow[]; total?: number };
      setRows(d.rows || []);
      setTotal(d.total || 0);
    }
    setLoading(false);
  }, [page, limit]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return (
    <div className="space-y-4">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin audit logs</h1>
          <p className="text-sm text-[#53697e]">
            Security trail for logins, permissions, admin changes, and sensitive operations.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRows}
          className="rounded-lg border border-[#e2e8f0]/70 bg-[#ffffff] px-3 py-2 text-sm text-[#475569] hover:bg-[#f8fafc] transition-colors"
        >
          Refresh
        </button>
      </div>

      <PaginatedTable
        title="Audit trail"
        data={rows}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={fetchRows}
        rowKey="log_id"
        showRefresh
      >
        <Column
          header="Time"
          dataKey="created_at"
          render={(val) => (val ? new Date(String(val)).toLocaleString() : "-")}
        />
        <Column
          header="Admin"
          dataKey="actor_name"
          render={(_val, row: AuditRow) =>
            row.actor_name || (row.actor_admin_id ? `Admin #${row.actor_admin_id}` : "-")
          }
        />
        <Column header="Action" dataKey="action_label" />
        <Column header="Target" dataKey="target_entity" />
        <Column header="IP" dataKey="ip_address" />
        <Column
          header="Details"
          dataKey="_detail"
          type="actions"
          align="right"
          actions={[
            {
              label: "View",
              onClick: (row: AuditRow) =>
                setExpandedId((prev) => (prev === row.log_id ? null : row.log_id)),
            },
          ]}
        />
      </PaginatedTable>

      {expandedId != null && (
        <div className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-4 text-sm">
          {rows
            .filter((r) => r.log_id === expandedId)
            .map((r) => (
              <div key={r.log_id} className="space-y-2">
                <p>
                  <span className="font-medium">User agent:</span> {r.user_agent || "-"}
                </p>
                <p>
                  <span className="font-medium">Previous:</span>{" "}
                  <code className="break-all">{formatJson(r.previous_value)}</code>
                </p>
                <p>
                  <span className="font-medium">New:</span>{" "}
                  <code className="break-all">{formatJson(r.new_value)}</code>
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}


