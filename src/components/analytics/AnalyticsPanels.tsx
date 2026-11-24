"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "@/components/ui";
import { multiples, periodLabel, rollForward, sumSnapshots, xirr, type FundAnalytics, type PeriodFx, type Snapshot } from "@/lib/analytics";
import { Columns, HBars, Legend, Lines, MEANING, SERIES } from "./charts";
import { MiniTable, Widget } from "./Widget";

export type Ccy = "USD" | "BRL";

export type View = ReturnType<typeof useAnalyticsView>;

const ZERO = (date: string): Snapshot => ({ date, commitment: 0, paidIn: 0, distributed: 0, nav: 0, income: 0, realized: 0, unrealized: 0, fees: 0, expenses: 0 });

/** Aggregate the selected funds up to the as-of period. */
export function useAnalyticsView(data: { periods: string[]; fx: PeriodFx[]; funds: FundAnalytics[] }, scope: string, asOfIdx: number, ccy: Ccy) {
  return useMemo(() => {
    // BRL view: each period converted at its own PTAX (USD figures were built at the same rates)
    const kAt = (i: number) => (ccy === "BRL" ? data.fx[i].rate : 1);
    const k = kAt(asOfIdx);
    const [kind, id] = scope.split(":");
    const sel = data.funds.filter((f) => kind === "all" || (kind === "gp" && f.gpId === id) || (kind === "fund" && f.id === id));
    const scale = (s: Snapshot, m = k): Snapshot => ({ ...s, commitment: s.commitment * m, paidIn: s.paidIn * m, distributed: s.distributed * m, nav: s.nav * m, income: s.income * m, realized: s.realized * m, unrealized: s.unrealized * m, fees: s.fees * m, expenses: s.expenses * m });
    // start one period before the first commitment, so young vehicles don't show years of empty quarters
    const first = data.periods.findIndex((_, i) => sel.some((f) => f.series[i].commitment > 0));
    const from = Math.min(Math.max(0, first - 1), Math.max(0, asOfIdx - 3));
    const periods = data.periods.slice(from, asOfIdx + 1);
    const series = periods.map((d, i) => scale(sumSnapshots(sel.map((f) => f.series[from + i]), d), kAt(from + i)));
    const asOf = periods[periods.length - 1];
    const end = series[series.length - 1];
    const usdAt = (i: number) => sumSnapshots(sel.map((f) => f.series[i]), data.periods[i]);
    const yAbs = data.periods.findLastIndex((d, i) => i < asOfIdx && d.endsWith("12-31"));
    /**
     * Roll-forward from period s (exclusive; -1 = inception) to asOf, translated properly:
     * opening NAV at the opening rate, each quarter's movements at that quarter's average rate,
     * closing NAV at the closing rate; the residual is FX translation. In USD it is zero.
     */
    const translatedRoll = (s: number) => {
      const lines = { contributions: 0, distributions: 0, fees: 0, expenses: 0, income: 0, realized: 0, unrealized: 0 };
      for (let i = Math.max(0, s + 1); i <= asOfIdx; i++) {
        const prev = i > 0 ? usdAt(i - 1) : ZERO("");
        const m = rollForward(prev, usdAt(i));
        const r = ccy === "BRL" ? (kAt(Math.max(0, i - 1)) + kAt(i)) / 2 : 1;
        for (const key of Object.keys(lines) as (keyof typeof lines)[]) lines[key] += m[key] * r;
      }
      const beginning = s >= 0 ? usdAt(s).nav * kAt(s) : 0;
      const ending = usdAt(asOfIdx).nav * k;
      const moved = beginning + Object.values(lines).reduce((a, b) => a + b, 0);
      const fxTranslation = Math.abs(ending - moved) < 0.5 ? 0 : ending - moved;
      return { beginning, ...lines, fxTranslation, ending };
    };
    const flows = sel.flatMap((f) => f.flows).filter((x) => x.date <= asOf);
    // Cash actually called / returned in each period, from dated flows (each at its own PTAX)
    const bucket = periods.map((d, i) => {
      const lo = i === 0 ? (from > 0 ? data.periods[from - 1] : "") : periods[i - 1];
      const inP = flows.filter((x) => x.date > lo && x.date <= d);
      return {
        called: -inP.filter((x) => x.amount < 0).reduce((a, x) => a + x.amount, 0) * kAt(from + i),
        returned: inP.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0) * kAt(from + i),
      };
    });
    const irr = xirr(flows, { date: asOf, amount: end.nav / k }); // IRR measured in USD
    const perFund = sel.map((f) => {
      const s = scale(f.series[asOfIdx]);
      return { f, s, m: multiples(s), irr: xirr(f.flows.filter((x) => x.date <= asOf), { date: asOf, amount: s.nav / k }) };
    });
    return {
      k,
      ccy,
      asOf,
      sel,
      periods,
      labels: periods.map(periodLabel),
      series,
      end,
      m: multiples(end),
      irr,
      roll: { QTD: translatedRoll(asOfIdx - 1), YTD: translatedRoll(yAbs), ITD: translatedRoll(-1) },
      fx: data.fx[asOfIdx],
      periodFlows: bucket,
      perFund,
    };
  }, [data, scope, asOfIdx, ccy]);
}

/* ---------- formatting ---------- */
const sym = (c: Ccy) => (c === "BRL" ? "R$" : "$");
export const fmtShort = (c: Ccy) => (v: number) => {
  const a = Math.abs(v);
  const s = a >= 1e9 ? `${(a / 1e9).toFixed(1)}B` : a >= 1e6 ? `${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(0)}K` : a.toFixed(0);
  return `${v < 0 ? "−" : ""}${sym(c)}${s}`;
};
export const fmtFull = (v: number) => (Math.round(v) === 0 ? "—" : `${v < 0 ? "(" : ""}${Math.abs(Math.round(v)).toLocaleString("en-US")}${v < 0 ? ")" : ""}`);
const pctFmt = (v: number | null) => (v === null || !isFinite(v) ? "—" : `${(v * 100).toFixed(1)}%`);
const x2 = (v: number) => (v ? `${v.toFixed(2)}x` : "—");

/* ---------- KPIs ---------- */
export function KpiStrip({ v }: { v: View }) {
  const f = fmtShort(v.ccy);
  const items: [string, string, string?][] = [
    ["NAV", f(v.end.nav)],
    ["Commitments", f(v.end.commitment), v.sel.length > 1 ? `${v.sel.length} vehicles` : undefined],
    ["Paid-in", f(v.end.paidIn), v.end.commitment ? `${((v.end.paidIn / v.end.commitment) * 100).toFixed(0)}% called` : undefined],
    ["Unfunded", f(v.end.commitment - v.end.paidIn)],
    ["Distributed", f(v.end.distributed)],
    ["TVPI", x2(v.m.tvpi), `DPI ${x2(v.m.dpi)}`],
    ["Net IRR", pctFmt(v.irr), "since inception"],
  ];
  return (
    <div className="grid grid-cols-2 divide-stone-200 overflow-hidden rounded-[8px] border border-stone-200/70 bg-white shadow-card sm:grid-cols-4 lg:grid-cols-7 lg:divide-x">
      {items.map(([l, val, sub]) => (
        <div key={l} className="px-4 py-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500">{l}</div>
          <div className="num mt-1 text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink-900">{val}</div>
          {sub && <div className="mt-0.5 text-[11px] text-stone-500">{sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Roll-forward summary (QTD / YTD / ITD) ---------- */
export function SummaryWidget({ v, bare }: { v: View; bare?: boolean }) {
  const rows: [string, keyof View["roll"]["QTD"], boolean?][] = [
    ["Beginning NAV", "beginning", true],
    ["Contributions", "contributions"],
    ["Distributions", "distributions"],
    ["Management fees", "fees"],
    ["Fund expenses", "expenses"],
    ["Income", "income"],
    ["Realized gains", "realized"],
    ["Unrealized gains", "unrealized"],
    ...(v.ccy === "BRL" ? ([["FX translation", "fxTranslation"]] as [string, keyof View["roll"]["QTD"]][]) : []),
    ["Ending NAV", "ending", true],
  ];
  const cols = ["QTD", "YTD", "ITD"] as const;
  return (
    <Widget
      title="Partners' capital"
      unit={`${v.ccy} · as of ${periodLabel(v.asOf)}`}
      bare={bare}
      csv={{ headers: ["Line", ...cols], rows: rows.map(([l, key]) => [l, ...cols.map((c) => v.roll[c][key])]) }}
    >
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-[0.1em] text-stone-500">
            <th className="pb-2 text-left font-semibold" />
            {cols.map((c) => (
              <th key={c} className="pb-2 text-right font-semibold">
                {c === "QTD" ? "Quarter" : c === "YTD" ? "Year to date" : "Inception"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([l, key, strong]) => (
            <tr key={l} className={cx(strong ? "border-y border-stone-200 font-semibold text-ink-900" : "text-stone-700")}>
              <td className={cx("py-[7px]", !strong && "pl-3")}>{l}</td>
              {cols.map((c) => (
                <td key={c} className="num py-[7px] text-right">
                  {fmtFull(v.roll[c][key])}
                </td>
              ))}
            </tr>
          ))}
          <tr className="text-stone-700">
            <td className="pt-3">Net IRR{v.ccy === "BRL" ? " (USD)" : ""}</td>
            <td className="num pt-3 text-right text-stone-400">—</td>
            <td className="num pt-3 text-right text-stone-400">—</td>
            <td className="num pt-3 text-right font-semibold text-ink-900">{pctFmt(v.irr)}</td>
          </tr>
        </tbody>
      </table>
    </Widget>
  );
}

/* ---------- NAV evolution ---------- */
export function NavWidget({ v, bare, height = 260 }: { v: View; bare?: boolean; height?: number }) {
  const f = fmtShort(v.ccy);
  const series = [
    { name: "NAV", color: MEANING.value, values: v.series.map((s) => s.nav) },
    { name: "Paid-in capital", color: MEANING.capitalIn, values: v.series.map((s) => s.paidIn) },
    { name: "Cumulative distributions", color: MEANING.returned, values: v.series.map((s) => s.distributed) },
  ];
  return (
    <Widget
      title="Value evolution"
      unit={v.ccy}
      bare={bare}
      legend={<Legend items={series.map((s) => ({ name: s.name, color: s.color, line: true }))} />}
      csv={{ headers: ["Period", ...series.map((s) => s.name)], rows: v.periods.map((d, i) => [d, ...series.map((s) => s.values[i])]) }}
      table={<MiniTable headers={["Period", ...series.map((s) => s.name)]} rows={v.labels.map((l, i) => [l, ...series.map((s) => fmtFull(s.values[i]))])} />}
    >
      <Lines categories={v.labels} series={series} fmt={f} height={height} />
    </Widget>
  );
}

/* ---------- Quarterly capital activity ---------- */
export function FlowsWidget({ v, bare, height = 240 }: { v: View; bare?: boolean; height?: number }) {
  const f = fmtShort(v.ccy);
  const contrib = v.periodFlows.map((p) => p.called);
  const dist = v.periodFlows.map((p) => p.returned);
  const series = [
    { name: "Contributions", color: MEANING.capitalIn, values: contrib },
    { name: "Distributions", color: MEANING.returned, values: dist },
  ];
  return (
    <Widget
      title="Capital activity"
      unit={`${v.ccy} per quarter`}
      bare={bare}
      legend={<Legend items={series} />}
      csv={{ headers: ["Period", "Contributions", "Distributions"], rows: v.periods.map((d, i) => [d, contrib[i], dist[i]]) }}
      table={<MiniTable headers={["Period", "Contributions", "Distributions"]} rows={v.labels.map((l, i) => [l, fmtFull(contrib[i]), fmtFull(dist[i])])} />}
    >
      <Columns categories={v.labels} series={series} fmt={f} height={height} />
    </Widget>
  );
}

/* ---------- Multiples by vehicle ---------- */
export function PerformanceWidget({ v, bare }: { v: View; bare?: boolean }) {
  const rows = [...v.perFund].filter((p) => p.s.paidIn > 0).sort((a, b) => b.m.tvpi - a.m.tvpi);
  return (
    <Widget
      title="Performance by vehicle"
      unit="multiple of paid-in"
      bare={bare}
      legend={<Legend items={[{ name: "DPI · distributed", color: MEANING.returned }, { name: "RVPI · unrealized", color: MEANING.value }]} />}
      csv={{ headers: ["Vehicle", "DPI", "RVPI", "TVPI", "Net IRR"], rows: rows.map((p) => [p.f.name, p.m.dpi, p.m.rvpi, p.m.tvpi, p.irr ?? ""]) }}
      table={<MiniTable headers={["Vehicle", "DPI", "RVPI", "TVPI", "Net IRR"]} rows={rows.map((p) => [p.f.shortName, x2(p.m.dpi), x2(p.m.rvpi), x2(p.m.tvpi), pctFmt(p.irr)])} />}
    >
      {rows.length ? (
        <HBars rows={rows.map((p) => ({ label: p.f.shortName, values: [p.m.dpi, p.m.rvpi] }))} parts={[{ name: "DPI", color: MEANING.returned }, { name: "RVPI", color: MEANING.value }]} fmt={x2} />
      ) : (
        <p className="py-6 text-center text-[12px] text-stone-400">No paid-in capital yet</p>
      )}
    </Widget>
  );
}

/* ---------- Exposure ---------- */
export function ExposureWidget({ v, by, bare }: { v: View; by: "strategy" | "gp"; bare?: boolean }) {
  const f = fmtShort(v.ccy);
  const map = new Map<string, number>();
  for (const p of v.perFund) map.set(by === "gp" ? p.f.gpName : p.f.strategy, (map.get(by === "gp" ? p.f.gpName : p.f.strategy) ?? 0) + p.s.nav);
  const rows = [...map.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, [, n]) => a + n, 0) || 1;
  const title = by === "gp" ? "NAV by GP" : "NAV by strategy";
  return (
    <Widget
      title={title}
      unit={v.ccy}
      bare={bare}
      csv={{ headers: [by === "gp" ? "GP" : "Strategy", "NAV", "Share"], rows: rows.map(([l, n]) => [l, n, n / total]) }}
      table={<MiniTable headers={[by === "gp" ? "GP" : "Strategy", "NAV", "Share"]} rows={rows.map(([l, n]) => [l, fmtFull(n), `${((n / total) * 100).toFixed(1)}%`])} />}
    >
      <HBars rows={rows.map(([l, n]) => ({ label: l, values: [n] }))} parts={[{ name: "NAV", color: SERIES[0] }]} fmt={f} totalFmt={(n) => `${((n / total) * 100).toFixed(0)}%`} />
    </Widget>
  );
}

/* ---------- Holdings tree (GP › vehicle › investor) ---------- */
type TreeRowProps = {
  depth: number;
  label: string;
  s: Pick<Snapshot, "commitment" | "paidIn" | "distributed" | "nav">;
  irr?: number | null;
  k?: string;
  count?: number;
  open?: boolean;
  onToggle?: (k: string) => void;
};

function TreeRow({ depth, label, s, irr, k, count, open, onToggle }: TreeRowProps) {
  const m = multiples({ ...ZERO(""), ...s });
  return (
    <tr className={cx("border-b border-stone-100", depth === 0 && "bg-stone-50/70 font-semibold", k && "cursor-pointer hover:bg-gold-50")} onClick={k && onToggle ? () => onToggle(k) : undefined}>
      <td className="py-[7px] pr-3" style={{ paddingLeft: 12 + depth * 20 }}>
        <span className="inline-flex items-center gap-1.5">
          {k ? <ChevronRight size={13} className={cx("text-stone-400 transition-transform", open && "rotate-90")} /> : <span className="w-[13px]" />}
          <span className={cx(depth === 2 ? "text-stone-700" : "text-ink-900")}>{label}</span>
          {count !== undefined && <span className="text-[11px] font-normal text-stone-400">{count}</span>}
        </span>
      </td>
      {[s.commitment, s.paidIn, s.commitment - s.paidIn, s.distributed, s.nav].map((n, i) => (
        <td key={i} className="num px-3 text-right">
          {fmtFull(n)}
        </td>
      ))}
      <td className="num px-3 text-right">{x2(m.dpi)}</td>
      <td className="num px-3 text-right">{x2(m.tvpi)}</td>
      <td className="num px-3 pr-4 text-right">{irr === undefined ? "" : pctFmt(irr)}</td>
    </tr>
  );
}


export function TreeWidget({ v, bare, open: openAll }: { v: View; bare?: boolean; open?: boolean }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(openAll ? v.perFund.map((p) => `gp:${p.f.gpId}`) : []));
  const toggle = (k: string) => setOpen((s) => (s.has(k) ? (s.delete(k), new Set(s)) : new Set(s).add(k)));
  const gps = [...new Set(v.perFund.map((p) => p.f.gpId))];
  const cols = ["Commitment", "Paid-in", "Unfunded", "Distributed", "NAV", "DPI", "TVPI", "Net IRR"];

  const rows: (string | number)[][] = [];
  return (
    <Widget
      title="Holdings"
      unit={`${v.ccy} · GP › vehicle › investor`}
      bare={bare}
      csv={{
        headers: ["Level", "Name", ...cols],
        rows: (() => {
          for (const p of v.perFund) {
            rows.push(["Vehicle", p.f.name, p.s.commitment, p.s.paidIn, p.s.commitment - p.s.paidIn, p.s.distributed, p.s.nav, p.m.dpi, p.m.tvpi, p.irr ?? ""]);
            for (const i of p.f.investors) rows.push(["Investor", `${p.f.shortName} / ${i.name}`, i.commitment * v.k, i.paidIn * v.k, (i.commitment - i.paidIn) * v.k, i.distributed * v.k, i.nav * v.k, "", "", ""]);
          }
          return rows;
        })(),
      }}
    >
      <div className="-mx-4 -mb-4 overflow-auto">
        <table className="w-full min-w-[980px] text-[12.5px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-stone-200 text-[10.5px] uppercase tracking-[0.1em] text-stone-500">
              <th className="py-2 pl-4 text-left font-semibold">Name</th>
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 text-right font-semibold last:pr-4">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gps.map((g) => {
              const fs = v.perFund.filter((p) => p.f.gpId === g);
              const s = sumSnapshots(fs.map((p) => p.s), "");
              const gk = `gp:${g}`;
              const gpIrr = xirr(fs.flatMap((p) => p.f.flows).filter((x) => x.date <= v.asOf), { date: v.asOf, amount: s.nav / v.k });
              return (
                <Fragment key={g}>
                  <TreeRow depth={0} label={fs[0].f.gpName} s={s} k={gk} count={fs.length} irr={gpIrr} open={open.has(gk)} onToggle={toggle} />
                  {open.has(gk) &&
                    fs.map((p) => {
                      const fk = `fund:${p.f.id}`;
                      return (
                        <Fragment key={p.f.id}>
                          <TreeRow depth={1} label={p.f.shortName} s={p.s} irr={p.irr} k={p.f.investors.length ? fk : undefined} count={p.f.investors.length} open={open.has(fk)} onToggle={toggle} />
                          {open.has(fk) &&
                            p.f.investors
                              .slice()
                              .sort((a, b) => b.commitment - a.commitment)
                              .map((i) => <TreeRow key={i.id} depth={2} label={i.name} s={{ commitment: i.commitment * v.k, paidIn: i.paidIn * v.k, distributed: i.distributed * v.k, nav: i.nav * v.k }} />)}
                        </Fragment>
                      );
                    })}
                </Fragment>
              );
            })}
            <TreeRow depth={0} label="Total" s={v.end} irr={v.irr} />
          </tbody>
        </table>
      </div>
    </Widget>
  );
}
