"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { GpLogo, AdministeredByAurum } from "@/components/brand/GpLogo";
import { Button } from "@/components/ui";
import { brandStyle, type GpClient } from "@/lib/gps";

const input =
  "h-11 w-full rounded-[3px] border border-stone-300 bg-white px-3.5 text-[14px] text-ink-900 placeholder:text-stone-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

/** Investor sign-in on the GP's portal address, entirely in the GP's brand. */
export function BrandedLogin({ gp }: { gp: GpClient }) {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [email, setEmail] = useState("m.calloway@callowaytrust.com");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const tall = gp.logo && gp.logo.width / gp.logo.height < 3;

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" style={brandStyle(gp.brand)}>
      <aside className="relative hidden flex-col overflow-hidden bg-brand text-brand-ink lg:flex">
        {gp.hero && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gp.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${gp.brand.primary}40 0%, ${gp.brand.primary}e6 75%)` }} />
          </>
        )}
        <div className="relative h-[3px] bg-brand-2" />
        <div className="relative flex flex-1 flex-col justify-center px-16">
          <GpLogo gp={gp} height={tall ? 120 : 52} tone="dark" />
          <div className="mt-14 max-w-[420px] border-t border-white/20 pt-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-2">Investor Portal</div>
            <p className="mt-3 text-[15px] leading-relaxed opacity-70">
              Capital account statements, notices, reports and tax documents for your investments with {gp.shortName}.
            </p>
          </div>
        </div>
        <div className="relative px-16 pb-8">
          <AdministeredByAurum tone="dark" />
        </div>
      </aside>

      <main className="flex flex-col bg-white">
        <div className="px-8 pt-8 lg:hidden">
          <GpLogo gp={gp} height={tall ? 56 : 28} />
        </div>
        <div className="flex flex-1 items-center justify-center px-8 py-14">
          <div className="w-full max-w-[380px]">
            {step === "credentials" ? (
              <>
                <h1 className="text-[26px] font-semibold tracking-[-0.015em]">Sign in</h1>
                <p className="mt-1.5 text-[14px] text-stone-600">Access your {gp.shortName} investor account.</p>
                <form
                  className="mt-9 space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep("code");
                  }}
                >
                  <label className="block">
                    <span className="text-[12px] font-semibold">Email address</span>
                    <input type="email" className={`${input} mt-1.5`} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="flex justify-between text-[12px] font-semibold">
                      Password
                      <a href="#" className="font-medium text-stone-500 hover:text-ink-900">
                        Forgot password?
                      </a>
                    </span>
                    <input type="password" className={`${input} mt-1.5`} defaultValue="preview" />
                  </label>
                  <Button type="submit" variant="brand" size="lg" className="w-full">
                    Continue
                  </Button>
                </form>
                <p className="mt-8 flex items-start gap-2 text-[12px] text-stone-500">
                  <Lock size={13} strokeWidth={1.8} className="mt-[2px] shrink-0" />
                  Multi-factor authentication is required for every session.
                </p>
              </>
            ) : (
              <>
                <button onClick={() => setStep("credentials")} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
                  <ArrowLeft size={14} strokeWidth={1.8} /> Back
                </button>
                <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.015em]">Verify it’s you</h1>
                <p className="mt-1.5 text-[14px] text-stone-600">Enter the 6-digit code sent to {email.replace(/^(.).*@/, "$1•••@")}.</p>
                <form
                  className="mt-9"
                  onSubmit={(e) => {
                    e.preventDefault();
                    router.push(`/investor/${gp.id}`);
                  }}
                >
                  <div className="flex justify-between gap-2">
                    {code.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          refs.current[i] = el;
                        }}
                        aria-label={`Digit ${i + 1}`}
                        inputMode="numeric"
                        value={d}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          const next = [...code];
                          v.slice(0, 6 - i)
                            .split("")
                            .forEach((ch, k) => (next[i + k] = ch));
                          if (!v) next[i] = "";
                          setCode(next);
                          refs.current[Math.min(i + Math.max(v.length, 1), 5)]?.focus();
                        }}
                        className="num h-14 w-full rounded-[3px] border border-stone-300 text-center text-[22px] font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    ))}
                  </div>
                  <Button type="submit" variant="brand" size="lg" className="mt-7 w-full" disabled={code.some((c) => !c)}>
                    Verify and sign in
                  </Button>
                </form>
              </>
            )}
            <div className="mt-8 border border-dashed border-stone-300 px-3.5 py-3 text-[12px] leading-relaxed text-stone-500">
              <span className="font-semibold text-stone-600">Preview.</span> Live at{" "}
              <span className="font-mono text-[11px] text-ink-900">{gp.customDomain ?? gp.portalDomain}</span>. Any password and code work.
            </div>
          </div>
        </div>
        <footer className="flex items-center justify-between border-t border-stone-100 px-8 py-5 text-[12px] text-stone-500">
          <span>© 2026 {gp.name}</span>
          <AdministeredByAurum />
        </footer>
      </main>
    </div>
  );
}
