"use client";

import { useState } from "react";
import { ArrowRight, BellRing } from "lucide-react";
import { cx } from "@/components/ui";
import { AreaChart, Bar, CLASS_COLOR, PALETTE, Panel, SampleTag, Seg, Stacked, Stat, StatRow, useWealth } from "./ui";
import { REPORT_LABEL, WATCH, groupBy, money, pct, sampleSeries, shortDate, signed, type GroupKey } from "@/lib/wealth";

const PERIODS = ["1M", "3M", "YTD", "1Y", "3Y", "All"] as const;
type Period = (typeof PERIODS)[number];

export function Overview() {
  const { f, t, ccy, open, go } = useWealth();
  const [period, setPeriod] = useState<Period>("YTD");
  const [by, setBy] = useState<GroupKey>("cls");
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

  const groups = groupBy(f, t.assets, by);
  const ranked = [...t.assets].filter((a) => a.ytd !== 0).sort((a, b) => b.ytdPct - a.ytdPct);
  const parts = [
    { label: "Investment return", v: t.investmentReturn, note: "price, income and currency of each holding" },
    { label: "Contributions and withdrawals", v: f.ytd.flows, note: "money in and out, including spending and fees" },
    { label: "Currency effect", v: f.ytd.fx, note: "exchange-rate movements on holdings outside US dollars" },
  ];
  const mx = Math.max(...parts.map((p) => Math.abs(p.v)));
  const alerts = (WATCH[f.id] ?? []).filter((w) => w.state === "triggered");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-d-text-3">{f.name} · net worth</div>
          <div className="mt-2 font-display text-[56px] font-light leading-none tracking-[-0.03em] text-d-text tabular-nums max-sm:text-[40px]">{money(t.net, ccy, 2)}</div>
          <div className="mt-2 text-[13.5px] text-d-text-2">
            <b className={cx("font-semibold tabular-nums", t.change >= 0 ? "text-d-pos" : "text-d-neg")}>{signed(m(t.change, 2), t.change)}</b> this year ·{" "}
            {pct(t.change / t.start)} · as of {REPORT_LABEL}
          </div>
        </div>
        <div className="rounded-[10px] border border-d-line bg-d-surface px-4 py-3 text-[12.5px] max-sm:hidden">
          <div className="text-[11px] text-d-text-3">Relationship manager</div>
          <div className="font-semibold text-d-text">{f.rm.name}</div>
          <div className="text-d-text-3">{f.rm.title}</div>
        </div>
      </div>

      <StatRow cols={4}>
        <Stat label="Gross assets" value={m(t.gross)} note={`${t.assets.length} holdings`} />
        <Stat label="Liabilities" value={m(-t.debt)} note={`${t.liabs.length} ${t.liabs.length === 1 ? "facility" : "facilities"}`} />
        <Stat label="Available liquidity" value={m(t.liquid)} note="cash and listed securities" />
        <Stat
          label="Investment return YTD"
          value={signed(m(t.investmentReturn, 2), t.investmentReturn)}
          tone={t.investmentReturn >= 0 ? "pos" : "neg"}
          note={pct(t.investmentReturn / t.start)}
        />
      </StatRow>

      <Panel
        title="Change in wealth"
        note={<SampleTag />}
        action={<Seg size="sm" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ id: p, label: p }))} />}
        pad={false}
      >
        <div className="px-3 pb-2 pt-3">
          <AreaChart values={vals} labels={labels} fmt={(v) => money(v, ccy, Math.max(...vals) - Math.min(...vals) < 3e6 ? 1 : 0)} id={`nw-${period}`} />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr_1fr]">
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

        <Panel
          title="Allocation"
          action={
            <Seg
              size="sm"
              value={by}
              onChange={setBy}
              options={[
                { id: "cls", label: "Class" },
                { id: "ccy", label: "Currency" },
                { id: "custodian", label: "Custodian" },
              ]}
            />
          }
        >
          <Stacked
            parts={groups.map((g, i) => ({
              key: g.key,
              value: g.usd,
              color: by === "cls" ? (CLASS_COLOR[g.key as keyof typeof CLASS_COLOR] ?? PALETTE[i]) : PALETTE[i % PALETTE.length],
            }))}
          />
          <div className="mt-3 space-y-0.5">
            {groups.slice(0, 8).map((g, i) => (
              <div key={g.key} className="grid grid-cols-[10px_1fr_auto_auto] items-center gap-2 py-1 text-[12.5px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: by === "cls" ? (CLASS_COLOR[g.key as keyof typeof CLASS_COLOR] ?? PALETTE[i]) : PALETTE[i % PALETTE.length] }}
                />
                <span className="truncate text-d-text">{g.key}</span>
                <span className="tabular-nums text-d-text-3">{pct(g.usd / t.gross)}</span>
                <b className="w-[64px] text-right font-medium tabular-nums text-d-text">{m(g.usd)}</b>
              </div>
            ))}
            {groups.length > 8 && (
              <div className="pt-1 text-[11.5px] text-d-text-3">
                + {groups.length - 8} more · {m(groups.slice(8).reduce((s, g) => s + g.usd, 0))}
              </div>
            )}
          </div>
        </Panel>

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
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
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
