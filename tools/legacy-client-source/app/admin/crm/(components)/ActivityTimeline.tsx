"use client";

import {
  Activity,
  MessageSquare,
  Wallet,
  Gift,
  ShieldAlert,
  Ban,
  CalendarDays,
  Phone,
} from "lucide-react";
import type { ActivityEvent } from "@/src/features/crm/types";

const ICONS: Record<string, typeof Activity> = {
  booking: CalendarDays,
  wallet: Wallet,
  loyalty: Gift,
  complaint: MessageSquare,
  spam: ShieldAlert,
  block: Ban,
  unblock: Ban,
  communication: Phone,
  note: MessageSquare,
  login: Activity,
};

export function ActivityTimeline({
  events,
  loading,
}: {
  events: ActivityEvent[];
  loading?: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-[#53697e]">Loading timeline…</p>;
  }
  if (!events.length) {
    return <p className="rounded-lg border border-dashed border-[#e2e8f0] p-6 text-center text-sm text-[#53697e]">No activity yet.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-[#e2e8f0] pl-6">
      {events.map((ev) => {
        const Icon = ICONS[ev.event_type] || Activity;
        return (
          <li key={String(ev.event_id)} className="relative pb-6">
            <span className="absolute -left-[1.65rem] flex h-7 w-7 items-center justify-center rounded-full bg-[#ffffff] ring-2 ring-[#e2e8f0]">
              <Icon className="h-3.5 w-3.5 text-[#53697e]" />
            </span>
            <div className="rounded-lg border border-[#f1f5f9] bg-[#ffffff] p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#0f172a]">{ev.title}</p>
                <span className="text-[11px] uppercase tracking-wide text-[#94a3b8]">{ev.event_type}</span>
              </div>
              {ev.description ? <p className="mt-1 text-sm text-[#475569]">{ev.description}</p> : null}
              <p className="mt-1 text-xs text-[#94a3b8]">
                {ev.created_at ? new Date(ev.created_at).toLocaleString() : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
