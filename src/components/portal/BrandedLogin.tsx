"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { GpLogo, AdministeredByAurum } from "@/components/brand/GpLogo";
import { Button } from "@/components/ui";
import { LoginStage } from "@/components/auth/LoginStage";
import { EntranceBackdrop } from "@/components/auth/AuthShell";
import { useBrand } from "@/components/brand/BrandProvider";
import { resolveLook } from "@/lib/entrances";
import { useMotionAllowed } from "@/components/auth/useMotionAllowed";
import { useTheme } from "@/components/shell/ThemeProvider";
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
  const { theme } = useTheme();
  const motion = useMotionAllowed();
  const { brand } = useBrand();
  const look = resolveLook(brand, `investor:${gp.id}`);
  const tone = look.backdrop === "field" && theme === "light" ? "light" : "dark";

  return (
    <LoginStage
      style={brandStyle(gp.brand)}
      sharp={look.backdrop !== "gold"}
      tone={tone}
      background={<EntranceBackdrop brand={brand} look={look} tone={tone} still={!motion} field={{ ink: gp.brand.primary, accent: gp.brand.secondary }} />}
      logo={<GpLogo gp={gp} height={tall ? 64 : 30} tone={tone} />}
      statement={
        <>
          <div className="text-[13px] font-medium text-white/80">{look.eyebrow}</div>
          <h1 className="mt-4 font-serif text-[52px] font-normal leading-[1.05] tracking-[-0.015em] drop-shadow-[0_2px_20px_rgba(0,0,0,0.25)]">{look.headline}</h1>
          <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-white/80">{look.text}</p>
        </>
      }
      footer={
        <>
          <span>© 2026 {gp.name}</span>
          <AdministeredByAurum tone={tone} />
        </>
      }
    >
      {step === "credentials" ? (
        <>
          <div className="mb-5">
            <GpLogo gp={gp} height={tall ? 44 : 22} />
          </div>
          <h1 className="text-[20px] font-semibold tracking-[-0.015em]">Sign in</h1>
          <p className="mt-1.5 text-[14px] text-stone-600">Access your {gp.shortName} investor account.</p>
          <form
            className="mt-6 space-y-5"
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
          <p className="mt-6 flex items-start gap-2 text-[12px] text-stone-500">
            <Lock size={13} strokeWidth={1.8} className="mt-[2px] shrink-0" />
            Multi-factor authentication is required for every session.
          </p>
        </>
      ) : (
        <>
          <button onClick={() => setStep("credentials")} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
            <ArrowLeft size={14} strokeWidth={1.8} /> Back
          </button>
          <h1 className="mt-5 text-[20px] font-semibold tracking-[-0.015em]">Verify it’s you</h1>
          <p className="mt-1.5 text-[14px] text-stone-600">Enter the 6-digit code sent to {email.replace(/^(.).*@/, "$1•••@")}.</p>
          <form
            className="mt-6"
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
      <div className="mt-6 rounded-[8px] bg-stone-50 px-3.5 py-3 text-[12px] leading-relaxed text-stone-500">
        <span className="font-semibold text-stone-600">Preview.</span> Live at <span className="font-mono text-[11px] text-ink-900">{gp.customDomain ?? gp.portalDomain}</span>. Any
        password and code work.
      </div>
    </LoginStage>
  );
}
