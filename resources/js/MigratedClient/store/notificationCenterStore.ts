import { create } from "zustand";

interface NotificationCenterState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}

export const useNotificationCenterStore = create<NotificationCenterState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
