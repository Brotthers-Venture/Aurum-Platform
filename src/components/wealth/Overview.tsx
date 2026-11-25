"use client";

import { useState } from "react";
import { ArrowRight, BellRing } from "lucide-react";
import { cx } from "@/components/ui";
import { AreaChart, Bar, Panel, SampleTag, Seg, useCountUp, useWealth } from "./ui";
import { Honeycomb } from "./Honeycomb";
import { REPORT_LABEL, WATCH, money, pct, sampleSeries, shortDate, signed } from "@/lib/wealth";

const PERIODS = ["1M", "3M", "YTD", "1Y", "3Y", "All"] as const;
type Period = (typeof PERIODS)[number];

export function Overview() {
  const { f, t, ccy, open, go, mode, actorId } = useWealth();
  const [period, setPeriod] = useState<Period>("YTD");
  const m = (v: number, d = 1) => money(v, ccy, d);

  // Sample history: the period's start is derived from the YTD change so the end point always equals today's net worth.
  const spanStart = { "1M": t.net - t.change * 0.12, "3M": t.net - t.change * 0.33, YTD: t.start, "1Y": t.start - t.change * 0.08, "3Y": t.start * 0.84, All: t.start * 0.62 }[
    period
  ];
  const n = { "1M": 22, "3M": 30, YTD: 47, "1Y": 52, "3Y": 36, All: 40 }[period];
  const labels = {
    "1M": ["25 Oct", "8 Nov", "24 Nov"],
    "3M": ["Aug", "Sep", "Oct", "Nov"],
    YTD: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
    "1Y": ["Nov '25", "Feb", "May", "Aug", "Nov"],
    "3Y": ["2023", "2024", "2025", "2026"],
    All: ["2019", "2021", "2023", "2026"],
  }[period];
  const vals = sampleSeries(n, spanStart, t.net, f.id === "halvorsen" ? 3 : 7);

  const ranked = [...t.assets].filter((a) => a.ytd !== 0).sort((a, b) => b.ytdPct - a.ytdPct);
  const parts = [
    { label: "Investment return", v: t.investmentReturn, note: "price, income and currency of each holding" },
    { label: "Contributions and withdrawals", v: f.ytd.flows, note: "money in and out, including spending and fees" },
    { label: "Currency effect", v: f.ytd.fx, note: "exchange-rate movements on holdings outside US dollars" },
  ];
  const mx = Math.max(...parts.map((p) => Math.abs(p.v)));
  const alerts = (WATCH[f.id] ?? []).filter((w) => w.state === "triggered");

  const shown = useCountUp(t.net);
  const first = f.people.find((p) => p.memberId === actorId)?.name.split(" ")[0];
  const span = { "1M": 30, "3M": 91, YTD: 328, "1Y": 365, "3Y": 1095, All: 2555 }[period];
  const pointLabel = (i: number) => {
    const d = new Date(Date.parse("2026-11-24T12:00:00Z") - (1 - i / (n - 1)) * span * 864e5);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  };

  return (
    <div className="space-y-6">
      <section className="rise grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-[14px] text-d-text-2">
            {mode === "client" && first ? `Good evening, ${first}. Here is where ${f.name.replace(" Family", "")} wealth stands.` : `${f.name} — consolidated net worth`}
          </p>
          <div className="fig mt-3 text-[64px] leading-[0.95] text-d-text max-sm:text-[42px]">{money(shown, ccy, 2)}</div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px]">
            <span
              className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold tabular-nums", t.change >= 0 ? "text-d-pos" : "text-d-neg")}
              style={{ background: `color-mix(in oklab, ${t.change >= 0 ? "var(--d-pos)" : "var(--d-neg)"} 12%, transparent)` }}
            >
              {signed(m(t.change, 2), t.change)} · {pct(t.change / t.start)}
            </span>
            <span className="text-d-text-3">since 1 January · valued {REPORT_LABEL}</span>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-x-8 gap-y-1 text-[12.5px] max-sm:gap-x-4">
          {(
            [
              ["Assets", m(t.gross)],
              ["Liabilities", m(-t.debt)],
              ["Available now", m(t.liquid)],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-d-text-3">{k}</dt>
              <dd className="fig mt-0.5 text-[22px] text-d-text">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Panel
        title="Net worth over time"
        note={<SampleTag />}
        action={<Seg size="sm" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ id: p, label: p }))} />}
        pad={false}
      >
        <div className="px-3 pb-2 pt-3">
          <AreaChart values={vals} labels={labels} fmt={(v) => money(v, ccy, Math.max(...vals) - Math.min(...vals) < 3e6 ? 1 : 0)} id={`nw-${period}`} pointLabel={pointLabel} />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Panel title="What you own" note="by asset class">
          <Honeycomb />
        </Panel>
        <Panel title="What moved your wealth this year">
          {parts.map((p) => (
            <div key={p.label} className="mb-3">
              <div className="flex justify-between gap-3 text-[13px]">
                <span className="text-d-text-2">{p.label}</span>
                <b className={cx("font-semibold tabular-nums", p.v >= 0 ? "text-d-pos" : "text-d-neg")}>{signed(m(p.v, 2), p.v)}</b>
              </div>
              <div className="mt-1.5">
                <Bar value={Math.abs(p.v) / mx} color={p.v >= 0 ? "var(--tenant-accent)" : "var(--d-text-3)"} />
              </div>
              <div className="mt-1 text-[11px] text-d-text-3">{p.note}</div>
            </div>
          ))}
          <div className="flex justify-between border-t border-d-line pt-2.5 text-[13px]">
            <b className="font-semibold text-d-text">Change in net worth</b>
            <b className="font-semibold tabular-nums text-d-text">{signed(m(t.change, 2), t.change)}</b>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Highest and lowest returns" note="this year">
          {[...ranked.slice(0, 3), ...ranked.slice(-3).reverse()].map((a, i) => (
            <button
              key={a.id + i}
              onClick={() => open(a.id)}
              className={cx(
                "grid w-full grid-cols-[1fr_auto] items-center gap-3 py-1.5 text-left text-[12.5px] hover:opacity-80",
                i === 3 && "mt-2 border-t border-d-line-soft pt-3",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-d-text">{a.name}</span>
                <span className="text-[11px] text-d-text-3">{a.cls}</span>
              </span>
              <span className="text-right">
                <b className={cx("block font-semibold tabular-nums", a.ytdPct >= 0 ? "text-d-pos" : "text-d-neg")}>{signed(pct(a.ytdPct), a.ytdPct)}</b>
                <span className="text-[11px] tabular-nums text-d-text-3">{signed(m(a.ytd), a.ytd)}</span>
              </span>
            </button>
          ))}
        </Panel>
        <Panel
          title="Coming up"
          note="next 90 days"
          action={
            <button onClick={() => go("liquidity")} className="inline-flex items-center gap-1 text-[12px] font-semibold text-d-text-2 hover:text-d-text">
              Liquidity <ArrowRight size={12} />
            </button>
          }
          pad={false}
        >
          {f.obligations
            .filter((o) => o.amt !== 0)
            .slice(0, 5)
            .map((o) => (
              <div key={o.date + o.what} className="grid grid-cols-[86px_1fr_auto] items-center gap-3 border-b border-d-line-soft px-4 py-2.5 text-[12.5px] last:border-0">
                <span className="tabular-nums text-d-text-2">{shortDate(o.date).replace(/, \d{4}$/, "")}</span>
                <span className="min-w-0">
                  <span className="block truncate text-d-text">{o.what}</span>
                  <span className={cx("text-[11px]", o.confirmed ? "text-d-text-2" : "text-d-text-3")}>
                    {o.confirmed ? "Confirmed" : "Projected"}
                    {o.status !== "Projected" ? ` · ${o.status}` : ""}
                  </span>
                </span>
                <b className={cx("font-medium tabular-nums", o.amt > 0 ? "text-d-pos" : "text-d-text")}>{signed(m(o.amt, 2), o.amt)}</b>
              </div>
            ))}
        </Panel>
        <Panel title="Alerts" note={`${alerts.length} need attention`} pad={false}>
          {(WATCH[f.id] ?? []).map((w) => {
            const a = t.assets.find((x) => x.id === w.asset);
            return (
              <button
                key={w.id}
                onClick={() => open(w.asset)}
                className="flex w-full items-center gap-3 border-b border-d-line-soft px-4 py-2.5 text-left text-[12.5px] last:border-0 hover:bg-d-raise"
              >
                <BellRing size={14} className={w.state === "triggered" ? "text-d-warn" : "text-d-text-3"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-d-text">{a?.name}</span>
                  <span className="text-[11px] text-d-text-3">{w.rule}</span>
                </span>
                <span className={cx("text-[11.5px] font-semibold", w.state === "triggered" ? "text-d-warn" : "text-d-text-3")}>
                  {w.state === "triggered" ? "Triggered" : "Watching"}
                </span>
              </button>
            );
          })}
        </Panel>
      </div>
    </div>
  );
}
