"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { cx } from "@/components/ui";
import { money } from "@/lib/format";
import { entityById, type Connection, type PayState, type Rail } from "@/lib/banking/data";
import type { Currency } from "@/lib/data";

export { Drawer, Section, KV, Seg, Empty, Illus, day } from "@/components/offering/ui";
export { Dialog, field, lbl, btnPrimary, btnSecondary } from "@/components/offering/Forms";

/** Money with its currency; credits can carry a plus sign. */
export function Amt({ v: raw, ccy, signed, decimals = 2, className }: { v: number; ccy: Currency; signed?: boolean; decimals?: number; className?: string }) {
  const v = Math.abs(raw) < 0.5 * 10 ** -decimals ? 0 : raw;
  const s = money(Math.abs(v), ccy, { decimals });
  return (
    <span className={cx("tnum whitespace-nowrap", signed && v > 0 && "text-[var(--color-up)]", className)}>
      {signed ? (v > 0 ? "+" : v < 0 ? "−" : "") : v < 0 ? "−" : ""}
      {s}
    </span>
  );
}

export function BankBanner({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-start gap-2.5 rounded-[10px] border border-dashed border-d-line px-3.5 py-2.5 text-[12.5px] leading-relaxed text-d-text-2", className)}>
      <FlaskConical size={15} className="mt-0.5 shrink-0 text-d-text-3" />
      <span>
        <b className="font-semibold text-d-text">Prototype.</b> No bank is connected and no money moves. Fund accounts mirror the funds’ books; company and family accounts are
        illustrative. In production, accounts are opened in each client entity’s own name at a partner bank. The firm operates the platform under the client’s mandate and never
        holds the money.
      </span>
    </div>
  );
}

const STATE: Record<PayState, string> = {
  Draft: "border-d-line text-d-text-3",
  "Pending approval": "border-attn-line text-gold-700",
  "Pending release": "border-attn-line text-gold-700",
  Scheduled: "border-d-line text-d-text-2",
  Sent: "border-up-line text-up-ink",
  Settled: "border-up-line text-up-ink",
  Rejected: "border-neg-line text-negative",
  Cancelled: "border-d-line text-d-text-3",
  "On hold": "border-neg-line text-negative",
};
export function PayPill({ s }: { s: PayState }) {
  return <span className={cx("inline-flex whitespace-nowrap rounded-[6px] border px-2 py-0.5 text-[11.5px]", STATE[s])}>{s}</span>;
}

export function ConnPill({ c }: { c: Connection }) {
  const label = { Platform: "Platform", Connected: "Connected · read-only", Statements: "Statements" }[c];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap text-[12px]", c === "Platform" ? "text-d-text" : "text-d-text-3")}>
      <span aria-hidden className={cx("h-1.5 w-1.5 rounded-full", c === "Platform" ? "bg-[var(--color-up)]" : c === "Connected" ? "bg-[var(--d-accent-fill)]" : "bg-d-line-strong")} />
      {label}
    </span>
  );
}

export function RailTag({ r }: { r: Rail }) {
  return <span className="inline-flex whitespace-nowrap rounded-[5px] bg-d-raise px-1.5 py-px text-[11px] font-medium text-d-text-2">{r}</span>;
}

/** An entity's initials in a small square. */
export function EntityMark({ id, size = 30 }: { id: string; size?: number }) {
  const e = entityById(id);
  const letters = (e?.short ?? "?")
    .split(/[\s-]+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-[8px] border border-d-line bg-[var(--d-accent-soft)] text-[11px] font-semibold text-[var(--d-accent)]"
    >
      {letters}
    </span>
  );
}

/** A short-lived confirmation line. */
export function useFlash() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 5200);
    return () => clearTimeout(t);
  }, [msg]);
  const node: ReactNode = msg ? (
    <div
      role="status"
      className={cx(
        "fixed bottom-5 left-1/2 z-50 max-w-[560px] -translate-x-1/2 rounded-[10px] border px-4 py-2.5 text-[13px] shadow-lift",
        msg.ok ? "border-d-line bg-d-surface text-d-text" : "border-neg-line bg-d-surface text-negative",
      )}
    >
      {msg.text}
    </div>
  ) : null;
  return { flash: (r: { ok: boolean; message: string }) => setMsg({ ok: r.ok, text: r.message }), node };
}

export const th = "px-3 py-2.5 text-left text-[11.5px] font-medium text-d-text-3 first:pl-4 last:pr-4 whitespace-nowrap";
export const td = "px-3 py-2.5 first:pl-4 last:pr-4 align-middle";
export const tr = "border-b border-d-line-soft last:border-0 hover:bg-d-raise";
export const card = "overflow-hidden rounded-[12px] border border-d-line bg-d-surface";
