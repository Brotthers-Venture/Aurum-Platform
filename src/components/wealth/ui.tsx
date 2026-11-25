"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cx } from "@/components/ui";
import type { AssetClass, Ccy, Family, Totals } from "@/lib/wealth";

export type WealthMode = "client" | "staff";
export type WealthCtx = {
  f: Family;
  t: Totals;
  ccy: Ccy;
  setCcy: (c: Ccy) => void;
  open: (assetId: string | null) => void;
  mode: WealthMode;
  actor: string;
  go: (page: WealthPageId) => void;
};
export const Ctx = createContext<WealthCtx | null>(null);
export const useWealth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWealth outside WealthPlatform");
  return c;
};

export type WealthPageId = "overview" | "explorer" | "structure" | "liquidity" | "reports" | "documents" | "todos" | "access";
export const WEALTH_PAGES: { id: WealthPageId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "explorer", label: "Explorer" },
  { id: "structure", label: "Structure" },
  { id: "liquidity", label: "Liquidity" },
  { id: "reports", label: "Reports" },
  { id: "documents", label: "Documents" },
  { id: "todos", label: "To-dos" },
  { id: "access", label: "Access" },
];

/** Category colours, fixed per asset class so a class keeps its colour in every view. Mid-tones read on light and dark. */
export const CLASS_COLOR: Record<AssetClass, string> = {
  "Public equities": "#5F86AE",
  "Fixed income": "#4E9A8E",
  "Real estate": "#C29A3A",
  Cash: "#9AA5B1",
  "Private equity": "#9A7A93",
  "Private credit": "#B07A6E",
  "Hedge funds": "#7F9A73",
  "Direct business": "#8E7FB8",
  "Digital assets": "#5FA8C2",
  Collectibles: "#B9A27E",
};
export const PALETTE = ["#5F86AE", "#C29A3A", "#4E9A8E", "#9A7A93", "#B07A6E", "#7F9A73", "#8E7FB8", "#9AA5B1", "#5FA8C2", "#B9A27E"];

export function Panel({
  title,
  note,
  action,
  children,
  className,
  pad = true,
}: {
  title?: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={cx("overflow-hidden rounded-[10px] border border-d-line bg-d-surface", className)}>
      {title && (
        <header className="flex min-h-[44px] items-center gap-2 border-b border-d-line-soft px-4 py-2.5">
          <h2 className="text-[13.5px] font-semibold text-d-text">{title}</h2>
          {note && <span className="text-[12px] text-d-text-3">{note}</span>}
          {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={pad ? "p-4" : undefined}>{children}</div>
    </section>
  );
}

export function Seg<T extends string>({ value, options, onChange, size = "md" }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-[7px] border border-d-line">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            "whitespace-nowrap border-r border-d-line last:border-r-0",
            size === "sm" ? "px-2 py-1 text-[11.5px]" : "px-2.5 py-1.5 text-[12px]",
            value === o.id ? "bg-d-raise font-semibold text-d-text" : "text-d-text-2 hover:text-d-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "pos" | "neg" }) {
  return (
    <div className="bg-d-surface px-4 py-3.5">
      <div className="text-[11.5px] text-d-text-3">{label}</div>
      <div
        className={cx(
          "mt-1 whitespace-nowrap font-display text-[24px] font-light tracking-[-0.02em] tabular-nums",
          tone === "pos" ? "text-d-pos" : tone === "neg" ? "text-d-neg" : "text-d-text",
        )}
      >
        {value}
      </div>
      {note && <div className="mt-0.5 text-[11px] text-d-text-3">{note}</div>}
    </div>
  );
}
export function StatRow({ children }: { children: ReactNode; cols?: number }) {
  return <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-d-line bg-d-line lg:grid-cols-4">{children}</div>;
}

export function SampleTag({ children = "Sample series" }: { children?: ReactNode }) {
  return <span className="rounded-[3px] border border-dashed border-d-line-strong px-1.5 py-px text-[10.5px] text-d-text-3">{children}</span>;
}
export function Fresh({ tone, label }: { tone: "good" | "muted" | "warn"; label: string }) {
  const c = tone === "good" ? "var(--d-pos)" : tone === "warn" ? "var(--d-warn)" : "var(--d-text-3)";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11.5px]" style={{ color: c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {label}
    </span>
  );
}
export function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-d-raise">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}
export function Stacked({ parts }: { parts: { key: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  return (
    <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
      {parts.map((p) => (
        <span key={p.key} title={p.key} style={{ width: `${(Math.max(0, p.value) / total) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
}

/** Line/area chart with three y ticks; `fmt` formats ticks. Hover shows the value at the nearest point. */
export function AreaChart({
  values,
  labels,
  fmt,
  height = 220,
  color = "var(--tenant-accent)",
  id = "a",
}: {
  values: number[];
  labels: string[];
  fmt: (v: number) => string;
  height?: number;
  color?: string;
  id?: string;
}) {
  const W = 1000;
  const H = height;
  const min = Math.min(...values) * 0.995;
  const max = Math.max(...values) * 1.005;
  const X = (i: number) => 56 + (i / (values.length - 1)) * (W - 70);
  const Y = (v: number) => 10 + (1 - (v - min) / (max - min || 1)) * (H - 36);
  const d = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Chart">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.2" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => {
        const v = min + (max - min) * f;
        return (
          <g key={f}>
            <line x1={56} x2={W - 12} y1={Y(v)} y2={Y(v)} stroke="var(--d-line-soft)" />
            <text x={48} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--d-text-3)" className="tabular-nums">
              {fmt(v)}
            </text>
          </g>
        );
      })}
      <path d={`${d}L${X(values.length - 1)},${H - 26}L${X(0)},${H - 26}Z`} fill={`url(#g-${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={X(values.length - 1)} cy={Y(values[values.length - 1])} r={4} fill={color} />
      {labels.map((l, i) => (
        <text key={l + i} x={X((i / Math.max(1, labels.length - 1)) * (values.length - 1))} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--d-text-3)">
          {l}
        </text>
      ))}
    </svg>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-[13px] text-d-text-3">{children}</div>;
}

export const btn =
  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[7px] border border-d-line-strong bg-d-surface px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise disabled:opacity-40";
export const btnPrimary = "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[12.5px] font-semibold disabled:opacity-40";
export const input = "h-8 rounded-[7px] border border-d-line bg-d-surface px-2.5 text-[12.5px] text-d-text placeholder:text-d-text-3 focus:border-d-line-strong focus:outline-none";
