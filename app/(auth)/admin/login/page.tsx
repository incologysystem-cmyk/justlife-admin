"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { toast } from "sonner";
import OtpInput from "@/app/components/auth/OtpInput";

const OTP_LENGTH = 4;

type LoginResponse = {
  success?: boolean;
  user?: {
    role?: "customer" | "provider" | "admin" | string;
    [key: string]: any;
  };
  token?: string;
  error?: string;
  message?: string;
};

function sanitizeAdminNext(next: string) {
  if (!next) return "/admin";
  if (next.startsWith("/admin")) return next;
  return "/admin";
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string>("/admin");

  // read ?next=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      setNext(url.searchParams.get("next") || "/admin");
    } catch {
      setNext("/admin");
    }
  }, []);

  // cooldown timer
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

  // STEP 1 — Send OTP
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

      const j: any = await r.json().catch(() => ({}));

      if (!r.ok || j.error) {
        throw new Error(j.error || j.message || "Failed to send OTP");
      }

      if (!j.requestId) {
        throw new Error("requestId missing");
      }

      setRequestId(j.requestId);
      setCode("");
      setStep("otp");
      startCooldown(30);

      if (j.devCode) toast.info(`Dev OTP: ${j.devCode}`);
      toast.success("4-digit OTP sent to your WhatsApp");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2 — Verify OTP
  async function verifyOtp() {
    if (!requestId) return toast.error("Please resend OTP");
    if (code.length !== OTP_LENGTH) {
      return toast.error(`Enter ${OTP_LENGTH}-digit code`);
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
        throw new Error(data.error || data.message || "Invalid OTP");
      }

      if (!data.user || data.user.role !== "admin") {
        throw new Error("Admin access only");
      }

      toast.success("Logged in as admin");

      const target = sanitizeAdminNext(next);

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
      {/* LEFT */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 px-8 py-10 text-gray-800">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Sign in</h1>
            <p className="text-sm mt-1">
              Login with your admin WhatsApp number
            </p>
          </div>

          {step === "phone" ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium">
                  Admin phone (WhatsApp)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971501234567"
                  className="w-full mt-1 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <button
                onClick={startOtp}
                disabled={loading || !phone.trim()}
                className="w-full py-2 rounded-md bg-emerald-600 text-white font-medium disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send 4-Digit OTP"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium">
                  Enter 4-digit code
                </label>
                <OtpInput
                  value={code}
                  onChange={setCode}
                  length={OTP_LENGTH}
                />
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || code.length !== OTP_LENGTH}
                className="w-full py-2 rounded-md bg-emerald-600 text-white font-medium disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <button
                onClick={() => cooldown === 0 && startOtp()}
                disabled={cooldown > 0 || loading}
                className="w-full py-2 rounded-md border text-sm disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
              </button>

              <button
                onClick={() => setStep("phone")}
                className="w-full text-xs underline text-gray-600"
              >
                Change phone
              </button>
            </div>
          )}

          <p className="text-xs text-gray-600">
            Restricted area — Admin access only
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden md:block w-1/2 relative">
        <Image
          src="/png-clipart-user-computer-icons-product-manuals-system-administrator-behaviors-blue-text-thumbnail.png"
          alt="Admin dashboard"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
    </div>
  );
}
