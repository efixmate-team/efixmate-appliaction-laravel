"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ScanSearch } from "lucide-react";
import { CrmShell } from "../(components)/CrmShell";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";

type SpamRow = {
  customer_id: number;
  first_name: string;
  last_name?: string;
  mobile_number: string;
  spam_score: number;
  spam_flag: boolean;
  lifetime_value?: number;
};

export default function CrmSpamPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SpamRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (overrides: Record<string, unknown> = {}) => {
      setLoading(true);
      const res = await adminOperationalAPI.crm.spamList({
        page: String(overrides.page ?? page),
        limit: String(overrides.limit ?? limit),
      });
      if (res.status && res.data) {
        const payload = res.data as { rows?: SpamRow[]; total?: number };
        setRows(payload.rows || []);
        setTotal(payload.total || 0);
      }
      setLoading(false);
    },
    [page, limit]
  );

  useEffect(() => {
    void load();
  }, []);

  const scan = async (id: number) => {
    await adminOperationalAPI.crm.spamScan(id);
    void load();
  };

  return (
    <CrmShell title="Spam review" description="Review flagged accounts and run heuristic spam scans.">
      <PaginatedTable
        title="Spam review"
        badge="CRM"
        subtitle={`${total} flagged customers`}
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
        showRefresh
        onRefresh={() => void load()}
        rowKey="customer_id"
        enableSelection={false}
      >
        <Column header="SL" type="serial" />
        <Column
          header="Customer"
          dataKey="first_name"
          render={(_v, row: SpamRow) => (
            <span className="font-medium">
              {row.first_name} {row.last_name || ""}
              {row.spam_flag ? (
                <span className="ml-2 rounded bg-[#fef3c7] px-1.5 text-xs text-[#92400e]">Flagged</span>
              ) : null}
            </span>
          )}
        />
        <Column header="Mobile" dataKey="mobile_number" />
        <Column header="Score" dataKey="spam_score" />
        <Column
          header="CLV"
          dataKey="lifetime_value"
          render={(v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
        />
        <Column
          header="Action"
          type="actions"
          align="right"
          actions={[
            {
              label: "Re-scan",
              icon: ScanSearch,
              onClick: (row: SpamRow) => void scan(row.customer_id),
            },
            {
              label: "Open",
              icon: Eye,
              onClick: (row: SpamRow) => router.push(`/admin/crm/customers/${row.customer_id}`),
            },
          ]}
        />
      </PaginatedTable>
    </CrmShell>
  );
}
