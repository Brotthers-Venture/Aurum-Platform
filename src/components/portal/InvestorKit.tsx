import type { ReactNode } from "react";

/** Page frame of the investor portal: the same width and rhythm as the manager portal. */
export function Frame({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1640px] px-3 pb-10 pt-3 sm:px-6 sm:pt-4 2xl:px-8">{children}</div>;
}

/** Page heading in the workstation register. */
export function InvHead({ eyebrow, title, meta, action }: { eyebrow?: ReactNode; title: ReactNode; meta?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-1 pb-4 pt-2">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[12.5px] text-d-text-3">{eyebrow}</div>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-d-text">{title}</h1>
        {meta && <div className="mt-1.5 max-w-[720px] text-[13px] leading-relaxed text-d-text-2">{meta}</div>}
      </div>
      {action}
    </header>
  );
}

/** A strip of headline figures, separated by hairlines. */
export function FigureStrip({ items }: { items: { label: string; value: ReactNode; note?: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-[12px] border border-stone-200 bg-white sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it, i) => (
        <div key={it.label} className={i > 0 ? "border-stone-100 px-5 py-4 max-sm:odd:border-l-0 sm:border-l max-lg:[&:nth-child(4)]:border-l-0" : "px-5 py-4"}>
          <dt className="text-[12px] text-stone-500">{it.label}</dt>
          <dd className="fig mt-1.5 text-[22px] leading-none text-ink-900">{it.value}</dd>
          {it.note && <div className="mt-1.5 text-[11.5px] text-stone-500">{it.note}</div>}
        </div>
      ))}
    </dl>
  );
}
