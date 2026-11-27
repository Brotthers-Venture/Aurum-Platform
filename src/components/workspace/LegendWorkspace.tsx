"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronsUpDown, EyeOff, LayoutGrid, MoreVertical, Plus, SlidersHorizontal } from "lucide-react";
import { cx } from "@/components/ui";
import { Columns, Lines, MEANING } from "@/components/analytics/charts";
import { fmtShort, useAnalyticsView } from "@/components/analytics/AnalyticsPanels";
import { periodLabel, type FundAnalytics, type PeriodFx } from "@/lib/analytics";
import { pill } from "./status";

export { pill };

/* Robinhood Legend-style workspace in Aurum cream: tiled panels, dense lists, one big chart. */

const UP = "var(--color-up)"; // turquoise — gains / money returned
const DOWN = "var(--color-down)"; // brick — declines

export type WorkspaceCall = {
  id: string;
  fund: string;
  fundId: string;
  number: number;
  notice: string;
  due: string;
  amount: number;
  received: number;
  status: string;
  currency: string;
};
export type WorkspaceEvent = { id: string; title: string; status: string; side: string; type: string; href: string };
export type WorkspaceAttention = { tag: string; title: string; detail: string; href: string };

const usd0 = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const money = (v: number, ccy = "USD") => `${ccy === "BRL" ? "R$" : "$"}${Math.round(v).toLocaleString("en-US")}`;

export function Panel({
  title,
  children,
  actions,
  className,
  bodyClass,
  aside,
  tag = "var(--tenant-metal)",
}: {
  title?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  /** always visible, at the right of the header */
  aside?: ReactNode;
  className?: string;
  bodyClass?: string;
  tag?: string;
}) {
  return (
    <section className={cx("group/panel flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[12px] border border-stone-200 bg-white", className)} data-tag={tag}>
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-stone-100 px-4">
        <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-900">{title}</div>
        {aside}
        <div className="flex items-center gap-1 text-stone-400 opacity-0 transition-opacity focus-within:opacity-100 group-hover/panel:opacity-100">
          {actions}
          <button type="button" aria-label="Panel options" className="rounded-[6px] p-1 hover:bg-stone-100 hover:text-ink-900">
            <MoreVertical size={15} />
          </button>
        </div>
      </header>
      <div className={cx("min-h-0 flex-1 overflow-auto", bodyClass)}>{children}</div>
    </section>
  );
}

function Delta({ v, pct, money: m }: { v: number; pct?: boolean; money?: (n: number) => string }) {
  if (!isFinite(v) || (pct ? Math.abs(v) < 0.00005 : Math.abs(v) < 500)) return <span className="text-stone-400">—</span>;
  const up = v > 0;
  return (
    <span className="num inline-flex items-center gap-1 font-medium" style={{ color: up ? UP : DOWN }}>
      <span className="text-[9px]">{up ? "▲" : "▼"}</span>
      {pct ? `${Math.abs(v * 100).toFixed(2)}%` : (m ?? usd0)(Math.abs(v))}
    </span>
  );
}

function Spark({ values, w = 64, h = 22 }: { values: number[]; w?: number; h?: number }) {
  const v = values.filter((x) => isFinite(x));
  if (v.length < 2) return <span className="inline-block" style={{ width: w }} />;
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const pts = v.map((x, i) => `${((i / (v.length - 1)) * w).toFixed(1)},${(h - 2 - ((x - lo) / (hi - lo || 1)) * (h - 4)).toFixed(1)}`).join(" ");
  const up = v[v.length - 1] >= v[0];
  return (
    <svg width={w} height={h} aria-hidden>
      <polyline points={pts} fill="none" stroke={up ? UP : DOWN} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export type WorkspaceOptions = {
  /** workspace tabs (default: Overview, Capital activity, Investor relations) */
  tabs?: string[];
  /** show the layout controls (new layout, add widget) */
  customise?: boolean;
  /** the portfolio selector; default: one entry per GP */
  scopes?: { id: string; label: string }[];
  allLabel?: string;
  /** where a vehicle opens: `${fundBase}/${id}` */
  fundBase?: string;
  /** the action beside Portfolio; default: New call */
  primaryAction?: ReactNode;
};

export function LegendWorkspace({
  data,
  calls,
  events,
  attention,
  options = {},
}: {
  data: { periods: string[]; fx: PeriodFx[]; funds: FundAnalytics[] };
  calls: WorkspaceCall[];
  events: WorkspaceEvent[];
  attention: WorkspaceAttention[];
  options?: WorkspaceOptions;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [scope, setScope] = useState("all");
  const [range, setRange] = useState<"1Y" | "3Y" | "ITD">("3Y");
  const [hide, setHide] = useState(false);
  const [right, setRight] = useState<"attention" | "activity">("attention");
  const last = data.periods.length - 1;
  const v = useAnalyticsView(data, scope, last, "USD");
  const f = fmtShort("USD");
  const mask = (s: string) => (hide ? "••••" : s);

  const prev = v.series[v.series.length - 2];
  const qChange = prev ? v.end.nav - prev.nav - (v.end.paidIn - prev.paidIn) + (v.end.distributed - prev.distributed) : 0;
  const qPct = prev && prev.nav ? qChange / prev.nav : 0;

  const take = range === "1Y" ? 5 : range === "3Y" ? 13 : v.series.length;
  const ser = v.series.slice(-take);
  const lab = v.labels.slice(-take);

  const rows = useMemo(
    () =>
      v.perFund
        .map((p) => {
          const pr = p.f.series[last - 1];
          const ch = pr ? p.s.nav - pr.nav - (p.s.paidIn - pr.paidIn) + (p.s.distributed - pr.distributed) : 0;
          return { ...p, ch, chPct: pr && pr.nav ? ch / pr.nav : 0, spark: p.f.series.slice(-9).map((s) => s.nav) };
        })
        .filter((r) => r.s.commitment > 0),
    [v.perFund, last],
  );
  const scopes = options.scopes ?? [...new Map(data.funds.map((x) => [x.gpId, x.gpName])).entries()].map(([id, label]) => ({ id: `gp:${id}`, label }));
  const allLabel = options.allLabel ?? "All vehicles";
  const fundHref = (id: string) => `${options.fundBase ?? "/admin/fund/funds"}/${id}`;
  const customise = options.customise ?? true;

  return (
    <div className="-mx-2 space-y-2">
      {/* workspace bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-stone-200 bg-white px-2 py-1.5">
        {/* On a phone the tabs stay on one line and scroll sideways instead of wrapping. */}
        <div className="scroll-quiet flex min-w-0 max-w-full items-center gap-2 overflow-x-auto max-md:flex-1">
          {(options.tabs ?? ["Overview", "Capital activity", "Investor relations"]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cx(
                "inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-[8px] px-3 text-[13px]",
                tab === t ? "bg-champagne font-semibold text-ink-900" : "text-stone-500 hover:bg-stone-100 hover:text-ink-900",
              )}
            >
              {t === "Overview" && <LayoutGrid size={14} />}
              {t}
            </button>
          ))}
          {customise && (
            <button
              type="button"
              aria-label="New layout"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-stone-400 hover:bg-stone-100 hover:text-ink-900 max-md:hidden"
            >
              <Plus size={15} />
            </button>
          )}
        </div>
        <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[12px] text-ink-900">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: UP }} />
          Q4 2026 · period open
        </span>
        {customise && (
          <button type="button" className="inline-flex h-8 items-center gap-2 rounded-[8px] px-3 text-[13px] font-semibold text-ink-900 hover:bg-stone-100 max-md:hidden">
            Add widget <LayoutGrid size={14} />
          </button>
        )}
        <label className="relative inline-flex h-8 items-center rounded-[8px] border border-stone-200 bg-white pl-3 pr-7 text-[13px] font-semibold text-ink-900">
          <select aria-label="Portfolio" value={scope} onChange={(e) => setScope(e.target.value)} className="appearance-none bg-transparent pr-1 focus:outline-none">
            <option value="all">{allLabel}</option>
            {scopes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronsUpDown size={13} className="pointer-events-none absolute right-2 text-stone-400" />
        </label>
      </div>

      <div className="grid gap-2 xl:grid-cols-[300px_minmax(0,1fr)_380px] xl:grid-rows-[460px]">
        {/* account */}
        <Panel
          title={
            <span className="flex items-center justify-between">
              Portfolio
              {options.primaryAction !== undefined ? (
                options.primaryAction
              ) : (
                <Link href="/admin/fund/capital-calls/new" className="rounded-[7px] border border-stone-200 px-2.5 py-1 text-[12px] font-semibold text-ink-900 hover:bg-stone-100">
                  New call
                </Link>
              )}
            </span>
          }
          actions={
            <button
              type="button"
              aria-label={hide ? "Show values" : "Hide values"}
              onClick={() => setHide((h) => !h)}
              className="rounded-[6px] p-1 hover:bg-stone-100 hover:text-ink-900"
            >
              <EyeOff size={15} />
            </button>
          }
          bodyClass="px-5 py-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[12.5px] text-stone-500">{scope === "all" ? allLabel : scopes.find((o) => o.id === scope)?.label}</div>
              <div className="fig mt-1 text-[34px] leading-none text-ink-900">{mask(usd0(v.end.nav))}</div>
            </div>
          </div>
          <div className="mt-1 text-[12.5px]">
            <Delta v={qChange} />{" "}
            <span className="num" style={{ color: qChange >= 0 ? UP : DOWN }}>
              ({(qPct * 100).toFixed(2)}%)
            </span>{" "}
            <span className="text-stone-500">this quarter</span>
          </div>
          <div className="mt-5 border-t border-stone-100 pt-4 text-[13px] font-semibold text-ink-900">Overview</div>
          <dl className="mt-2 space-y-2 text-[13px]">
            {(
              [
                ["Commitments", usd0(v.end.commitment)],
                ["Called to date", `${usd0(v.end.paidIn)} (${v.end.commitment ? Math.round((v.end.paidIn / v.end.commitment) * 100) : 0}%)`],
                ["Unfunded commitments", usd0(v.end.commitment - v.end.paidIn)],
                ["Distributed to date", usd0(v.end.distributed)],
                ["TVPI · DPI", `${v.m.tvpi.toFixed(2)}x · ${v.m.dpi.toFixed(2)}x`],
                ["Net IRR", v.irr === null ? "—" : `${(v.irr * 100).toFixed(1)}%`],
              ] as [string, string][]
            ).map(([k, val]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-stone-500">{k}</dt>
                <dd className="num text-ink-900">{mask(val)}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* chart */}
        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold">NAV</span>
              <span className="num text-stone-500">{f(v.end.nav)}</span>
              <Delta v={qChange} money={f} />
            </span>
          }
          actions={
            <button type="button" aria-label="Chart settings" className="rounded-[6px] p-1 hover:bg-stone-100 hover:text-ink-900">
              <SlidersHorizontal size={15} />
            </button>
          }
          tag={MEANING.value}
          bodyClass="flex flex-col px-4 pb-3 pt-2"
        >
          <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
            <span className="rounded-[6px] bg-up-bg px-2 py-0.5 font-semibold" style={{ color: UP }}>
              Distributions {f(v.periodFlows.slice(-take).reduce((a, p) => a + p.returned, 0))}
            </span>
            <span className="rounded-[6px] bg-stone-100 px-2 py-0.5 font-semibold text-ink-900">Calls {f(v.periodFlows.slice(-take).reduce((a, p) => a + p.called, 0))}</span>
            <span className="num text-stone-500">
              Paid-in <span className="text-ink-900">{f(v.end.paidIn)}</span> · TVPI <span className="text-ink-900">{v.m.tvpi.toFixed(2)}x</span>
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <Lines
              categories={lab}
              series={[
                { name: "NAV", color: MEANING.value, values: ser.map((s) => s.nav) },
                { name: "Paid-in", color: MEANING.capitalIn, values: ser.map((s) => s.paidIn) },
              ]}
              fmt={f}
              height={250}
            />
            <Columns
              categories={lab}
              series={[
                { name: "Called", color: "var(--color-stone-300)", values: v.periodFlows.slice(-take).map((p) => p.called) },
                { name: "Distributed", color: UP, values: v.periodFlows.slice(-take).map((p) => p.returned) },
              ]}
              fmt={f}
              height={84}
            />
          </div>
          <div className="mt-1 flex items-center gap-1 text-[12px]">
            {(["1Y", "3Y", "ITD"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cx("rounded-[6px] px-2 py-1", range === r ? "font-semibold text-ink-900" : "text-stone-400 hover:text-ink-900")}
              >
                {r}
              </button>
            ))}
            <span className="ml-3 text-stone-400">
              Interval: <span className="font-semibold text-ink-900">Quarter</span>
            </span>
            <span className="ml-auto text-stone-400">{data.fx[last].source === "PTAX" ? `BRL at PTAX ${data.fx[last].rate.toFixed(4)}` : "BRL at indicative 5.40"}</span>
          </div>
        </Panel>

        {/* recent */}
        <Panel
          title={
            <span className="inline-flex items-center gap-4">
              {(
                [
                  ["attention", "Needs attention"],
                  ["activity", "Recent activity"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRight(k)}
                  className={cx("text-[13px] font-semibold", right === k ? "text-ink-900" : "text-stone-400 hover:text-ink-900")}
                >
                  {label}
                  {k === "attention" ? <span className="ml-1 font-normal text-stone-400">{attention.length}</span> : null}
                </button>
              ))}
            </span>
          }
          bodyClass="px-4 pb-3 pt-1"
        >
          {right === "attention" ? (
            <ul>
              {attention.map((a) => (
                <li key={a.title}>
                  <Link href={a.href} className="group flex items-center gap-3 rounded-[8px] px-1 py-2.5 hover:bg-stone-100/60">
                    <span className="w-[78px] shrink-0 text-[11.5px] font-medium text-stone-500">
                      {a.tag
                        .split(" ")
                        .map((w, i) => (w.length <= 3 ? w.toUpperCase() : i ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
                        .join(" ")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-ink-900" title={a.title}>
                        {a.title}
                      </span>
                      <span className="block truncate text-[11.5px] text-stone-500" title={a.detail}>
                        {a.detail}
                      </span>
                    </span>
                    <ArrowRight size={13} className="text-stone-300 group-hover:text-ink-900" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[11.5px] font-semibold text-stone-500">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Side</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-100/60">
                    <td className="max-w-[150px] truncate py-[8px] font-semibold text-ink-900" title={e.title}>
                      <Link href={e.href}>{e.title}</Link>
                    </td>
                    <td className="py-[8px]">
                      <span className={cx("inline-flex rounded-[6px] border px-2 py-0.5 text-[11.5px]", pill[e.status] ?? "border-stone-200 text-stone-500")}>{e.status}</span>
                    </td>
                    <td className="py-[8px]" style={{ color: e.side === "Distribution" ? UP : MEANING.capitalIn }}>
                      {e.side}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        {/* positions */}
        <Panel title="Vehicles" actions={<SlidersHorizontal size={15} className="mx-1" />} bodyClass="px-4 pb-3 pt-2">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[11.5px] font-semibold text-stone-500">
                <th className="pb-2 font-semibold">Vehicle</th>
                <th className="pb-2 text-right font-semibold">NAV</th>
                <th className="pb-2 text-right font-semibold">TVPI</th>
                <th className="pb-2 pl-3 font-semibold">Last 9 quarters</th>
                <th className="pb-2 text-right font-semibold">Quarter</th>
              </tr>
            </thead>
            <tbody>
              {[...rows]
                .sort((a, b) => b.s.nav - a.s.nav)
                .map((r) => (
                  <tr key={r.f.id} className="hover:bg-stone-100/60">
                    <td className="max-w-[260px] truncate py-[9px] font-semibold text-ink-900">
                      <Link href={fundHref(r.f.id)}>{r.f.shortName}</Link>
                    </td>
                    <td className="num py-[9px] text-right text-ink-900">{mask(f(r.s.nav))}</td>
                    <td className="num py-[9px] text-right text-stone-600">{r.m.tvpi ? `${r.m.tvpi.toFixed(2)}x` : "—"}</td>
                    <td className="py-[9px] pl-3">
                      <Spark values={r.spark} w={88} />
                    </td>
                    <td className="py-[9px] text-right">
                      <Delta v={r.ch} money={f} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>

        {/* capital calls */}
        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold">Capital calls</span>
              <span className="text-stone-500">{calls.filter((c) => c.status !== "Funded").length} open</span>
            </span>
          }
          tag={MEANING.capitalIn}
          actions={<SlidersHorizontal size={15} className="mx-1" />}
        >
          <div className="scroll-quiet overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-stone-100 text-[11.5px] font-semibold text-stone-500">
                  <th className="px-4 py-2.5 text-left font-semibold">Vehicle</th>
                  <th className="px-2 py-2.5 text-left font-semibold max-2xl:hidden">Call</th>
                  <th className="px-2 py-2.5 text-left font-semibold">Due</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Amount</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Received</th>
                  <th className="w-[120px] px-2 py-2.5 text-left font-semibold max-2xl:hidden">Funded</th>
                  <th className="py-2.5 pl-2 pr-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => {
                  const pctFunded = c.amount ? c.received / c.amount : 0;
                  return (
                    <tr
                      key={c.id}
                      // The whole row opens the call; the name stays a real link for keyboard and screen-reader users.
                      onClick={(e) => !(e.target as HTMLElement).closest("a") && router.push(`/admin/fund/capital-calls/${c.id}`)}
                      className="cursor-pointer border-b border-stone-100 hover:bg-stone-100/60"
                    >
                      <td className="px-4 py-[9px] font-semibold text-ink-900" title={`${c.fund}, call No. ${c.number}`}>
                        {/* Table cells grow to fit their content, so the width cap sits on the link itself. */}
                        <Link href={`/admin/fund/capital-calls/${c.id}`} className="block max-w-[200px] truncate hover:underline 2xl:max-w-[320px]">
                          {c.fund}
                        </Link>
                      </td>
                      <td className="num whitespace-nowrap px-2 py-[9px] text-stone-600 max-2xl:hidden">No. {c.number}</td>
                      <td className="num whitespace-nowrap px-2 py-[9px] text-stone-600">{c.due}</td>
                      <td className="num whitespace-nowrap px-2 py-[9px] text-right text-ink-900">{mask(money(c.amount, c.currency))}</td>
                      {/* The bar and the status already say how funded a call is; the amount stays plain. */}
                      <td className="num whitespace-nowrap px-2 py-[9px] text-right text-ink-900">{mask(money(c.received, c.currency))}</td>
                      {/* Narrower cards drop the bar: the status and the received amount already carry it. */}
                      <td className="px-2 py-[9px] max-2xl:hidden">
                        <span className="block h-1 w-full overflow-hidden rounded-full bg-stone-100">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${Math.min(100, pctFunded * 100)}%`, background: pctFunded >= 1 ? UP : MEANING.capitalIn }}
                          />
                        </span>
                      </td>
                      <td className="py-[9px] pl-2 pr-4">
                        <span className={cx("inline-flex whitespace-nowrap rounded-[6px] border px-2 py-0.5 text-[11.5px]", pill[c.status] ?? "border-stone-200 text-stone-500")}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <p className="px-2 text-right text-[11px] text-stone-400">As of {periodLabel(data.periods[last]) === "Today" ? "today" : data.periods[last]} · USD</p>
    </div>
  );
}
