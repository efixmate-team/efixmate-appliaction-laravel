"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { CrmShell } from "../(components)/CrmShell";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import type { CrmCustomerRow } from "@/src/features/crm/types";

export default function CrmCustomersPage() {
  const router = useRouter();
  const [data, setData] = useState<CrmCustomerRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [blocked, setBlocked] = useState("");
  const [spam, setSpam] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(
    async (overrides: Record<string, unknown> = {}) => {
      setLoading(true);
      const res = await adminOperationalAPI.crm.customers({
        page: String(overrides.page ?? page),
        limit: String(overrides.limit ?? limit),
        search: (overrides.search ?? search) || undefined,
        blocked: (overrides.blocked ?? blocked) || undefined,
        spam: (overrides.spam ?? spam) || undefined,
      });
      if (res.status && res.data) {
        const payload = res.data as { rows?: CrmCustomerRow[]; total?: number };
        setData(payload.rows || []);
        setTotal(payload.total || 0);
      }
      setLoading(false);
    },
    [page, limit, search, blocked, spam]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    void fetchCustomers({ search: value, page: 1 });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void fetchCustomers({ page: p });
  };

  const handleLimitChange = (l: number) => {
    setLimit(l);
    setPage(1);
    void fetchCustomers({ limit: l, page: 1 });
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  return (
    <CrmShell title="CRM Customers" description="Search, filter, and open customer 360° profiles.">
      <PaginatedTable
        title="Customers"
        badge="CRM"
        subtitle={`${total} customers`}
        data={data}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSearch={handleSearch}
        searchValue={search}
        showSearch
        showFilter
        showRefresh
        onRefresh={() => void fetchCustomers()}
        rowKey="customer_id"
        searchPlaceholder="Search name, email, mobile, UID…"
        filters={[
          {
            type: "dropdown",
            label: "Block status",
            value: blocked,
            placeholder: "All",
            options: [
              { label: "All", value: "" },
              { label: "Blocked", value: "true" },
              { label: "Active", value: "false" },
            ],
            onChange: (v: string) => {
              setBlocked(v);
              setPage(1);
              void fetchCustomers({ blocked: v, page: 1 });
            },
          },
          {
            type: "dropdown",
            label: "Spam",
            value: spam,
            placeholder: "All",
            options: [
              { label: "All", value: "" },
              { label: "Spam flagged", value: "true" },
            ],
            onChange: (v: string) => {
              setSpam(v);
              setPage(1);
              void fetchCustomers({ spam: v, page: 1 });
            },
          },
        ]}
      >
        <Column header="SL" type="serial" />
        <Column
          header="Customer"
          dataKey="first_name"
          sortable
          render={(_v, row: CrmCustomerRow) => (
            <span className="font-medium">
              {row.first_name} {row.last_name || ""}
            </span>
          )}
        />
        <Column header="Mobile" dataKey="mobile_number" sortable />
        <Column header="Email" dataKey="email" sortable />
        <Column
          header="CLV"
          dataKey="lifetime_value"
          render={(v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
        />
        <Column header="Bookings" dataKey="total_bookings" />
        <Column header="Loyalty" dataKey="loyalty_points" />
        <Column
          header="Status"
          dataKey="is_blocked"
          render={(_v, row: CrmCustomerRow) =>
            row.is_blocked ? (
              <span className="rounded bg-[#fef2f2] px-2 py-0.5 text-xs text-[#b91c1c]">Blocked</span>
            ) : row.spam_flag ? (
              <span className="rounded bg-[#fffbeb] px-2 py-0.5 text-xs text-[#92400e]">Spam</span>
            ) : (
              <span className="rounded bg-[#ecfdf5] px-2 py-0.5 text-xs text-[#047857]">Active</span>
            )
          }
        />
        <Column
          header="Action"
          type="actions"
          align="right"
          actions={[
            {
              label: "Open 360°",
              icon: Eye,
              onClick: (row: CrmCustomerRow) => router.push(`/admin/crm/customers/${row.customer_id}`),
            },
          ]}
        />
      </PaginatedTable>
    </CrmShell>
  );
}
