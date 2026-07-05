'use client';

import React, { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────
// Confetti (SSR SAFE)
// ─────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#639922', '#378ADD', '#D4537E',
  '#EF9F27', '#534AB7', '#1D9E75', '#E24B4A',
] as const;

type ConfettiDot = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  isSquare: boolean;
};

function ConfettiDots() {
  const [dots, setDots] = useState<ConfettiDot[]>([]);

  useEffect(() => {
    const generated: ConfettiDot[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? CONFETTI_COLORS[0],
      size: 5 + Math.random() * 6,
      delay: 0.8 + Math.random() * 1.2,
      duration: 0.9 + Math.random() * 0.6,
      isSquare: Math.random() > 0.5,
    }));
    // One-shot client confetti; random layout cannot run during render (react-hooks/purity).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-mount init
    setDots(generated);
  }, []);

  return (
    <>
      <style>{`
        @keyframes so-popDot {
          0% { opacity: 0; transform: scale(0); }
          40% { opacity: 1; transform: scale(1) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.5) translateY(30px); }
        }
      `}</style>

      {dots.map((dot) => (
        <div
          key={dot.id}
          style={{
            position: 'absolute',
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            background: dot.color,
            borderRadius: dot.isSquare ? '2px' : '50%',
            opacity: 0,
            animation: `so-popDot ${dot.duration}s ease ${dot.delay}s forwards`,
          }}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Success Overlay
// ─────────────────────────────────────────────────────────

export type SuccessOverlayProps = {
  show: boolean;
  title?: string;
  subtitle?: string;
  /** Called once after `finishDelay` when `show` becomes true — use to clear parent state (e.g. `() => setOk(false)`). */
  onFinish?: () => void;
  finishDelay?: number;
  messageDelay?: number;
};

export default function SuccessOverlay({
  show,
  title = "Done!",
  subtitle = "Redirecting…",
  onFinish,
  finishDelay = 2400,
  messageDelay = 1800,
}: SuccessOverlayProps) {

  const [mounted, setMounted] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show) {
      setShowMessage(false);
      return;
    }

    const msgTimer = setTimeout(() => setShowMessage(true), messageDelay);
    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, finishDelay);

    return () => {
      clearTimeout(msgTimer);
      clearTimeout(finishTimer);
    };
    // Only re-arm when `show` (or delays) change — not when `onFinish` identity changes while visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture `onFinish` from the render where `show` became true
  }, [show, finishDelay, messageDelay]);

  // 🚀 prevent hydration mismatch
  if (!mounted || !show) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden bg-[#fffbeb]">

      {/* Confetti */}
      <ConfettiDots />

      {/* Message */}
      {showMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-auto ">

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#3B6D11" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold">{title}</p>
            <p className="text-sm text-[#344352]">{subtitle}</p>
          </div>

        </div>
      )}
    </div>
  );
}