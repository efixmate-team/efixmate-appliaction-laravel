"use client";

import { useEffect, useRef } from "react";

type TicketEvent = {
  ticketId: number;
  ticketSource: string;
  action?: string;
};

/**
 * Subscribe to admin support ticket Socket.IO events.
 */
export function useSupportSocket(
  opts: {
    ticketId?: number;
    ticketSource?: string;
    onUpdate?: (payload: TicketEvent) => void;
    onReply?: (payload: TicketEvent & { reply?: unknown }) => void;
  } = {}
) {
  const socketRef = useRef<{
    emit: (ev: string, data: unknown) => void;
    on: (ev: string, fn: (p: unknown) => void) => void;
    off: (ev: string, fn: (p: unknown) => void) => void;
    disconnect: () => void;
  } | null>(null);

  const { ticketId, ticketSource, onUpdate, onReply } = opts;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    (async () => {
      try {
        const { io } = await import("socket.io-client");
        const base =
          process.env.NEXT_PUBLIC_SOCKET_URL ||
          `${window.location.protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_API_PORT || "5000"}`;

        const socket = io(`${base}/admin-ops`, {
          path: "/socket.io",
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        const handleUpdate = (p: TicketEvent) => onUpdate?.(p);
        const handleReply = (p: TicketEvent) => onReply?.(p);

        socket.on("support:ticket-updated", handleUpdate);
        socket.on("support:ticket-reply", handleReply);

        socketRef.current = socket;

        if (ticketId && ticketSource) {
          socket.emit("support:subscribe-ticket", { ticketId, ticketSource });
        }
      } catch {
        /* socket optional */
      }
    })();

    return () => {
      cancelled = true;
      const s = socketRef.current;
      if (s && ticketId && ticketSource) {
        s.emit("support:unsubscribe-ticket", { ticketId, ticketSource });
      }
      s?.disconnect?.();
      socketRef.current = null;
    };
  }, [ticketId, ticketSource, onUpdate, onReply]);
}
