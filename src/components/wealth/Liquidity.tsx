"use client";

import { useState } from "react";
import { cx } from "@/components/ui";
import { Bar, Panel, SampleTag, Seg, Stat, StatRow, useWealth } from "./ui";
import { REPORT_DATE, entityName, local, money, sampleSeries, shortDate, signed } from "@/lib/wealth";

/** Cash today, what is confirmed to come and go, and what is only expected — never on the same line. */
export function Liquidity() {
  const { f, t, ccy } = useWealth();
  const [days, setDays] = useState<"30" | "60" | "90">("90");
  const m = (v: number, d = 2) => money(v, ccy, d);
  const end = Date.parse(`${REPORT_DATE}T12:00:00Z`) + Number(days) * 864e5;
  const ev = f.obligations.filter((o) => o.amt !== 0 && Date.parse(`${o.date}T12:00:00Z`) <= end);
  const conf = ev.filter((o) => o.confirmed).reduce((s, o) => s + o.amt, 0);
  const proj = ev.filter((o) => !o.confirmed).reduce((s, o) => s + o.amt, 0);
  const cash = t.assets.filter((a) => a.cls === "Cash");

  // chart: 30 days of sample history, then each day forward from scheduled events
  const W = 1000;
  const H = 240;
  const N = Number(days);
  const hist = sampleSeries(30, t.cash * 0.95, t.cash, 5);
  const fc: number[] = [];
  const fp: number[] = [];
  let c = t.cash;
  let p = t.cash;
  for (let d = 0; d <= N; d++) {
    const day = new Date(Date.parse(`${REPORT_DATE}T12:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
    ev.filter((o) => o.date === day).forEach((o) => {
      if (o.confirmed) c += o.amt;
      p += o.amt;
    });
    fc.push(c);
    fp.push(p);
  }
  const all = [...hist, ...fc, ...fp];
  const lo = Math.min(...all) * 0.97;
  const hi = Math.max(...all) * 1.02;
  const span = 29 + N;
  const X = (i: number) => 60 + (i / span) * (W - 76);
  const Y = (v: number) => 12 + (1 - (v - lo) / (hi - lo || 1)) * (H - 42);
  const path = (arr: number[], off: number) => arr.map((v, i) => `${i ? "L" : "M"}${X(i + off).toFixed(1)},${Y(v).toFixed(1)}`).join("");
  const byEntity = new Map<string, number>();
  cash.forEach((a) => byEntity.set(a.owner, (byEntity.get(a.owner) ?? 0) + a.usd));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[12.5px] text-d-text-2">Balances come from the latest statements. No live bank connection is in place.</p>
        <div className="ml-auto">
          <Seg
            value={days}
            onChange={setDays}
            options={[
              { id: "30", label: "30 days" },
              { id: "60", label: "60 days" },
              { id: "90", label: "90 days" },
            ]}
          />
        </div>
      </div>
      <StatRow>
        <Stat label="Cash today" value={m(t.cash)} note="from statements" />
        <Stat label="Available liquidity" value={m(t.liquid, 1)} note="cash and listed securities" />
        <Stat label={`Confirmed · next ${days} days`} value={signed(m(conf), conf)} note="notices and scheduled payments" />
        <Stat label={`Projected · next ${days} days`} value={signed(m(proj), proj)} note="expectations, not commitments" />
      </StatRow>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          title={`Cash · past 30 days and next ${days}`}
          note={<SampleTag>Sample series before today</SampleTag>}
          action={
            <span className="flex gap-3 text-[11.5px] text-d-text-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-d-text" />
                Statements
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2" style={{ borderColor: "var(--tenant-accent)" }} />
                Confirmed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-d-text-2" />
                With projections
              </span>
            </span>
          }
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
            <defs>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line y2="6" stroke="var(--d-line-strong)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x={X(29)} y={12} width={X(span) - X(29)} height={H - 42} fill="url(#hatch)" opacity={0.35} />
            {[lo, (lo + hi) / 2, hi].map((v) => (
              <g key={v}>
                <line x1={60} x2={W - 16} y1={Y(v)} y2={Y(v)} stroke="var(--d-line-soft)" />
                <text x={52} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--d-text-3)">
                  {money(v, ccy)}
                </text>
              </g>
            ))}
            <path d={path(hist, 0)} fill="none" stroke="var(--d-text)" strokeWidth={2} />
            <path d={path(fp, 29)} fill="none" stroke="var(--d-text-2)" strokeWidth={1.6} strokeDasharray="5 4" />
            <path d={path(fc, 29)} fill="none" stroke="var(--tenant-accent)" strokeWidth={2} />
            <line x1={X(29)} x2={X(29)} y1={12} y2={H - 30} stroke="var(--d-text-3)" />
            <text x={X(29) + 5} y={24} fontSize={11} fill="var(--d-text-2)">
              Today
            </text>
            {[30, 60, 90]
              .filter((d) => d <= N)
              .map((d) => (
                <text key={d} x={X(29 + d)} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--d-text-3)">
                  +{d} days
                </text>
              ))}
          </svg>
        </Panel>
        <Panel title="In the window" note={`${ev.length} events`} pad={false}>
          {ev.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12.5px] text-d-text-3">Nothing scheduled.</div>
          ) : (
            ev.map((o) => (
              <div key={o.date + o.what} className="grid grid-cols-[62px_1fr_auto] gap-3 border-b border-d-line-soft px-4 py-2.5 text-[12.5px] last:border-0">
                <span className="tabular-nums text-d-text-2">{shortDate(o.date).replace(/, \d{4}$/, "")}</span>
                <span className="min-w-0">
                  <span className="block text-d-text">{o.what}</span>
                  <span
                    className={cx("text-[11px] font-medium", o.confirmed ? "" : "text-d-text-3")}
                    style={o.confirmed ? { color: "var(--tenant-accent-ink, var(--tenant-accent))" } : undefined}
                  >
                    {o.confirmed ? "Confirmed" : "Projected"}
                    {o.status !== "Projected" ? ` · ${o.status}` : ""}
                  </span>
                </span>
                <b className={cx("font-medium tabular-nums", o.amt > 0 ? "text-d-pos" : "text-d-text")}>{signed(m(o.amt), o.amt)}</b>
              </div>
            ))
          )}
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Accounts and facilities" pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-d-line text-left text-[11px] text-d-text-3">
                  <th className="px-4 py-2 font-medium">Institution</th>
                  <th className="px-3 py-2 font-medium">Account</th>
                  <th className="px-3 py-2 font-medium">Entity</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                  <th className="px-3 py-2 text-right font-medium">In {ccy}</th>
                  <th className="px-3 py-2 font-medium">As of</th>
                </tr>
              </thead>
              <tbody>
                {cash.map((a) => (
                  <tr key={a.id} className="border-b border-d-line-soft">
                    <td className="px-4 py-2 text-d-text">{a.custodian}</td>
                    <td className="px-3 py-2 text-d-text-2">{a.name}</td>
                    <td className="px-3 py-2 text-d-text-2">{entityName(f, a.owner)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-d-text">{local(a.value, a.ccy)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-d-text">{m(a.usd)}</td>
                    <td className="px-3 py-2 tabular-nums text-d-text-2">{shortDate(a.asOf)}</td>
                  </tr>
                ))}
                {t.liabs.map((l) => (
                  <tr key={l.id} className="border-b border-d-line-soft last:border-0">
                    <td className="px-4 py-2 text-d-text">{l.lender}</td>
                    <td className="px-3 py-2 text-d-text-2">
                      {l.name} · {l.rate}
                    </td>
                    <td className="px-3 py-2 text-d-text-2">{entityName(f, l.owner)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-d-neg">{local(-l.value, l.ccy)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-d-neg">{m(-l.usd)}</td>
                    <td className="px-3 py-2 text-d-text-2">matures {l.matures.slice(0, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Cash by entity">
          {[...byEntity.entries()].map(([id, v]) => (
            <div key={id} className="mb-3">
              <div className="flex justify-between gap-3 text-[12.5px]">
                <span className="text-d-text">{entityName(f, id)}</span>
                <b className="font-medium tabular-nums text-d-text">{m(v)}</b>
              </div>
              <div className="mt-1.5">
                <Bar value={v / t.cash} color="#5F86AE" />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
