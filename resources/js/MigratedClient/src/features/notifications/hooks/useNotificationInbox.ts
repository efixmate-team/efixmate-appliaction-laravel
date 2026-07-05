"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";
import type { NotificationInboxItem, PaginatedResult } from "../types";

type ApiResult<T> = { status: boolean; data?: T; message?: string };

export function useNotificationInbox(limit = 8, enabled = false) {
  const [items, setItems] = useState<NotificationInboxItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const [inboxRes, unreadRes] = await Promise.all([
      adminOperationalAPI.notifications.inbox({ page: 1, limit, isRead: false }) as Promise<
        ApiResult<PaginatedResult<NotificationInboxItem>>
      >,
      adminOperationalAPI.notifications.inboxUnreadCount() as Promise<ApiResult<{ unread: number }>>,
    ]);
    if (inboxRes.status && inboxRes.data) setItems(inboxRes.data.rows || []);
    if (unreadRes.status && unreadRes.data) setUnread(unreadRes.data.unread);
    setLoading(false);
  }, [limit, enabled]);

  const markRead = useCallback(
    async (inboxId: number) => {
      await adminOperationalAPI.notifications.markInboxRead(inboxId);
      await refresh();
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    await adminOperationalAPI.notifications.markAllInboxRead();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [refresh, enabled]);

  return { items, unread, loading, refresh, markRead, markAllRead };
}
