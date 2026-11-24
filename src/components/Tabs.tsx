"use client";

import { useState, type ReactNode } from "react";
import { cx } from "./ui";

export function Tabs({ tabs }: { tabs: { id: string; label: string; count?: number; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  return (
    <div>
      <div role="tablist" className="flex gap-6 border-b border-stone-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cx(
              "-mb-px border-b-2 pb-3 pt-1 text-[13px] transition-colors",
              active === t.id ? "border-ink-900 font-semibold text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900",
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="num ml-1.5 text-stone-400">{t.count}</span>}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
