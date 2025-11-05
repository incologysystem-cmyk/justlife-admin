// app/(auth)/login/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import OtpInput from "@/app/components/auth/OtpInput";

const DEFAULT_CODE_LEN = 6;

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [codeLen, setCodeLen] = useState<number>(DEFAULT_CODE_LEN);
  const next = useSearchParams().get("next") || "/";

  // keep an interval ref to clear on unmount
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

  async function start() {
    if (!phone.trim()) return toast.error("Enter phone number");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const j = await r.json();

      if (!r.ok || j.error) throw new Error(j.error || "Failed to send OTP");

      // your backend should return a UUID requestId required by otpVerifySchema
      if (!j.requestId) throw new Error("requestId missing in /otp/start response");
      setRequestId(j.requestId);

      // Optional: backend can tell us code length (fallback to 6)
      if (typeof j.codeLength === "number" && j.codeLength > 0) {
        setCodeLen(j.codeLength);
      } else {
        setCodeLen(DEFAULT_CODE_LEN);
      }

      setCode("");           // reset any previous code
      setStep("otp");
      startCooldown(30);     // 30s resend cooldown
      if (j.devCode) toast.info(`Dev OTP: ${j.devCode}`);
      toast.success("OTP sent");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!requestId) return toast.error("Missing requestId. Please resend OTP.");
    if (code.length !== codeLen) return toast.error(`Enter ${codeLen}-digit code`);

    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANT: your backend expects { requestId, code }
        body: JSON.stringify({ requestId, code }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || "Invalid code");

      // Cookie is set by our Next API route on success
      toast.success("Signed in");
      window.location.href = next;
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl2 p-5 space-y-4">
        <h1 className="text-lg font-semibold">Sign in</h1>

        {step === "phone" ? (
          <div className="space-y-3">
            <label className="text-xs text-white/60">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +971501234567"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={start}
              disabled={loading || !phone.trim()}
              className="w-full px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs text-white/60">Enter {codeLen}-digit code</label>
            <OtpInput value={code} onChange={setCode} length={codeLen} />
            <button
              onClick={verify}
              disabled={loading || code.length !== codeLen}
              className="w-full px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            <button
              onClick={() => cooldown === 0 && start()}
              disabled={cooldown > 0 || loading}
              className="w-full px-3 py-2 rounded border border-border text-sm disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>

            <button
              onClick={() => setStep("phone")}
              className="w-full px-3 py-2 rounded border border-border text-xs opacity-70"
            >
              Change phone
            </button>
          </div>
        )}

        <p className="text-xs text-white/50">
          No account? <a className="underline" href="/signup">Create one</a>
        </p>
      </div>
    </div>
  );
}
