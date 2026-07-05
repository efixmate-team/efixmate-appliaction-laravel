import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminScopeState {
  country_id: number | null;
  country_name: string | null;
  state_id: number | null;
  state_name: string | null;
  city_id: number | null;
  city_name: string | null;
  area_id: number | null;
  area_name: string | null;
  fy_id: number | null;
  fy_label: string | null;
  setScope: (scope: Partial<Omit<AdminScopeState, "setScope" | "resetScope">>) => void;
  resetScope: () => void;
}

export const DEFAULT_FY_LABEL = "2026-27";

const DEFAULT_STATE = {
  country_id: 1,
  country_name: "India",
  state_id: null,
  state_name: null,
  city_id: null,
  city_name: null,
  area_id: null,
  area_name: null,
  fy_id: null as number | null,
  fy_label: DEFAULT_FY_LABEL,
};

export const useAdminScopeStore = create<AdminScopeState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setScope: (scope) => set((s) => ({ ...s, ...scope })),
      resetScope: () => set(DEFAULT_STATE),
    }),
    { name: "efm_admin_scope" },
  ),
);

export function applyDefaultFyFromMeta(
  financialYears: { fy_id: number; fy_label: string; is_current?: boolean }[],
  defaultFy?: { fy_id: number; fy_label: string } | null,
) {
  const target =
    defaultFy ??
    financialYears.find((f) => f.fy_label === DEFAULT_FY_LABEL) ??
    financialYears.find((f) => f.is_current);
  if (!target) return;
  const cur = useAdminScopeStore.getState();
  if (cur.fy_id == null || cur.fy_label === DEFAULT_FY_LABEL) {
    useAdminScopeStore.getState().setScope({
      fy_id: target.fy_id,
      fy_label: target.fy_label,
    });
  }
}
