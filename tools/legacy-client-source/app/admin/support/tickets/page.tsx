"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PaginatedTable, { Column } from "@/app/admin/(components)/Table";
import Input from "@/app/admin/(components)/Forms/Input";
import Select from "@/app/admin/(components)/Forms/Select";
import { usePaginatedTickets } from "@/src/features/support/hooks/useSupportTickets";
import { TICKET_PRIORITIES, TICKET_SOURCES, TICKET_STATUSES } from "@/src/features/support/constants";
import type { TicketListItem } from "@/src/features/support/types";
import { SupportShell } from "../(components)/SupportShell";
import { TicketStatusBadge } from "../(components)/TicketStatusBadge";
import { PriorityBadge } from "../(components)/PriorityBadge";
import { TableSkeleton } from "../(components)/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupportSocket } from "@/src/features/support/hooks/useSupportSocket";
import { useSupportTicketStore } from "@/store/supportTicketStore";

function SupportTicketsContent() {
  const searchParams = useSearchParams();
  const listVersion = useSupportTicketStore((s) => s.listVersion);
  const bumpList = useSupportTicketStore((s) => s.bumpListVersion);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [slaBreached, setSlaBreached] = useState(searchParams.get("slaBreached") === "true" ? "true" : "");

  const { data, loading, error, refresh } = usePaginatedTickets({
    page,
    limit,
    status: status || undefined,
    priority: priority || undefined,
    source: source || undefined,
    search: search || undefined,
    slaBreached: slaBreached || undefined,
  });

  useSupportSocket({
    onUpdate: () => {
      bumpList();
      refresh();
    },
  });

  useEffect(() => {
    if (listVersion > 0) refresh();
  }, [listVersion, refresh]);

  return (
    <SupportShell
      title="Tickets"
      description="Unified customer and technician support queue."
      actions={
        <Link href="/admin/support/tickets/new">
          <Button size="sm">Create ticket</Button>
        </Link>
      }
    >
      <div className="grid gap-3 rounded-xl border border-[#f1f5f9] bg-[#ffffff] p-4 md:grid-cols-2 lg:grid-cols-6">
        <Select title="Source" value={source} onChange={(e) => setSource(e.target.value)} options={TICKET_SOURCES} />
        <Select title="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={TICKET_STATUSES} />
        <Select
          title="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={[{ value: "", label: "All" }, ...TICKET_PRIORITIES]}
        />
        <Input title="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Subject or #" />
        <Select
          title="SLA"
          value={slaBreached}
          onChange={(e) => setSlaBreached(e.target.value)}
          options={[
            { value: "", label: "All" },
            { value: "true", label: "Breached only" },
          ]}
        />
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setPage(1);
              refresh();
            }}
          >
            Apply
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-[#dc2626]">{error}</p> : null}
      {loading && !data ? <TableSkeleton /> : null}

      <PaginatedTable
        title="Support tickets"
        data={data?.rows || []}
        total={data?.total || 0}
        loading={loading}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={refresh}
        rowKey="ticket_id"
        showRefresh
      >
        <Column
          header="Ticket"
          dataKey="ticket_number"
          render={(_v, row: TicketListItem) => (
            <Link
              href={`/admin/support/tickets/${row.ticket_id}?source=${row.ticket_source}`}
              className="font-medium text-[#2563eb] hover:underline"
            >
              {row.ticket_number || `#${row.ticket_id}`}
            </Link>
          )}
        />
        <Column header="Subject" dataKey="subject" />
        <Column header="Requester" dataKey="requester_name" />
        <Column header="Source" dataKey="ticket_source" />
        <Column
          header="Status"
          dataKey="status"
          render={(_v, row: TicketListItem) => <TicketStatusBadge status={row.status} />}
        />
        <Column
          header="Priority"
          dataKey="priority"
          render={(_v, row: TicketListItem) => <PriorityBadge priority={row.priority} />}
        />
        <Column
          header="SLA"
          dataKey="sla_breached"
          render={(_v, row: TicketListItem) =>
            row.sla_breached ? <Badge variant="danger">Breached</Badge> : <Badge variant="success">OK</Badge>
          }
        />
      </PaginatedTable>
    </SupportShell>
  );
}

export default function SupportTicketsPage() {
  return (
    <Suspense
      fallback={
        <SupportShell title="Support tickets">
          <TableSkeleton rows={8} />
        </SupportShell>
      }
    >
      <SupportTicketsContent />
    </Suspense>
  );
}

