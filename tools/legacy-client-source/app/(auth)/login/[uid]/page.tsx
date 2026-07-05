/** @format */

"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminAPI, commonAPIs } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

import FormInput from "../../../../components/forms/FormInput";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  ShieldAlert,
  RefreshCw,
  ServerCrash,
  ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Paper Plane
// ─────────────────────────────────────────────────────────────────────────────
function PaperPlane() {
  return (
    <svg
      width='72'
      height='44'
      viewBox='0 0 72 44'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M 70 22 L 4 4 L 20 22 Z'
        fill='#e0f2fe'
        stroke='#7dd3fc'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M 70 22 L 4 40 L 20 22 Z'
        fill='#bae6fd'
        stroke='#7dd3fc'
        strokeWidth='1.2'
        strokeLinejoin='round'
      />
      <path
        d='M 4 4 L 20 22 L 4 40 Z'
        fill='#7dd3fc'
        stroke='#38bdf8'
        strokeWidth='1'
        strokeLinejoin='round'
      />
      <line
        x1='70'
        y1='22'
        x2='20'
        y2='22'
        stroke='#0ea5e9'
        strokeWidth='0.8'
        strokeDasharray='5 3'
        opacity='0.65'
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confetti
// ─────────────────────────────────────────────────────────────────────────────
function ConfettiDots() {
  const COLORS = [
    "#639922",
    "#378ADD",
    "#D4537E",
    "#EF9F27",
    "#534AB7",
    "#1D9E75",
    "#E24B4A",
  ];

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
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const setUser = useAuthStore((state) => state.setUser);

  const params = useParams();
  const router = useRouter();

  const dynamicId = params.uid;

  const [loginType, setLoginType] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationState, setValidationState] = useState<
    "valid" | "invalid" | "server-error"
  >("valid");
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [requires2fa, setRequires2fa] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  const planeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // ─────────────────────────────────────────────────────────────────────────
  // UID Validation
  // ─────────────────────────────────────────────────────────────────────────
  const verifyUID = async () => {
    try {
      setIsValidating(true);
      const data = await commonAPIs.checkUID({ uid: dynamicId });

      if (data.status === false) {
        setValidationState(data.exists === false ? "invalid" : "server-error");
        return;
      }
      if (!data.exists) {
        setValidationState("invalid");
        return;
      }
      setLoginType(data.belongsTo);
      setValidationState("valid");
    } catch (err) {
      console.error("UID verification failed:", err);
      setValidationState("server-error");
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (dynamicId) verifyUID();
  }, [dynamicId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Success animation
  // ─────────────────────────────────────────────────────────────────────────
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
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [loginSuccess]);

  // ─────────────────────────────────────────────────────────────────────────
  // Auth handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleLoginSuccess = (redirectPath: string) => {
    setLoginSuccess(true);
    setTimeout(() => setShowSuccessMsg(true), 2300);
    setTimeout(() => router.push(redirectPath), 3300);
  };

  const finishAdminSession = async () => {
    const profile = await adminAPI.profile();
    if (!profile.status || !profile.data) {
      setLoginError(
        profile.message || "Login succeeded, but session cookie was not saved.",
      );
      return false;
    }
    setUser({ ...profile.data, role: "ADMIN" });
    handleLoginSuccess("/admin/dashboard");
    return true;
  };

  const handleVerify2fa = async () => {
    try {
      setIsLoading(true);
      setLoginError("");
      const response = await adminAPI.verify2faLogin({
        pendingToken,
        code: totpCode,
      });
      if (response.status) {
        await finishAdminSession();
      } else {
        setLoginError(response.message || "Invalid code");
      }
    } catch {
      setLoginError("Unable to verify code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      setIsLoading(true);
      setLoginError("");

      if (requires2fa) {
        await handleVerify2fa();
        return;
      }

      if (loginType === "ADMIN") {
        const response = await adminAPI.login({
          device_ip: "127.0.0.1",
          username: credentials.username,
          password: credentials.password,
          admin_uid: dynamicId,
        });

        if (response.status) {
          if (
            (response as { requires2fa?: boolean }).requires2fa &&
            (response as { pendingToken?: string }).pendingToken
          ) {
            setRequires2fa(true);
            setPendingToken(
              (response as { pendingToken: string }).pendingToken,
            );
            setLoginError("");
            return;
          }
          await finishAdminSession();
        } else {
          setLoginError(response.message);
        }
      }
    } catch (err) {
      console.error("Login Failed:", err);
      setLoginError("Unable to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading screen
  // ─────────────────────────────────────────────────────────────────────────
  if (isValidating) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 bg-[#fafafa] dark:bg-[#09090b]'>
          <BrandLogo width={38} height={38} className="h-10 w-10" />
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-5 w-5 animate-spin text-[#a1a1aa]' />
          <p className='text-sm text-[#a1a1aa]'>Verifying secure access…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Invalid UID screen
  // ─────────────────────────────────────────────────────────────────────────
  if (validationState === "invalid") {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#09090b] p-6'>
        <div className='w-full max-w-sm overflow-hidden rounded-3xl border border-[#e4e4e7]/80 bg-[#ffffff] shadow-2xl shadow-[#e4e4e7]/40 dark:border-[#27272a]/70 dark:bg-[#18181b] dark:shadow-[#09090b]/60'>
          <div className='h-0.5 w-full bg-gradient-to-r from-[#f87171] via-[#fef2f2] to-[#fff1f2]' />
          <div className='p-8 text-center'>
            <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fef2f2] dark:bg-[#450a0a]/30'>
              <ShieldAlert className='h-8 w-8 text-[#7b5757]' />
            </div>
            <h1 className='text-xl font-bold text-[#18181b] dark:text-[#433333]'>
              Invalid Access Link
            </h1>
            <p className='mt-2 text-sm leading-relaxed text-[#433333]'>
              This login URL is invalid, expired, or no longer available.
            </p>
            <button
              onClick={() => router.push("/")}
              className='mt-7 h-11 w-full rounded-xl bg-[#18181b] text-sm font-semibold text-[#ffffff] transition hover:bg-[#27272a] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e7]'>
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Server error screen
  // ─────────────────────────────────────────────────────────────────────────
  if (validationState === "server-error") {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#09090b] p-6'>
        <div className='w-full max-w-sm overflow-hidden rounded-3xl border border-[#e4e4e7]/80 bg-[#ffffff] shadow-2xl shadow-[#e4e4e7]/40 dark:border-[#27272a]/70 dark:bg-[#18181b] dark:shadow-[#09090b]/60'>
          <div className='h-0.5 w-full bg-gradient-to-r from-[#fbbf24] via-[#fffbeb] to-[#fff7ed]' />
          <div className='p-8 text-center'>
            <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fffbeb] dark:bg-[#451a03]/30'>
              <ServerCrash className='h-8 w-8 text-[#fffbeb]' />
            </div>
            <h1 className='text-xl font-bold text-[#18181b] dark:text-[#433333]'>
              Server Unreachable
            </h1>
            <p className='mt-2 text-sm leading-relaxed text-[#433333]'>
              Unable to verify your login request right now. Check your
              connection and try again.
            </p>
            <button
              onClick={verifyUID}
              className='mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#18181b] text-sm font-semibold text-[#ffffff] transition hover:bg-[#27272a] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e7]'>
              <RefreshCw className='h-4 w-4' />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main login UI — centered
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#fafafa] p-4 antialiased dark:bg-[#09090b]'>
        {/* Ambient background blobs */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute -top-32 right-0 h-96 w-96 rounded-full bg-[#dbeafe]/70 blur-3xl dark:bg-[#172554]/30' />
          <div className='absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#e0e7ff]/50 blur-3xl dark:bg-[#1e1b4b]/25' />
        </div>

        <div
          className={`relative w-full max-w-sm ${
            loginSuccess
              ? "pointer-events-none scale-95 opacity-0"
              : "scale-100 opacity-100"
          }`}
          style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}>
          {/* Card */}
          <div className='overflow-hidden rounded-3xl border border-[#e4e4e7]/80 bg-[#ffffff]/90  backdrop-blur-xl dark:border-[#27272a]/70 dark:bg-[#18181b]/90 dark:shadow-[#09090b]/60'>
            {/* Top accent stripe */}
            {/* <div className='h-0.5 w-full bg-gradient-to-r from-[#eff6ff] via-[#f5f3ff] to-[#2563eb]' /> */}

            <div className='p-8'>
              {/* Logo + heading */}
              <div className='mb-8 flex flex-col items-center text-center'>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                  <BrandLogo width={28} height={28} className="h-7 w-7" />
                </div>
                <h1 className='text-[22px] font-bold text-[#18181b] dark:text-[#433333]'>
                  {requires2fa
                    ? "Two-factor verification"
                    : "Sign in"}
                </h1>
                <p className='mt-1.5 text-[13px] leading-relaxed text-[#433333] dark:text-[#a1a1aa]'>
                  {requires2fa
                    ? "Enter the code from your authenticator app"
                    : "Admin portal — enter your credentials"}
                </p>
              </div>

              {/* Form */}
              <div className='space-y-4'>
                <FormInput
                  label='User ID / Email'
                  icon={Mail}
                  type='text'
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  placeholder='admin@example.com'
                  disabled={isLoading}
                  error={!requires2fa ? loginError : undefined}
                />

                {!requires2fa ? (
                  <FormInput
                    label='Password'
                    icon={Lock}
                    type='password'
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    placeholder='••••••••'
                    disabled={isLoading}
                    error={loginError}
                  />
                ) : (
                  <FormInput
                    label='Authenticator Code'
                    icon={ShieldAlert}
                    type='text'
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder='6-digit code'
                    disabled={isLoading}
                    error={loginError}
                  />
                )}

                <button
                  disabled={isLoading}
                  onClick={handleAction}
                  className='group flex h-12 w-full items-center justify-center rounded-xl bg-[#27272a] px-4 text-sm font-semibold text-[#ffffff] transition-all hover:bg-[#27272a] active:scale-[0.98] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e7] disabled:opacity-70'>
                  {isLoading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <>
                      {requires2fa ? "Verify & Sign In" : "Continue"}
                      <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                    </>
                  )}
                </button>
              </div>

              {/* Security footer */}
              <div className='mt-7 flex items-center justify-center gap-1.5 text-[11px] text-[#a1a1aa]'>
                <ShieldCheck size={11} className='text-[#ecfdf5]' />
                Protected by end-to-end encryption
              </div>
            </div>
          </div>

          <p className='mt-5 text-center text-[11px] text-[#a1a1aa] dark:text-[#52525b]'>
            &copy; {new Date().getFullYear()} eFixMate
          </p>
        </div>

        {/* Success animation overlay */}
        {loginSuccess && (
          <div className='fixed inset-0 z-10 overflow-hidden pointer-events-none'>
            <canvas
              ref={canvasRef}
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            />
            <ConfettiDots />
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
              <PaperPlane />
            </div>

            {showSuccessMsg && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-auto'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]'>
                  <svg
                    width='32'
                    height='32'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#3B6D11'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <polyline points='20 6 9 17 4 12' />
                  </svg>
                </div>
                <div className='flex flex-col items-center gap-1 text-center'>
                  <p className='text-lg font-semibold text-[#18181b] dark:text-[#433333]'>
                    Logged in successfully!
                  </p>
                  <p className='text-[13px] text-[#433333] dark:text-[#a1a1aa]'>
                    Redirecting to dashboard…
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
