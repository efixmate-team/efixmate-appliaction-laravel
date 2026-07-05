"use client";

import { ToastProvider } from "@/providers/ToastProvider";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
