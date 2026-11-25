"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "@/components/ui";
import { Ctx, WEALTH_PAGES, type WealthMode, type WealthPageId } from "./ui";
import { Overview } from "./Overview";
import { Explorer } from "./Explorer";
import { Structure } from "./Structure";
import { Liquidity } from "./Liquidity";
import { Reports } from "./Reports";
import { Access, Documents, Todos } from "./Workbench";
import { AssetDrawer } from "./AssetDrawer";
import { REPORTING, totals, type Ccy, type Family } from "@/lib/wealth";

const CCY_KEY = "aurum-wealth-ccy";

/**
 * A family's whole wealth — overview, explorer, structure, liquidity, reports, documents, to-dos and access.
 * The same component serves the family (client portal, in the serving firm's brand) and the office (console).
 */
export function WealthPlatform({
  family,
  mode,
  actor,
  actorId,
  page,
  onPage,
  showNav = true,
}: {
  family: Family;
  mode: WealthMode;
  actor: string;
  actorId?: string;
  page?: WealthPageId;
  onPage?: (p: WealthPageId) => void;
  showNav?: boolean;
}) {
  const [own, setOwn] = useState<WealthPageId>("overview");
  const current = page ?? own;
  const go = (p: WealthPageId) => (onPage ? onPage(p) : setOwn(p));
  const [ccy, setCcyState] = useState<Ccy>("USD");
  const [asset, setAsset] = useState<string | null>(null);
  useEffect(() => {
    try {
      const c = window.localStorage.getItem(CCY_KEY) as Ccy | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the reader's reporting currency after hydration
      if (c && REPORTING.includes(c)) setCcyState(c);
    } catch {}
  }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAsset(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  const setCcy = (c: Ccy) => {
    setCcyState(c);
    try {
      window.localStorage.setItem(CCY_KEY, c);
    } catch {}
  };
  const t = useMemo(() => totals(family), [family]);
  const ctx = { f: family, t, ccy, setCcy, open: setAsset, mode, actor, actorId, go };

  return (
    <Ctx.Provider value={ctx}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-d-line print:hidden">
          {showNav && (
            <nav className="-mb-px flex gap-5 overflow-x-auto">
              {WEALTH_PAGES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(p.id)}
                  className={cx(
                    "whitespace-nowrap border-b-2 pb-2.5 text-[13px] font-semibold",
                    current === p.id ? "text-d-text" : "border-transparent text-d-text-3 hover:text-d-text",
                  )}
                  style={current === p.id ? { borderColor: "var(--tenant-accent)" } : undefined}
                >
                  {p.label}
                </button>
              ))}
            </nav>
          )}
          <label className="mb-2 ml-auto flex items-center gap-2 text-[12px] text-d-text-3">
            Reporting currency
            <select
              value={ccy}
              onChange={(e) => setCcy(e.target.value as Ccy)}
              className="h-7 rounded-[6px] border border-d-line bg-d-surface px-1.5 text-[12px] font-semibold text-d-text"
            >
              {REPORTING.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        {current === "overview" ? (
          <Overview />
        ) : current === "explorer" ? (
          <Explorer />
        ) : current === "structure" ? (
          <Structure />
        ) : current === "liquidity" ? (
          <Liquidity />
        ) : current === "reports" ? (
          <Reports />
        ) : current === "documents" ? (
          <Documents />
        ) : current === "todos" ? (
          <Todos />
        ) : (
          <Access />
        )}
        <p className="border-t border-d-line-soft pt-3 text-[11px] text-d-text-3">
          Demo data · reporting date 24 Nov 2026 · converted at indicative rates (EUR 1.08, CHF 1.13, GBP 1.27 US dollars; 5.40 reais per dollar) · history charts are sample
          series.
        </p>
      </div>
      {asset && (
        <>
          <button aria-label="Close" onClick={() => setAsset(null)} className="fixed inset-0 z-30 bg-black/20" />
          <AssetDrawer id={asset} />
        </>
      )}
    </Ctx.Provider>
  );
}
