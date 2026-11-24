"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Avatar, Status, cx } from "@/components/ui";
import { date, initials, money, moneyShort, pct } from "@/lib/format";
import type { Currency } from "@/lib/data";

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
export type MasterRow = { id: string; name: string; contact: string; type: string; jurisdiction: string; taxForm: string; kyc: string; rm: string; vehicles: string[]; commitmentUsd: number; navUsd: number };

/**
 * Investors the way fund administrators work: a register per vehicle (who is in this fund, their
 * commitment, share of the fund and capital account), with the investor master list as a second view.
 */
export function InvestorsView({ vehicles, master, fxNote }: { vehicles: Vehicle[]; master: MasterRow[]; fxNote: string }) {
  const [view, setView] = useState<"vehicle" | "investor">("vehicle");
  const [fund, setFund] = useState<string>("all");
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const shown = vehicles.filter((v) => fund === "all" || v.id === fund);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-[10px] border border-stone-200 bg-white p-0.5 shadow-card">
          {(
            [
              ["vehicle", "By vehicle"],
              ["investor", "By investor"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} className={cx("h-8 rounded-[8px] px-3.5 text-[12.5px] font-semibold", view === v ? "bg-champagne text-ink-900" : "text-stone-500 hover:text-ink-900")}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search investors" className="h-9 w-[240px] rounded-[10px] border border-stone-200 bg-white pl-8 pr-3 text-[13px] shadow-card focus:border-ink-900 focus:outline-none" />
        </div>
        <span className="ml-auto text-[12px] text-stone-500">{fxNote}</span>
      </div>

      {view === "vehicle" && (
        <>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={fund === "all"} onClick={() => setFund("all")} label="All vehicles" n={vehicles.length} />
            {vehicles.map((v) => (
              <Chip key={v.id} on={fund === v.id} onClick={() => setFund(v.id)} label={v.shortName} n={v.rows.length} />
            ))}
          </div>

          {shown.map((v) => {
            const rows = v.rows.filter((r) => match(r.name) || match(r.contact));
            const t = v.rows.reduce(
              (a, r) => ({ commitment: a.commitment + r.commitment, called: a.called + r.called, unfunded: a.unfunded + r.unfunded, distributed: a.distributed + r.distributed, nav: a.nav + r.nav }),
              { commitment: 0, called: 0, unfunded: 0, distributed: 0, nav: 0 },
            );
            const isClosed = fund === "all" && !q && (closed[v.id] ?? true);
            if (q && !rows.length) return null;
            return (
              <section key={v.id} className="overflow-hidden rounded-[16px] border border-stone-200/80 bg-white shadow-card">
                <button onClick={() => (fund === "all" ? setClosed((c) => ({ ...c, [v.id]: !(c[v.id] ?? true) })) : setFund("all"))} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-stone-50/60" aria-expanded={!isClosed}>
                  {isClosed ? <ChevronRight size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-ink-900">{v.name}</div>
                    <div className="text-[11.5px] text-stone-500">
                      {v.gp} · {v.status} · {v.currency}
                    </div>
                  </div>
                  <Fig label="Investors" value={String(v.rows.length)} />
                  <Fig label="Commitments" value={moneyShort(t.commitment, v.currency)} />
                  <Fig label="Called" value={t.commitment ? pct(t.called / t.commitment, 0) : "—"} />
                  <Fig label="NAV" value={moneyShort(t.nav, v.currency)} />
                </button>
                {!isClosed && (
                  <div className="overflow-x-auto border-t border-stone-100">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Investor</th>
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
                              <td>
                                <div className="flex items-center gap-3">
                                  <Avatar label={initials(r.name)} />
                                  <div>
                                    <div className="font-semibold text-ink-900">{r.name}</div>
                                    <div className="text-[12px] text-stone-500">{r.contact}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-stone-600">{r.type}</td>
                              <td className="num text-stone-600">{date(r.closeDate)}</td>
                              <td className="num r">{money(r.commitment, v.currency)}</td>
                              <td className="num r text-stone-600">{t.commitment ? pct(r.commitment / t.commitment) : "—"}</td>
                              <td className="num r">
                                {money(r.called, v.currency)}
                                <div className="text-[11px] text-stone-400">{r.commitment ? pct(r.called / r.commitment, 0) : "—"}</div>
                              </td>
                              <td className="num r">{money(r.unfunded, v.currency)}</td>
                              <td className="num r">{money(r.distributed, v.currency)}</td>
                              <td className="num r font-semibold">{money(r.nav, v.currency)}</td>
                              <td>
                                <Status value={r.kyc} />
                              </td>
                            </tr>
                          ))}
                        <tr className="bg-stone-50/70 font-semibold">
                          <td colSpan={3} className="text-stone-600">
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
          {!shown.some((v) => v.rows.length) && <p className="py-10 text-center text-[13px] text-stone-400">No investors in this vehicle yet.</p>}
        </>
      )}

      {view === "investor" && (
        <div className="overflow-hidden rounded-[16px] border border-stone-200/80 bg-white shadow-card">
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
                            <span key={v} className="rounded-[6px] bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-600">
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

function Chip({ on, onClick, label, n }: { on: boolean; onClick: () => void; label: string; n: number }) {
  return (
    <button onClick={onClick} className={cx("flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold", on ? "border-transparent bg-champagne text-ink-900" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400")}>
      {label}
      <span className={cx("num text-[11px]", on ? "text-ink-700" : "text-stone-400")}>{n}</span>
    </button>
  );
}

function Fig({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden w-[118px] text-right md:block">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{label}</div>
      <div className="num text-[14px] font-semibold text-ink-900">{value}</div>
    </div>
  );
}
