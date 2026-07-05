'use client';

import React, { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────
// Glitch Particles (SSR SAFE)
// ─────────────────────────────────────────────────────────

function GlitchParticles() {
  const COLORS = [
    '#E24B4A', '#D4537E', '#EF9F27',
    '#c0392b', '#e74c3c', '#ff6b6b', '#ff4757',
  ];

  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 5 + Math.random() * 6,
      delay: 0.8 + Math.random() * 1.2,
      duration: 0.9 + Math.random() * 0.6,
      isSquare: Math.random() > 0.5,
    }));
    setParticles(generated);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fo-popDot {
          0%   { opacity: 0; transform: scale(0) rotate(0deg); }
          40%  { opacity: 1; transform: scale(1) rotate(45deg) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.5) rotate(90deg) translateY(30px); }
        }
        @keyframes fo-shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px) rotate(-1deg); }
          30%       { transform: translateX(8px) rotate(1deg); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        @keyframes fo-fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fo-xDraw {
          from { stroke-dashoffset: 40; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
      `}</style>

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.isSquare ? '2px' : '50%',
            opacity: 0,
            animation: `fo-popDot ${p.duration}s ease ${p.delay}s forwards`,
          }}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Failed Overlay
// ─────────────────────────────────────────────────────────

export default function FailedOverlay({
  show,
  title = "Something went wrong",
  subtitle = "Please try again.",
  onFinish,
  finishDelay = 2400,
  messageDelay = 1200,
}: {
  show: boolean;
  title?: string;
  subtitle?: string;
  onFinish?: () => void;
  finishDelay?: number;
  messageDelay?: number;
}) {
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
    const finishTimer = onFinish ? setTimeout(onFinish, finishDelay) : null;

    return () => {
      clearTimeout(msgTimer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [show]);

  if (!mounted || !show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      style={{ background: '#fff5f5' }}
    >
      {/* Particles */}
      <GlitchParticles />

      {/* Message */}
      {showMessage && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-auto"
          style={{
            animation: 'fo-fadeInUp 0.4s ease forwards',
          }}
        >
          {/* Icon with shake */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fee2e2',
              animation: 'fo-shake 0.6s ease 0.1s both',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b91c1c"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              {/* X lines drawn with dash animation */}
              <line
                x1="5" y1="5" x2="19" y2="19"
                strokeDasharray="20"
                strokeDashoffset="0"
                style={{ animation: 'fo-xDraw 0.35s ease 0.25s both' }}
              />
              <line
                x1="19" y1="5" x2="5" y2="19"
                strokeDasharray="20"
                strokeDashoffset="0"
                style={{ animation: 'fo-xDraw 0.35s ease 0.4s both' }}
              />
            </svg>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-lg font-semibold" style={{ color: '#7f1d1d' }}>
              {title}
            </p>
            <p className="text-sm" style={{ color: '#9f9f9f' }}>
              {subtitle}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}