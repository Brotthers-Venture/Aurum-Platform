"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/components/ui";
import { PHASES, STAGES, stageOf, type Amounts, type StageId } from "@/lib/offering/data";

/* ───────── numbers ───────── */

export const usd = (v: number | undefined | null) => (v === undefined || v === null ? "—" : `$${Math.round(v).toLocaleString("en-US")}`);
export function usdShort(v: number | undefined | null) {
  if (v === undefined || v === null) return "—";
  const a = Math.abs(v);
  if (a >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(a % 1e6 === 0 ? 0 : 1)}M`;
  if (a >= 1e3) return `$${Math.round(v / 1e3)}K`;
  return `$${v}`;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const day = (iso?: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};
export const dayShort = (iso?: string) => {
  if (!iso) return "—";
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
};
export const daysFrom = (iso: string, today = "2026-11-24") => Math.round((Date.parse(`${iso.slice(0, 10)}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5);

/* ───────── marks ───────── */

/** Data with no record behind it yet. */
export function Illus({ title = "Illustrative: not on record anywhere yet", short }: { title?: string; short?: boolean }) {
  return (
    <span title={title} className="inline-flex shrink-0 items-center rounded-[5px] border border-dashed border-d-line px-1.5 text-[10.5px] leading-[18px] text-d-text-3">
      {short ? "Illus." : "Illustrative"}
    </span>
  );
}

const PHASE_TONE: Record<string, string> = {
  prospecting: "text-d-text-2 border-d-line",
  diligence: "text-d-text border-d-line",
  subscription: "text-d-text border-d-text-3",
  closed: "text-up-ink border-up-line",
  out: "text-d-text-3 border-d-line",
};
export function StagePill({ stage, className }: { stage: StageId; className?: string }) {
  const s = stageOf(stage);
  return <span className={cx("inline-flex whitespace-nowrap rounded-[6px] border px-1.5 py-px text-[11.5px]", PHASE_TONE[s.phase ?? "out"], className)}>{s.label}</span>;
}

/** Where an opportunity stands: four phases, the current stage named under its phase. */
export function StageTrack({ stage, compact }: { stage: StageId; compact?: boolean }) {
  const s = stageOf(stage);
  const at = s.phase ? PHASES.findIndex((p) => p.id === s.phase) : -1;
  return (
    <div>
      <div className="flex gap-1" aria-label={`Stage: ${s.label}`}>
        {PHASES.map((p, i) => (
          <span
            key={p.id}
            className={cx("h-1 flex-1 rounded-full", at < 0 ? "bg-d-line" : i < at ? "bg-d-text-3" : i === at ? "" : "bg-d-line")}
            style={i === at ? { background: stage === "funded" || stage === "accepted" ? "var(--color-up)" : "var(--d-text)" } : undefined}
          />
        ))}
      </div>
      {!compact && (
        <div className="mt-1.5 flex text-[11px] text-d-text-3">
          {PHASES.map((p, i) => (
            <span key={p.id} className={cx("flex-1", i === at && "font-semibold text-d-text")}>
              {i === at ? s.label : p.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── the capital ladder ───────── */

export type LadderRow = { key: string; label: string; value: number; note?: ReactNode; tone: "accepted" | "subscribed" | "soft" | "indicative" | "potential" };
const TONE: Record<LadderRow["tone"], { bar: string; style?: React.CSSProperties }> = {
  accepted: { bar: "", style: { background: "var(--color-up)" } },
  subscribed: { bar: "", style: { background: "color-mix(in oklab, var(--color-up) 45%, transparent)" } },
  soft: { bar: "", style: { background: "color-mix(in oklab, var(--d-text) 42%, transparent)" } },
  indicative: { bar: "", style: { background: "color-mix(in oklab, var(--d-text) 24%, transparent)" } },
  potential: { bar: "border border-dashed border-d-text-3", style: { background: "transparent" } },
};

/**
 * Accepted, subscribed, soft, indicated and potential amounts against the target. Each opportunity counts once, at
 * its most advanced amount, so the segments never double count; they are distinct kinds and labelled as such.
 */
export function Ladder({ target, rows, received, height = 10 }: { target: number | null; rows: LadderRow[]; received?: number; height?: number }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const scale = Math.max(target ?? 0, total, 1);
  return (
    <div>
      <div className="relative flex w-full overflow-hidden rounded-[3px] bg-d-line-soft" style={{ height }}>
        {rows.map((r) =>
          r.value > 0 ? (
            <span
              key={r.key}
              title={`${r.label}: ${usd(r.value)}`}
              className={cx("h-full", TONE[r.tone].bar)}
              style={{ width: `${(r.value / scale) * 100}%`, ...TONE[r.tone].style }}
            />
          ) : null,
        )}
        {target ? <span aria-hidden className="absolute inset-y-[-3px] w-px bg-d-text" style={{ left: `${Math.min(100, (target / scale) * 100)}%` }} /> : null}
      </div>
      {received !== undefined && rows[0]?.value ? (
        <div className="relative mt-1 h-[3px] w-full">
          <span className="absolute inset-y-0 left-0 rounded-full bg-d-text-3" style={{ width: `${(received / scale) * 100}%` }} title={`Received: ${usd(received)}`} />
        </div>
      ) : null}
    </div>
  );
}
export function LadderLegend({ rows, extra }: { rows: LadderRow[]; extra?: ReactNode }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] sm:grid-cols-3 xl:grid-cols-5">
      {rows.map((r) => (
        <div key={r.key} className="min-w-0">
          <dt className="flex items-center gap-1.5 text-d-text-3">
            <span className={cx("h-2 w-2 shrink-0 rounded-[2px]", TONE[r.tone].bar)} style={TONE[r.tone].style} />
            {r.label}
          </dt>
          <dd className="tnum mt-0.5 text-[13.5px] text-d-text">
            {usdShort(r.value)} {r.note}
          </dd>
        </div>
      ))}
      {extra}
    </dl>
  );
}
export const ladderRows = (f: { accepted: number; subscribed: number; soft: number; indicative: number; potential: number; potentialIllustrative: number }): LadderRow[] => [
  { key: "a", label: "Accepted commitments", value: f.accepted, tone: "accepted" },
  { key: "s", label: "Subscriptions in progress", value: f.subscribed, tone: "subscribed" },
  { key: "f", label: "Soft commitments", value: f.soft, tone: "soft" },
  { key: "i", label: "Indications of interest", value: f.indicative, tone: "indicative" },
  {
    key: "p",
    label: "Potential",
    value: f.potential,
    tone: "potential",
    note: f.potentialIllustrative ? <Illus short title={`${usd(f.potentialIllustrative)} of it is estimated, not recorded`} /> : null,
  },
];

export const amountRows = (a: Amounts): [string, number | undefined][] => [
  ["Potential", a.potential],
  ["Indicated", a.indicative],
  ["Soft commitment", a.soft],
  ["Subscribed", a.subscribed],
  ["Accepted commitment", a.accepted],
  ["Called", a.called],
  ["Received", a.received],
];

/* ───────── drawer ───────── */

export function Drawer({ title, kicker, onClose, children, width = 440 }: { title: ReactNode; kicker?: ReactNode; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} aria-hidden />
      <aside
        className="drawer-in fixed inset-y-0 right-0 z-40 flex max-w-full flex-col border-l border-d-line bg-d-surface shadow-lift"
        style={{ width }}
        role="dialog"
        aria-label={typeof title === "string" ? title : "Details"}
      >
        <header className="flex items-start gap-3 border-b border-d-line px-5 py-4">
          <div className="min-w-0 flex-1">
            {kicker && <div className="text-[12px] text-d-text-3">{kicker}</div>}
            <h2 className="mt-0.5 text-[17px] font-semibold leading-snug text-d-text">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-[6px] p-1.5 text-d-text-3 hover:bg-d-raise hover:text-d-text">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-[12.5px]">{children}</div>
      </aside>
    </>
  );
}

export function Section({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("mb-5", className)}>
      {(title || aside) && (
        <div className="mb-2 flex items-center gap-2">
          {title && <h3 className="flex-1 text-[12px] font-semibold text-d-text-2">{title}</h3>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="divide-y divide-d-line-soft text-[12.5px]">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex gap-3 py-1.5">
          <dt className="w-[42%] shrink-0 text-d-text-3">{k}</dt>
          <dd className="min-w-0 break-words text-d-text">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A quiet segmented control. */
export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex rounded-[8px] border border-d-line p-0.5 text-[12.5px]" role="group" aria-label={label}>
      {options.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={cx("h-7 rounded-[6px] px-2.5 font-medium", value === k ? "bg-d-raise text-d-text" : "text-d-text-3 hover:text-d-text")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export const STAGE_OPTIONS = STAGES;

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-[10px] border border-dashed border-d-line px-4 py-8 text-center text-[12.5px] text-d-text-3">{children}</div>;
}
