"use client";

import { resolveUploadUrl } from "@/lib/api/coreClient";
import type { UserCustomer } from "@/store/userAuth.store";

type UserAvatarProps = {
  customer?: UserCustomer | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: { box: "h-6 w-6 text-[10px]", px: 24 },
  md: { box: "h-9 w-9 text-[12px]", px: 36 },
  lg: { box: "h-12 w-12 text-[15px]", px: 48 },
} as const;

export function UserAvatar({ customer, size = "md", className = "" }: UserAvatarProps) {
  const { box, px } = SIZES[size];
  const name = customer?.first_name?.trim() || "U";
  const initial = name.charAt(0).toUpperCase();
  const raw = customer?.profile_pitcher?.trim();
  const imgUrl = raw ? resolveUploadUrl(raw) : "";

  if (imgUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgUrl}
        alt=""
        width={px}
        height={px}
        className={`${box} aspect-square shrink-0 rounded-full object-cover ring-2 ring-[#ffffff] ${className}`}
      />
    );
  }

  return (
    <div
      className={`${box} flex shrink-0 items-center justify-center rounded-full bg-[#0e55d9] font-black text-[#ffffff] shadow-[0_2px_8px_rgba(14,85,217,0.25)] ${className}`}
    >
      {initial}
    </div>
  );
}
