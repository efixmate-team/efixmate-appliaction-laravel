/** @format */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronLeft, ShieldCheck, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { sendOtp, verifyOtp } from "@/lib/api/userClient";
import { useUserAuthStore } from "@/store/userAuth.store";
import { completeUserLogin, parseSendOtpResponse } from "@/lib/userAuth";

const OTP_RESEND_SECONDS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Success Visual Sub-Components
// ─────────────────────────────────────────────────────────────────────────────
function PaperPlane() {
  return (
    <svg width='72' height='44' viewBox='0 0 72 44' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M 70 22 L 4 4 L 20 22 Z' fill='#e0f2fe' stroke='#7dd3fc' strokeWidth='1.2' strokeLinejoin='round' />
      <path d='M 70 22 L 4 40 L 20 22 Z' fill='#bae6fd' stroke='#7dd3fc' strokeWidth='1.2' strokeLinejoin='round' />
      <path d='M 4 4 L 20 22 L 4 40 Z' fill='#7dd3fc' stroke='#38bdf8' strokeWidth='1' strokeLinejoin='round' />
      <line x1='70' y1='22' x2='20' y2='22' stroke='#0ea5e9' strokeWidth='0.8' strokeDasharray='5 3' opacity='0.65' />
    </svg>
  );
}

function ConfettiDots() {
  const COLORS = ["#639922", "#378ADD", "#D4537E", "#EF9F27", "#534AB7", "#1D9E75", "#E24B4A"];
  const rand = (seed: number) => {
    const v = Math.sin(seed * 999) * 10000;
    return v - Math.floor(v);
  };

  const dots = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: 10 + rand(i + 1) * 80,
    y: 10 + rand(i + 31) * 80,
    color: COLORS[Math.floor(rand(i + 61) * COLORS.length)],
    size: 5 + rand(i + 91) * 6,
    delay: 0.8 + rand(i + 121) * 1.2,
    duration: 0.5 + rand(i + 151) * 0.6,
    isSquare: rand(i + 181) > 0.5,
  }));

  return (
    <>
      <style>{`
        @keyframes popDot {
          0%   { opacity: 0; transform: scale(0) translateY(0); }
          40%  { opacity: 1; transform: scale(1) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.5) translateY(32px); }
        }
      `}</style>
      {dots.map((dot) => (
        <div
          key={dot.id}
          style={{
            position: "absolute",
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            background: dot.color,
            borderRadius: dot.isSquare ? "2px" : "50%",
            opacity: 0,
            animation: `popDot ${dot.duration}s ease ${dot.delay}s forwards`,
          }}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main OTP Login Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router       = useRouter();
  const searchParams  = useSearchParams();
  const redirect      = searchParams.get("redirect") || "/";

  const { setSession } = useUserAuthStore();

  const [step,      setStep]      = useState<"input" | "verify">("input");
  const [mobile,    setMobile]    = useState("");
  const [loginId,   setLoginId]   = useState<string | number>("");
  const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState("");
  const [timer,     setTimer]     = useState(0);

  const [loginSuccess, setLoginSuccess]     = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  const inputRefs    = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const planeRef     = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer]);

  const startTimer = () => setTimer(OTP_RESEND_SECONDS);

  // ── Success Animations Flight Path Engine ──────────────────────────────────
  useEffect(() => {
    if (!loginSuccess || !planeRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d")!;
    const DURATION = 2200;
    const RX = 38, RY = 27, CX = 50, CY = 50, MAX_TRAIL = 50;
    const trail: { px: number; py: number }[] = [];
    let startTime: number | null = null;

    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / DURATION, 1);
      const t = progress * 2 * Math.PI;
      const xPct = CX + RX * Math.sin(t);
      const yPct = CY + RY * Math.sin(2 * t);
      const px = (xPct / 100) * W;
      const py = (yPct / 100) * H;
      const tx = RX * Math.cos(t);
      const ty = 2 * RY * Math.cos(2 * t);
      const rotation = Math.atan2(ty, tx) * (180 / Math.PI);
      const scale = 1 + 0.18 * Math.sin(t);
      const opacity = progress < 0.05 ? progress / 0.05 : progress > 0.92 ? (1 - progress) / 0.08 : 1;

      trail.push({ px, py });
      if (trail.length > MAX_TRAIL) trail.shift();
      ctx.clearRect(0, 0, W, H);

      trail.forEach((dot, i) => {
        const age = i / MAX_TRAIL;
        const r = 4 + age * 5;
        const alpha = age * 0.5;
        const g = ctx.createRadialGradient(dot.px, dot.py, 0, dot.px, dot.py, r * 2);
        g.addColorStop(0, `rgba(14, 165, 233, ${alpha})`);
        g.addColorStop(1, `rgba(14, 165, 233, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(dot.px, dot.py, r * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      if (planeRef.current) {
        planeRef.current.style.left = `${xPct}%`;
        planeRef.current.style.top = `${yPct}%`;
        planeRef.current.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale.toFixed(3)})`;
        planeRef.current.style.opacity = String(Math.max(0, opacity));
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [loginSuccess]);

  const handleLoginSuccess = () => {
    setLoginSuccess(true);
    setTimeout(() => setShowSuccessMsg(true), 2300);
    setTimeout(() => router.replace(redirect), 3300);
  };

  // ── Action Logistics handlers ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    const digits = mobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await sendOtp(digits);
      const parsed = parseSendOtpResponse(res);
      if (parsed.ok && parsed.loginId != null) {
        setLoginId(parsed.loginId);
        setStep("verify");
        startTimer();
      } else {
        setError(parsed.message || "Failed to send OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await verifyOtp(loginId, code);
      const result = await completeUserLogin(res, setSession);
      if (result.ok) {
        handleLoginSuccess();
      } else {
        setError(result.message || "Invalid OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && value && newOtp.every(Boolean)) {
      setTimeout(() => handleVerifyOtp(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    await handleSendOtp();
  };

  return (
    <>
      <div className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#fafafa] p-4 antialiased dark:bg-[#09090b]'>
        
        {/* Ambient background architectural layouts */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute -top-32 right-0 h-96 w-96 rounded-full bg-[#dbeafe]/70 blur-3xl dark:bg-[#172554]/30' />
          <div className='absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#e0e7ff]/50 blur-3xl dark:bg-[#1e1b4b]/25' />
        </div>

        <div
          className={`relative w-full max-w-sm ${loginSuccess ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100"}`}
          style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}
        >
          {/* Change Number Option Row */}
          {step === "verify" && (
            <button
              disabled={isLoading}
              onClick={() => { setStep("input"); setOtp(["","","","","",""]); setError(""); }}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#a1a1aa] hover:text-[#18181b] dark:hover:text-[#433333] transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={14} />
              Change number
            </button>
          )}

          {/* Core App Wrapper Card */}
          <div className='overflow-hidden rounded-3xl border border-[#e4e4e7]/80 bg-[#ffffff]/90 shadow-2xl shadow-[#e4e4e7]/40 backdrop-blur-xl dark:border-[#27272a]/70 dark:bg-[#18181b]/90 dark:shadow-[#09090b]/60'>
            <div className='p-8'>
              
              {/* Heading / Identifier Section */}
              <div className='mb-8 flex flex-col items-center text-center'>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                  <BrandLogo width={28} height={28} className="h-7 w-7" />
                </div>
                <h1 className='text-[22px] font-bold text-[#18181b] dark:text-[#433333]'>
                  {step === "input" ? "Secure Login" : "Verify Code"}
                </h1>
                <p className='mt-1.5 text-[13px] leading-relaxed text-[#71717a] dark:text-[#a1a1aa]'>
                  {step === "input"
                    ? "Enter your mobile number to securely access your workspace"
                    : `Confirm authorization credentials sent via SMS to +91 ${mobile}`}
                </p>
              </div>

              {/* Dynamic Action Responses */}
              {error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200/60 p-3 text-center text-xs font-medium text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* ── STEP 1: Interactive Phone Module ── */}
              {step === "input" ? (
                <div className='space-y-4 animate-in fade-in zoom-in-95 duration-200'>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <div className="flex items-center gap-1.5 pr-3 border-r border-[#e4e4e7] dark:border-[#27272a]">
                        <span className="text-sm">🇮🇳</span>
                        <span className="text-[13px] font-medium text-[#71717a] dark:text-[#a1a1aa]">+91</span>
                      </div>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "")); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      placeholder="Enter mobile number"
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl border border-[#e4e4e7] bg-transparent pl-[88px] pr-4 text-sm font-medium text-[#18181b] placeholder-[#a1a1aa] outline-none transition-all focus:border-[#a1a1aa] dark:border-[#27272a] dark:text-[#433333] dark:focus:border-[#52525b] disabled:opacity-50"
                    />
                  </div>

                  <button
                    disabled={isLoading || mobile.length < 10}
                    onClick={handleSendOtp}
                    className='group flex h-12 w-full items-center justify-center rounded-xl bg-[#27272a] px-4 text-sm font-semibold text-[#ffffff] transition-all hover:bg-[#18181b] active:scale-[0.98] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e7] disabled:opacity-50'
                  >
                    {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : (
                      <>
                        Request OTP
                        <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* ── STEP 2: Unified Verification Matrices ── */
                <div className='space-y-5 animate-in fade-in slide-in-from-right-4 duration-200'>
                  <div className='flex justify-between gap-2'>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        disabled={isLoading}
                        type='text'
                        inputMode='numeric'
                        maxLength={1}
                        ref={(el) => { if (el) inputRefs.current[index] = el; }}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className='h-12 w-full rounded-xl border border-[#e4e4e7] bg-transparent text-center text-lg font-bold text-[#18181b] outline-none transition-all focus:border-[#a1a1aa] dark:border-[#27272a] dark:text-[#433333] dark:focus:border-[#52525b] disabled:opacity-40'
                      />
                    ))}
                  </div>

                  <div className='space-y-4'>
                    <button
                      disabled={isLoading || otp.some((d) => !d)}
                      onClick={handleVerifyOtp}
                      className='flex h-12 w-full items-center justify-center rounded-xl bg-[#27272a] text-sm font-semibold text-[#ffffff] transition-all hover:bg-[#18181b] active:scale-[0.98] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e7] disabled:opacity-50'
                    >
                      {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : "Confirm Identification"}
                    </button>

                    <div className='flex flex-col items-center gap-1.5 text-xs'>
                      <p className='text-[#a1a1aa] dark:text-[#71717a]'>Didn&apos;t receive code?</p>
                      {timer > 0 ? (
                        <span className='font-medium text-[#71717a] dark:text-[#a1a1aa]'>
                          Resend operational window changes in {timer}s
                        </span>
                      ) : (
                        <button
                          disabled={isLoading}
                          onClick={handleResend}
                          className='flex items-center gap-1 font-semibold text-[#18181b] dark:text-[#433333] hover:opacity-80 transition-opacity disabled:opacity-50'
                        >
                          <RefreshCw size={12} /> Resend Access OTP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Metrics Footer */}
              <div className='mt-8 flex items-center justify-center gap-1.5 text-[11px] text-[#a1a1aa] dark:text-[#71717a]'>
                <ShieldCheck size={13} className='text-emerald-600/80' />
                Protected by end-to-end operational security
              </div>

            </div>
          </div>

          <p className='mt-5 text-center text-[11px] text-[#a1a1aa] dark:text-[#52525b]'>
            &copy; {new Date().getFullYear()} eFixMate
          </p>
        </div>

        {/* Dynamic Flight Automation Overlay Systems */}
        {loginSuccess && (
          <div className='fixed inset-0 z-50 overflow-hidden pointer-events-none'>
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
            <ConfettiDots />
            <div ref={planeRef} style={{ position: "absolute", top: "50%", left: "50%", opacity: 0, pointerEvents: "none", willChange: "transform, left, top, opacity" }}>
              <PaperPlane />
            </div>

            {showSuccessMsg && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-auto bg-[#fafafa]/60 backdrop-blur-md dark:bg-[#09090b]/60'>
                <div className='flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40'>
                  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#059669' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
                    <polyline points='20 6 9 17 4 12' />
                  </svg>
                </div>
                <div className='flex flex-col items-center gap-1 text-center'>
                  <p className='text-lg font-bold text-[#18181b] dark:text-[#433333]'>
                    Authorized Successfully
                  </p>
                  <p className='text-[13px] text-[#71717a] dark:text-[#a1a1aa]'>
                    Redirecting to secure terminal workspace…
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
