"use client";

import { ToastProvider } from "@/providers/ToastProvider";

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
