"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/api/userClient";
import { completeUserLogin, parseSendOtpResponse } from "@/lib/userAuth";
import { useUserAuthStore } from "@/store/userAuth.store";

type Props = {
  onClose: () => void;
  onSuccess?: () => void;
};

export default function UserLoginModal({ onClose, onSuccess }: Props) {
  const { setSession } = useUserAuthStore();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [mobile, setMobile] = useState("");
  const [loginId, setLoginId] = useState<string | number>("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleSend = async () => {
    const digits = mobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp(digits);
      const parsed = parseSendOtpResponse(res);
      if (parsed.ok && parsed.loginId != null) {
        setLoginId(parsed.loginId);
        setStep("otp");
        setTimer(30);
      } else {
        setError(parsed.message ?? "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Enter all 6 digits");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp(loginId, code);
      const result = await completeUserLogin(res, setSession);
      if (result.ok) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.message ?? "Invalid OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = (val: string, i: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#000000]/40 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[#ffffff] shadow-xl">
        <div className="border-b border-[#f3f4f6] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-[#111827] text-[15px]">
              {step === "phone" ? "Login to continue" : "Enter OTP"}
            </p>
            <p className="text-[12px] text-[#344352] mt-0.5">
              {step === "phone" ? "Secure OTP login - no password needed" : `Sent to +91 ${mobile}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-[#f3f4f6] text-[#344352] hover:bg-[#e5e7eb]"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-3">
          {error && (
            <div className="rounded-lg bg-[#fef2f2] border border-[#fee2e2] px-3 py-2 text-[12.5px] text-[#dc2626]">
              {error}
            </div>
          )}
          {step === "phone" ? (
            <>
              <div className="flex items-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 focus-within:border-[#eff6ff] focus-within:bg-[#ffffff] transition-colors">
                <span className="text-[13px] font-semibold text-[#344352] pr-2 border-r border-[#e5e7eb] mr-2">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Mobile number"
                  className="flex-1 bg-transparent text-[14px] font-medium text-[#111827] placeholder-[#9ca3af] outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || mobile.length < 10}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-[14px] font-semibold text-[#ffffff] transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Get OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    ref={(el) => {
                      if (el) inputRefs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => handleOtp(e.target.value, i)}
                    onKeyDown={(e) => handleKey(e, i)}
                    className="h-12 w-full rounded-lg border-2 border-[#e5e7eb] bg-[#f9fafb] text-center text-[18px] font-bold text-[#111827] outline-none transition-colors focus:border-[#eff6ff] focus:bg-[#ffffff]"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || otp.some((d) => !d)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-[14px] font-semibold text-[#ffffff] hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Continue"}
              </button>
              <div className="text-center text-[12px] text-[#344352]">
                {timer > 0 ? (
                  `Resend in ${timer}s`
                ) : (
                  <button type="button" onClick={handleSend} className="text-[#2563eb] font-medium hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
          <p className="text-[11px] text-center text-[#9ca3af]">
            By continuing, you agree to our{" "}
            <Link href="/terms-and-conditions" className="underline">
              Terms
            </Link>{" "}
            &{" "}
            <Link href="/privacy-policy" className="underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
