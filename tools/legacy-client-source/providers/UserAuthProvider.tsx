"use client";

import { useEffect } from "react";
import { useUserAuthStore } from "@/store/userAuth.store";
import { getUserProfile } from "@/lib/api/userClient";
import { normalizeCustomer } from "@/lib/userAuth";
import { initUserFcm } from "@/lib/firebase/fcm";

/**
 * Rehydrates the cached customer from localStorage on mount.
 * If a cookie-backed session marker exists, fetches the profile to confirm it's still valid.
 * Logs out if the server returns 401/404 (stale or missing user).
 */
export default function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, token, setCustomer, logout, isHydrated } = useUserAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated || !token) return;

    (async () => {
      try {
        const res = await getUserProfile() as { status?: boolean; data?: unknown; message?: string };
        if (res.status === false) {
          // Stale token (e.g. user from production DB not in local DB) — clear session
          logout();
          return;
        }
        const customer = normalizeCustomer(res.data);
        if (customer) setCustomer(customer);
        initUserFcm().catch(() => {});
      } catch {
        /* network error — keep cached session */
      }
    })();
  }, [isHydrated, token, setCustomer, logout]);

  return <>{children}</>;
}
