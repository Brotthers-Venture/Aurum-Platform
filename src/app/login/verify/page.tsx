"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "your registered email";
  return `${user.slice(0, 1)}${"•".repeat(Math.max(user.length - 1, 3))}@${domain}`;
}

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(45);
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(sessionStorage.getItem("aurum.pendingEmail") ?? "");
    } catch {}
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function setDigit(i: number, v: string) {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = [...code];
      digits.slice(0, 6 - i).split("").forEach((d, k) => (next[i + k] = d));
      setCode(next);
      refs.current[Math.min(i + digits.length, 5)]?.focus();
      return;
    }
    const next = [...code];
    next[i] = digits;
    setCode(next);
    if (digits && i < 5) refs.current[i + 1]?.focus();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const isStaff = email.endsWith("@aurumasset.us");
    setTimeout(() => router.push(isStaff ? "/admin" : "/portal"), 400);
  }

  const complete = code.every((d) => d !== "");

  return (
    <AuthShell>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> Back
      </Link>
      <h2 className="mt-6 text-[26px] font-semibold tracking-[-0.015em] text-ink-900">Verify it’s you</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-stone-600">
        Enter the 6-digit code sent to <span className="font-medium text-ink-900">{maskEmail(email)}</span>.
      </p>

      <form onSubmit={submit} className="mt-9">
        <div className="flex justify-between gap-2">
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1}`}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
              }}
              className="num h-14 w-full rounded-[3px] border border-stone-300 text-center text-[22px] font-medium text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
            />
          ))}
        </div>
        <Button type="submit" size="lg" className="mt-7 w-full" disabled={!complete || busy}>
          {busy ? "Signing in…" : "Verify and sign in"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-[13px]">
        <button type="button" className="font-medium text-stone-600 underline-offset-4 hover:text-ink-900 hover:underline">
          Use authenticator app
        </button>
        {seconds > 0 ? (
          <span className="num text-stone-400">Resend code in 0:{String(seconds).padStart(2, "0")}</span>
        ) : (
          <button type="button" onClick={() => setSeconds(45)} className="font-medium text-ink-900 underline-offset-4 hover:underline">
            Resend code
          </button>
        )}
      </div>
      <p className="mt-10 text-[12px] leading-relaxed text-stone-500">
        Didn’t receive a code? Check your spam folder or contact Client Services at{" "}
        <a className="text-ink-900 underline underline-offset-4" href="mailto:clientservices@aurumasset.us">
          clientservices@aurumasset.us
        </a>
        .
      </p>
    </AuthShell>
  );
}
