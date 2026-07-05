"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Check, ChevronRight, X } from "lucide-react";
import {
  ADMIN_SETUP_FLOW,
  findSetupStepIndex,
  FIRST_SETUP_STEP,
  isSetupGuideSection,
} from "@/app/admin/(lib)/adminSetupGuide";

const TOTAL_STEPS = ADMIN_SETUP_FLOW.length;
const FIRST_STEP = FIRST_SETUP_STEP;
const VISITS_KEY = "efm_setup_visits";

function loadVisits(): Record<number, string> {
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    return raw ? (JSON.parse(raw) as Record<number, string>) : {};
  } catch {
    return {};
  }
}

function saveVisit(step: number) {
  try {
    const visits = loadVisits();
    visits[step] = new Date().toISOString();
    localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
  } catch {
    /* ignore */
  }
}

function formatVisit(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function SetupGuideButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [visitTimes, setVisitTimes] = useState<Record<number, string>>({});

  // Clear legacy one-time dismiss flag so the guide stays available.
  useEffect(() => {
    try {
      sessionStorage.removeItem("efm_setup_guide_dismissed");
    } catch {
      /* ignore */
    }
  }, []);

  // Record visit whenever user lands on a step page.
  const currentIndex = findSetupStepIndex(pathname);
  const onStepPage = currentIndex >= 0;

  useEffect(() => {
    if (!onStepPage) return;
    const step = ADMIN_SETUP_FLOW[currentIndex].step;
    saveVisit(step);
    setVisitTimes((prev) => ({ ...prev, [step]: new Date().toISOString() }));
  }, [currentIndex, onStepPage]);

  // Load stored visits on mount.
  useEffect(() => {
    setVisitTimes(loadVisits());
  }, []);

  if (!isSetupGuideSection(pathname)) return null;

  const current = onStepPage ? ADMIN_SETUP_FLOW[currentIndex] : null;
  const next = onStepPage ? ADMIN_SETUP_FLOW[currentIndex + 1] ?? null : FIRST_STEP;
  const isLast = onStepPage && !ADMIN_SETUP_FLOW[currentIndex + 1];

  const handleClosePanel = () => setExpanded(false);

  const handleNext = () => {
    if (onStepPage && isLast) {
      router.push("/admin/dashboard");
      return;
    }
    router.push(next.path);
    setExpanded(false);
  };

  const handleStart = () => {
    router.push(FIRST_STEP.path);
    setExpanded(false);
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-2"
      style={{ pointerEvents: "none" }}
    >
      {expanded && (
        <div
          className="w-80 max-h-[min(70vh,520px)] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-[0_20px_60px_rgba(14,85,217,0.18)] flex flex-col"
          style={{ pointerEvents: "auto" }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0e55d9] to-[#2563eb] px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-[#ffffff]" />
              <span className="text-[12px] font-normal text-[#ffffff]">Configuration guide</span>
            </div>
            <button
              type="button"
              onClick={handleClosePanel}
              className="grid h-5 w-5 place-items-center rounded-full bg-[#ffffff]/20 text-[#ffffff] hover:bg-[#ffffff]/30 transition-colors"
              aria-label="Close guide panel"
            >
              <X size={11} />
            </button>
          </div>

          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#f1f5f9] shrink-0">
            <p className="text-[11px] text-[#475569] leading-relaxed">
              Configure in order: <strong>Lookups</strong> first (reference data), then{" "}
              <strong>Masters</strong> (geography, services, pricing).
            </p>
            {onStepPage && current && (
              <div className="mt-2 h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0e55d9] to-[#2563eb] transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            {(["lookups", "masters"] as const).map((phase) => {
              const steps = ADMIN_SETUP_FLOW.filter((s) => s.phase === phase);
              return (
                <div key={phase} className="mb-3 last:mb-0">
                  <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5c6a7f]">
                    {phase === "lookups" ? "Lookups" : "Masters"}
                  </p>
                  {steps.map((s) => {
                    const idx = ADMIN_SETUP_FLOW.indexOf(s);
                    const done = onStepPage && idx < currentIndex;
                    const active = onStepPage && idx === currentIndex;
                    const visitedAt = visitTimes[s.step];
                    return (
                      <button
                        key={s.path}
                        type="button"
                        onClick={() => {
                          router.push(s.path);
                          setExpanded(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                          active
                            ? "bg-[#eef4ff]"
                            : done
                              ? "hover:bg-[#f8fafc]"
                              : "opacity-60 hover:opacity-100 hover:bg-[#f8fafc]"
                        }`}
                      >
                        {done ? (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#22c55e] to-[#15803d] shadow-[0_2px_6px_rgba(34,197,94,0.45)]">
                            <Check size={11} strokeWidth={3} className="text-white" />
                          </div>
                        ) : (
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                              active
                                ? "bg-[#0e55d9] text-[#ffffff]"
                                : "bg-[#f1f5f9] text-[#5c6a7f]"
                            }`}
                          >
                            {s.step}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[12px] font-semibold truncate ${
                              active ? "text-[#0e55d9]" : "text-[#475569]"
                            }`}
                          >
                            {s.label}
                          </p>
                          {(done || active) && visitedAt && (
                            <p className="text-[10px] text-[#94a3b8] truncate">
                              Last visit: {formatVisit(visitedAt)}
                            </p>
                          )}
                          {active && (
                            <>
                              <p className="text-[10.5px] text-[#5c6a7f] truncate">{s.description}</p>
                              {s.requires && s.requires.length > 0 && (
                                <p className="text-[10px] text-[#d97706]/90 mt-0.5 truncate">
                                  Needs: {s.requires.join(", ")}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        {active && <ChevronRight size={12} className="shrink-0 text-[#0e55d9]" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#f1f5f9] p-3 shrink-0">
            {onStepPage ? (
              <>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex w-full items-center font-normal justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0e55d9] to-[#2563eb] py-2.5 text-[12.5px] font-bold text-[#ffffff] shadow-[0_4px_14px_rgba(14,85,217,0.30)] transition-all hover:-translate-y-0.5"
                >
                  {isLast ? "Finish — go to dashboard" : "Next Step"}
                  {!isLast && <ArrowRight size={13} />}
                </button>
                {!isLast && next && (
                  <p className="mt-1.5 text-center text-[10px] text-[#5c6a7f]">
                    Opens {next.label} · Step {current!.step} of {TOTAL_STEPS}
                  </p>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStart}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0e55d9] to-[#2563eb] py-2.5 text-[12.5px] font-bold text-[#ffffff] shadow-[0_4px_14px_rgba(14,85,217,0.30)] transition-all hover:-translate-y-0.5"
                >
                  Start with {FIRST_STEP.label}
                  <ArrowRight size={13} />
                </button>
                <p className="mt-1.5 text-center text-[10px] text-[#5c6a7f]">
                  {TOTAL_STEPS} steps · lookups then masters
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2" style={{ pointerEvents: "auto" }}>
        {onStepPage && (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center font-normal gap-2 rounded-full bg-[#ffffff] border border-[#e2e8f0] py-2.5 pl-4 pr-4 text-[12.5px] font-bold text-[#0e55d9] shadow-lg shadow-[#e2e8f0]/80 transition-all hover:-translate-y-0.5 hover:border-[#bfdbfe]"
          >
            {isLast ? "Finish setup" : "Next Step"}
            <ArrowRight size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0e55d9] to-[#2563eb] py-2.5 pl-3.5 pr-4 text-[#ffffff] shadow-[0_8px_28px_rgba(14,85,217,0.40)] transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <BookOpen size={16} className="shrink-0" />
          <span className="text-[12.5px] font-normal leading-tight">
            {onStepPage && current
              ? `Step ${current.step}/${TOTAL_STEPS}`
              : "Setup guide"}
          </span>
        </button>
      </div>
    </div>
  );
}

// Re-export for any legacy imports
export { ADMIN_SETUP_FLOW as SETUP_FLOW } from "@/app/admin/(lib)/adminSetupGuide";
