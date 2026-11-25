import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "brand" | "aurum";

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] text-[13px] font-semibold tracking-[0.01em] transition-colors disabled:opacity-50 disabled:pointer-events-none";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-700",
  secondary: "border border-stone-300 bg-white text-ink-900 hover:border-ink-900",
  ghost: "text-ink-900 hover:bg-stone-100",
  gold: "bg-gold-400 text-ink-900 hover:bg-gold-500",
  brand: "bg-brand text-brand-ink hover:opacity-90",
  /** Aurum logo gold, navy text — reserved for Aurum's own sign-in */
  aurum: "bg-[var(--tenant-accent)] text-[var(--tenant-accent-ink)] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)] hover:brightness-[0.95]",
};
const buttonSizes = { sm: "h-8 px-3", md: "h-9 px-4", lg: "h-11 px-5 text-[14px]" };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return <button className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return <Link className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...props} />;
}

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  /** @deprecated descriptions are no longer shown — keep pages lean */
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink-900">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
  flush,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cx("rounded-[8px] border border-stone-200/70 bg-white shadow-card", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold tracking-[0.01em] text-ink-900">{title}</h2>
          {actions && <div className="flex items-center gap-3 text-[12px]">{actions}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("px-5 py-4", className)}>
      <div className="eyebrow">{label}</div>
      <div className="num mt-2 text-[24px] font-medium leading-none tracking-[-0.02em] text-ink-900">{value}</div>
      {sub && <div className="num mt-2 text-[12px] text-stone-500">{sub}</div>}
    </div>
  );
}

export function StatRow({ children, cols = 6 }: { children: ReactNode; cols?: 4 | 6 }) {
  return (
    <div
      className={cx(
        "grid grid-cols-2 divide-stone-200 rounded-[8px] border border-stone-200/70 bg-white shadow-card md:divide-x [&>*]:border-stone-200 max-md:[&>*:nth-child(n+3)]:border-t",
        cols === 6 ? "md:grid-cols-3 xl:grid-cols-6 md:max-xl:[&>*:nth-child(n+4)]:border-t" : "md:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

type Tone = "positive" | "caution" | "negative" | "info" | "neutral" | "ink";

const statusTone: Record<string, Tone> = {
  Funded: "positive",
  Paid: "positive",
  Clear: "positive",
  Approved: "positive",
  Countersigned: "ink",
  Investing: "positive",
  "Partially funded": "caution",
  Issued: "info",
  Scheduled: "info",
  Submitted: "info",
  Fundraising: "info",
  "In progress": "neutral",
  Invited: "neutral",
  Draft: "neutral",
  Pending: "neutral",
  "Not started": "neutral",
  Harvesting: "neutral",
  "Fully called": "neutral",
  "Changes requested": "caution",
  "Under review": "caution",
  Expiring: "caution",
  "Potential match": "negative",
  Rejected: "negative",
  Escalated: "negative",
  Cleared: "positive",
  "Needs review": "caution",
  "Awaiting second approver": "caution",
  "Manual statements": "neutral",
  Overdue: "negative",
  Sourced: "positive",
  "Not found in LPA": "neutral",
  "Conflicting clauses": "caution",
  Superseded: "neutral",
  Outstanding: "caution",
  Completed: "positive",
  Requested: "neutral",
  "GP consent": "info",
  Documentation: "info",
  Posted: "positive",
  "Pending review": "caution",
  "Not connected": "neutral",
};

/**
 * Status as a quiet dot + label, in the brand palette only:
 * filled ink = done, gold = needs attention, ink ring = open, stone ring = not started, red = problem.
 */
const statusDot: Record<string, string> = {
  positive: "bg-ink-900",
  ink: "bg-ink-900",
  caution: "bg-gold-500",
  info: "border-[1.5px] border-ink-900 bg-transparent",
  neutral: "border-[1.5px] border-stone-400 bg-transparent",
  negative: "bg-negative",
};

export function Status({ value, className }: { value: string; className?: string }) {
  const k = statusTone[value] ?? "neutral";
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium leading-none", k === "negative" ? "text-negative" : k === "neutral" ? "text-stone-500" : "text-ink-800", className)}>
      <span className={cx("h-[7px] w-[7px] shrink-0 rounded-full", statusDot[k])} />
      {value}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-1 w-full overflow-hidden rounded-full bg-stone-100", className)}>
      <div className="h-full bg-brand" style={{ width: `${Number.isFinite(value) ? Math.round(Math.min(1, Math.max(0, value)) * 100) : 0}%` }} />
    </div>
  );
}

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-6 border-b border-stone-100 py-2.5 text-[13px]">
          <dt className="text-stone-500">{k}</dt>
          <dd className="text-right font-medium text-ink-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Avatar({ label, size = 28 }: { label: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold tracking-[0.04em] text-ink-700"
      style={{ width: size, height: size }}
    >
      {label}
    </span>
  );
}
