"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cx } from "@/components/ui";
import { td, th, tr } from "./GpKit";

export type InvestorRow = { id: string; name: string; type: string; jurisdiction: string; funds: string; commitment: string; nav: string; commitmentRaw: number };

/** The limited partners, filterable; the header search opens it with ?q=. */
export function InvestorTable({ rows }: { rows: InvestorRow[] }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k ? rows.filter((r) => `${r.name} ${r.type} ${r.jurisdiction} ${r.funds}`.toLowerCase().includes(k)) : rows;
  }, [q, rows]);
  return (
    <>
      <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-2.5">
        <label className="flex h-8 w-full max-w-[320px] items-center gap-2 rounded-[8px] border border-stone-200 px-2.5 text-stone-500 focus-within:border-stone-300">
          <Search size={14} className="shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name, type, jurisdiction or fund"
            aria-label="Filter investors"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 placeholder:text-stone-400 focus:outline-none"
          />
        </label>
        <span className="ml-auto text-[12px] text-stone-500">
          {shown.length} of {rows.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className={th}>Investor</th>
              <th className={th}>Type</th>
              <th className={th}>Jurisdiction</th>
              <th className={th}>Funds</th>
              <th className={cx(th, "text-right")}>Commitments</th>
              <th className={cx(th, "text-right")}>NAV</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className={tr}>
                <td className={cx(td, "font-semibold text-ink-900")}>{r.name}</td>
                <td className={cx(td, "text-stone-600")}>{r.type}</td>
                <td className={cx(td, "text-stone-600")}>{r.jurisdiction}</td>
                <td className={cx(td, "max-w-[280px] truncate text-stone-600")}>{r.funds}</td>
                <td className={cx(td, "num text-right text-ink-900")}>{r.commitment}</td>
                <td className={cx(td, "num text-right text-ink-900")}>{r.nav}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-stone-500">
                  No investor matches “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
