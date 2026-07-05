"use client";

import { ToastProvider } from "@/providers/ToastProvider";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
