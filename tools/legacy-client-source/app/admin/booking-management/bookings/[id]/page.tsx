"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BookingDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/booking-management/workflow/${params.id}`);
  }, [params.id, router]);

  return null;
}
