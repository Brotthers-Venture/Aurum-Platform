"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, Download, Maximize2, Table2, X } from "lucide-react";
import { cx } from "@/components/ui";

export type Csv = { headers: string[]; rows: (string | number)[][] };

function downloadCsv(name: string, csv: Csv) {
  const esc = (v: string | number) => (typeof v === "number" ? String(Math.round(v * 100) / 100) : /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const body = [csv.headers, ...csv.rows].map((r) => r.map(esc).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const tool = "inline-flex h-7 w-7 items-center justify-center rounded-[3px] text-stone-400 hover:bg-stone-100 hover:text-ink-900";

/** Analytics panel: title bar with chart/table toggle, CSV export and full-screen. */
export function Widget({
  title,
  unit,
  legend,
  csv,
  table,
  children,
  className,
  bare,
}: {
  title: string;
  unit?: string;
  legend?: ReactNode;
  csv?: Csv;
  table?: ReactNode;
  children: ReactNode;
  className?: string;
  /** print / report mode: no toolbar */
  bare?: boolean;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const body = (
    <>
      <header className="flex items-center gap-3 border-b border-stone-200 px-4 py-2.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-900">{title}</h3>
        {unit && <span className="text-[11px] text-stone-400">{unit}</span>}
        {!bare && (
          <div className="ml-auto flex items-center gap-0.5 print:hidden">
            {table && (
              <div className="mr-1 flex rounded-[3px] bg-stone-100 p-0.5">
                {(["chart", "table"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={v === "chart" ? "Chart view" : "Table view"}
                    title={v === "chart" ? "Chart" : "Table"}
                    onClick={() => setView(v)}
                    className={cx("inline-flex h-6 w-7 items-center justify-center rounded-[2px]", view === v ? "bg-white text-ink-900 shadow-sm" : "text-stone-400 hover:text-ink-900")}
                  >
                    {v === "chart" ? <BarChart3 size={13} /> : <Table2 size={13} />}
                  </button>
                ))}
              </div>
            )}
            {csv && (
              <button type="button" aria-label={`Export ${title}`} title="Export CSV" className={tool} onClick={() => downloadCsv(title, csv)}>
                <Download size={14} />
              </button>
            )}
            <button type="button" aria-label={full ? "Close" : `Expand ${title}`} title={full ? "Close" : "Expand"} className={tool} onClick={() => setFull((f) => !f)}>
              {full ? <X size={15} /> : <Maximize2 size={13} />}
            </button>
          </div>
        )}
      </header>
      <div className={cx("p-4", full && "flex-1 overflow-auto")}>
        {view === "chart" || !table ? (
          <>
            {legend && <div className="mb-3">{legend}</div>}
            {children}
          </>
        ) : (
          table
        )}
      </div>
    </>
  );

  return (
    <>
      <section className={cx("flex h-full min-w-0 flex-col rounded-[8px] border border-stone-200/70 bg-white shadow-card break-inside-avoid", className)}>{body}</section>
      {full && (
        <div className="fixed inset-0 z-50 flex bg-ink-950/40 p-8 backdrop-blur-[2px]" onClick={() => setFull(false)}>
          <section className="flex w-full flex-col rounded-[4px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {body}
          </section>
        </div>
      )}
    </>
  );
}

/** Compact financial table used as the "table view" of a widget. */
export function MiniTable({ headers, rows, align }: { headers: string[]; rows: ReactNode[][]; align?: ("l" | "r")[] }) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-stone-200 text-[10.5px] uppercase tracking-[0.08em] text-stone-500">
            {headers.map((h, i) => (
              <th key={h} className={cx("whitespace-nowrap px-2 py-1.5 font-semibold", (align?.[i] ?? (i ? "r" : "l")) === "r" ? "text-right" : "text-left")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-stone-100 last:border-0">
              {r.map((c, k) => (
                <td key={k} className={cx("whitespace-nowrap px-2 py-1.5", (align?.[k] ?? (k ? "r" : "l")) === "r" ? "num text-right" : "text-ink-900")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
