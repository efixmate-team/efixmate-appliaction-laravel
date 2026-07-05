"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  useEffect(() => {
    adminAPI.profile()
      .then((res) => {
        if (!res?.status || !res?.data) {
          setUser(null);
          router.push("/login");
          return;
        }

        setUser({
          ...res.data,
          role: "ADMIN",
        });
      })
      .catch(() => {
        setUser(null);
        router.push("/login");
      });
  }, [router, setUser]);

  return children;
}
