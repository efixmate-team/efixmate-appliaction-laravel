"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperationalAPI } from "@/lib/adminOperationalApi";

type ApiResult<T> = { status: boolean; data?: T; message?: string };

export function useSecurityDashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = (await adminOperationalAPI.security.dashboard()) as ApiResult<Record<string, number>>;
    if (res.status && res.data) setStats(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}
