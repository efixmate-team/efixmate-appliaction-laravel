"use client";

import { ToastProvider } from "@/providers/ToastProvider";

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
