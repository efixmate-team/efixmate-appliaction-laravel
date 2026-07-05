"use client";

import { create } from "zustand";

export type UserCustomer = {
  customer_id: number;
  customer_uid?: string;
  first_name: string;
  last_name?: string;
  mobile_number: string;
  email?: string | null;
  email_verified?: boolean;
  mobile_verified?: boolean;
  is_active?: boolean;
  profile_pitcher?: string | null;
};

type UserAuthState = {
  // Token is no longer stored in JS — it lives in an httpOnly cookie set by the server.
  // Keep a non-secret compatibility marker so older UI code can still test `!!token`.
  token: string | null;
  customer: UserCustomer | null;
  isHydrated: boolean;
  setCustomer: (customer: UserCustomer) => void;
  setSession: (customer: UserCustomer) => void;
  logout: () => void;
  hydrate: () => void;
};

const CUSTOMER_KEY = "efm_u_customer";

function readStoredCustomer(): UserCustomer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? (JSON.parse(raw) as UserCustomer) : null;
  } catch {
    return null;
  }
}

export const useUserAuthStore = create<UserAuthState>((set) => ({
  token: null,
  customer: null,
  isHydrated: false,

  setCustomer: (customer) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    }
    set({ customer, token: "cookie-session" });
  },

  // setSession no longer accepts a token — cookie is set server-side
  setSession: (customer) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    }
    set({ customer, token: "cookie-session" });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CUSTOMER_KEY);
    }
    set({ customer: null, token: null });
  },

  hydrate: () => {
    const customer = readStoredCustomer();
    set({
      customer,
      token: customer ? "cookie-session" : null,
      isHydrated: true,
    });
  },
}));
