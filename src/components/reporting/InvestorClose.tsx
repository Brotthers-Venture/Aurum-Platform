"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { funds } from "@/lib/data";
import { date } from "@/lib/format";
import { CURRENT_PERIOD, periodName, prevPeriod, type Period } from "@/lib/reporting/figures";
import { useReporting } from "@/lib/reporting/store";
import { LetterView } from "./Letter";
import { StatementPaper } from "./Statement";
import { deriveClose, useClose } from "./useClose";
import { useInvestorReports } from "@/components/studio/Digital";

const PERIODS: Period[] = [CURRENT_PERIOD, prevPeriod(CURRENT_PERIOD)];

/** Quarterly packages published for this investor, newest first. */
export function InvestorPublished({ gpId, investorId }: { gpId: string; investorId: string }) {
  const s = useReporting();
  const rows = useMemo(
    () =>
      PERIODS.flatMap((p) =>
        funds
          .filter((f) => f.gpId === gpId)
          .map((f) => deriveClose(s, f.id, p))
          .filter((d) => d.close?.status === "published" && d.partners.some((x) => x.investorId === investorId))
          .map((d) => ({ d, p })),
      ),
    [s, gpId, investorId],
  );
  const reports = useInvestorReports(gpId, investorId);
  if (!rows.length && !reports.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-[15px] font-semibold">Quarterly reporting</h2>
      <ul className="mt-3 divide-y divide-stone-200 overflow-hidden rounded-[10px] border border-stone-200 bg-white">
        {reports.map((r) => (
          <li key={r.id}>
            <Link href={`/investor/${gpId}/documents/report?id=${r.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50">
              <FileText size={15} strokeWidth={1.5} className="shrink-0 text-stone-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">{r.name}</span>
                <span className="block text-[12px] text-stone-500">
                  Interactive report and PDF · published {date((r.versions.findLast((v) => v.status === "published")?.at ?? r.modified).slice(0, 10))}
                </span>
              </span>
              <ArrowRight size={15} className="text-stone-400" />
            </Link>
          </li>
        ))}
        {rows.map(({ d, p }) => (
          <li key={`${d.fund.id}-${p}`}>
            <Link href={`/investor/${gpId}/documents/quarterly?fund=${d.fund.id}&period=${p}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50">
              <FileText size={15} strokeWidth={1.5} className="shrink-0 text-stone-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">{periodName(p)} investor letter and capital account statement</span>
                <span className="block text-[12px] text-stone-500">
                  {d.fund.name} · published {date(d.close!.published!.at.slice(0, 10))}
                </span>
              </span>
              <ArrowRight size={15} className="text-stone-400" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InvestorQuarterly({ gpId, investorId }: { gpId: string; investorId: string }) {
  const params = useSearchParams();
  const fundId = params.get("fund") ?? "";
  const period = (PERIODS.find((p) => p === params.get("period")) ?? CURRENT_PERIOD) as Period;
  const valid = funds.some((f) => f.id === fundId && f.gpId === gpId);
  return valid ? <Quarterly fundId={fundId} period={period} gpId={gpId} investorId={investorId} /> : <Missing gpId={gpId} />;
}

function Quarterly({ fundId, period, gpId, investorId }: { fundId: string; period: Period; gpId: string; investorId: string }) {
  const d = useClose(fundId, period);
  const row = d.partners.find((p) => p.investorId === investorId);
  const report = d.report && d.report.status === "published" ? d.report : null;
  if (!d.close || d.close.status !== "published" || !row) return <Missing gpId={gpId} />;
  return (
    <main className="mx-auto max-w-[900px] px-6 py-10">
      <Link href={`/investor/${gpId}/documents`} className="inline-flex items-center gap-1.5 text-[12.5px] text-stone-500 hover:text-ink-900">
        <ArrowLeft size={13} /> Documents
      </Link>
      <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.02em]">{periodName(period)} reporting</h1>
      <p className="mt-1 text-[13.5px] text-stone-600">
        {d.fund.name} · published {date(d.close.published!.at.slice(0, 10))}
      </p>
      <h2 className="mb-3 mt-8 text-[15px] font-semibold">Investor letter</h2>
      <LetterView close={d.close} gp={d.gp} figures={d.figures} side="investor" />
      {report && (
        <Link
          href={`/investor/${gpId}/documents/report?id=${report.id}`}
          className="mt-6 flex items-center gap-3 rounded-[10px] border border-stone-200 bg-white px-5 py-3.5 hover:bg-stone-50"
        >
          <FileText size={15} strokeWidth={1.5} className="text-stone-400" />
          <span className="flex-1 text-[13.5px] font-semibold">Open the full quarterly report</span>
          <ArrowRight size={15} className="text-stone-400" />
        </Link>
      )}
      <h2 className="mb-3 mt-10 text-[15px] font-semibold">Your capital account statement</h2>
      <StatementPaper gp={d.gp} fundName={d.fund.name} currency={d.fund.currency} period={period} row={row} />
    </main>
  );
}

function Missing({ gpId }: { gpId: string }) {
  return (
    <main className="mx-auto max-w-[900px] px-6 py-16 text-center">
      <p className="text-[14px] text-stone-600">This report isn’t available. It may not have been published yet.</p>
      <Link href={`/investor/${gpId}/documents`} className="mt-3 inline-block text-[13px] font-semibold underline underline-offset-2">
        Back to documents
      </Link>
    </main>
  );
}
