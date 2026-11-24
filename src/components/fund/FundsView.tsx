"use client";

import { useState, type ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { cx } from "@/components/ui";

/** Cards (offering view, like an investor would see it) or the administration table. */
export function FundsView({ cards, table }: { cards: ReactNode; table: ReactNode }) {
  const [view, setView] = useState<"cards" | "table">("cards");
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex rounded-[6px] border border-stone-200 bg-white p-0.5 shadow-card" role="group" aria-label="View">
          {(
            [
              ["cards", LayoutGrid, "Cards"],
              ["table", List, "Table"],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cx("inline-flex h-7 items-center gap-1.5 rounded-[4px] px-2.5 text-[12px] font-semibold", view === v ? "bg-champagne text-ink-900 shadow-[inset_0_0_0_1px_rgba(184,151,90,0.45)]" : "text-stone-500 hover:text-ink-900")}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>
      {view === "cards" ? cards : table}
    </div>
  );
}
