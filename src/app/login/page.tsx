"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AuthShell, Field, inputClass } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email address registered with Aurum.");
    if (password.length < 1) return setError("Enter your password.");
    setError(null);
    setBusy(true);
    // Preview only — replaced by Supabase Auth (password + MFA) in phase 2.
    try {
      sessionStorage.setItem("aurum.pendingEmail", email.trim().toLowerCase());
    } catch {}
    setTimeout(() => router.push("/login/verify"), 450);
  }

  return (
    <AuthShell>
      <h2 className="text-[26px] font-semibold tracking-[-0.015em] text-ink-900">Sign in</h2>
      <p className="mt-1.5 text-[14px] text-stone-600">Access your Aurum client account.</p>

      <form onSubmit={submit} className="mt-9 space-y-5" noValidate>
        <Field label="Email address">
          <input
            type="email"
            autoComplete="username"
            className={inputClass}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Password"
          hint={
            <a href="#" className="text-[12px] font-medium text-stone-500 underline-offset-4 hover:text-ink-900 hover:underline">
              Forgot password?
            </a>
          }
        >
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className={`${inputClass} pr-11`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-400 hover:text-ink-900"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
            </button>
          </div>
        </Field>

        <label className="flex items-center gap-2.5 text-[13px] text-stone-600">
          <input type="checkbox" className="h-4 w-4 rounded-[2px] border-stone-300 accent-ink-900" />
          Remember this device for 30 days
        </label>

        {error && (
          <p role="alert" className="border-l-2 border-negative bg-negative-bg px-3 py-2 text-[13px] text-negative">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Verifying…" : "Continue"}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-4 text-[11px] uppercase tracking-[0.14em] text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />
        or
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <Button variant="secondary" size="lg" className="w-full" type="button">
        Continue with single sign-on
      </Button>

      <div className="mt-10 space-y-3 text-[13px] text-stone-600">
        <p>
          New investor? Use the secure invitation link sent by your fund administrator to create your account.
        </p>
        <p className="flex items-start gap-2 text-[12px] text-stone-500">
          <Lock size={13} strokeWidth={1.8} className="mt-[2px] shrink-0" />
          Multi-factor authentication is required for every session. Sessions end after 15 minutes of inactivity.
        </p>
      </div>

      <div className="mt-8 border border-dashed border-stone-300 px-3.5 py-3 text-[12px] leading-relaxed text-stone-500">
        <span className="font-semibold text-stone-600">Preview environment.</span> Any password works. Emails ending
        in <span className="font-mono text-[11px] text-ink-900">@aurumasset.us</span> open the administrator view;
        a GP’s domain (e.g. <span className="font-mono text-[11px] text-ink-900">@strlex.com</span>) opens that GP’s portal; all others
        open the investor portals.
      </div>
    </AuthShell>
  );
}
