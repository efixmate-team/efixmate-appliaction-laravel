import { create } from "zustand";
import type { TicketListItem } from "@/src/features/support/types";

interface SupportTicketState {
  selectedTicket: TicketListItem | null;
  setSelectedTicket: (t: TicketListItem | null) => void;
  listVersion: number;
  bumpListVersion: () => void;
}

export const useSupportTicketStore = create<SupportTicketState>((set) => ({
  selectedTicket: null,
  setSelectedTicket: (selectedTicket) => set({ selectedTicket }),
  listVersion: 0,
  bumpListVersion: () => set((s) => ({ listVersion: s.listVersion + 1 })),
}));
