"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next"; // ✅ typed route
import { toast } from "sonner";
import OtpInput from "@/app/components/auth/OtpInput";

const DEFAULT_CODE_LEN = 6;

type LoginResponse = {
  success?: boolean;
  user?: {
    role?: "customer" | "provider" | "admin" | string;
    [key: string]: any;
  };
  token?: string;
  error?: string;
  message?: string;
  codeLength?: number;
};

function sanitizeAdminNext(next: string) {
  // ✅ only allow internal /admin routes to avoid open-redirect
  if (!next) return "/admin";
  if (next.startsWith("/admin")) return next;
  return "/admin";
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeLen, setCodeLen] = useState<number>(DEFAULT_CODE_LEN);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string>("/admin");

  // read ?next=... from URL on client (fallback -> /admin)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      setNext(url.searchParams.get("next") || "/admin");
    } catch {
      setNext("/admin");
    }
  }, []);

  // cooldown timer for resend
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown(seconds = 30) {
    setCooldown(seconds);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  // STEP 1: start OTP for admin phone
  async function startOtp() {
    if (!phone.trim()) return toast.error("Enter phone number");

    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const j: LoginResponse & { requestId?: string; devCode?: string } =
        await r.json().catch(() => ({} as any));

      if (!r.ok || j.error) {
        throw new Error(j.error || j.message || "Failed to send OTP");
      }

      if (!j.requestId) {
        throw new Error("requestId missing in /otp/start response");
      }

      setRequestId(j.requestId);
      setCode("");
      setCodeLen(j.codeLength || DEFAULT_CODE_LEN);

      setStep("otp");
      startCooldown(30);

      if (j.devCode) toast.info(`Dev OTP: ${j.devCode}`);
      toast.success("OTP sent to your WhatsApp");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: verify OTP and ensure role === admin
  async function verifyOtp() {
    if (!requestId) return toast.error("Missing requestId. Please resend OTP.");
    if (code.length !== codeLen) {
      return toast.error(`Enter ${codeLen}-digit code`);
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId, code }),
      });

      const data: LoginResponse = await r.json().catch(() => ({} as any));

      if (!r.ok || data.error) {
        throw new Error(data.error || data.message || "Invalid code");
      }

      if (!data.user || data.user.role !== "admin") {
        throw new Error("You are not allowed to access the admin area.");
      }

      toast.success("Logged in as admin");

      // ✅ sanitize redirect
      const target = sanitizeAdminNext(next);

      console.log("ADMIN LOGIN redirecting to:", target);

      // ✅ Typed routes fix: cast after sanitization
      try {
        router.push(target as Route);
      } catch {
        window.location.href = target;
      }
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT 50% — ADMIN LOGIN FORM (OTP based) */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 px-8 py-10 text-gray-800">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-800">Admin Sign in</h1>
            <p className="text-sm text-gray-700">
              Login with your registered admin phone number to access the
              dashboard.
            </p>
          </div>

          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Admin phone (WhatsApp)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971501234567"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                />
              </div>

              <button
                onClick={startOtp}
                disabled={loading || !phone.trim()}
                className="w-full py-2 rounded-md bg-emerald-600 text-white font-medium shadow disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Enter {codeLen}-digit code
                </label>
                <OtpInput value={code} onChange={setCode} length={codeLen} />
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || code.length !== codeLen}
                className="w-full py-2 rounded-md bg-emerald-600 text-white font-medium shadow disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <button
                onClick={() => cooldown === 0 && startOtp()}
                disabled={cooldown > 0 || loading}
                className="w-full py-2 rounded-md border border-gray-300 text-sm text-gray-800 disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
              </button>

              <button
                onClick={() => setStep("phone")}
                className="w-full py-2 text-xs text-gray-600 underline"
              >
                Change phone
              </button>
            </div>
          )}

          <p className="text-xs text-gray-700">
            This area is restricted to Credible Management administrators only.
          </p>
        </div>
      </div>

      {/* RIGHT 50% — ADMIN VISUAL */}
      <div className="hidden md:block w-1/2 relative">
        <Image
          src="/png-clipart-user-computer-icons-product-manuals-system-administrator-behaviors-blue-text-thumbnail.png"
          alt="Admin dashboard overview"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute bottom-6 left-6 right-6 bg-white/90 p-4 rounded-xl shadow-lg text-gray-800">
          <p className="text-base font-semibold">
            Monitor your entire service platform in one place
          </p>
          <p className="text-xs mt-1">
            Track provider approvals, live jobs, payments and platform
            performance from the Credible Management admin dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
