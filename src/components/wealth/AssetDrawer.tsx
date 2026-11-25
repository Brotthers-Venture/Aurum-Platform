"use client";

import { BellRing, FileText, X } from "lucide-react";
import { cx } from "@/components/ui";
import { CLASS_COLOR, Fresh, useWealth } from "./ui";
import { WATCH, entityName, freshness, local, money, pct, shortDate, signed } from "@/lib/wealth";

/** One holding: what it is worth, where the number comes from, who owns it, what it costs, and its paperwork. */
export function AssetDrawer({ id }: { id: string }) {
  const { f, t, ccy, open } = useWealth();
  const a = t.assets.find((x) => x.id === id);
  if (!a) return null;
  const m = (v: number, d = 2) => money(v, ccy, d);
  const debt = t.liabs.find((l) => l.id === a.linkedDebt);
  const fr = freshness(a.asOf);
  const chain: string[] = [];
  let e: string | undefined = a.owner;
  while (e) {
    const en = f.entities.find((x) => x.id === e);
    chain.unshift(en ? `${en.name}${en.pct !== undefined ? ` (${en.pct}%)` : ""}` : e);
    e = en?.parent;
  }
  const rows: [string, string][] = [
    ["Value", `${m(a.usd)}${a.ccy !== ccy ? ` · ${local(a.value, a.ccy)}` : ""}`],
    ...(a.usdCost !== undefined
      ? ([
          ["Cost", m(a.usdCost)],
          ["Unrealised gain", signed(m(a.usd - a.usdCost), a.usd - a.usdCost)],
        ] as [string, string][])
      : []),
    ["Return this year", a.ytd ? `${signed(m(a.ytd), a.ytd)} · ${signed(pct(a.ytdPct), a.ytdPct)}` : "—"],
    ...(a.income ? ([["Income this year", m(a.income)]] as [string, string][]) : []),
    ["Custodian or manager", a.custodian ?? a.manager ?? "Held directly"],
    ["Country", `${a.country} · ${a.region}`],
    ["Valuation source", `${a.source} · ${shortDate(a.asOf)}`],
    ...(a.maturity ? ([["Matures", shortDate(a.maturity)]] as [string, string][]) : []),
  ];
  const pm = a.pm;
  const watch = (WATCH[f.id] ?? []).filter((w) => w.asset === a.id);

  return (
    <aside className="drawer-in fixed inset-y-0 right-0 z-40 flex w-[420px] max-w-full flex-col border-l border-d-line bg-d-surface shadow-lift" role="dialog" aria-label={a.name}>
      <header className="flex items-start gap-3 border-b border-d-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11.5px] text-d-text-3">
            <span className="h-2 w-2 rounded-full" style={{ background: CLASS_COLOR[a.cls] }} />
            {a.cls}
          </div>
          <h2 className="mt-1 text-[17px] font-semibold leading-snug text-d-text">{a.name}</h2>
          <div className="mt-1">
            <Fresh {...fr} />
          </div>
        </div>
        <button onClick={() => open(null)} aria-label="Close" className="rounded-[6px] p-1.5 text-d-text-3 hover:bg-d-raise hover:text-d-text">
          <X size={16} />
        </button>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-[12.5px]">
        <div className="font-display text-[30px] font-light tabular-nums tracking-[-0.02em] text-d-text">{m(a.usd)}</div>
        <dl>
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-d-line-soft py-1.5">
              <dt className="text-d-text-2">{k}</dt>
              <dd className="text-right tabular-nums text-d-text">{v}</dd>
            </div>
          ))}
        </dl>

        {pm && (
          <section>
            <h3 className="mb-2 text-[12px] font-semibold text-d-text">Private markets</h3>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[8px] border border-d-line bg-d-line">
              {[
                ["TVPI", (pm.dist + a.value) / pm.called],
                ["DPI", pm.dist / pm.called],
                ["RVPI", a.value / pm.called],
              ].map(([k, v]) => (
                <div key={k as string} className="bg-d-surface px-3 py-2">
                  <div className="text-[11px] text-d-text-3">{k}</div>
                  <div className="font-display text-[19px] font-light tabular-nums text-d-text">{(v as number).toFixed(2)}×</div>
                </div>
              ))}
            </div>
            <dl className="mt-2">
              {[
                ["Commitment", m(pm.commit)],
                ["Called", `${m(pm.called)} · ${pct(pm.called / pm.commit, 0)}`],
                ["Unfunded commitment", m(pm.commit - pm.called)],
                ["Distributions received", m(pm.dist)],
                ["Vintage · strategy", `${pm.vintage} · ${pm.strategy}`],
                ["Net IRR", "needs dated cash flows"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-d-line-soft py-1.5">
                  <dt className="text-d-text-2">{k}</dt>
                  <dd className={cx("text-right tabular-nums", v === "needs dated cash flows" ? "text-d-text-3" : "text-d-text")}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {a.re && (
          <section>
            <h3 className="mb-2 text-[12px] font-semibold text-d-text">Property</h3>
            <dl>
              {[
                ["Location · use", `${a.re.city} · ${a.re.type}`],
                ["Rent per year", a.re.rent ? local(a.re.rent, a.ccy) : "Owner-occupied"],
                ["Operating costs per year", local(a.re.opex, a.ccy)],
                ["Net operating income", local(a.re.rent - a.re.opex, a.ccy)],
                ...(a.re.occupancy !== undefined ? [["Occupancy", pct(a.re.occupancy, 0)]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-d-line-soft py-1.5">
                  <dt className="text-d-text-2">{k}</dt>
                  <dd className="text-right tabular-nums text-d-text">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {debt && (
          <section>
            <h3 className="mb-2 text-[12px] font-semibold text-d-text">Leverage</h3>
            <div className="rounded-[8px] border border-d-line p-3">
              <div className="flex justify-between">
                <span className="text-d-text-2">
                  {debt.name} · {debt.lender}
                </span>
                <b className="font-medium tabular-nums text-d-neg">{m(-debt.usd)}</b>
              </div>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-d-raise">
                <span style={{ width: `${(debt.usd / a.usd) * 100}%`, background: "var(--d-text-3)" }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11.5px] text-d-text-3">
                <span>Loan to value {pct(debt.usd / a.usd)}</span>
                <span>Equity {m(a.usd - debt.usd)}</span>
              </div>
              <div className="mt-1 text-[11.5px] text-d-text-3">
                {debt.rate} · matures {shortDate(debt.matures)}
              </div>
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-1 text-[12px] font-semibold text-d-text">Ownership</h3>
          <p className="leading-relaxed text-d-text-2">{chain.join(" → ")}</p>
        </section>

        {watch.length > 0 && (
          <section>
            <h3 className="mb-1 text-[12px] font-semibold text-d-text">Watching</h3>
            {watch.map((w) => (
              <div key={w.id} className="flex items-center gap-2 py-1">
                <BellRing size={13} className={w.state === "triggered" ? "text-d-warn" : "text-d-text-3"} />
                <span className="flex-1 text-d-text-2">{w.rule}</span>
                <span className={cx("text-[11.5px] font-semibold", w.state === "triggered" ? "text-d-warn" : "text-d-text-3")}>{w.state === "triggered" ? "Triggered" : "OK"}</span>
              </div>
            ))}
          </section>
        )}

        <section>
          <h3 className="mb-1 text-[12px] font-semibold text-d-text">Documents</h3>
          {a.docs?.length ? (
            a.docs.map((d) => (
              <div key={d} className="flex items-center gap-2 border-b border-d-line-soft py-1.5 last:border-0">
                <FileText size={13} className="text-d-text-3" />
                <span className="flex-1 text-d-text">{d}</span>
                <span className="text-[11px] text-d-text-3">PDF</span>
              </div>
            ))
          ) : (
            <p className="text-d-text-3">No documents attached yet.</p>
          )}
        </section>
        <p className="text-[11px] text-d-text-3">Held by {entityName(f, a.owner)}. Demo data.</p>
      </div>
    </aside>
  );
}
