"use client";

import { GpLogo } from "@/components/brand/GpLogo";
import type { GpClient } from "@/lib/gps";
import { date, money, pct } from "@/lib/format";
import { periodEnd, periodName, prevPeriod, partnerRows, type Period } from "@/lib/reporting/figures";

type Row = ReturnType<typeof partnerRows>[number];

/** One partner's capital account statement for the quarter, on paper. */
export function StatementPaper({ gp, fundName, currency, period, row }: { gp: GpClient; fundName: string; currency: "USD" | "BRL"; period: Period; row: Row }) {
  const m = (v: number) => money(v, currency);
  const lines: [string, number, boolean?][] = [
    [`Capital account at ${date(periodEnd(prevPeriod(period)))}`, row.openNav],
    ["Contributions", row.contributions],
    ["Distributions", -row.distributions],
    ["Net result allocated", row.result],
    [`Capital account at ${date(periodEnd(period))}`, row.nav, true],
  ];
  return (
    <article className="mx-auto w-full max-w-[760px] rounded-[4px] bg-[#fbfaf7] px-8 py-9 text-[#1c2025] shadow-[0_1px_2px_rgba(30,25,15,0.06),0_14px_40px_-22px_rgba(30,25,15,0.35)] ring-1 ring-black/5 sm:px-12 sm:py-10">
      <header className="flex items-end justify-between gap-6 border-b border-[#e4dfd6] pb-5">
        <GpLogo gp={gp} height={gp.logo && gp.logo.width / gp.logo.height < 3 ? 46 : 26} tone="light" />
        <div className="text-right text-[11.5px] leading-relaxed text-[#6b7078]">
          Capital account statement
          <br />
          {periodName(period)}
        </div>
      </header>
      <div className="mt-6 grid gap-1 text-[12.5px] sm:grid-cols-2">
        <div>
          <div className="text-[#6b7078]">Partner</div>
          <div className="text-[15px] font-semibold">{row.name}</div>
        </div>
        <div className="sm:text-right">
          <div className="text-[#6b7078]">Fund</div>
          <div className="text-[15px] font-semibold">{fundName}</div>
        </div>
      </div>
      <table className="mt-7 w-full text-[13px]">
        <tbody>
          {lines.map(([label, v, total]) => (
            <tr key={label} className={total ? "border-t border-[#1c2025]/70 font-semibold" : "border-b border-[#ece7de]"}>
              <td className="py-2.5">{label}</td>
              <td className="tnum py-2.5 text-right">{m(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2.5 text-[12.5px] sm:grid-cols-4">
        {[
          ["Commitment", m(row.commitment)],
          ["Paid-in to date", m(row.called)],
          ["Unfunded", m(row.unfunded)],
          ["Share of the fund", pct(row.share, 2)],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="text-[#6b7078]">{k}</div>
            <div className="tnum mt-0.5 font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-[11px] leading-relaxed text-[#8a8f96]">
        Prepared by the fund administrator from the fund’s books as of {date(periodEnd(period))}. Distributions to date: {m(row.distributed)}. Administered by{" "}
        <span className="font-serif font-semibold tracking-[0.12em]">AURUM</span> Asset Management for {gp.name.replace(/\.$/, "")}.
      </p>
    </article>
  );
}
