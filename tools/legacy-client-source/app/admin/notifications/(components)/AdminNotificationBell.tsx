"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, X } from "lucide-react";
import { useNotificationInbox } from "@/src/features/notifications/hooks/useNotificationInbox";

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const { items, unread, loading, markRead, markAllRead, refresh } = useNotificationInbox(6, open);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8f0]/60 bg-[#f8fafc] text-[#475569] transition-all duration-150 hover:bg-[#f1f5f9] hover:text-[#334155]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fff7ed] px-1 text-[9px] font-bold text-[#ffffff]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-[#f1f5f9] bg-[#ffffff] shadow-xl shadow-[#e2e8f0]/80">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3">
              <span className="text-[13px] font-semibold text-[#475569]">Notifications</span>
              <div className="flex items-center gap-2">
                {unread > 0 ? (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="text-[11px] text-[#2563eb] hover:text-[#1d4ed8]"
                  >
                    Mark all read
                  </button>
                ) : null}
                <button type="button" onClick={() => setOpen(false)} className="text-[#5c6a7f] hover:text-[#475569]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="max-h-80 divide-y divide-[#f8fafc] overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-center text-xs text-[#5c6a7f]">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-[#5c6a7f]">No unread notifications</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.inbox_id}
                    type="button"
                    onClick={() => void markRead(n.inbox_id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc]"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#eff6ff]" />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-[#334155]">{n.title}</p>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-[#5c6a7f]">{n.body}</p>
                      ) : null}
                      <p className="mt-0.5 text-[10px] text-[#5c6a7f]">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-[#f1f5f9] px-4 py-2.5">
              <Link
                href="/admin/notifications"
                onClick={() => setOpen(false)}
                className="text-[12px] text-[#2563eb] hover:text-[#1d4ed8]"
              >
                Open Notification Center
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
