"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Printer, X } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { CallNotice } from "@/components/fund/CallNotice";
import { buildNotices, ready } from "@/lib/capital-notice";
import { capitalCalls, fundById } from "@/lib/data";

/**
 * Every notice of one capital call, one US Letter page per limited partner, with the checks that must pass before
 * the notices go out. Save as PDF prints the selection; held notices print with their gaps marked.
 */
export function NoticeBook({ callId }: { callId: string }) {
  const { brand } = useBrand();
  const [only, setOnly] = useState("all");
  const call = capitalCalls.find((c) => c.id === callId);
  const f = call && fundById(call.fundId);
  if (!call || !f) return <div className="p-10 text-[14px]">This capital call does not exist.</div>;

  const notices = buildNotices(f, call, brand);
  const shown = only === "all" ? notices : notices.filter((n) => n.investor.id === only);
  const held = notices.filter((n) => !ready(n));
  const checkIds = notices[0]?.checks ?? [];

  return (
    <div className="print-root cc-book min-h-screen bg-[#E9E6E0] pb-16">
      <div className="print-chrome sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-6 py-3 text-[13px]">
          <Link href={`/admin/fund/capital-calls/${call.id}`} className="flex items-center gap-1.5 font-semibold text-[var(--tenant-ink)] hover:underline">
            <ArrowLeft size={14} /> Capital Call No. {call.number}
          </Link>
          <span className="h-5 w-px bg-black/10" />
          <span className="text-[#6B6458]">{f.name}</span>
          <label className="flex items-center gap-1.5">
            <span className="text-[11.5px] text-[#6B6458]">Notices for</span>
            <select value={only} onChange={(e) => setOnly(e.target.value)} className="h-8 max-w-[260px] rounded-[6px] border border-black/15 bg-white px-2 text-[12.5px]">
              <option value="all">All {notices.length} partners</option>
              {notices.map((n) => (
                <option key={n.investor.id} value={n.investor.id}>
                  {n.investor.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => window.print()}
            className="ml-auto flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--tenant-ink)] px-3 text-[12.5px] font-semibold text-white hover:opacity-90"
          >
            <Printer size={14} /> Save as PDF
          </button>
        </div>
      </div>

      <section className="print-chrome mx-auto mt-6 max-w-[1180px] px-6">
        <div className="rounded-[8px] border border-black/10 bg-white">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/10 px-5 py-3">
            <h1 className="text-[15px] font-semibold text-[var(--tenant-ink)]">Before these notices go out</h1>
            <span className="text-[12.5px] text-[#6B6458]">
              {held.length ? `${held.length} of ${notices.length} held until the gaps below are filled` : `All ${notices.length} ready to issue`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-black/10 text-left text-[11.5px] text-[#6B6458]">
                  <th className="px-5 py-2 font-semibold">Partner</th>
                  <th className="px-2 py-2 font-semibold">Reference</th>
                  {checkIds.map((c) => (
                    <th key={c.id} className="px-2 py-2 font-semibold">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notices.map((n) => (
                  <tr key={n.investor.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-2 font-semibold text-[var(--tenant-ink)]">{n.investor.name}</td>
                    <td className="whitespace-nowrap px-2 py-2 tabular-nums text-[#3d4652]">{n.reference}</td>
                    {n.checks.map((c) => (
                      <td key={c.id} className="px-2 py-2" title={c.detail}>
                        {c.ok ? (
                          <Check size={15} className="text-[#126e35]" aria-label={`${c.label}: ${c.detail}`} />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#b4232c]">
                            <X size={14} aria-hidden /> <span className="sr-only">{c.label}: </span>
                            <span className="whitespace-nowrap">{c.short}</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="print-pages mt-6 flex flex-col items-center gap-6 px-4">
        {shown.map((n) => (
          <CallNotice key={n.investor.id} n={n} />
        ))}
      </div>
    </div>
  );
}
