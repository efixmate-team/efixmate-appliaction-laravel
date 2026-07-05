"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { ContactInquiryShell } from "./(components)/ContactInquiryShell";
import { InquiryStatusBadge } from "./(components)/InquiryStatusBadge";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import { INQUIRY_STATUSES } from "@/src/features/contact-inquiries/constants";

type InquiryRow = {
  inquiry_id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  status: string;
  created_at: string;
};

type Stats = {
  new: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
};

export default function ContactInquiriesPage() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const res = await adminOperationalAPI.contactInquiries.stats();
    if (res.status && res.data) setStats(res.data as Stats);
  }, []);

  const load = useCallback(
    async (overrides: Record<string, unknown> = {}) => {
      setLoading(true);
      const res = await adminOperationalAPI.contactInquiries.list({
        page: String(overrides.page ?? page),
        limit: String(overrides.limit ?? limit),
        status: (overrides.status ?? status) || undefined,
        search: (overrides.search ?? search) || undefined,
      });
      if (res.status && res.data) {
        const payload = res.data as { rows?: InquiryRow[]; total?: number };
        setRows(
          (payload.rows || []).map((r) => ({
            ...r,
            inquiry_id: String(r.inquiry_id),
          }))
        );
        setTotal(payload.total || 0);
      }
      setLoading(false);
    },
    [page, limit, status, search]
  );

  useEffect(() => {
    void loadStats();
    void load();
  }, []);

  return (
    <ContactInquiryShell
      title="Contact inquiries"
      description="Messages submitted from the website contact form."
    >
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total", value: stats.total, className: "text-[#1e293b]" },
            { label: "New", value: stats.new, className: "text-[#2563eb]" },
            { label: "In progress", value: stats.in_progress, className: "text-[#d97706]" },
            { label: "Resolved", value: stats.resolved, className: "text-[#059669]" },
            { label: "Closed", value: stats.closed, className: "text-[#53697e]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-[#53697e]">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.className}`}>{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <PaginatedTable
        title="Inbox"
        badge="Contact"
        subtitle={`${total} messages`}
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
        onRefresh={() => {
          void loadStats();
          void load();
        }}
        rowKey="inquiry_id"
        searchPlaceholder="Search name, email, subject, message…"
        filters={[
          {
            type: "dropdown",
            label: "Status",
            value: status,
            options: [{ label: "All", value: "" }, ...INQUIRY_STATUSES.map((s) => ({ label: s.label, value: s.value }))],
            onChange: (v: string) => {
              setStatus(v);
              setPage(1);
              void load({ status: v, page: 1 });
            },
          },
        ]}
      >
        <Column header="ID" dataKey="inquiry_id" render={(v) => <span className="font-mono text-xs">#{v}</span>} />
        <Column header="From" dataKey="name" sortable />
        <Column header="Email" dataKey="email" />
        <Column header="Subject" dataKey="subject" render={(v) => v || "—"} />
        <Column
          header="Status"
          dataKey="status"
          render={(_v, row: InquiryRow) => <InquiryStatusBadge status={row.status} />}
        />
        <Column
          header="Received"
          dataKey="created_at"
          render={(v) => new Date(String(v)).toLocaleString()}
        />
        <Column
          header=""
          dataKey="_actions"
          render={(_v, row: InquiryRow) => (
            <Link
              href={`/admin/contact-inquiries/${row.inquiry_id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#2563eb] hover:underline"
            >
              <Eye size={16} />
              View
            </Link>
          )}
        />
      </PaginatedTable>
    </ContactInquiryShell>
  );
}
