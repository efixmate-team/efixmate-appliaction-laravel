"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTechnicianAuthStore } from "@/store/technicianAuth.store";
import TechnicianAuthProvider from "@/providers/TechnicianAuthProvider";
const TECHNICIAN_RESERVED_SEGMENTS = new Set(["login", "register"]);

const isPublicTechnicianPath = (pathname: string) => {
  if (pathname === "/technician") return true;
  if (pathname.startsWith("/technician/login")) return true;
  // Admin technician panel: /technician/[id]/... — let the nested layout handle auth
  const seg = pathname.split("/")[2];
  if (seg && !TECHNICIAN_RESERVED_SEGMENTS.has(seg)) return true;
  return false;
};

function TechAuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isHydrated, isRegistered } = useTechnicianAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = isPublicTechnicianPath(pathname);
  const isUnauthenticatedProtectedPath = isHydrated && !isPublicPath && !token;

  useEffect(() => {
    if (!isHydrated) return;
    if (!isPublicPath && !token) {
      router.replace("/technician/login");
      return;
    }
  }, [isHydrated, token, isRegistered, pathname, router, isPublicPath]);

  if (!isHydrated || isUnauthenticatedProtectedPath) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f0fdf4] px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#16a34a]" />
        <p className="text-sm font-semibold text-[#14532d]">
          Mobile verification is required to access technician registration.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  return (
    <TechnicianAuthProvider>
      <TechAuthGuard>
        <div className="flex min-h-screen flex-col bg-[#f8fafc]">
          <div className="flex-1">{children}</div>
        </div>
      </TechAuthGuard>
    </TechnicianAuthProvider>
  );
}
