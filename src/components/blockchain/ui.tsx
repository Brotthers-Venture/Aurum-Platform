"use client";

import { useState } from "react";
import { Check, Copy, FlaskConical } from "lucide-react";
import { cx } from "@/components/ui";
import { TREATMENT, shortAddr, type Token, type TokenStatus, type Treatment } from "@/lib/blockchain/data";

export { Drawer, Empty, Illus, KV, Section, Seg, day, dayShort } from "@/components/offering/ui";

export const n = (v: number) => v.toLocaleString("en-US");
export const usd2 = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const usd0 = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

/** Shown wherever chain data appears: nothing here is on a real network. */
export function SimBanner({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-start gap-2.5 rounded-[10px] border border-dashed border-d-line px-3.5 py-2.5 text-[12.5px] leading-relaxed text-d-text-2", className)}>
      <FlaskConical size={15} className="mt-0.5 shrink-0 text-d-text-3" />
      <span>
        <b className="font-semibold text-d-text">Simulation.</b> No blockchain is connected: addresses, transactions and blocks are simulated, and no wallet or money is involved.
        What a token legally represents is confirmed by counsel for each company.
      </span>
    </div>
  );
}

export function Address({ a, className }: { a: string | null; className?: string }) {
  const [copied, setCopied] = useState(false);
  if (!a) return <span className={cx("text-[12px] text-d-text-3", className)}>Not connected</span>;
  return (
    <button
      type="button"
      title={`${a} (simulated address)`}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(a).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] border border-d-line px-1.5 py-0.5 font-mono text-[11.5px] text-d-text-2 hover:text-d-text",
        className,
      )}
    >
      {shortAddr(a)}
      {copied ? <Check size={11} /> : <Copy size={11} className="text-d-text-3" />}
    </button>
  );
}

const TONE: Record<Treatment, string> = {
  record: "border-up-line text-up-ink",
  "record-agreement": "border-d-text-3 text-d-text",
  mirror: "border-d-line text-d-text-2",
};
export function TreatmentPill({ t }: { t: Treatment }) {
  return (
    <span title={TREATMENT[t].label} className={cx("inline-flex whitespace-nowrap rounded-[6px] border px-1.5 py-px text-[11.5px]", TONE[t])}>
      {TREATMENT[t].short}
    </span>
  );
}

const S_TONE: Record<TokenStatus, string> = {
  Live: "border-up-line text-up-ink",
  "Ready to issue": "border-attn-line text-gold-700",
  "Identity review": "border-attn-line text-gold-700",
  "Waiting for incorporation": "border-d-line text-d-text-3",
};
export function StatusPill({ s }: { s: TokenStatus }) {
  return <span className={cx("inline-flex whitespace-nowrap rounded-[6px] border px-1.5 py-px text-[11.5px]", S_TONE[s])}>{s}</span>;
}

/** A company's mark: its initials in a quiet square (no logos are invented). */
export function CompanyMark({ t, size = 36 }: { t: Pick<Token, "symbol">; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[9px] border border-d-line bg-d-raise font-semibold tracking-[0.02em] text-d-text-2"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.28) }}
    >
      {t.symbol.slice(0, 2)}
    </span>
  );
}
