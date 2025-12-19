"use client";
import { useState } from "react";
import { toast } from "sonner";
import OtpInput from "@/app/components/auth/OtpInput";

export default function SignupPage() {
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function start() {
    if (!phone) return toast.error("Enter phone number");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || "Failed to send OTP");
      setStep("otp");
      setCooldown(30);
      const t = setInterval(
        () => setCooldown((c) => (c <= 1 ? (clearInterval(t), 0) : c - 1)),
        1000
      );
      if (j.devCode) toast.info(`Dev OTP: ${j.devCode}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (code.length < 6) return toast.error("Enter 6-digit code");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || "Invalid code");
      // cookie set by proxy route on success
      setStep("profile");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeProfile() {
    if (!name || !email) return toast.error("Fill your name and email");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/complete-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || "Failed to complete profile");
      toast.success("Welcome!");
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl2 p-5 space-y-4">
        <h1 className="text-lg font-semibold">Create account</h1>

        {step === "phone" && (
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
              disabled={loading}
              className="w-full px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-3">
            <label className="text-xs text-white/60">Enter 6-digit code</label>
            <OtpInput value={code} onChange={setCode} />
            <button
              onClick={verify}
              disabled={loading}
              className="w-full px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              onClick={() => cooldown === 0 && start()}
              disabled={cooldown > 0}
              className="w-full px-3 py-2 rounded border border-border text-sm"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-3">
            <label className="text-xs text-white/60">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="text-xs text-white/60">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={completeProfile}
              disabled={loading}
              className="w-full px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-sm"
            >
              {loading ? "Saving..." : "Complete profile"}
            </button>
          </div>
        )}

        <p className="text-xs text-white/50">
          Already have an account? <a className="underline" href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
