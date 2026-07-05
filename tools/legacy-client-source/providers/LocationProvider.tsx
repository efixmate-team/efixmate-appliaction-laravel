"use client";

import { useEffect, useRef } from "react";
import { useLocationStore } from "@/store/location.store";
import { useUserAuthStore } from "@/store/userAuth.store";
import { autoDetectLocation } from "@/lib/locationDetection";
import { getAddresses, activateAddress } from "@/lib/api/userClient";
import {
  locationFromUserAddress,
  normalizeUserAddresses,
  resolveNearestSavedAddress,
} from "@/lib/userAddress";

/**
 * On mount:
 * 1. Rehydrate persisted location from localStorage
 * 2. Logged-in → GPS picks nearest saved address (Home vs Office) and activates it
 * 3. Guest → auto-detect via GPS / IP
 */
export default function LocationProvider({ children }: { children: React.ReactNode }) {
  const { setLocation, setDetecting, setPermissionDenied, hydrate } = useLocationStore();
  const { token } = useUserAuthStore();
  const ranForToken = useRef<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (token) {
        if (ranForToken.current === token) return;
        ranForToken.current = token;

        try {
          const res = await getAddresses() as { status?: boolean; data?: unknown };
          const addresses = normalizeUserAddresses(res.data);

          if (addresses.length > 0 && !cancelled) {
            setDetecting(true);
            const match = await resolveNearestSavedAddress(addresses);
            if (match && !cancelled) {
              const { address, gpsUsed } = match;
              if (gpsUsed && !address.is_selected) {
                await activateAddress(address.address_id);
              }
              setLocation(locationFromUserAddress({ ...address, is_selected: true }));
            }
            setDetecting(false);
            return;
          }
        } catch {
          /* fall through */
        }
      } else {
        ranForToken.current = null;
      }

      const stored = useLocationStore.getState().location;
      if (stored && stored.source !== "default") return;
      if (cancelled) return;

      setDetecting(true);
      const { location: detected, permissionDenied } = await autoDetectLocation();
      if (!cancelled) {
        setLocation(detected);
        setPermissionDenied(permissionDenied);
      }
      setDetecting(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, setLocation, setDetecting, setPermissionDenied]);

  return <>{children}</>;
}
