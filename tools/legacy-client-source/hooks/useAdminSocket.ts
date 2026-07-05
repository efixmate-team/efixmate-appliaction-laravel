"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type LiveMetrics = Record<string, unknown>;
type LiveBooking = Record<string, unknown>;

/**
 * Admin /admin-ops Socket.IO (polling fallback when socket.io-client unavailable).
 */
export function useAdminSocket(enabled = true) {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<{ disconnect: () => void } | null>(null);

  const applyPayload = useCallback((m: LiveMetrics | null, b: LiveBooking[]) => {
    if (m) setMetrics(m);
    if (b?.length) setBookings(b);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

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

        socket.on("connect", () => !cancelled && setConnected(true));
        socket.on("disconnect", () => !cancelled && setConnected(false));
        socket.on("dashboard:metrics", (payload: LiveMetrics) => !cancelled && setMetrics(payload));
        socket.on("dashboard:bookings", (payload: LiveBooking[]) => !cancelled && setBookings(payload));

        socketRef.current = socket;
      } catch {
        setConnected(false);
      }
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect?.();
      socketRef.current = null;
    };
  }, [enabled]);

  return { metrics, bookings, connected, applyPayload };
}
