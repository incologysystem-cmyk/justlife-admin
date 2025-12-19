"use client";
import { useEffect, useRef } from "react";

export default function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handle(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const next = value.split("");
    next[i] = v;
    onChange(next.join(""));
    if (v && i < length - 1) inputs.current[i + 1]?.focus();
  }

  function key(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (value[i]) {
        const next = value.split("");
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) inputs.current[i + 1]?.focus();
  }

  function paste(e: React.ClipboardEvent<HTMLDivElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    const next = value.split("");
    for (let i = 0; i < length; i++) next[i] = text[i] ?? next[i] ?? "";
    onChange(next.join(""));
    const last = Math.min(text.length, length) - 1;
    if (last >= 0) inputs.current[last]?.focus();
  }

  return (
    <div className="flex gap-2" onPaste={paste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handle(i, e)}
          onKeyDown={(e) => key(i, e)}
          onFocus={(e) => e.currentTarget.select()}
          className="w-10 h-12 text-center rounded border border-border bg-background text-lg"
        />
      ))}
    </div>
  );
}
