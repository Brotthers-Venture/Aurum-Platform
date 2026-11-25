"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { cx } from "@/components/ui";
import { CLASS_COLOR, Panel, Seg, btn, useWealth } from "./ui";
import { REPORT_LABEL, entityName, groupBy, maturities, money, pct, shortDate, signed, type AssetClass } from "@/lib/wealth";

type Report = "balance" | "change" | "targets" | "maturities";

export function Reports() {
  const [r, setR] = useState<Report>("balance");
  const { f } = useWealth();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Seg
          value={r}
          onChange={setR}
          options={[
            { id: "balance", label: "Balance sheet" },
            { id: "change", label: "Change in wealth" },
            { id: "targets", label: "Allocation against targets" },
            { id: "maturities", label: "Maturities" },
          ]}
        />
        <button onClick={() => window.print()} className={cx(btn, "ml-auto")}>
          <Printer size={14} /> Print or save as PDF
        </button>
      </div>
      <div className="hidden print:block">
        <div className="text-[11px] uppercase tracking-[0.14em] text-d-text-3">{f.name}</div>
      </div>
      {r === "balance" ? <Balance /> : r === "change" ? <Change /> : r === "targets" ? <Targets /> : <Maturities />}
    </div>
  );
}

function Row({ label, v, strong, indent, neg, head }: { label: string; v: string; strong?: boolean; indent?: boolean; neg?: boolean; head?: boolean }) {
  return (
    <div className={cx("flex justify-between gap-4 border-b border-d-line-soft py-1.5 text-[12.5px]", strong && "border-d-line font-semibold")}>
      <span className={cx(indent && "pl-4", strong || head ? "text-d-text" : "text-d-text-2", head && "font-medium")}>{label}</span>
      <span className={cx("tabular-nums", neg ? "text-d-neg" : "text-d-text")}>{v}</span>
    </div>
  );
}

function Balance() {
  const { f, t, ccy } = useWealth();
  const m = (v: number) => money(v, ccy, 2);
  const cls = groupBy(f, t.assets, "cls");
  return (
    <Panel title="Balance sheet" note={`as of ${REPORT_LABEL} · in ${ccy}`}>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-d-text-3">Assets</div>
          {cls.map((g) => (
            <div key={g.key}>
              <Row head label={g.key} v={m(g.usd)} />
              {g.list.map((a) => (
                <Row key={a.id} indent label={a.name} v={m(a.usd)} />
              ))}
            </div>
          ))}
          <Row strong label="Total assets" v={m(t.gross)} />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-d-text-3">Liabilities</div>
          {t.liabs.map((l) => (
            <Row key={l.id} label={`${l.name} · ${entityName(f, l.owner)}`} v={m(-l.usd)} neg />
          ))}
          <Row strong label="Total liabilities" v={m(-t.debt)} neg />
          <div className="mt-6" />
          <Row strong label="Net worth" v={m(t.net)} />
          <Row label="Debt to assets" v={pct(t.debt / t.gross)} />
          <Row label="Liquid share of assets" v={pct(t.liquid / t.gross)} />
        </div>
      </div>
    </Panel>
  );
}

function Change() {
  const { f, t, ccy } = useWealth();
  const steps = [
    { label: "Net worth, 1 January", v: t.start, total: true },
    { label: "Investment return", v: t.investmentReturn },
    { label: "Contributions and withdrawals", v: f.ytd.flows },
    { label: "Currency effect", v: f.ytd.fx },
    { label: `Net worth, ${REPORT_LABEL}`, v: t.net, total: true },
  ];
  const lo = Math.min(t.start, t.net) * 0.94;
  const hi = Math.max(t.start, t.net, t.start + t.investmentReturn) * 1.01;
  const W = 1000;
  const H = 280;
  const X = (v: number) => 230 + ((v - lo) / (hi - lo)) * (W - 330);
  let run = 0;
  return (
    <Panel title="Change in wealth" note="year to date">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
        {steps.map((s, i) => {
          const y = 18 + i * 50;
          let a: number;
          let b: number;
          if (s.total) {
            a = lo;
            b = s.v;
            run = s.v;
          } else {
            a = run;
            b = run + s.v;
            run = b;
          }
          const x1 = X(Math.min(a, b));
          const x2 = X(Math.max(a, b));
          const color = s.total ? "var(--d-text-2)" : s.v >= 0 ? "var(--tenant-accent)" : "var(--d-text-3)";
          return (
            <g key={s.label}>
              <text x={0} y={y + 20} fontSize={12.5} fill="var(--d-text)" fontWeight={s.total ? 600 : 400}>
                {s.label}
              </text>
              <rect x={x1} y={y + 6} width={Math.max(2, x2 - x1)} height={22} rx={3} fill={color} opacity={s.total ? 0.35 : 0.9} />
              <text x={x2 + 8} y={y + 21} fontSize={12} fill="var(--d-text)" className="tabular-nums" fontWeight={600}>
                {s.total ? money(s.v, ccy, 2) : signed(money(s.v, ccy, 2), s.v)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[11.5px] text-d-text-3">
        Investment return is the sum of each holding&apos;s result this year. Contributions and withdrawals include spending, taxes and fees paid from the portfolio.
      </p>
    </Panel>
  );
}

function Targets() {
  const { f, t, ccy } = useWealth();
  const targets = f.targets ?? {};
  const cls = groupBy(f, t.assets, "cls");
  const keys = [...new Set([...Object.keys(targets), ...cls.map((c) => c.key)])] as AssetClass[];
  if (!Object.keys(targets).length)
    return <Panel title="Allocation against targets">No targets set for this family yet. The office agrees them with you in the annual review.</Panel>;
  return (
    <Panel title="Allocation against targets" note="agreed in the investment policy · differences beyond 3 points are highlighted" pad={false}>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-d-line text-left text-[11px] text-d-text-3">
            <th className="px-4 py-2 font-medium">Asset class</th>
            <th className="px-3 py-2 text-right font-medium">Value</th>
            <th className="px-3 py-2 text-right font-medium">Actual</th>
            <th className="px-3 py-2 text-right font-medium">Target</th>
            <th className="w-[40%] px-3 py-2 font-medium">Difference</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const v = cls.find((c) => c.key === k)?.usd ?? 0;
            const actual = v / t.gross;
            const target = targets[k];
            const diff = target === undefined ? undefined : actual - target;
            const big = diff !== undefined && Math.abs(diff) > 0.03;
            return (
              <tr key={k} className="border-b border-d-line-soft last:border-0">
                <td className="px-4 py-2">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: CLASS_COLOR[k] }} />
                  <span className="text-d-text">{k}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-d-text-2">{money(v, ccy)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-d-text">{pct(actual)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-d-text-2">{target === undefined ? "—" : pct(target, 0)}</td>
                <td className="px-3 py-2">
                  {diff === undefined ? (
                    <span className="text-[11.5px] text-d-text-3">no target</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="relative h-2 flex-1 rounded-full bg-d-raise">
                        <span className="absolute inset-y-[-3px] left-1/2 w-px bg-d-line-strong" />
                        <span
                          className="absolute inset-y-0 rounded-full"
                          style={{
                            left: diff < 0 ? `${50 + Math.max(-50, diff * 250)}%` : "50%",
                            width: `${Math.min(50, Math.abs(diff) * 250)}%`,
                            background: big ? "var(--d-warn)" : "var(--d-text-3)",
                          }}
                        />
                      </div>
                      <span className={cx("w-[56px] text-right text-[12px] font-semibold tabular-nums", big ? "text-d-warn" : "text-d-text-2")}>
                        {signed((diff * 100).toFixed(1), diff)} pt
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function Maturities() {
  const { f, t, ccy } = useWealth();
  const rows = maturities(f, t);
  return (
    <Panel title="Maturities" note="bonds, fund terms and loan facilities, in date order" pad={false}>
      {rows.map((r) => (
        <div key={r.date + r.what} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 border-b border-d-line-soft px-4 py-2.5 text-[12.5px] last:border-0">
          <span className="tabular-nums text-d-text-2">{shortDate(r.date)}</span>
          <span>
            <span className="block text-d-text">{r.what}</span>
            <span className="text-[11px] text-d-text-3">{r.kind}</span>
          </span>
          <b className={cx("font-medium tabular-nums", r.usd < 0 ? "text-d-neg" : "text-d-text")}>{money(r.usd, ccy, 2)}</b>
        </div>
      ))}
    </Panel>
  );
}
