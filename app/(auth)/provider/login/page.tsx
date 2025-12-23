"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import OtpInput from "@/app/components/auth/OtpInput";

const DEFAULT_CODE_LEN = 4; // ✅ change to 4

type UserRole = "customer" | "provider" | "admin" | string;

type OtpVerifyResponse = {
  success?: boolean;
  user?: { role?: UserRole; [key: string]: any };
  data?: { user?: { role?: UserRole; [key: string]: any } };
  token?: string;
  error?: string;
  message?: string;
  codeLength?: number; // backend may send 4 or 6
};

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [codeLen, setCodeLen] = useState<number>(DEFAULT_CODE_LEN);
  const [next, setNext] = useState<string>("/provider");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      setNext(url.searchParams.get("next") || "/provider");
    } catch {
      setNext("/provider");
    }
  }, []);

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

  // 🔹 STEP 1: Provider ke liye OTP start
  async function start() {
    if (!phone.trim()) return toast.error("Enter phone number");
    setLoading(true);

    try {
      const payload = {
        phone: phone.trim(),
        requireProvider: true,
      };

      const r = await fetch("/api/auth/otp/start?requireProvider=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({} as any));

      if (!r.ok || j.error) {
        const msg =
          j.error ||
          j.message ||
          (r.status === 400
            ? "This number is not registered as a provider"
            : "Failed to send OTP");
        toast.error(msg);
        return;
      }

      if (!j.requestId) {
        toast.error("Missing requestId in response");
        return;
      }

      // ✅ if backend gives codeLength use it, otherwise default 4
      const len = Number(j.codeLength || DEFAULT_CODE_LEN);
      setRequestId(j.requestId);
      setCodeLen(Number.isFinite(len) && len > 0 ? len : DEFAULT_CODE_LEN);

      // ✅ important: reset code when switching len
      setCode("");
      setStep("otp");
      startCooldown(30);
      toast.success("OTP sent to WhatsApp");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 STEP 2: OTP verify
  async function verify() {
    if (!requestId) return toast.error("Missing requestId");
    if (code.length !== codeLen) return toast.error(`Enter ${codeLen} digits`);

    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, code }),
      });

      const j: OtpVerifyResponse = await r.json().catch(() => ({} as any));

      if (!r.ok || j.error) throw new Error(j.error || j.message || "Invalid OTP");

      const user = j.user || j.data?.user;
      if (!user) throw new Error("User info missing in OTP response");

      if (user.role !== "provider") {
        throw new Error("This number is not registered as a provider");
      }

      toast.success("Signed in as provider");
      window.location.href = next;
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 px-8 py-10 text-gray-800">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-800">Provider Login</h1>
            <p className="text-sm text-gray-700">
              Access your provider dashboard, manage jobs & track payments.
            </p>
          </div>

          {step === "phone" ? (
            <div className="space-y-4">
              <label className="text-xs font-medium text-gray-700">
                Phone Number (WhatsApp)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971501234567"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
              />
              <button
                onClick={start}
                disabled={loading || !phone.trim()}
                className="w-full py-2 rounded-md bg-emerald-600 text-white font-medium shadow disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-xs font-medium text-gray-700">
                Enter {codeLen}-digit code
              </label>

              {/* ✅ key forces remount when length changes (important when switching 6->4) */}
              <OtpInput key={codeLen} value={code} onChange={setCode} length={codeLen} />

              <button
                onClick={verify}
                disabled={loading || code.length !== codeLen}
                className="w-full py-2 rounded-md bg-emerald-600 text-white font-medium shadow disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <button
                onClick={() => cooldown === 0 && start()}
                disabled={cooldown > 0 || loading}
                className="w-full py-2 rounded-md border border-gray-300 text-sm disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
              </button>

              <button
                onClick={() => {
                  setCode("");
                  setStep("phone");
                }}
                className="w-full py-2 text-xs text-gray-600 underline"
              >
                Change Phone
              </button>
            </div>
          )}

          <p className="text-xs text-gray-700">
            Not a provider?{" "}
            <a href="/provider/register" className="underline text-emerald-600">
              Apply now
            </a>
          </p>
        </div>
      </div>

      <div className="hidden md:block w-1/2 relative">
        <Image
          src="/ru-service-provider.png"
          alt="Service Provider"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute bottom-6 left-6 right-6 bg-white/90 p-4 rounded-xl shadow-lg text-gray-800">
          <p className="text-base font-semibold">
            Grow your service business with Credible Management
          </p>
          <p className="text-xs mt-1">
            Get instant job requests, complete tasks and receive payments — all
            from one dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
