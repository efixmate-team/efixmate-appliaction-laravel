"use client";

import { useEffect } from "react";
import { useTechnicianAuthStore } from "@/store/technicianAuth.store";
import { getTechnicianProfile } from "@/lib/api/technicianClient";
import { normalizeTechnician, isTechTokenExpired } from "@/lib/technicianAuth";
import { initTechnicianFcm } from "@/lib/firebase/fcm";

export default function TechnicianAuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, token, setTechnician, setRegistrationState, logout, isHydrated } = useTechnicianAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated || !token) return;

    if (isTechTokenExpired(token)) {
      logout();
      return;
    }

    (async () => {
      try {
        const res = await getTechnicianProfile() as {
          status?: boolean;
          data?: unknown;
          is_registered?: boolean;
          isRegistered?: boolean;
        };
        if (res.status === false) {
          if (res.is_registered === false || res.isRegistered === false) {
            setRegistrationState(false);
            return;
          }
          logout();
          return;
        }
        if (res.is_registered === true || res.isRegistered === true) {
          setRegistrationState(true);
        }
        const tech = normalizeTechnician(res.data);
        if (tech) setTechnician(tech);
        initTechnicianFcm(token).catch(() => {});
      } catch {
        /* keep cached session on network error */
      }
    })();
  }, [isHydrated, token, setTechnician, setRegistrationState, logout]);

  return <>{children}</>;
}
