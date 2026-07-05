"use client";

import { create } from "zustand";

export type TechnicianUser = {
  technician_id: number;
  first_name: string;
  last_name?: string;
  mobile_number: string;
  email?: string | null;
  is_active?: boolean;
  profile_photo?: string | null;
  application_status?: string;
};

type TechnicianAuthState = {
  token: string | null;
  technician: TechnicianUser | null;
  isRegistered: boolean | null;
  isHydrated: boolean;
  setToken: (token: string) => void;
  setTechnician: (technician: TechnicianUser) => void;
  setRegistrationState: (isRegistered: boolean | null) => void;
  setSession: (token: string, technician: TechnicianUser, isRegistered?: boolean | null) => void;
  logout: () => void;
  hydrate: () => void;
};

const TOKEN_KEY = "efm_tech_token";
const TECH_KEY = "efm_tech_user";
const REGISTERED_KEY = "efm_tech_is_registered";

function readStoredTechnician(): TechnicianUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TECH_KEY);
    return raw ? (JSON.parse(raw) as TechnicianUser) : null;
  } catch {
    return null;
  }
}

export const useTechnicianAuthStore = create<TechnicianAuthState>((set) => ({
  token: null,
  technician: null,
  isRegistered: null,
  isHydrated: false,

  setToken: (token) => {
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },

  setTechnician: (technician) => {
    if (typeof window !== "undefined") localStorage.setItem(TECH_KEY, JSON.stringify(technician));
    set({ technician });
  },

  setRegistrationState: (isRegistered) => {
    if (typeof window !== "undefined") {
      if (isRegistered === null) localStorage.removeItem(REGISTERED_KEY);
      else localStorage.setItem(REGISTERED_KEY, isRegistered ? "true" : "false");
    }
    set({ isRegistered });
  },

  setSession: (token, technician, isRegistered = null) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TECH_KEY, JSON.stringify(technician));
      if (isRegistered === null) localStorage.removeItem(REGISTERED_KEY);
      else localStorage.setItem(REGISTERED_KEY, isRegistered ? "true" : "false");
    }
    set({ token, technician, isRegistered });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TECH_KEY);
      localStorage.removeItem(REGISTERED_KEY);
    }
    set({ token: null, technician: null, isRegistered: null });
  },

  hydrate: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TOKEN_KEY);
      const registeredRaw = localStorage.getItem(REGISTERED_KEY);
      const isRegistered =
        registeredRaw === "true" ? true : registeredRaw === "false" ? false : null;
      set({ token: stored ?? null, technician: readStoredTechnician(), isRegistered, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));
