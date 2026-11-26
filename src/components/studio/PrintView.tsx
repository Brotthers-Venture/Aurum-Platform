"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useReporting } from "@/lib/reporting/store";
import { STATUS_TEXT } from "@/lib/studio/data";
import { REPORT_STATUS } from "@/lib/studio/model";
import { dataFor, getReport, useStudio } from "@/lib/studio/store";
import { ReportPage, useLook } from "./Render";

/**
 * The print-ready report: real pages of real text and vector charts, paginated for A4. The browser's print engine
 * embeds the fonts and keeps text selectable; nothing here is a screenshot.
 */
export function PrintView({ id }: { id: string }) {
  const s = useStudio();
  const closes = useReporting();
  const params = useSearchParams();
  const report = getReport(s, id);
  const look = useLook(report ?? { fundId: "stx-brazil-housing", design: { brand: "manager", typography: "editorial", cover: "field" } });
  const data = useMemo(() => (report ? dataFor(report, closes) : null), [report, closes]);
  const auto = params.get("print") === "1";

  useEffect(() => {
    if (!auto || !report) return;
    let done = false;
    document.fonts.ready.then(() => {
      if (!done) window.setTimeout(() => window.print(), 300);
    });
    return () => {
      done = true;
    };
  }, [auto, report]);

  if (!report || !data) return <p className="p-10 text-center text-[14px]">This report doesn’t exist in this browser.</p>;

  return (
    <div className="print-root min-h-dvh bg-[#e9e7e3] text-[#1b1f24]">
      <div className="print-chrome sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 bg-[#f4f2ee]/95 px-5 py-2.5 text-[13px] backdrop-blur">
        <Link href={`/admin/report-studio/${report.id}`} className="inline-flex items-center gap-1.5 text-[#4b5159] hover:text-black">
          <ArrowLeft size={14} /> Back to the editor
        </Link>
        <span className="font-semibold">{report.name}</span>
        <span className="text-[#6a7079]">
          {REPORT_STATUS[report.status]} · data {report.snapshot ? "frozen" : "live"} · {STATUS_TEXT[data.status].toLowerCase()} figures
        </span>
        <button onClick={() => window.print()} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[7px] bg-[#1b1f24] px-3 font-semibold text-white">
          <Printer size={14} /> Print or save as PDF
        </button>
      </div>
      <div className="print-pages flex flex-col items-center gap-8 py-10">
        {report.pages.map((p, i) => (
          <div key={p.id} className="print-page shadow-[0_1px_2px_rgba(0,0,0,0.12),0_18px_50px_-26px_rgba(0,0,0,0.5)]">
            <ReportPage report={report} data={data} page={p} index={i} look={look} mode="print" />
          </div>
        ))}
      </div>
    </div>
  );
}
