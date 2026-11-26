import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { cx } from "@/components/ui";
import { pill } from "@/components/workspace/status";

/** Shared pieces of the manager portal, in the workstation's register. */

export function PageHead({ eyebrow, title, meta, action }: { eyebrow?: ReactNode; title: ReactNode; meta?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-2 pb-4 pt-3">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[12.5px] text-d-text-3">{eyebrow}</div>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-d-text">{title}</h1>
        {meta && <div className="mt-1.5 text-[13px] text-d-text-2">{meta}</div>}
      </div>
      {action}
    </header>
  );
}

const DONE = new Set(["Paid", "Funded", "Countersigned", "Approved", "Published"]);
const WAITING = new Set(["Due", "Part paid", "Issued", "Partially funded", "Scheduled", "Submitted", "In review", "Waiting for you", "Your approval", "With the manager"]);
const PROBLEM = new Set(["Overdue", "Changes requested"]);

/** Status with an icon as well as a colour, so it reads without colour. */
export function StatusPill({ value }: { value: string }) {
  const Icon = DONE.has(value) ? CheckCircle2 : WAITING.has(value) ? Clock3 : PROBLEM.has(value) ? AlertCircle : null;
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] border px-2 py-0.5 text-[11.5px]", pill[value] ?? "border-stone-200 text-stone-500")}>
      {Icon && <Icon size={12} strokeWidth={2} aria-hidden />}
      {value}
    </span>
  );
}

export function Meter({ value }: { value: number }) {
  const full = value >= 0.999;
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full bg-stone-100">
      <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: full ? "var(--color-up)" : "var(--d-accent)" }} />
    </span>
  );
}

/** A strip of headline figures, separated by hairlines. */
export function Figures({ items }: { items: { label: string; value: string; note?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-[12px] border border-stone-200 bg-white sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it, i) => (
        <div key={it.label} className={cx("px-5 py-4", i > 0 && "border-stone-100 max-sm:odd:border-l-0 sm:border-l")}>
          <dt className="text-[12.5px] text-stone-500">{it.label}</dt>
          <dd className="fig mt-1.5 text-[26px] leading-none text-ink-900">{it.value}</dd>
          {it.note && <div className="mt-1.5 text-[11.5px] text-stone-500">{it.note}</div>}
        </div>
      ))}
    </dl>
  );
}

export const th = "px-3 py-2.5 text-left text-[11.5px] font-semibold text-stone-500 first:pl-4 last:pr-4";
export const td = "px-3 py-[10px] first:pl-4 last:pr-4";
export const tr = "border-b border-stone-100 last:border-0 hover:bg-stone-100/60";
