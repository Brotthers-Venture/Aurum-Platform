"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Avatar, Status, cx } from "@/components/ui";
import { date, initials, money, moneyShort, pct } from "@/lib/format";
import type { Currency } from "@/lib/data";

/** Register columns: chevron · vehicle · investors · commitments · called · NAV (shared by header and rows). */
const GRID = "grid grid-cols-[20px_minmax(0,1fr)_84px_132px_132px_132px] gap-x-4 max-md:grid-cols-[20px_minmax(0,1fr)_110px]";

export type VehicleRow = {
  investorId: string;
  name: string;
  contact: string;
  type: string;
  kyc: string;
  closeDate: string;
  commitment: number;
  called: number;
  unfunded: number;
  distributed: number;
  nav: number;
};
export type Vehicle = { id: string; name: string; shortName: string; currency: Currency; gp: string; status: string; rows: VehicleRow[] };
export type MasterRow = {
  id: string;
  name: string;
  contact: string;
  type: string;
  jurisdiction: string;
  taxForm: string;
  kyc: string;
  rm: string;
  vehicles: string[];
  commitmentUsd: number;
  navUsd: number;
};

/**
 * Investors the way fund administrators work: a register per vehicle (who is in this fund, their
 * commitment, share of the fund and capital account), with the investor master list as a second view.
 */
export function InvestorsView({ vehicles, master, fxNote }: { vehicles: Vehicle[]; master: MasterRow[]; fxNote: string }) {
  const [view, setView] = useState<"vehicle" | "investor">("vehicle");
  const [fund, setFund] = useState<string>("all");
  const [mgr, setMgr] = useState<string>("all");
  const managers = [...new Set(vehicles.map((v) => v.gp))].sort((a, b) => a.localeCompare(b));
  const inMgr = vehicles.filter((v) => mgr === "all" || v.gp === mgr);
  const [q, setQ] = useState("");
  // Deep link from search: ?q=<name>&view=investor
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("view");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- apply the linked search after hydration
    if (sp.get("q")) setQ(sp.get("q")!);
    if (v === "investor" || v === "vehicle") setView(v);
  }, []);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const shown = inMgr.filter((v) => fund === "all" || v.id === fund);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-[6px] bg-d-surface p-0.5 ring-1 ring-d-line">
          {(
            [
              ["vehicle", "By vehicle"],
              ["investor", "By investor"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cx("h-8 rounded-[4px] px-3.5 text-[12.5px] font-semibold", view === v ? "bg-d-raise text-d-text" : "text-d-text-3 hover:text-d-text")}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-d-text-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search investors"
            className="h-9 w-[240px] rounded-[6px] bg-d-surface pl-8 pr-3 text-[13px] text-d-text ring-1 ring-d-line placeholder:text-d-text-3 focus:outline-none focus:ring-d-line-strong"
          />
        </div>
        <span className="ml-auto text-[12px] text-d-text-3">{fxNote}</span>
      </div>

      {view === "vehicle" && (
        <>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Manager">
              <Chip
                on={mgr === "all"}
                onClick={() => {
                  setMgr("all");
                  setFund("all");
                }}
                label="All managers"
                n={vehicles.reduce((a, v) => a + v.rows.length, 0)}
              />
              {managers.map((m) => (
                <Chip
                  key={m}
                  on={mgr === m}
                  onClick={() => {
                    setMgr(m);
                    setFund("all");
                  }}
                  label={m}
                  n={vehicles.filter((v) => v.gp === m).reduce((a, v) => a + v.rows.length, 0)}
                />
              ))}
            </div>
            {mgr !== "all" && inMgr.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 border-l-2 border-d-line pl-3" role="group" aria-label="Vehicle">
                <span className="mr-1 text-[12px] text-d-text-3">{mgr}’s vehicles</span>
                <Chip on={fund === "all"} onClick={() => setFund("all")} label="All" n={inMgr.reduce((a, v) => a + v.rows.length, 0)} small />
                {inMgr.map((v) => (
                  <Chip key={v.id} on={fund === v.id} onClick={() => setFund(v.id)} label={v.shortName} n={v.rows.length} small />
                ))}
              </div>
            )}
          </div>

          <div className="matte overflow-hidden">
            <div className={cx(GRID, "border-b border-d-line px-4 py-2.5 text-[12px] text-d-text-3")}>
              <span />
              <span>Vehicle</span>
              <span className="text-right max-md:hidden">Investors</span>
              <span className="text-right max-md:hidden">Commitments</span>
              <span className="text-right max-md:hidden">Called</span>
              <span className="text-right">NAV</span>
            </div>
            {shown.map((v, vi) => {
              const rows = v.rows.filter((r) => match(r.name) || match(r.contact));
              const firstOfMgr = vi === 0 || shown[vi - 1].gp !== v.gp;
              const t = v.rows.reduce(
                (a, r) => ({
                  commitment: a.commitment + r.commitment,
                  called: a.called + r.called,
                  unfunded: a.unfunded + r.unfunded,
                  distributed: a.distributed + r.distributed,
                  nav: a.nav + r.nav,
                }),
                { commitment: 0, called: 0, unfunded: 0, distributed: 0, nav: 0 },
              );
              const isClosed = fund === "all" && !q && (closed[v.id] ?? true);
              if (q && !rows.length) return null;
              const calledPct = t.commitment ? t.called / t.commitment : 0;
              return (
                <section key={v.id} className="border-b border-d-line-soft last:border-0">
                  {firstOfMgr && (
                    <div className="flex items-baseline gap-2 border-b border-d-line-soft bg-[color-mix(in_oklab,var(--d-raise)_45%,transparent)] px-4 py-2">
                      <span className="text-[12.5px] font-semibold text-d-text">{v.gp}</span>
                      <span className="text-[11.5px] text-d-text-3">
                        {shown.filter((x) => x.gp === v.gp).length} {shown.filter((x) => x.gp === v.gp).length === 1 ? "vehicle" : "vehicles"}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => (fund === "all" ? setClosed((c) => ({ ...c, [v.id]: !(c[v.id] ?? true) })) : setFund("all"))}
                    className={cx(
                      GRID,
                      "w-full items-center px-4 py-3 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--d-raise)_55%,transparent)]",
                      !isClosed && "bg-[color-mix(in_oklab,var(--d-raise)_40%,transparent)]",
                    )}
                    aria-expanded={!isClosed}
                  >
                    <ChevronRight size={15} className={cx("text-d-text-3 transition-transform duration-200", !isClosed && "rotate-90")} />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-d-text">{v.name}</span>
                      <span className="text-[12px] text-d-text-3">
                        {v.status} · {v.currency}
                      </span>
                    </span>
                    <span className="num text-right text-[13.5px] text-d-text max-md:hidden">{v.rows.length}</span>
                    <span className="num text-right text-[13.5px] text-d-text max-md:hidden">{moneyShort(t.commitment, v.currency)}</span>
                    <span className="flex items-center justify-end gap-2.5 max-md:hidden">
                      <span className="hidden h-[3px] w-[64px] overflow-hidden rounded-full bg-d-raise lg:block">
                        <span className="block h-full rounded-full bg-d-text-2" style={{ width: `${calledPct * 100}%` }} />
                      </span>
                      <span className="num w-[40px] text-right text-[13.5px] text-d-text">{t.commitment ? pct(calledPct, 0) : "—"}</span>
                    </span>
                    <span className="num text-right text-[13.5px] font-semibold text-d-text">{moneyShort(t.nav, v.currency)}</span>
                  </button>
                  {!isClosed && (
                    <div className="overflow-x-auto border-t border-d-line-soft bg-d-surface-2">
                      <table className="data-table register">
                        <thead>
                          <tr>
                            <th className="!pl-[40px]">Investor</th>
                            <th>Type</th>
                            <th>Close</th>
                            <th className="r">Commitment</th>
                            <th className="r">% of fund</th>
                            <th className="r">Called</th>
                            <th className="r">Unfunded</th>
                            <th className="r">Distributed</th>
                            <th className="r">NAV</th>
                            <th>KYC / AML</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...rows]
                            .sort((a, b) => b.commitment - a.commitment)
                            .map((r) => (
                              <tr key={r.investorId} className="row-link">
                                <td className="!pl-[40px]">
                                  <div className="flex items-center gap-3">
                                    <Avatar label={initials(r.name)} />
                                    <div>
                                      <div className="font-semibold text-d-text">{r.name}</div>
                                      <div className="text-[12px] text-d-text-3">{r.contact}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-d-text-2">{r.type}</td>
                                <td className="num text-d-text-2">{date(r.closeDate)}</td>
                                <td className="num r">{money(r.commitment, v.currency)}</td>
                                <td className="num r text-d-text-2">{t.commitment ? pct(r.commitment / t.commitment) : "—"}</td>
                                <td className="num r">
                                  {money(r.called, v.currency)}
                                  <div className="text-[11px] text-d-text-3">{r.commitment ? pct(r.called / r.commitment, 0) : "—"}</div>
                                </td>
                                <td className="num r">{money(r.unfunded, v.currency)}</td>
                                <td className="num r">{money(r.distributed, v.currency)}</td>
                                <td className="num r font-semibold">{money(r.nav, v.currency)}</td>
                                <td>
                                  <Status value={r.kyc} />
                                </td>
                              </tr>
                            ))}
                          <tr className="font-semibold">
                            <td colSpan={3} className="!pl-[40px] text-d-text-2">
                              Total · {v.rows.length} investors
                            </td>
                            <td className="num r">{money(t.commitment, v.currency)}</td>
                            <td className="num r">100.0%</td>
                            <td className="num r">{money(t.called, v.currency)}</td>
                            <td className="num r">{money(t.unfunded, v.currency)}</td>
                            <td className="num r">{money(t.distributed, v.currency)}</td>
                            <td className="num r">{money(t.nav, v.currency)}</td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          {!shown.some((v) => v.rows.length) && <p className="py-10 text-center text-[13px] text-stone-400">No investors in this vehicle yet.</p>}
        </>
      )}

      {view === "investor" && (
        <div className="matte overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Type</th>
                  <th>Jurisdiction</th>
                  <th>Tax form</th>
                  <th>KYC / AML</th>
                  <th>Vehicles</th>
                  <th className="r">Commitments (USD)</th>
                  <th className="r">NAV (USD)</th>
                  <th>Relationship</th>
                </tr>
              </thead>
              <tbody>
                {master
                  .filter((m) => match(m.name) || match(m.contact))
                  .map((m) => (
                    <tr key={m.id} className="row-link">
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar label={initials(m.name)} />
                          <div>
                            <div className="font-semibold text-ink-900">{m.name}</div>
                            <div className="text-[12px] text-stone-500">{m.contact}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-stone-600">{m.type}</td>
                      <td className="text-stone-600">{m.jurisdiction}</td>
                      <td className="font-mono text-[12px] text-stone-600">{m.taxForm}</td>
                      <td>
                        <Status value={m.kyc} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {m.vehicles.map((v) => (
                            <span key={v} className="rounded-[4px] bg-d-raise px-1.5 py-0.5 text-[11px] text-d-text-2">
                              {v}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="num r">{moneyShort(m.commitmentUsd)}</td>
                      <td className="num r">{moneyShort(m.navUsd)}</td>
                      <td className="text-stone-600">{m.rm}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ on, onClick, label, n, small }: { on: boolean; onClick: () => void; label: string; n: number; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        "flex items-center gap-1.5 rounded-[6px] font-semibold transition-colors",
        small ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[12.5px]",
        on ? "bg-d-raise text-d-text ring-1 ring-d-line-strong" : "text-d-text-2 hover:bg-[color-mix(in_oklab,var(--d-raise)_55%,transparent)] hover:text-d-text",
      )}
    >
      {label}
      <span className={cx("num text-[11px]", on ? "text-d-text-2" : "text-d-text-3")}>{n}</span>
    </button>
  );
}
