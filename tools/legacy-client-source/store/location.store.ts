"use client";

import { create } from "zustand";

export type LocationSource = "gps" | "ip" | "manual" | "address" | "default";

export type LocationData = {
  lat: number;
  lng: number;
  /** Locality / neighbourhood name, e.g. "Shankar Nagar" */
  area: string;
  /** City name, e.g. "Raipur" */
  city: string;
  /** Short state code, e.g. "CG" */
  state: string;
  /** Pincode */
  pincode?: string;
  /** What the header pill shows: "Shankar Nagar, Raipur" */
  displayName: string;
  /** How the location was determined */
  source: LocationSource;
  /** Saved address id when location comes from a customer address */
  addressId?: number;
};

export type ServiceabilityState = {
  checked: boolean;
  serviceable: boolean;
  areaId: number | null;
};

type LocationStore = {
  location: LocationData | null;
  isDetecting: boolean;
  isModalOpen: boolean;
  permissionDenied: boolean;
  serviceability: ServiceabilityState | null;

  setLocation: (loc: LocationData) => void;
  setDetecting: (v: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
  setPermissionDenied: (v: boolean) => void;
  setServiceability: (s: ServiceabilityState) => void;
  clearServiceability: () => void;
  checkServiceability: (lat: number, lng: number) => Promise<void>;
  /** Read persisted location from localStorage */
  hydrate: () => void;
};

const STORAGE_KEY = "efm_location";

const DEFAULT_LOCATION: LocationData = {
  lat: 21.2514, lng: 81.6296,
  area: "", city: "Raipur", state: "CG",
  displayName: "Raipur, CG",
  source: "default",
};

export const useLocationStore = create<LocationStore>((set) => ({
  location:        null,
  isDetecting:     false,
  isModalOpen:     false,
  permissionDenied: false,
  serviceability:  null,

  setLocation: (location) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    }
    set({ location });
  },

  setDetecting:        (isDetecting) => set({ isDetecting }),
  openModal:           ()            => set({ isModalOpen: true }),
  closeModal:          ()            => set({ isModalOpen: false }),
  setPermissionDenied: (v)           => set({ permissionDenied: v }),
  setServiceability:   (s)           => set({ serviceability: s }),
  clearServiceability: ()            => set({ serviceability: null }),

  checkServiceability: async (lat, lng) => {
    try {
      const { BASE_URL } = await import("@/lib/api/coreClient");
      const res = await fetch(`${BASE_URL}/user/check-serviceability?lat=${lat}&lng=${lng}`);
      if (!res.ok) {
        set({ serviceability: { checked: true, serviceable: true, areaId: null } });
        return;
      }
      const data = await res.json();
      set({
        serviceability: {
          checked: true,
          serviceable: data.serviceable !== false,
          areaId: data.area_id ?? null,
        },
      });
    } catch {
      // Fail open — network error must not block users
      set({ serviceability: { checked: true, serviceable: true, areaId: null } });
    }
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LocationData;
        set({ location: parsed });
      } else {
        set({ location: DEFAULT_LOCATION });
      }
    } catch {
      set({ location: DEFAULT_LOCATION });
    }
  },
}));

export { DEFAULT_LOCATION };
