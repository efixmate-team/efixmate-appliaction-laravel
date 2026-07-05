"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { CrmShell } from "../(components)/CrmShell";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { COMPLAINT_STATUSES } from "@/src/features/crm/constants";

type Complaint = {
  complaint_id: string;
  customer_id: number;
  subject: string;
  status: string;
  priority: string;
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  created_at: string;
};

export default function CrmComplaintsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Complaint[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (overrides: Record<string, unknown> = {}) => {
      setLoading(true);
      const res = await adminOperationalAPI.crm.complaints({
        page: String(overrides.page ?? page),
        limit: String(overrides.limit ?? limit),
        status: (overrides.status ?? status) || undefined,
        search: (overrides.search ?? search) || undefined,
      });
      if (res.status && res.data) {
        const payload = res.data as { rows?: Complaint[]; total?: number };
        setRows(payload.rows || []);
        setTotal(payload.total || 0);
      }
      setLoading(false);
    },
    [page, limit, status, search]
  );

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (id: string, next: string) => {
    await adminOperationalAPI.crm.updateComplaint(id, { status: next });
    void load();
  };

  return (
    <CrmShell title="Customer complaints" description="Track and resolve CRM complaints separate from support tickets.">
      <PaginatedTable
        title="Complaints"
        badge="CRM"
        subtitle={`${total} complaints`}
        data={rows}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={(p) => {
          setPage(p);
          void load({ page: p });
        }}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
          void load({ limit: l, page: 1 });
        }}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
          void load({ search: v, page: 1 });
        }}
        searchValue={search}
        showSearch
        showFilter
        showRefresh
        onRefresh={() => void load()}
        rowKey="complaint_id"
        searchPlaceholder="Search subject…"
        filters={[
          {
            type: "dropdown",
            label: "Status",
            value: status,
            placeholder: "All statuses",
            options: [{ label: "All statuses", value: "" }, ...COMPLAINT_STATUSES.map((s) => ({ label: s, value: s }))],
            onChange: (v: string) => {
              setStatus(v);
              setPage(1);
              void load({ status: v, page: 1 });
            },
          },
        ]}
      >
        <Column header="SL" type="serial" />
        <Column header="Subject" dataKey="subject" sortable />
        <Column
          header="Customer"
          render={(_v, row: Complaint) => (
            <div>
              <Link href={`/admin/crm/customers/${row.customer_id}`} className="font-medium text-[#0284c7] hover:underline">
                {row.first_name} {row.last_name || ""}
              </Link>
              <div className="text-xs text-[#53697e]">{row.mobile_number}</div>
            </div>
          )}
        />
        <Column header="Priority" dataKey="priority" />
        <Column
          header="Status"
          dataKey="status"
          render={(_v, row: Complaint) => (
            <select
              className="rounded border border-[#e2e8f0] px-1 py-0.5 text-xs"
              value={row.status}
              onChange={(e) => void updateStatus(row.complaint_id, e.target.value)}
            >
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        />
        <Column
          header="Created"
          dataKey="created_at"
          type="date"
        />
        <Column
          header="Action"
          type="actions"
          align="right"
          actions={[
            {
              label: "360°",
              icon: Eye,
              onClick: (row: Complaint) => router.push(`/admin/crm/customers/${row.customer_id}`),
            },
          ]}
        />
      </PaginatedTable>
    </CrmShell>
  );
}
