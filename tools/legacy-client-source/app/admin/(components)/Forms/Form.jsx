'use client';

import React, { useRef, useState } from "react";
import { cn, FormContext, useFormContext } from "./formUtils";

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const GAPS = {
  sm: "gap-3",
  md: "gap-5",
  lg: "gap-7",
};

const ALIGN = {
  left: "justify-start",
  right: "justify-end",
  center: "justify-center",
  full: "justify-stretch",
};

export default function Form({
  showMe = true,
  onSubmit,
  onReset,
  children,
  className,

  cols = 1,
  gap = "md",

  submitLabel = "Submit",
  resetLabel = "Reset",
  showReset = false,
  submitAlign = "right",
  loading = false,

  card = false,
  title,
  subtitle,
}) {
  const formRef = useRef(null);
  const isSubmitting = useRef(false);
  const [submitCount, setSubmitCount] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || isSubmitting.current) return;

    setSubmitCount((prev) => prev + 1);

    const form = e.target;

    // Wait for React to update children before reading FormData
    requestAnimationFrame(() => {
      if (isSubmitting.current) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const values = Object.fromEntries(formData.entries());

      isSubmitting.current = true;
      const result = onSubmit?.(formData, values);
      if (result && typeof result.then === "function") {
        result.finally(() => { isSubmitting.current = false; });
      } else {
        isSubmitting.current = false;
      }
    });
  };

  const handleReset = (e) => {
    e.preventDefault();
    formRef.current?.reset();
    onReset?.();
  };

  const inner = (
    <FormContext.Provider value={{ submitCount }}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onReset={handleReset}
        className={cn("flex flex-col gap-5", !card && className)}
      >
        {/* ✅ GRID */}
        <div className={cn("grid", COLS[cols] ?? COLS[1], GAPS[gap] ?? GAPS.md)}>
          {children}
        </div>

        {/* Actions */}
        <div className={cn("flex items-center gap-2.5 pt-16", ALIGN[submitAlign] ?? ALIGN.right)}>

          {showReset && (
            <button
              type="reset"
              disabled={loading}
              className={cn(
                "px-4 py-2 rounded-lg text-[13px] font-semibold border",
                "text-[#475569] bg-[#ffffff] border-[#e2e8f0] hover:bg-[#f8fafc]",
                "disabled:opacity-50",
                submitAlign === "full" && "flex-1"
              )}
            >
              {resetLabel}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-semibold",
              "bg-[#1e293b] text-[#ffffff] hover:bg-[#0f172a]",
              "disabled:opacity-60",
              submitAlign === "full" && "flex-1"
            )}
          >
            {loading ? "Loading..." : submitLabel}
          </button>

        </div>
      </form>
    </FormContext.Provider>
  );

  if (!card) return inner;

  return (
    <>
      {showMe && (
        <div className={cn("bg-[#ffffff] rounded-xl shadow-sm overflow-hidden", className)}>
          {(title || subtitle) && (
            <div className="px-6 py-5">
              {title && <h2 className="text-[15px] font-bold">{title}</h2>}
              {subtitle && <p className="text-[13px] text-[#53697e]0">{subtitle}</p>}
            </div>
          )}
          <div className="px-6 py-6">{inner}</div>
        </div>
      )}
    </>
  );
}