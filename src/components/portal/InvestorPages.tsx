"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, FileText } from "lucide-react";
import { cx } from "@/components/ui";
import { Panel } from "@/components/workspace/LegendWorkspace";
import { StatusPill } from "@/components/gp/GpKit";
import { FigureStrip, InvHead } from "@/components/portal/InvestorKit";
import { FundMark, InvestmentCards, InvestmentsTable, ValueChart, pct1, tvpi } from "@/components/portal/InvestorWorkspace";
import type { InvCall, InvDistribution, InvDocument, InvestorView } from "@/lib/investor-portal";
import { date, money } from "@/lib/format";

const UP = "var(--color-up)";
const th = "px-3 py-2.5 text-left text-[11.5px] font-semibold text-stone-500 first:pl-4 last:pr-4";
const td = "px-3 py-[10px] first:pl-4 last:pr-4";
const tr = "border-b border-stone-100 last:border-0 hover:bg-stone-100/60";
const usd0 = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const irrText = pct1;

/* ───────── Investments ───────── */

export function InvestmentsList({ v, base, entity }: { v: InvestorView; base: string; entity: string }) {
  const end = v.total[v.total.length - 1];
  return (
    <>
      <InvHead
        eyebrow={entity}
        title="Investments"
        meta={`${v.funds.length} ${v.funds.length === 1 ? "fund" : "funds"} · amounts in each fund’s currency; totals in US dollars.`}
      />
      <FigureStrip
        items={[
          { label: "Commitment", value: usd0(end.commitment) },
          { label: "Called to date", value: usd0(end.paidIn) },
          { label: "Still to be called", value: usd0(Math.max(0, end.commitment - end.paidIn)) },
          { label: "Distributions", value: usd0(end.distributed) },
          { label: "Value", value: usd0(end.nav) },
          { label: "TVPI · Net IRR", value: `${tvpi(end).toFixed(2)}x`, note: `Net IRR ${irrText(v.irr)}` },
        ]}
      />
      <Panel title="Your funds" className="mt-2">
        <div className="overflow-x-auto max-sm:hidden">
          <InvestmentsTable v={v} base={base} />
        </div>
        <InvestmentCards v={v} base={base} />
      </Panel>
    </>
  );
}

export function FundDetail({ v, base, fundId }: { v: InvestorView; base: string; fundId: string }) {
  const f = v.funds.find((x) => x.id === fundId)!;
  const flows = useMemo(
    () =>
      f.series.map((t, i) => ({
        label: t.label,
        paidIn: Math.max(0, i ? t.paidIn - f.series[i - 1].paidIn : t.paidIn),
        distributed: Math.max(0, i ? t.distributed - f.series[i - 1].distributed : t.distributed),
      })),
    [f],
  );
  const calls = v.calls.filter((c) => c.fundId === f.id);
  const dists = v.distributions.filter((d) => d.fundId === f.id);
  const docs = v.documents.filter((d) => d.fundId === f.id);
  const L = f.local;
  const end = f.series[f.series.length - 1];
  return (
    <>
      <Link href={`${base}/investments`} className="ml-1 inline-flex items-center gap-1.5 text-[12.5px] text-d-text-3 hover:text-d-text">
        <ArrowLeft size={13} /> Investments
      </Link>
      <InvHead
        title={f.name}
        meta={`${f.strategy} · ${f.domicile} · vintage ${f.vintage} · reported in ${f.currency === "BRL" ? "Brazilian reais" : "US dollars"}`}
        action={
          <Link
            href={`${base}/documents`}
            className="inline-flex h-9 items-center gap-2 rounded-[7px] border border-stone-200 bg-white px-3.5 text-[13px] font-semibold text-ink-900 hover:bg-stone-100"
          >
            <FileText size={14} /> Statements and documents
          </Link>
        }
      />
      <FigureStrip
        items={[
          { label: "Commitment", value: money(L.commitment, f.currency) },
          {
            label: "Called to date",
            value: money(L.paidIn, f.currency),
            note: L.receivable > 0.5 ? `${money(L.receivable, f.currency)} due on an open call` : `${Math.round((L.paidIn / (L.commitment || 1)) * 100)}% of commitment`,
          },
          { label: "Still to be called", value: money(Math.max(0, L.unfunded), f.currency) },
          { label: "Distributions", value: money(L.distributed, f.currency) },
          { label: "Value", value: money(L.nav, f.currency), note: `Last valuation ${date(v.total[v.total.length - 2]?.date ?? v.today)}` },
          { label: "TVPI · Net IRR", value: `${tvpi({ paidIn: L.paidIn, distributed: L.distributed, nav: L.nav }).toFixed(2)}x`, note: `Net IRR ${irrText(f.irr)}` },
        ]}
      />
      <div className="mt-2 grid gap-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel
          title={<span>Value of your interest{f.currency === "BRL" && <span className="ml-1.5 font-normal text-stone-400">in US dollars at PTAX</span>}</span>}
          bodyClass="flex flex-col px-4 pb-3 pt-2"
        >
          <div className="h-[400px]">
            <ValueChart series={f.series} flows={flows} height={260} />
          </div>
        </Panel>
        <Panel title="Your capital account" bodyClass="px-5 py-4">
          <dl className="space-y-2 text-[13px]">
            {(
              [
                ["Capital called", money(L.paidIn, f.currency)],
                ["Less distributions", money(-L.distributed, f.currency)],
                ["Net income, gains, fees and expenses", money(L.nav - L.paidIn + L.distributed, f.currency)],
              ] as [string, string][]
            ).map(([k, val]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-stone-500">{k}</dt>
                <dd className="num text-ink-900">{val}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-stone-200 pt-2 font-semibold">
              <dt className="text-ink-900">Capital account balance</dt>
              <dd className="num text-ink-900">{money(L.nav, f.currency)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] leading-relaxed text-stone-500">
            From the fund’s books as of {date(v.today)}, using the last valuation. Your quarterly capital account statement is the record for each quarter.
          </p>
          {f.currency === "BRL" && (
            <p className="mt-2 text-[12px] text-stone-500">US dollar figures on the overview use the PTAX rate of each date (indicative when PTAX is unavailable).</p>
          )}
          <div className="mt-4 text-[12px] text-stone-500">
            In US dollars today: <span className="num text-ink-900">{usd0(end.nav)}</span>
          </div>
        </Panel>
      </div>
      <div className="mt-2 grid gap-2 xl:grid-cols-2">
        <CallsPanel calls={calls} title="Capital calls" />
        <DistributionsPanel dists={dists} />
      </div>
      <DocumentsPanel docs={docs} title="Documents for this fund" className="mt-2" />
    </>
  );
}

/* ───────── Capital activity ───────── */

export function ActivityView({ v, entity }: { v: InvestorView; entity: string }) {
  const open = v.calls.filter((c) => c.status !== "Paid");
  const next = [...open].sort((a, b) => a.due.localeCompare(b.due))[0];
  const end = v.total[v.total.length - 1];
  return (
    <>
      <InvHead
        eyebrow={entity}
        title="Capital activity"
        meta="Your share of each capital call and distribution. Wire instructions are on each call notice; always confirm them with your administrator by phone."
      />
      <FigureStrip
        items={[
          { label: "Called to date", value: usd0(end.paidIn) },
          { label: "Due on open calls", value: usd0(v.receivable), note: open.length ? `${open.length} open ${open.length === 1 ? "call" : "calls"}` : "Nothing due" },
          { label: "Next due date", value: next ? date(next.due) : "—", note: next ? `${next.fund} · Call No. ${next.number}` : undefined },
          { label: "Still to be called", value: usd0(Math.max(0, end.commitment - end.paidIn)) },
          { label: "Distributions received", value: usd0(end.distributed) },
          { label: "Net IRR", value: irrText(v.irr), note: "on money paid in and received" },
        ]}
      />
      {open.length > 0 && (
        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          {open.map((c) => (
            <section key={c.id} className="rounded-[12px] border border-attn-line bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-medium text-gold-700">
                  Capital call · {c.status === "Overdue" ? "overdue since" : "due"} {date(c.due)}
                </span>
                <StatusPill value={c.status} />
              </div>
              <h2 className="mt-2 text-[17px] font-semibold text-ink-900">
                {c.fund} — Call No. {c.number}
              </h2>
              <p className="mt-0.5 text-[12.5px] text-stone-500">{c.purpose}</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[12px] text-stone-500">Your share</div>
                  <div className="fig text-[26px] leading-none text-ink-900">{money(c.amount - c.paid, c.currency, { decimals: 2 })}</div>
                </div>
                <button type="button" className="inline-flex h-9 items-center gap-2 rounded-[7px] bg-brand px-3.5 text-[13px] font-semibold text-brand-ink hover:opacity-90">
                  <Download size={14} /> Call notice and wire instructions
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
      <div className="mt-2 grid gap-2">
        <CallsPanel calls={v.calls} title="Capital calls" showFund />
        <DistributionsPanel dists={v.distributions} showFund />
      </div>
    </>
  );
}

function CallsPanel({ calls, title, showFund }: { calls: InvCall[]; title: string; showFund?: boolean }) {
  return (
    <Panel
      title={
        <span>
          {title} <span className="ml-1 font-normal text-stone-400">{calls.length}</span>
        </span>
      }
    >
      {calls.length === 0 ? (
        <p className="px-4 py-10 text-center text-[12.5px] text-stone-500">No capital has been called yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={cx("w-full text-[12.5px]", showFund ? "min-w-[860px]" : "min-w-[560px]")}>
            <thead>
              <tr className="border-b border-stone-100">
                {showFund && <th className={th}>Fund</th>}
                <th className={th}>Call</th>
                <th className={th}>Notice</th>
                <th className={th}>Due</th>
                {showFund && <th className={th}>Purpose</th>}
                <th className={cx(th, "text-right")}>Your share</th>
                <th className={cx(th, "text-right")}>Paid</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className={tr}>
                  {showFund && (
                    <td className={td}>
                      <span className="flex items-center gap-2.5 font-semibold text-ink-900">
                        <FundMark name={c.fund} />
                        {c.fund}
                      </span>
                    </td>
                  )}
                  <td className={cx(td, "whitespace-nowrap", !showFund && "font-semibold text-ink-900")}>No. {c.number}</td>
                  <td className={cx(td, "num whitespace-nowrap text-stone-600")}>{date(c.notice)}</td>
                  <td className={cx(td, "num whitespace-nowrap text-stone-600")}>{date(c.due)}</td>
                  {showFund && <td className={cx(td, "max-w-[280px] truncate text-stone-600")}>{c.purpose}</td>}
                  <td className={cx(td, "num whitespace-nowrap text-right text-ink-900")}>{money(c.amount, c.currency)}</td>
                  <td className={cx(td, "num whitespace-nowrap text-right text-stone-600")}>{c.paid ? money(c.paid, c.currency) : "—"}</td>
                  <td className={td}>
                    <StatusPill value={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function DistributionsPanel({ dists, showFund }: { dists: InvDistribution[]; showFund?: boolean }) {
  return (
    <Panel
      title={
        <span>
          Distributions <span className="ml-1 font-normal text-stone-400">{dists.length}</span>
        </span>
      }
    >
      {dists.length === 0 ? (
        <p className="px-4 py-10 text-center text-[12.5px] text-stone-500">No distributions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-[12.5px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Date</th>
                {showFund && <th className={th}>Fund</th>}
                <th className={th}>Type</th>
                <th className={cx(th, "text-right")}>Your share</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {dists.map((d) => (
                <tr key={d.id} className={tr}>
                  <td className={cx(td, "num whitespace-nowrap text-stone-600")}>{date(d.date)}</td>
                  {showFund && (
                    <td className={td}>
                      <span className="flex items-center gap-2.5 font-semibold text-ink-900">
                        <FundMark name={d.fund} />
                        {d.fund}
                      </span>
                    </td>
                  )}
                  <td className={cx(td, "text-stone-600")}>{d.type === "Mixed" ? "Income and capital" : d.type}</td>
                  <td className={cx(td, "num whitespace-nowrap text-right")} style={{ color: UP }}>
                    +{money(d.amount, d.currency)}
                  </td>
                  <td className={td}>
                    <StatusPill value={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ───────── Documents ───────── */

function DocumentsPanel({ docs, title, className, filters }: { docs: InvDocument[]; title: string; className?: string; filters?: boolean }) {
  const [cat, setCat] = useState("All");
  const [fund, setFund] = useState("all");
  const cats = ["All", ...new Set(docs.map((d) => d.category))];
  const fundsList = [...new Map(docs.map((d) => [d.fundId, d.fund])).entries()];
  const shown = docs.filter((d) => (cat === "All" || d.category === cat) && (fund === "all" || d.fundId === fund));
  return (
    <Panel
      className={className}
      title={
        <span>
          {title} <span className="ml-1 font-normal text-stone-400">{shown.length}</span>
        </span>
      }
    >
      {filters && docs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-100 px-4 py-2.5">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cx(
                "h-7 rounded-full border px-3 text-[12px]",
                cat === c ? "border-ink-900 bg-ink-900 font-semibold text-white" : "border-stone-200 text-stone-600 hover:border-stone-300 hover:text-ink-900",
              )}
            >
              {c}
            </button>
          ))}
          {fundsList.length > 1 && (
            <select
              aria-label="Fund"
              value={fund}
              onChange={(e) => setFund(e.target.value)}
              className="ml-auto h-7 rounded-[7px] border border-stone-200 bg-white px-2 text-[12px] text-ink-900"
            >
              <option value="all">All funds</option>
              {fundsList.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="px-4 py-10 text-center text-[12.5px] text-stone-500">No documents yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] sm:min-w-[720px]">
            <thead className="max-sm:hidden">
              <tr className="border-b border-stone-100">
                <th className={th}>Document</th>
                <th className={th}>Fund</th>
                <th className={th}>Category</th>
                <th className={th}>Date</th>
                <th className={cx(th, "text-right")}>Size</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id} className={tr}>
                  <td className={td}>
                    <span className="flex items-center gap-2.5">
                      <FileText size={15} strokeWidth={1.5} className="shrink-0 text-stone-400" />
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink-900">{d.name}</span>
                        <span className="block text-[11.5px] text-stone-500 sm:hidden">
                          {d.fund} · {date(d.date)}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className={cx(td, "text-stone-600 max-sm:hidden")}>{d.fund}</td>
                  <td className={cx(td, "text-stone-600 max-sm:hidden")}>{d.category}</td>
                  <td className={cx(td, "num whitespace-nowrap text-stone-600 max-sm:hidden")}>{date(d.date)}</td>
                  <td className={cx(td, "num text-right text-stone-500 max-sm:hidden")}>{d.size}</td>
                  <td className={cx(td, "text-right")}>
                    <button type="button" aria-label={`Download ${d.name}`} className="rounded-[6px] p-1 text-stone-400 hover:bg-stone-100 hover:text-ink-900">
                      <Download size={15} strokeWidth={1.6} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function DocumentsView({ v, entity, gpName, reports }: { v: InvestorView; entity: string; gpName: string; reports: React.ReactNode }) {
  return (
    <>
      <InvHead eyebrow={entity} title="Documents" meta={`Notices, statements, reports and tax documents for your investments with ${gpName}.`} />
      {reports}
      <DocumentsPanel docs={v.documents} title="All documents" className="mt-2" filters />
    </>
  );
}

/* ───────── Subscriptions ───────── */

export function SubscriptionsView({ v, entity }: { v: InvestorView; entity: string }) {
  const progress = v.subscriptions.filter((s) => s.status !== "Countersigned");
  return (
    <>
      <InvHead eyebrow={entity} title="Subscriptions" meta="Your investor profile is saved once and reused for every subscription. You only confirm what has changed." />
      {progress.length > 0 && (
        <div className="mb-2 grid gap-2 lg:grid-cols-2">
          {progress.map((o) => (
            <Link key={o.id} href={`/subscribe/${o.fundId}`} className="group rounded-[12px] border border-stone-200 bg-white p-5 hover:border-stone-300">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-stone-500">Invited {date(o.invitedOn)}</span>
                <StatusPill value={o.status} />
              </div>
              <h2 className="mt-2 text-[17px] font-semibold text-ink-900">{o.fund}</h2>
              <div className="num mt-0.5 text-[12.5px] text-stone-500">{money(o.commitment)} commitment</div>
              <div className="mt-5 flex items-center gap-4">
                <span className="block h-1 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <span className="block h-full rounded-full bg-[var(--d-accent)]" style={{ width: `${o.progress * 100}%` }} />
                </span>
                <span className="num text-[12px] text-stone-500">{Math.round(o.progress * 100)}% complete</span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
                  Continue <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Panel
        title={
          <span>
            Completed <span className="ml-1 font-normal text-stone-400">{v.funds.length}</span>
          </span>
        }
      >
        {v.funds.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12.5px] text-stone-500">None yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Fund</th>
                  <th className={cx(th, "text-right")}>Commitment</th>
                  <th className={th}>Vintage</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {v.funds.map((f) => (
                  <tr key={f.id} className={tr}>
                    <td className={cx(td, "font-semibold text-ink-900")}>{f.name}</td>
                    <td className={cx(td, "num text-right")}>{money(f.local.commitment, f.currency)}</td>
                    <td className={cx(td, "num text-stone-600")}>{f.vintage}</td>
                    <td className={td}>
                      <StatusPill value="Countersigned" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
