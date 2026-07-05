"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (opts: { type?: ToastType; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (opts: { type?: ToastType; title: string; description?: string }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const item: ToastItem = {
        id,
        type: opts.type || "info",
        title: opts.title,
        description: opts.description,
      };
      setItems((prev) => [...prev, item]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    toast: push,
    success: (title, description) => push({ type: "success", title, description }),
    error: (title, description) => push({ type: "error", title, description }),
  };

  const icon = (type: ToastType) => {
    if (type === "success") return <CheckCircle2 className="h-4 w-4 text-[#059669]" />;
    if (type === "error") return <AlertCircle className="h-4 w-4 text-[#dc2626]" />;
    return <Info className="h-4 w-4 text-[#2563eb]" />;
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex gap-3 rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-3 shadow-lg"
            role="status"
          >
            <div className="mt-0.5">{icon(t.type)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1e293b]">{t.title}</p>
              {t.description ? <p className="mt-0.5 text-xs text-[#53697e]">{t.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-[#94a3b8] hover:text-[#475569]"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}