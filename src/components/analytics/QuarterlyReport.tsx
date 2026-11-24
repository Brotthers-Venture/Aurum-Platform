"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { GpLogo } from "@/components/brand/GpLogo";
import { cx } from "@/components/ui";
import { periodLabel, type FundAnalytics } from "@/lib/analytics";
import type { GpClient } from "@/lib/gps";
import { FlowsWidget, KpiStrip, NavWidget, SummaryWidget, fmtFull, useAnalyticsView } from "./AnalyticsPanels";
import { MiniTable, Widget } from "./Widget";

export type ReportFund = {
  id: string;
  name: string;
  currency: "USD" | "BRL";
  domicile: string;
  legalForm: string;
  vintage: number;
  strategy: string;
  managementFee: string;
  carry: string;
  hurdle: string;
  term: string;
  auditor: string;
  economicsPending: boolean;
};

const longDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const quarterTitle = (d: string) => {
  const l = periodLabel(d);
  return l === "Today" ? "Interim report" : `${l.replace(" ", " 20")} quarterly report`;
};

function Page({ gp, fund, asOf, n, total, children }: { gp: GpClient; fund: ReportFund; asOf: string; n: number; total: number; children: ReactNode }) {
  return (
    <section className="report-page relative mx-auto flex h-[794px] w-[1123px] flex-col bg-white px-12 pb-8 pt-9 shadow-[0_10px_40px_-18px_rgba(11,21,25,0.35)] print:shadow-none">
      <div className="absolute inset-x-0 top-0 h-[5px]" style={{ background: gp.brand.primary }} />
      <header className="flex items-end justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-5">
          <GpLogo gp={gp} height={30} />
          <span className="h-8 w-px bg-stone-200" />
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-500">{quarterTitle(asOf)}</div>
            <div className="font-serif text-[21px] leading-tight text-ink-900">{fund.name}</div>
          </div>
        </div>
        <div className="text-right text-[11px] leading-relaxed text-stone-500">
          As of {longDate(asOf)}
          <br />
          Reporting currency {fund.currency}
        </div>
      </header>
      <div className="flex-1 pt-5">{children}</div>
      <footer className="flex items-center justify-between border-t border-stone-200 pt-3 text-[10px] text-stone-400">
        <span className="inline-flex items-center gap-2">
          Administered by <span className="font-serif text-[10px] font-semibold tracking-[0.14em] text-ink-900">AURUM</span> Asset Management
        </span>
        <span>Confidential · prepared for the limited partners of {fund.name}</span>
        <span className="num">
          {n} / {total}
        </span>
      </footer>
    </section>
  );
}

export function QuarterlyReport({ data, fund, gp }: { data: { periods: string[]; funds: FundAnalytics[] }; fund: ReportFund; gp: GpClient }) {
  const params = useSearchParams();
  const initial = Math.max(0, data.periods.indexOf(params.get("asOf") ?? ""));
  const [asOfIdx, setAsOfIdx] = useState(initial || data.periods.length - 2);
  const v = useAnalyticsView(data, `fund:${fund.id}`, asOfIdx, fund.currency);
  const fa = data.funds.find((f) => f.id === fund.id)!;
  const k = v.k;
  const investors = fa.investors
    .slice()
    .sort((a, b) => b.commitment - a.commitment)
    .map((i) => ({ ...i, commitment: i.commitment * k, paidIn: i.paidIn * k, distributed: i.distributed * k, nav: i.nav * k }));
  const totalNav = investors.reduce((a, i) => a + i.nav, 0) || 1;
  const terms: [string, string][] = fund.economicsPending
    ? [["Economics", "Pending LPA review"]]
    : [
        ["Management fee", fund.managementFee],
        ["Carried interest", fund.carry],
        ["Preferred return", fund.hurdle],
      ];

  return (
    <div className="min-h-screen bg-stone-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex w-[1123px] items-center gap-3 print:hidden">
        <Link href="/admin/fund/analytics" className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 hover:text-ink-900">
          <ArrowLeft size={13} /> Analytics
        </Link>
        <select aria-label="Period" value={asOfIdx} onChange={(e) => setAsOfIdx(Number(e.target.value))} className="ml-auto h-8 rounded-[3px] border border-stone-300 bg-white px-2.5 text-[12.5px]">
          {data.periods.map((d, i) => (
            <option key={d} value={i}>
              {periodLabel(d) === "Today" ? "Today" : periodLabel(d).replace(" ", " 20")}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => window.print()} className="inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-ink-900 px-3 text-[12px] font-semibold text-white hover:bg-ink-800">
          <Printer size={13} /> Print / save PDF
        </button>
      </div>

      <div className="space-y-8 print:space-y-0">
        <Page gp={gp} fund={fund} asOf={v.asOf} n={1} total={2}>
          <div className="space-y-4">
            <KpiStrip v={v} />
            <div className={cx("grid grid-cols-12 gap-4")}>
              <div className="col-span-7">
                <NavWidget v={v} bare height={300} />
              </div>
              <div className="col-span-5">
                <SummaryWidget v={v} bare />
              </div>
            </div>
          </div>
        </Page>

        <Page gp={gp} fund={fund} asOf={v.asOf} n={2} total={2}>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <FlowsWidget v={v} bare height={230} />
            </div>
            <div className="col-span-5">
              <Widget title="Vehicle" bare>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
                  {(
                    [
                      ["Legal form", fund.legalForm],
                      ["Domicile", fund.domicile],
                      ["Strategy", fund.strategy],
                      ["Vintage", String(fund.vintage)],
                      ["Term", fund.term],
                      ["Auditor", fund.auditor],
                      ...terms,
                    ] as [string, string][]
                  ).map(([l, val]) => (
                    <div key={l}>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">{l}</dt>
                      <dd className="mt-0.5 text-ink-900">{val}</dd>
                    </div>
                  ))}
                </dl>
              </Widget>
            </div>
            <div className="col-span-12">
              <Widget title="Partners' capital accounts" unit={fund.currency} bare>
                <MiniTable
                  headers={["Partner", "Commitment", "Paid-in", "Unfunded", "Distributed", "NAV", "Share of NAV"]}
                  rows={[
                    ...investors.map((i) => [i.name, fmtFull(i.commitment), fmtFull(i.paidIn), fmtFull(i.commitment - i.paidIn), fmtFull(i.distributed), fmtFull(i.nav), `${((i.nav / totalNav) * 100).toFixed(1)}%`]),
                    [
                      <strong key="t">Total</strong>,
                      ...[v.end.commitment, v.end.paidIn, v.end.commitment - v.end.paidIn, v.end.distributed, v.end.nav].map((n, i) => <strong key={i}>{fmtFull(n)}</strong>),
                      <strong key="p">100.0%</strong>,
                    ],
                  ]}
                />
              </Widget>
            </div>
          </div>
        </Page>
      </div>
    </div>
  );
}
