"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button, cx } from "@/components/ui";

export function WizardShell({
  back,
  backLabel,
  eyebrow,
  title,
  steps,
  step,
  setStep,
  canContinue = true,
  finalLabel,
  onFinish,
  children,
  aside,
}: {
  back: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  steps: string[];
  step: number;
  setStep: (n: number) => void;
  canContinue?: boolean;
  finalLabel: string;
  onFinish: () => void;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <Link href={back} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> {backLabel}
      </Link>
      <div className="border-b border-stone-200 pb-5">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.015em]">{title}</h1>
        <ol className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          {steps.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                className={cx("flex items-center gap-2 text-[13px]", i === step ? "font-semibold text-ink-900" : i < step ? "text-ink-800" : "text-stone-400")}
              >
                <span
                  className={cx(
                    "num flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                    i < step ? "bg-ink-900 text-white" : i === step ? "border border-ink-900" : "border border-stone-300",
                  )}
                >
                  {i < step ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className={cx("grid gap-6", !!aside && "xl:grid-cols-[minmax(0,1fr)_320px]")}>
        <div className="min-w-0">
          {children}
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" disabled={!canContinue} onClick={() => setStep(step + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="button" variant="gold" disabled={!canContinue} onClick={onFinish}>
                {finalLabel}
              </Button>
            )}
          </div>
        </div>
        {aside && <aside className="space-y-4">{aside}</aside>}
      </div>
    </div>
  );
}

export const wizInput =
  "h-10 w-full rounded-[3px] border border-stone-300 bg-white px-3 text-[13px] text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900";

export function WField({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[12px] text-stone-500">{hint}</span>}
    </label>
  );
}

export function parseAmount(v: string) {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
