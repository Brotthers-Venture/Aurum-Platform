"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarClock, ChevronDown, ChevronsUpDown, Download, Eye, EyeOff, FileText, MessagesSquare, MoreHorizontal, TrendingUp } from "lucide-react";
import { cx } from "@/components/ui";
import { Columns, Lines, MEANING } from "@/components/analytics/charts";
import { fmtShort } from "@/components/analytics/AnalyticsPanels";
import { Panel } from "@/components/workspace/LegendWorkspace";
import { StatusPill } from "@/components/gp/GpKit";
import { InvestorPublished } from "@/components/reporting/InvestorClose";
import type { InvestorView, InvPoint } from "@/lib/investor-portal";
import { date, money } from "@/lib/format";

const UP = "var(--color-up)";
const DOWN = "var(--color-down)";
const usd0 = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
/** A percentage with one decimal that never reads "−0.0%". */
export const pct1 = (x: number | null) => {
  if (x === null || !isFinite(x)) return "n/a";
  const r = Math.round(x * 1000) / 10;
  return `${r === 0 ? "0.0" : r.toFixed(1)}%`;
};
const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1]} ${y}`;
};

/** Change in value over a period, net of money paid in and taken out. */
export const gain = (a: InvPoint | undefined, b: InvPoint) => (a ? b.nav - a.nav - (b.paidIn - a.paidIn) + (b.distributed - a.distributed) : 0);
export const tvpi = (p: { paidIn: number; distributed: number; nav: number }) => (p.paidIn ? (p.distributed + p.nav) / p.paidIn : 0);

export function Delta({ v, f = usd0 }: { v: number; f?: (n: number) => string }) {
  if (!isFinite(v) || Math.abs(v) < 0.5) return <span className="text-stone-400">—</span>;
  const up = v > 0;
  return (
    <span className="num inline-flex items-center gap-1 font-medium" style={{ color: up ? UP : DOWN }}>
      <span className="text-[9px]">{up ? "▲" : "▼"}</span>
      {f(Math.abs(v))}
    </span>
  );
}

export function Spark({ values, w = 72, h = 22 }: { values: number[]; w?: number; h?: number }) {
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

/** Account value over time: value and capital called, with each quarter's calls and distributions underneath. */
export type Range = "1Y" | "3Y" | "ITD";

/** Period switch for the value chart. */
export function RangeSwitch({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <span role="group" aria-label="Period" className="inline-flex rounded-full border border-stone-200 p-0.5">
      {(
        [
          ["1Y", "1Y"],
          ["3Y", "3Y"],
          ["ITD", "All"],
        ] as const
      ).map(([r, label]) => (
        <button
          key={r}
          type="button"
          aria-pressed={value === r}
          title={r === "ITD" ? "Since you invested" : r === "1Y" ? "Last year" : "Last three years"}
          onClick={() => onChange(r)}
          className={cx("h-6 rounded-full px-2.5 text-[11.5px]", value === r ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-500 hover:text-ink-900")}
        >
          {label}
        </button>
      ))}
    </span>
  );
}

export function ValueChart({
  series,
  flows,
  height = 250,
  range: controlled,
}: {
  series: InvPoint[];
  flows: { label: string; paidIn: number; distributed: number }[];
  height?: number;
  /** when set, the switch lives outside (e.g. in the panel header) */
  range?: Range;
}) {
  const [own, setOwn] = useState<Range>("3Y");
  const range = controlled ?? own;
  // start where this investor's history starts
  const first = Math.max(
    0,
    series.findIndex((s) => s.commitment > 0),
  );
  const take = range === "1Y" ? 5 : range === "3Y" ? 13 : series.length;
  const from = Math.max(first, series.length - take);
  const ser = series.slice(from);
  const fl = flows.slice(from);
  const f = fmtShort("USD");
  const end = series[series.length - 1];
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
        <span className="rounded-[6px] bg-up-bg px-2 py-0.5 font-semibold" style={{ color: UP }}>
          Distributions {f(fl.reduce((a, p) => a + p.distributed, 0))}
        </span>
        <span className="rounded-[6px] bg-stone-100 px-2 py-0.5 font-semibold text-ink-900">Called {f(fl.reduce((a, p) => a + p.paidIn, 0))}</span>
        <span className="num text-stone-500 max-sm:hidden">
          Total value <span className="text-ink-900">{f(end.nav + end.distributed)}</span> · TVPI <span className="text-ink-900">{tvpi(end).toFixed(2)}x</span>
        </span>
        {controlled === undefined && (
          <span className="ml-auto">
            <RangeSwitch value={own} onChange={setOwn} />
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <Lines
          categories={ser.map((s) => s.label)}
          series={[
            { name: "Value", color: MEANING.value, values: ser.map((s) => s.nav) },
            { name: "Called", color: MEANING.capitalIn, values: ser.map((s) => s.paidIn) },
          ]}
          fmt={f}
          height={height}
          note={(i) => {
            const g = i > 0 ? gain(ser[i - 1], ser[i]) : from > 0 ? gain(series[from - 1], ser[0]) : 0;
            return (
              <div className="mt-1 flex justify-between gap-4 border-t border-stone-100 pt-1 text-[11.5px]">
                <span className="text-stone-500">Change in value</span>
                <span className="num font-semibold" style={{ color: Math.abs(g) < 0.5 ? undefined : g > 0 ? UP : DOWN }}>
                  {Math.abs(g) < 0.5 ? "—" : `${g > 0 ? "+" : "−"}${f(Math.abs(g))}`}
                </span>
              </div>
            );
          }}
        />
        <Columns
          categories={ser.map((s) => s.label)}
          series={[
            { name: "Called", color: "var(--color-stone-300)", values: fl.map((p) => p.paidIn) },
            { name: "Distributions", color: UP, values: fl.map((p) => p.distributed) },
          ]}
          fmt={f}
          height={84}
        />
      </div>
    </div>
  );
}

/** One figure over a thin bar, for the summary beside the page title. */
function Gauge({ label, value, of, share, color = "var(--d-accent)" }: { label: string; value: string; of: string; share: number; color?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className="text-stone-500">{label}</span>
        <span className="num truncate">
          <span className="font-semibold text-ink-900">{value}</span> <span className="text-stone-400">{of}</span>
        </span>
      </div>
      <span className="mt-2 block h-[5px] overflow-hidden rounded-full bg-stone-100">
        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, share * 100))}%`, background: color }} />
      </span>
    </div>
  );
}

/** Whole dollars in full ink, cents quieter. */
function Amount({ v }: { v: number }) {
  const [whole, cents] = Math.abs(v).toFixed(2).split(".");
  return (
    <>
      {v < 0 ? "−" : ""}${Number(whole).toLocaleString("en-US")}
      <span className="text-stone-400">.{cents}</span>
    </>
  );
}

/** One plain fact worth knowing now: the next payment due, otherwise the return so far. */
function Highlight({ call, irr, base, hide }: { call?: InvestorView["calls"][number]; irr: number | null; base: string; hide: boolean }) {
  if (call)
    return (
      <Link href={`${base}/activity`} className="group mt-4 block rounded-[10px] border border-attn-line bg-[color-mix(in_oklab,var(--color-gold-500)_8%,transparent)] px-4 py-3">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-gold-700">
          <CalendarClock size={13} /> {call.status === "Overdue" ? "Overdue since" : "Due"} {date(call.due)}
        </span>
        <span className="fig mt-1 block text-[24px] leading-none text-ink-900">{hide ? "••••••" : money(call.amount - call.paid, call.currency)}</span>
        <span className="mt-1 flex items-center justify-between gap-2 text-[12px] text-stone-500">
          <span className="truncate">
            {call.fund} · Capital call No. {call.number}
          </span>
          <ArrowRight size={13} className="shrink-0 text-stone-400 group-hover:text-ink-900" />
        </span>
      </Link>
    );
  return (
    <div className="mt-4 rounded-[10px] border border-stone-200 bg-[var(--d-accent-soft)] px-4 py-3">
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-stone-600">
        <TrendingUp size={13} /> Net IRR
      </span>
      <span className="fig mt-1 block text-[24px] leading-none text-ink-900">{hide ? "••••" : pct1(irr)}</span>
      <span className="mt-1 block text-[12px] text-stone-500">Yearly return on the money you have paid in and received</span>
    </div>
  );
}

type Item = { id: string; at: string; tag: string; title: string; detail: string; href: string; status?: string; label?: string; fund?: string };

export function InvestorWorkspace({ gp, entity, v }: { gp: { id: string; shortName: string }; entity: string; v: InvestorView }) {
  const base = `/investor/${gp.id}`;
  const [scope, setScope] = useState("all");
  const [hide, setHide] = useState(false);
  const [right, setRight] = useState<"attention" | "activity">("attention");
  const [range, setRange] = useState<Range>("3Y");
  const mask = (s: string) => (hide ? "••••••" : s);

  const fund = v.funds.find((f) => f.id === scope);
  const series = fund ? fund.series : v.total;
  const flows = fund
    ? fund.series.map((t, i) => ({
        label: t.label,
        paidIn: Math.max(0, i ? t.paidIn - fund.series[i - 1].paidIn : t.paidIn),
        distributed: Math.max(0, i ? t.distributed - fund.series[i - 1].distributed : t.distributed),
      }))
    : v.flows;
  const end = series[series.length - 1];
  const prev = series[series.length - 2];
  const qChange = gain(prev, end);
  const life = end.nav + end.distributed - end.paidIn;
  const irr = fund ? fund.irr : v.irr;
  const valued = v.total[v.total.length - 2]?.date;
  const nextCall = v.calls.filter((c) => c.status !== "Paid" && (!fund || c.fundId === fund.id)).sort((x, y) => x.due.localeCompare(y.due))[0];

  const attention: Item[] = [
    ...v.calls
      .filter((c) => c.status !== "Paid")
      .map((c) => ({
        id: c.id,
        at: c.due,
        tag: "Capital call",
        title: `${c.fund} — Call No. ${c.number}`,
        detail: `${money(c.amount - c.paid, c.currency)} ${c.status === "Overdue" ? "overdue since" : "due"} ${date(c.due)}`,
        href: `${base}/activity`,
      })),
    ...v.subscriptions
      .filter((s) => s.status !== "Countersigned")
      .map((s) => ({
        id: s.id,
        at: s.invitedOn,
        tag: "Subscription",
        title: s.fund,
        detail: `${Math.round(s.progress * 100)}% complete · ${s.status}`,
        href: `/subscribe/${s.fundId}`,
      })),
    ...v.distributions
      .filter((d) => d.status === "Scheduled")
      .map((d) => ({
        id: d.id,
        at: d.date,
        tag: "Distribution",
        title: `${d.fund} · ${d.type}`,
        detail: `${money(d.amount, d.currency)} on ${date(d.date)}`,
        href: `${base}/activity`,
      })),
  ];
  const activity: Item[] = [
    ...v.calls.map((c) => ({
      id: c.id,
      at: c.notice,
      tag: "Call",
      title: `${c.fund} · Call No. ${c.number}`,
      label: `Capital call No. ${c.number}`,
      fund: c.fund,
      detail: money(c.amount, c.currency),
      status: c.status,
      href: `${base}/activity`,
    })),
    ...v.distributions.map((d) => ({
      id: d.id,
      at: d.date,
      tag: "Distribution",
      title: `${d.fund} · ${d.type}`,
      label: `Distribution · ${d.type === "Mixed" ? "income and capital" : d.type.toLowerCase()}`,
      fund: d.fund,
      detail: money(d.amount, d.currency),
      status: d.status,
      href: `${base}/activity`,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (!v.funds.length)
    return (
      <div className="space-y-2">
        <Panel title="Welcome" bodyClass="px-6 py-10">
          <h2 className="text-[20px] font-semibold text-ink-900">No funded investments with {gp.shortName} yet</h2>
          <p className="mt-2 max-w-[520px] text-[13.5px] leading-relaxed text-stone-600">
            Your positions, capital calls and statements appear here once your subscription is accepted and the first capital is called.
          </p>
          {v.subscriptions.length > 0 && (
            <Link
              href={`${base}/subscriptions`}
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-[7px] bg-brand px-4 text-[13px] font-semibold text-brand-ink hover:opacity-90"
            >
              Continue your subscription <ArrowRight size={14} />
            </Link>
          )}
        </Panel>
      </div>
    );

  return (
    <div className="space-y-2">
      {/* heading with the position at a glance */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-1 pb-2 pt-1">
        <div className="min-w-0">
          <div className="text-[12.5px] text-d-text-3">
            {entity}
            {valued && <> · last valuation {longDate(valued)}</>}
          </div>
          <h1 className="mt-0.5 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-d-text">Overview</h1>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 max-sm:w-full">
          <div className="flex min-w-0 flex-1 items-stretch rounded-[12px] border border-stone-200 bg-white px-4 py-2.5 sm:min-w-[400px]">
            <Gauge
              label="Called"
              value={hide ? "••••" : fmtShort("USD")(end.paidIn)}
              of={`of ${fmtShort("USD")(end.commitment)}`}
              share={end.commitment ? end.paidIn / end.commitment : 0}
            />
            <span aria-hidden className="mx-4 w-px bg-stone-200" />
            <Gauge
              label="Returned"
              value={hide ? "••••" : fmtShort("USD")(end.distributed)}
              of={`of ${fmtShort("USD")(end.paidIn)}`}
              share={end.paidIn ? end.distributed / end.paidIn : 0}
              color={UP}
            />
          </div>
          <label className="relative inline-flex h-10 min-w-0 items-center rounded-[10px] border border-stone-200 bg-white pl-3 pr-7 text-[13px] font-semibold text-ink-900 max-sm:w-full">
            <select
              aria-label="Investment"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full min-w-0 max-w-[220px] appearance-none truncate bg-transparent pr-1 focus:outline-none max-sm:max-w-none"
            >
              <option value="all">All investments</option>
              {v.funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.shortName}
                </option>
              ))}
            </select>
            <ChevronsUpDown size={13} className="pointer-events-none absolute right-2 text-stone-400" />
          </label>
        </div>
      </header>

      <div className="grid gap-2 xl:grid-cols-[320px_minmax(0,1fr)_360px] xl:grid-rows-[468px]">
        {/* account */}
        <Panel
          title={
            <span className="inline-flex items-center gap-1.5">
              Your account
              <button
                type="button"
                aria-label={hide ? "Show values" : "Hide values"}
                aria-pressed={hide}
                title={hide ? "Show values" : "Hide values"}
                onClick={() => setHide((h) => !h)}
                className="rounded-[6px] p-1 text-stone-400 hover:bg-stone-100 hover:text-ink-900"
              >
                {hide ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </span>
          }
          bodyClass="flex flex-col px-5 py-4"
        >
          <div className="text-[12.5px] text-stone-500">{fund ? fund.name : entity}</div>
          <div className="fig mt-1 text-[34px] leading-none text-ink-900">{hide ? "••••••" : <Amount v={end.nav} />}</div>
          <div className="mt-1.5 text-[12.5px]">
            {hide ? (
              <span className="text-stone-500">Values hidden</span>
            ) : end.paidIn > 0 && Math.abs(life / end.paidIn) < 0.0005 ? (
              <span className="text-stone-500">Level with the {usd0(end.paidIn)} called, counting distributions</span>
            ) : (
              <>
                <Delta v={life} />{" "}
                {end.paidIn > 0 && (
                  <span className="num" style={{ color: life >= 0 ? UP : DOWN }}>
                    ({pct1(Math.abs(life / end.paidIn))})
                  </span>
                )}{" "}
                <span className="text-stone-500">since you invested</span>
              </>
            )}
          </div>
          <Highlight call={nextCall} irr={irr} base={base} hide={hide} />
          <dl className="mt-4 space-y-1.5 text-[13px]">
            {(
              [
                ["Commitment", usd0(end.commitment)],
                ["Called to date", usd0(end.paidIn)],
                ...(!fund && v.receivable > 0.5 ? ([["Due on open calls", usd0(v.receivable)]] as [string, string][]) : []),
                ["Still to be called", usd0(Math.max(0, end.commitment - end.paidIn))],
                ["Distributions received", usd0(end.distributed)],
                ["TVPI", `${tvpi(end).toFixed(2)}x`],
              ] as [string, string][]
            ).map(([k, val]) => (
              <div key={k} className="flex justify-between gap-3">
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
              <span className="font-semibold">Account value</span>
              <span className="num text-stone-500">{mask(fmtShort("USD")(end.nav))}</span>
              {!hide && Math.abs(qChange) >= 0.5 && <Delta v={qChange} f={fmtShort("USD")} />}
            </span>
          }
          aside={<RangeSwitch value={range} onChange={setRange} />}
          tag={MEANING.value}
          bodyClass="flex flex-col px-4 pb-3 pt-2"
        >
          {hide ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-stone-500">Values hidden</div>
          ) : (
            <ValueChart series={series} flows={flows} range={range} />
          )}
        </Panel>

        {/* attention */}
        <Panel
          title={
            <span className="inline-flex items-center gap-4">
              {(
                [
                  ["attention", "Needs your attention"],
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
          {(right === "attention" ? attention : activity.slice(0, 9)).map((a) => (
            <Link key={a.tag + a.id} href={a.href} className="group flex items-center gap-3 rounded-[8px] px-1 py-2.5 hover:bg-stone-100/60">
              <span className="w-[84px] shrink-0 text-[11.5px] font-medium text-stone-500">{right === "attention" ? a.tag : date(a.at)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-ink-900">{a.title}</span>
                <span className="num block truncate text-[11.5px] text-stone-500">{a.detail}</span>
              </span>
              {a.status ? <StatusPill value={a.status} /> : <ArrowRight size={13} className="text-stone-300 group-hover:text-ink-900" />}
            </Link>
          ))}
          {right === "attention" && attention.length === 0 && (
            <div className="px-1 py-10 text-center">
              <div className="text-[13px] font-semibold text-ink-900">You’re up to date</div>
              <p className="mt-1 text-[12px] text-stone-500">No capital calls or documents are waiting for you.</p>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title={
          <span>
            Your investments <span className="ml-1 font-normal text-stone-400">{v.funds.length}</span>
          </span>
        }
        aside={
          <Link href={`${base}/investments`} className="text-[12px] font-medium text-stone-500 hover:text-ink-900">
            All investments
          </Link>
        }
      >
        <div className="overflow-x-auto max-sm:hidden">
          <InvestmentsTable v={v} base={base} />
        </div>
        <InvestmentCards v={v} base={base} />
      </Panel>

      <div className="grid gap-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ActivityPanel items={activity} base={base} today={v.today} />
        <div className="flex min-w-0 flex-col gap-2">
          <InvestorPublished gpId={gp.id} investorId={v.investorId} panel />
          <Panel
            title="Recent documents"
            aside={
              <Link href={`${base}/documents`} className="text-[12px] font-medium text-stone-500 hover:text-ink-900">
                All documents
              </Link>
            }
          >
            <ul>
              {v.documents.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-center gap-3 border-b border-stone-100 px-4 py-2.5 text-[12.5px] last:border-0">
                  <FileText size={15} strokeWidth={1.5} className="shrink-0 text-stone-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink-900">{d.name}</span>
                    <span className="block truncate text-[11.5px] text-stone-500">
                      {d.fund} · {d.category}
                    </span>
                  </span>
                  <span className="num shrink-0 text-stone-500 max-sm:hidden">{date(d.date)}</span>
                  <button type="button" aria-label={`Download ${d.name}`} className="rounded-[6px] p-1 text-stone-400 hover:bg-stone-100 hover:text-ink-900">
                    <Download size={15} strokeWidth={1.6} />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function InvestmentsTable({ v, base }: { v: InvestorView; base: string }) {
  return (
    <table className="w-full min-w-[880px] text-[12.5px]">
      <thead>
        <tr className="border-b border-stone-100 text-left text-[11.5px] text-stone-500">
          <th className="py-2.5 pl-4 pr-3 font-semibold">Fund</th>
          <th className="px-3 py-2.5 text-right font-semibold">Commitment</th>
          <th className="w-[130px] px-3 py-2.5 font-semibold">Called</th>
          <th className="px-3 py-2.5 text-right font-semibold">Distributions</th>
          <th className="px-3 py-2.5 text-right font-semibold">Value</th>
          <th className="px-3 py-2.5 text-right font-semibold">TVPI</th>
          <th className="px-3 py-2.5 font-semibold">Last 9 quarters</th>
          <th className="py-2.5 pl-3 pr-4 text-right font-semibold">Quarter</th>
        </tr>
      </thead>
      <tbody>
        {v.funds.map((f) => {
          const s = f.series;
          const called = f.local.commitment ? f.local.paidIn / f.local.commitment : 0;
          return (
            <tr key={f.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-100/60">
              <td className="py-[10px] pl-4 pr-3">
                <Link href={`${base}/investments/${f.id}`} className="block font-semibold text-ink-900 hover:underline">
                  {f.name}
                </Link>
                <span className="block text-[11.5px] text-stone-500">
                  {f.strategy} · {f.domicile}
                </span>
              </td>
              <td className="num px-3 py-[10px] text-right">{money(f.local.commitment, f.currency)}</td>
              <td className="px-3 py-[10px]">
                <span className="flex items-center gap-2">
                  <span className="block h-1 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <span className="block h-full rounded-full" style={{ width: `${Math.min(100, called * 100)}%`, background: called >= 0.999 ? UP : "var(--d-accent)" }} />
                  </span>
                  <span className="num w-[32px] text-right text-[11.5px] text-stone-500">{Math.round(called * 100)}%</span>
                </span>
              </td>
              <td className="num px-3 py-[10px] text-right">{money(f.local.distributed, f.currency)}</td>
              <td className="num px-3 py-[10px] text-right font-semibold text-ink-900">{money(f.local.nav, f.currency)}</td>
              <td className="num px-3 py-[10px] text-right">{tvpi({ paidIn: f.local.paidIn, distributed: f.local.distributed, nav: f.local.nav }).toFixed(2)}x</td>
              <td className="px-3 py-[10px]">
                <Spark values={s.slice(-9).map((p) => p.nav)} />
              </td>
              <td className="py-[10px] pl-3 pr-4 text-right">
                <Delta v={gain(s[s.length - 2], s[s.length - 1])} f={fmtShort("USD")} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** The investments table as cards, for phones. */
export function InvestmentCards({ v, base }: { v: InvestorView; base: string }) {
  return (
    <ul className="sm:hidden">
      {v.funds.map((f) => {
        const called = f.local.commitment ? f.local.paidIn / f.local.commitment : 0;
        return (
          <li key={f.id} className="border-b border-stone-100 last:border-0">
            <Link href={`${base}/investments/${f.id}`} className="block px-4 py-3.5">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-semibold text-ink-900">{f.name}</span>
                  <span className="block text-[11.5px] text-stone-500">
                    {f.strategy} · {f.domicile}
                  </span>
                </span>
                <span className="num shrink-0 text-right font-semibold text-ink-900">{money(f.local.nav, f.currency)}</span>
              </span>
              <span className="mt-2.5 flex items-center gap-2">
                <span className="block h-1 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <span className="block h-full rounded-full" style={{ width: `${Math.min(100, called * 100)}%`, background: called >= 0.999 ? UP : "var(--d-accent)" }} />
                </span>
                <span className="num text-[11.5px] text-stone-500">
                  {Math.round(called * 100)}% of {money(f.local.commitment, f.currency)} called
                </span>
              </span>
              <span className="num mt-1.5 flex justify-between text-[11.5px] text-stone-500">
                <span>Distributions {money(f.local.distributed, f.currency)}</span>
                <span>TVPI {tvpi({ paidIn: f.local.paidIn, distributed: f.local.distributed, nav: f.local.nav }).toFixed(2)}x</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** A fund's initials in a small square, so rows can be scanned by fund. */
export function FundMark({ name }: { name: string }) {
  const letters = name
    .replace(/[^A-Za-zÀ-ÿ0-9 -]/g, "")
    .split(/[\s-]+/)
    .filter((w) => w && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-stone-200 bg-[var(--d-accent-soft)] text-[11px] font-semibold text-[var(--d-accent)]"
    >
      {letters}
    </span>
  );
}

const PERIODS = [
  ["all", "All time"],
  ["12m", "Last 12 months"],
  ["ytd", "This year"],
  ["q", "This quarter"],
] as const;

function ActivityPanel({ items, base, today }: { items: Item[]; base: string; today: string }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>("all");
  const [menu, setMenu] = useState<string | null>(null);
  const y = today.slice(0, 4);
  const q = Math.floor((Number(today.slice(5, 7)) - 1) / 3) * 3 + 1;
  const start = period === "12m" ? `${Number(y) - 1}${today.slice(4)}` : period === "ytd" ? `${y}-01-01` : period === "q" ? `${y}-${String(q).padStart(2, "0")}-01` : "";
  const shown = items.filter((a) => a.at >= start).slice(0, 8);
  return (
    <Panel
      title="Capital activity"
      aside={
        <span className="flex items-center gap-2">
          <label className="relative inline-flex h-7 items-center rounded-full border border-stone-200 pl-3 pr-6 text-[12px] text-ink-900">
            <select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} className="appearance-none bg-transparent focus:outline-none">
              {PERIODS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 text-stone-400" />
          </label>
          <Link href={`${base}/activity`} className="text-[12px] font-medium text-stone-500 hover:text-ink-900 max-sm:hidden">
            All activity
          </Link>
        </span>
      }
    >
      {shown.length === 0 ? (
        <p className="px-4 py-10 text-center text-[12.5px] text-stone-500">No capital calls or distributions in this period.</p>
      ) : (
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100 text-left text-[11.5px] text-stone-500">
              <th className="py-2.5 pl-4 pr-3 font-semibold">Activity</th>
              <th className="px-3 py-2.5 font-semibold max-sm:hidden">Date</th>
              <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
              <th className="px-3 py-2.5 font-semibold max-sm:hidden">Status</th>
              <th className="w-10 py-2.5 pr-3" />
            </tr>
          </thead>
          <tbody>
            {shown.map((a, i) => {
              const key = a.tag + a.id;
              const up = i >= 2 && i >= shown.length - 2;
              return (
                <tr key={key} className="border-b border-stone-100 last:border-0 hover:bg-stone-100/60">
                  <td className="py-[9px] pl-4 pr-3">
                    <span className="flex items-center gap-3">
                      <FundMark name={a.fund ?? ""} />
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink-900">{a.label}</span>
                        <span className="block text-[11.5px] text-stone-500">
                          <span className="sm:hidden">{date(a.at)} · </span>
                          {a.fund}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="num whitespace-nowrap px-3 py-[9px] text-stone-600 max-sm:hidden">{date(a.at)}</td>
                  <td className="num whitespace-nowrap px-3 py-[9px] text-right" style={a.tag === "Distribution" ? { color: UP } : undefined}>
                    {a.tag === "Distribution" ? "+" : ""}
                    {a.detail}
                  </td>
                  <td className="px-3 py-[9px] max-sm:hidden">{a.status && <StatusPill value={a.status} />}</td>
                  <td className="relative py-[9px] pr-3 text-right">
                    <button
                      type="button"
                      aria-label={`Actions for ${a.label}`}
                      aria-expanded={menu === key}
                      onClick={() => setMenu((m) => (m === key ? null : key))}
                      className="rounded-[6px] p-1 text-stone-400 hover:bg-stone-100 hover:text-ink-900"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menu === key && (
                      <span
                        className={cx(
                          "absolute right-3 z-20 block w-[210px]",
                          up ? "bottom-9" : "top-9",
                          " rounded-[10px] border border-stone-200 bg-white p-1 text-left shadow-lift",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setMenu(null)}
                          className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-[12.5px] text-ink-900 hover:bg-stone-100"
                        >
                          <Download size={14} className="text-stone-500" /> Download {a.tag === "Call" ? "call notice" : "distribution notice"}
                        </button>
                        <Link
                          href={`${base}/activity`}
                          onClick={() => setMenu(null)}
                          className="flex items-center gap-2 rounded-[6px] px-2.5 py-2 text-[12.5px] text-ink-900 hover:bg-stone-100"
                        >
                          <ArrowRight size={14} className="text-stone-500" /> Open in capital activity
                        </Link>
                        <Link
                          href={`${base}/messages`}
                          onClick={() => setMenu(null)}
                          className="flex items-center gap-2 rounded-[6px] px-2.5 py-2 text-[12.5px] text-ink-900 hover:bg-stone-100"
                        >
                          <MessagesSquare size={14} className="text-stone-500" /> Ask your administrator
                        </Link>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
