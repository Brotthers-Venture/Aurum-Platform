"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { ButtonLink, cx } from "@/components/ui";
import { periodLabel, type FundAnalytics, type PeriodFx } from "@/lib/analytics";
import { ExposureWidget, FlowsWidget, KpiStrip, NavWidget, PerformanceWidget, SummaryWidget, TreeWidget, useAnalyticsView, type Ccy } from "./AnalyticsPanels";

const select = "h-8 rounded-[3px] border border-stone-300 bg-white px-2.5 text-[12.5px] text-ink-900 focus:border-ink-900 focus:outline-none";

function FxNote({ fx }: { fx: PeriodFx }) {
  return fx.source === "PTAX" ? (
    <span className="text-[11px] text-stone-500" title="Banco Central do Brasil · PTAX closing selling rate">
      PTAX <span className="num font-semibold text-ink-900">{fx.rate.toFixed(4)}</span> · BCB · {fx.date}
    </span>
  ) : (
    <span className="rounded-[4px] bg-negative-bg px-2 py-0.5 text-[11px] font-semibold text-negative">Indicative {fx.rate.toFixed(2)} · PTAX unavailable</span>
  );
}

export function AnalyticsWorkspace({ data }: { data: { periods: string[]; fx: PeriodFx[]; funds: FundAnalytics[] } }) {
  const [scope, setScope] = useState("all");
  const [asOfIdx, setAsOfIdx] = useState(data.periods.length - 2); // last quarter end
  const [ccy, setCcy] = useState<Ccy>("USD");
  const v = useAnalyticsView(data, scope, asOfIdx, ccy);

  const gps = [...new Map(data.funds.map((f) => [f.gpId, f.gpName])).entries()];
  const reportFund = scope.startsWith("fund:") ? scope.slice(5) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 pb-4">
        <h1 className="mr-4 text-[22px] font-semibold tracking-[-0.015em]">Analytics</h1>
        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">
          Portfolio
          <select aria-label="Portfolio" className={cx(select, "min-w-[240px] normal-case tracking-normal")} value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">All vehicles</option>
            <optgroup label="By GP">
              {gps.map(([id, name]) => (
                <option key={id} value={`gp:${id}`}>
                  {name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Vehicle">
              {data.funds.map((f) => (
                <option key={f.id} value={`fund:${f.id}`}>
                  {f.shortName}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">
          As of
          <select aria-label="As of" className={cx(select, "normal-case tracking-normal")} value={asOfIdx} onChange={(e) => setAsOfIdx(Number(e.target.value))}>
            {data.periods.map((d, i) => (
              <option key={d} value={i}>
                {periodLabel(d) === "Today" ? "Today" : `${periodLabel(d).replace(" ", " 20")} · ${d}`}
              </option>
            ))}
          </select>
        </label>
        <div className="flex rounded-[3px] border border-stone-300 bg-white p-0.5" role="group" aria-label="Currency">
          {(["USD", "BRL"] as const).map((c) => (
            <button key={c} type="button" onClick={() => setCcy(c)} className={cx("h-7 rounded-[2px] px-2.5 text-[12px] font-semibold", ccy === c ? "bg-champagne text-ink-900 shadow-[inset_0_0_0_1px_rgba(184,151,90,0.45)]" : "text-stone-500 hover:text-ink-900")}>
              {c}
            </button>
          ))}
        </div>
        <FxNote fx={data.fx[asOfIdx]} />
        <div className="ml-auto">
          <ButtonLink variant="secondary" size="sm" href={`/report/${reportFund ?? data.funds[0].id}?asOf=${data.periods[asOfIdx]}`}>
            <FileText size={13} /> {reportFund ? "Quarterly report" : "Report for a vehicle"}
          </ButtonLink>
        </div>
      </div>

      <KpiStrip v={v} />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <NavWidget v={v} />
        </div>
        <div className="xl:col-span-5">
          <SummaryWidget v={v} />
        </div>
        <div className="xl:col-span-7">
          <FlowsWidget v={v} />
        </div>
        <div className="xl:col-span-5">
          <PerformanceWidget v={v} />
        </div>
        <div className="xl:col-span-12">
          <TreeWidget v={v} />
        </div>
        <div className="xl:col-span-6">
          <ExposureWidget v={v} by="strategy" />
        </div>
        <div className="xl:col-span-6">
          <ExposureWidget v={v} by="gp" />
        </div>
      </div>
    </div>
  );
}
