"use client";

import UserAuthProvider from "@/providers/UserAuthProvider";

export default function HomeAuthShell({ children }: { children: React.ReactNode }) {
  return <UserAuthProvider>{children}</UserAuthProvider>;
}
