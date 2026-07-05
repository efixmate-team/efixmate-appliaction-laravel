"use client";

import { useState } from "react";

/**
 * LinkCell
 * Truncated, click-to-copy link cell.
 *
 * @prop {string|null} value - URL or any string to copy
 */
export function LinkCell({ value }) {
  const [copied,  setCopied]  = useState(false);
  const [hovered, setHovered] = useState(false);

  if (!value) return <span className="text-[13px] text-[#53697e]0">—</span>;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = Object.assign(document.createElement("input"), { value });
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/tooltip inline-block w-full max-w-[150px]">
      <button
        onClick={handleCopy}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-1 w-full text-[13px] text-[#eff6ff]0 hover:text-[#1d4ed8] transition-colors"
      >
        <span className="truncate flex-1 text-left">{value}</span>
        <span className="w-3.5 shrink-0">
          {copied ? (
            <svg className="w-3.5 h-3.5 text-[#f0fdf4]0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : hovered ? (
            <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h1" />
            </svg>
          ) : null}
        </span>
      </button>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-[#0f172a] text-[#ffffff] text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-[100] pointer-events-none border border-[#334155] font-medium ">
        {value}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}
