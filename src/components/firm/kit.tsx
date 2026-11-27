"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

/** Tab state mirrored into ?tab= without a navigation, so unsaved work survives. */
export function useTab<T extends string>(initial: T) {
  const path = usePathname();
  const [tab, set] = useState<T>(initial);
  const setTab = (t: T) => {
    set(t);
    window.history.replaceState(null, "", `${path}?tab=${t}`);
  };
  return [tab, setTab] as const;
}

/**
 * Page title for a solution or workspace. The coloured hexagons live in the Hexa Room sidebar only; titles carry no mark.
 * `color` is kept so callers can still pass the module colour, which the tabs and buttons below the title use.
 */
export function ModuleHeader({ title, action }: { color?: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink-900">{title}</h1>
      {action}
    </div>
  );
}

export function ModuleTabs<T extends string>({ tabs, tab, setTab, color }: { tabs: { id: T; label: string; count?: number }[]; tab: T; setTab: (t: T) => void; color: string }) {
  return (
    <div className="mt-5 flex gap-6 border-b border-stone-200">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={cx("-mb-px border-b-2 pb-2.5 text-[13px] font-semibold", tab === t.id ? "text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900")}
          style={tab === t.id ? { borderColor: color } : undefined}
        >
          {t.label}
          {t.count ? <span className="ml-1 text-stone-400">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function ActionButton({
  color,
  children,
  onClick,
  disabled,
  type,
}: {
  color: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-4 text-[13px] font-semibold text-white shadow-card hover:opacity-95 disabled:opacity-40"
      style={{ background: color }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-stone-300 bg-white px-3.5 text-[13px] font-semibold text-ink-900 hover:border-ink-900"
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-[12px] border border-stone-200/80 bg-white", className)}>{children}</div>;
}

export function Kpi({ label, value, note, tone }: { label: string; value: ReactNode; note?: string; tone?: "warn" }) {
  return (
    <Card className="px-5 py-4">
      <div className="text-[12px] text-stone-500">{label}</div>
      <div className={cx("fig mt-1 text-[28px] leading-tight", tone === "warn" ? "text-[#9A4422]" : "text-ink-900")}>{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-stone-500">{note}</div>}
    </Card>
  );
}

const pillTones = {
  neutral: "bg-stone-100 text-stone-600",
  good: "bg-[color-mix(in_oklab,var(--d-pos,#245F3C)_14%,transparent)] text-[var(--d-pos,#245F3C)]",
  warn: "bg-[color-mix(in_oklab,var(--d-warn,#8A5A1E)_14%,transparent)] text-[var(--d-warn,#8A5A1E)]",
  bad: "bg-[color-mix(in_oklab,var(--d-neg,#9A4422)_14%,transparent)] text-[var(--d-neg,#9A4422)]",
  info: "bg-[color-mix(in_oklab,var(--d-info,#334155)_14%,transparent)] text-[var(--d-info,#334155)]",
  gold: "bg-gold-50 text-gold-700",
};
export function Pill({ tone = "neutral", children }: { tone?: keyof typeof pillTones; children: ReactNode }) {
  return <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", pillTones[tone])}>{children}</span>;
}

/** Table header cell / cell styles shared by module tables. */
export const th = "px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500 first:pl-5 last:pr-5";
export const td = "px-3 py-3 first:pl-5 last:pr-5";

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[12px] bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lift">{text}</div>;
}

export function useToast() {
  const [text, setText] = useState<string | null>(null);
  const flash = (m: string) => {
    setText(m);
    setTimeout(() => setText(null), 2600);
  };
  return [text, flash] as const;
}

export const field = "h-9 w-full rounded-[9px] border border-stone-300 bg-white px-3 text-[13px] text-ink-900 focus:border-ink-900 focus:outline-none";
export const fieldLabel = "mb-1 block text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500";

export const fmtDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
export const fmtShort = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
export const TODAY = "2026-11-24";
export const daysUntil = (iso: string) => Math.round((Date.parse(`${iso.slice(0, 10)}T12:00:00Z`) - Date.parse(`${TODAY}T12:00:00Z`)) / 86_400_000);

export function Initials({ name, size = 26 }: { name: string; size?: number }) {
  const i = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[8px] bg-gold-100 font-semibold text-gold-700"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={name}
    >
      {i}
    </span>
  );
}
