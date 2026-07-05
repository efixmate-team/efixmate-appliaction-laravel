import * as React from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm ${className}`}>{children}</div>;
}

export function CardHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`border-b border-[#f1f5f9] px-4 py-3 ${className}`}>{children}</div>;
}

export function CardTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={`text-sm font-semibold text-[#1e293b] ${className}`}>{children}</h3>;
}

export function CardDescription({ children }: { className?: string; children: React.ReactNode }) {
  return <p className="mt-0.5 text-xs text-[#53697e]">{children}</p>;
}

export function CardContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}