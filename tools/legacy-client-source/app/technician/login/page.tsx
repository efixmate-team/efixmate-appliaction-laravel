/** @format */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { sendOtp, verifyOtp } from "@/lib/api/technicianClient";
import { useTechnicianAuthStore } from "@/store/technicianAuth.store";
import {
  parseSendOtpResponse,
  parseVerifyOtpResponse,
} from "@/lib/technicianAuth";

const OTP_RESEND_SECONDS = 30;

export default function TechnicianLoginPage() {
  const router = useRouter();
  const { setSession, isHydrated, token, isRegistered } =
    useTechnicianAuthStore();

  const [step, setStep] = useState<"input" | "verify">("input");
  const [mobile, setMobile] = useState("");
  const [loginId, setLoginId] = useState<string | number>("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Redirect already-logged-in technicians
  useEffect(() => {
    if (!isHydrated || !token) return;
    if (isRegistered !== null) {
      router.replace("/technician/register");
    }
  }, [isHydrated, token, isRegistered, router]);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timer]);

  // Paper plane success animation
  useEffect(() => {
    if (!loginSuccess || !planeRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const DURATION = 2200;
    const RX = 38,
      RY = 27,
      CX = 50,
      CY = 50,
      MAX_TRAIL = 50;
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
      const opacity =
        progress < 0.05
          ? progress / 0.05
          : progress > 0.92
            ? (1 - progress) / 0.08
            : 1;

      trail.push({ px, py });
      if (trail.length > MAX_TRAIL) trail.shift();
      ctx.clearRect(0, 0, W, H);

      trail.forEach((dot, i) => {
        const age = i / MAX_TRAIL;
        const r = 4 + age * 5;
        const alpha = age * 0.5;
        const g = ctx.createRadialGradient(
          dot.px,
          dot.py,
          0,
          dot.px,
          dot.py,
          r * 2,
        );
        g.addColorStop(0, `rgba(22, 163, 74, ${alpha})`);
        g.addColorStop(1, `rgba(22, 163, 74, 0)`);
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

  const handleLoginSuccess = (target: string) => {
    setLoginSuccess(true);
    setTimeout(() => setShowSuccessMsg(true), 2300);
    setTimeout(() => router.replace(target), 900);
  };

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
        setTimer(OTP_RESEND_SECONDS);
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
      const parsed = parseVerifyOtpResponse(res);
      if (!parsed.ok || !parsed.token) {
        setError(parsed.message || "Invalid OTP. Please try again.");
        return;
      }
      const techUser = parsed.technician ?? {
        technician_id: 0,
        first_name: "Technician",
        mobile_number: mobile,
      };
      setSession(parsed.token, techUser, parsed.isRegistered ?? false);
      handleLoginSuccess("/technician/register");
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
      <div className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f8fafc] p-4 antialiased'>
        <div
          className={`relative grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center ${loginSuccess ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100"}`}
          style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}>
          <div className='hidden rounded-lg border border-[#e2e8f0] bg-white p-8 shadow-sm lg:block'>
            <div className='mb-8 flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-[#f0fdf4] ring-1 ring-[#bbf7d0]'>
                <BrandLogo width={28} height={28} className='h-7 w-7' />
              </div>
              <div>
                <p className='text-lg font-semibold text-[#14532d]'>
                  eFixMate Partner
                </p>
                <p className='text-sm text-[#4b5563]'>
                  Desktop workspace for technicians
                </p>
              </div>
            </div>
            <div className='space-y-5'>
              {[
                "Accept and manage service requests",
                "Track earnings, ratings, and job progress",
                "Complete registration and approval updates",
              ].map((item) => (
                <div
                  key={item}
                  className='flex items-center gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3'>
                  <ShieldCheck size={18} className='text-[#16a34a]' />
                  <span className='text-sm font-semibold text-[#374151]'>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {/* Back to number */}
            {step === "verify" && (
              <button
                disabled={isLoading}
                onClick={() => {
                  setStep("input");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
                className='mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#6b7280] hover:text-[#16a34a] transition-colors disabled:opacity-50'>
                <ChevronLeft size={14} />
                Change number
              </button>
            )}

            <div className='overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-sm'>
              <div className='p-8'>
                {/* Header */}
                <div className='mb-8 flex flex-col items-center text-center'>
                  <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-[#f0fdf4] ring-1 ring-[#bbf7d0]'>
                    <div className='relative'>
                      <BrandLogo width={28} height={28} className='h-7 w-7' />
                      <span className='absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#16a34a]'>
                        <Wrench size={8} className='text-white' />
                      </span>
                    </div>
                  </div>
                  <h1 className='text-[22px] font-bold  text-[#14532d]'>
                    {step === "input" ? "Partner Login" : "Verify OTP"}
                  </h1>
                  <p className='mt-1.5 text-[13px] leading-relaxed text-[#4b5563]'>
                    {step === "input"
                      ? "Enter your mobile number to access your partner workspace"
                      : `OTP sent to +91 ${mobile}`}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600'>
                    {error}
                  </div>
                )}

                {/* Step 1: Phone input */}
                {step === "input" ? (
                  <div className='space-y-4 animate-in fade-in zoom-in-95 duration-200'>
                    <div className='relative rounded-lg shadow-sm'>
                      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
                        <div className='flex items-center gap-1.5 pr-3 border-r border-[#e5e7eb]'>
                          <span className='text-sm'>🇮🇳</span>
                          <span className='text-[13px] font-medium text-[#6b7280]'>
                            +91
                          </span>
                        </div>
                      </div>
                      <input
                        type='tel'
                        inputMode='numeric'
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => {
                          setMobile(e.target.value.replace(/\D/g, ""));
                          setError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        placeholder='Enter mobile number'
                        disabled={isLoading}
                        className='h-12 w-full rounded-lg border border-[#d1d5db] bg-transparent pl-[88px] pr-4 text-sm font-medium text-[#111827] placeholder-[#9ca3af] outline-none transition-all focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 disabled:opacity-50'
                      />
                    </div>

                    <button
                      disabled={isLoading || mobile.length < 10}
                      onClick={handleSendOtp}
                      className='group flex h-12 w-full items-center justify-center rounded-lg bg-[#16a34a] px-4 text-sm font-semibold text-white transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-50'>
                      {isLoading ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                        </>
                      )}
                    </button>

                    <p className='text-center text-[12px] text-[#9ca3af]'>
                      New partner?{" "}
                      <span className='font-medium text-[#16a34a]'>
                        OTP will guide your registration
                      </span>
                    </p>
                  </div>
                ) : (
                  /* Step 2: OTP boxes */
                  <div className='space-y-5 animate-in fade-in slide-in-from-right-4 duration-200'>
                    <div className='flex justify-between gap-2'>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          disabled={isLoading}
                          type='text'
                          inputMode='numeric'
                          maxLength={1}
                          ref={(el) => {
                            if (el) inputRefs.current[index] = el;
                          }}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(e.target.value, index)
                          }
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          className='h-12 w-full rounded-lg border border-[#d1d5db] bg-transparent text-center text-lg font-bold text-[#111827] outline-none transition-all focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 disabled:opacity-40'
                        />
                      ))}
                    </div>

                    <div className='space-y-4'>
                      <button
                        disabled={isLoading || otp.some((d) => !d)}
                        onClick={handleVerifyOtp}
                        className='flex h-12 w-full items-center justify-center rounded-lg bg-[#16a34a] text-sm font-semibold text-white transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-50'>
                        {isLoading ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          "Verify & Continue"
                        )}
                      </button>

                      <div className='flex flex-col items-center gap-1.5 text-xs'>
                        <p className='text-[#9ca3af]'>
                          Didn&apos;t receive code?
                        </p>
                        {timer > 0 ? (
                          <span className='font-medium text-[#6b7280]'>
                            Resend in {timer}s
                          </span>
                        ) : (
                          <button
                            disabled={isLoading}
                            onClick={handleResend}
                            className='flex items-center gap-1 font-semibold text-[#16a34a] hover:opacity-80 transition-opacity disabled:opacity-50'>
                            <RefreshCw size={12} /> Resend OTP
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className='mt-8 flex items-center justify-center gap-1.5 text-[11px] text-[#9ca3af]'>
                  <ShieldCheck size={13} className='text-[#16a34a]' />
                  Secured partner access
                </div>
              </div>
            </div>

            <p className='mt-5 text-center text-[11px] text-[#9ca3af]'>
              &copy; {new Date().getFullYear()} eFixMate
            </p>
          </div>
        </div>

        {/* Success animation overlay */}
        {loginSuccess && (
          <div className='fixed inset-0 z-50 overflow-hidden pointer-events-none'>
            <canvas
              ref={canvasRef}
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            />
            <div
              ref={planeRef}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                opacity: 0,
                pointerEvents: "none",
                willChange: "transform, left, top, opacity",
              }}>
              <svg width='72' height='44' viewBox='0 0 72 44' fill='none'>
                <path
                  d='M 70 22 L 4 4 L 20 22 Z'
                  fill='#dcfce7'
                  stroke='#86efac'
                  strokeWidth='1.2'
                  strokeLinejoin='round'
                />
                <path
                  d='M 70 22 L 4 40 L 20 22 Z'
                  fill='#bbf7d0'
                  stroke='#86efac'
                  strokeWidth='1.2'
                  strokeLinejoin='round'
                />
                <path
                  d='M 4 4 L 20 22 L 4 40 Z'
                  fill='#86efac'
                  stroke='#4ade80'
                  strokeWidth='1'
                  strokeLinejoin='round'
                />
                <line
                  x1='70'
                  y1='22'
                  x2='20'
                  y2='22'
                  stroke='#16a34a'
                  strokeWidth='0.8'
                  strokeDasharray='5 3'
                  opacity='0.65'
                />
              </svg>
            </div>

            {showSuccessMsg && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-auto bg-white/70 backdrop-blur-md'>
                <div className='flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]'>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#16a34a'
                    strokeWidth='3'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <polyline points='20 6 9 17 4 12' />
                  </svg>
                </div>
                <div className='flex flex-col items-center gap-1 text-center'>
                  <p className='text-lg font-bold text-[#14532d]'>
                    Verified!
                  </p>
                  <p className='text-[13px] text-[#4b5563]'>
                    Redirecting…
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
