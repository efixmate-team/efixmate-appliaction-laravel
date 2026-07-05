"use client";

import { ToastProvider } from "@/providers/ToastProvider";

export default function BookingWorkflowLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
