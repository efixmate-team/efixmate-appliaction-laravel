"use client";

import { useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUserAuthStore } from "@/store/userAuth.store";
import UserAuthProvider from "@/providers/UserAuthProvider";

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const { token, isHydrated } = useUserAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isHydrated || !token || pathname !== "/login") return;
    const redirect = searchParams.get("redirect") || "/";
    router.replace(redirect);
  }, [isHydrated, token, pathname, router, searchParams]);

  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserAuthProvider>
      <Suspense fallback={null}>
        <AuthLayoutInner>{children}</AuthLayoutInner>
      </Suspense>
    </UserAuthProvider>
  );
}
