"use client";

import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/lib/api/coreClient";

/** Resolve avatar src from row fields (admin profile_image is often a data: URL). */
export function resolveAvatarUrl(row) {
  const raw =
    row?.profile_image ||
    row?.profileImage ||
    row?.avatar ||
    row?.profile_pitcher ||
    row?.profilePitcher ||
    null;
  if (!raw) return null;
  const path = String(raw).trim();
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return resolveUploadUrl(path);
}

/**
 * AvatarCell
 * Circular avatar (image or initials) with name and optional email.
 *
 * @prop {string} value    - Full name (used for initials + alt text)
 * @prop {object} row      - Full row data; reads profile_image, avatar, profile_pitcher
 */
export function AvatarCell({ value, row }) {
  const avatarUrl = resolveAvatarUrl(row);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const initials = String(value)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 max-w-[200px]">
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={value}
          onError={() => setImgError(true)}
          className="w-9 h-9 rounded-full border border-[#e2e8f0] object-cover shadow-sm shrink-0"
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full border border-[#e2e8f0] bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] text-[#475569] flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm"
          aria-hidden
        >
          {initials || "?"}
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <div className="relative group/tooltip inline-block max-w-full text-left">
          <span className="text-[13px] font-semibold text-[#0f172a] leading-none mb-1 truncate block">
            {value}
          </span>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block bg-[#0f172a] text-[#ffffff] text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-[100] pointer-events-none border border-[#334155] font-medium ">
            {value}
            <div className="absolute top-full left-2 -mt-px border-4 border-transparent border-t-slate-900" />
          </div>
        </div>
        {row?.email && (
          <div className="relative group/tooltip inline-block max-w-full text-left">
            <span className="text-xs text-[#53697e]0 truncate block">{row.email}</span>
            <div className="absolute top-full left-0 mt-2 hidden group-hover/tooltip:block bg-[#0f172a] text-[#ffffff] text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-[100] pointer-events-none border border-[#334155] font-medium ">
              {row.email}
              <div className="absolute bottom-full left-2 -mb-px border-4 border-transparent border-b-slate-900" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
