"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, LayoutGrid, List } from "lucide-react";
import { cx } from "@/components/ui";

export type ManagerGroup = {
  id: string;
  name: string;
  /** the manager's mark */
  mark?: ReactNode;
  /** one line of what the group holds, e.g. "3 vehicles · $120M committed" */
  meta?: string;
  count: number;
  /** the manager's page */
  href?: string;
  /** the content, in one or two views */
  content: ReactNode;
  table?: ReactNode;
  /** a fuller view when this manager alone is chosen */
  focus?: ReactNode;
};

/**
 * Lists organised by manager (GP): a filter row with every manager and a count, and the content grouped under each
 * manager's heading. The choice is kept in the address (?gp=) so a link opens on the same manager.
 */
export function ByManager({
  groups,
  noun,
  allLabel = "All managers",
  panels,
}: {
  groups: ManagerGroup[];
  noun: [string, string];
  allLabel?: string;
  /** show all managers as panels, two to a row */
  panels?: boolean;
}) {
  const [gp, setGp] = useState("all");
  const [view, setView] = useState<"cards" | "table">("cards");
  const hasTable = groups.some((g) => g.table);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const g = sp.get("gp");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- apply the linked manager after hydration
    if (g && groups.some((x) => x.id === g)) setGp(g);
    if (sp.get("view") === "table") setView("table");
  }, [groups]);
  const choose = (id: string) => {
    setGp(id);
    const sp = new URLSearchParams(window.location.search);
    if (id === "all") sp.delete("gp");
    else sp.set("gp", id);
    window.history.replaceState(null, "", `${window.location.pathname}${sp.toString() ? `?${sp}` : ""}`);
  };
  const total = groups.reduce((a, g) => a + g.count, 0);
  // with everyone shown, managers with nothing here are left out (still in the filter row, dimmed)
  const shown = groups.filter((g) => (gp === "all" ? g.count > 0 : g.id === gp));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Manager">
          <Chip on={gp === "all"} onClick={() => choose("all")} label={allLabel} n={total} />
          {groups.map((g) => (
            <Chip key={g.id} on={gp === g.id} onClick={() => choose(g.id)} label={g.name} n={g.count} muted={!g.count} />
          ))}
        </div>
        {hasTable && (
          <div className="ml-auto flex rounded-[7px] bg-d-surface p-0.5 ring-1 ring-d-line" role="group" aria-label="View">
            {(
              [
                ["cards", LayoutGrid, "Cards"],
                ["table", List, "Table"],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cx(
                  "inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[12px] font-semibold",
                  view === v ? "bg-d-raise text-d-text" : "text-d-text-3 hover:text-d-text",
                )}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={cx(panels && gp === "all" && view === "cards" ? "grid items-start gap-4 xl:grid-cols-2" : "space-y-6")}>
        {shown.map((g) => {
          const asPanel = panels && gp === "all" && view === "cards";
          return (
            <section key={g.id} aria-labelledby={`mgr-${g.id}`} className={cx(asPanel && "overflow-hidden rounded-[12px] border border-d-line bg-d-surface")}>
              <header className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 border-b", asPanel ? "border-d-line-soft px-4 py-3" : "mb-3 border-d-line pb-2.5")}>
                {g.mark && <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-d-line bg-white">{g.mark}</span>}
                <h2 id={`mgr-${g.id}`} className="text-[16px] font-semibold text-d-text">
                  {g.name}
                </h2>
                {g.meta && <span className="text-[12.5px] text-d-text-3">{g.meta}</span>}
                {g.href && (
                  <Link href={g.href} className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-d-text-2 hover:text-d-text">
                    Manager profile <ArrowRight size={13} />
                  </Link>
                )}
              </header>
              {g.count === 0 ? (
                <p className="rounded-[10px] border border-dashed border-d-line px-4 py-6 text-center text-[12.5px] text-d-text-3">No {noun[1]} yet.</p>
              ) : view === "table" && g.table ? (
                g.table
              ) : gp !== "all" && g.focus ? (
                g.focus
              ) : (
                g.content
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ on, onClick, label, n, muted }: { on: boolean; onClick: () => void; label: string; n: number; muted?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[12.5px] font-semibold transition-colors",
        on
          ? "bg-d-raise text-d-text ring-1 ring-d-line-strong"
          : muted
            ? "text-d-text-3 hover:text-d-text-2"
            : "text-d-text-2 hover:bg-[color-mix(in_oklab,var(--d-raise)_55%,transparent)] hover:text-d-text",
      )}
    >
      {label}
      <span className={cx("num text-[11px] font-medium", on ? "text-d-text-2" : "text-d-text-3")}>{n}</span>
    </button>
  );
}
