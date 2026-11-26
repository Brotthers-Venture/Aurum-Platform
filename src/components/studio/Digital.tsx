"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, FileDown, FileText } from "lucide-react";
import { documents, fundById } from "@/lib/data";
import { date } from "@/lib/format";
import { periodName } from "@/lib/reporting/figures";
import { useReporting } from "@/lib/reporting/store";
import { STATUS_TEXT, fmt, type ReportData } from "@/lib/studio/data";
import type { Block, Report } from "@/lib/studio/model";
import { allReports, dataFor, getReport, useStudio } from "@/lib/studio/store";
import { BlockView, useLook, type Ctx, type Look } from "./Render";
import { partnerRows } from "@/lib/reporting/figures";

/**
 * The interactive edition of a report: the same blocks, data and identity as the printed report, laid out for the
 * screen — section navigation, charts that scale, tables that expand, and links to the fund's documents.
 */
export function DigitalReport({ report, data, back, docsHref }: { report: Report; data: ReportData; back?: { href: string; label: string }; docsHref?: string }) {
  const look = useLook(report);
  const fund = fundById(report.fundId)!;
  const sections = report.pages.slice(1);
  const [active, setActive] = useState(sections[0]?.id);
  const c: Ctx = { report, data, look, mode: "print", pages: report.pages };
  const docs = documents.filter((d) => d.fundId === report.fundId && d.visibility !== "Internal").sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        const top = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections]);

  const kpis = ["nav", "net_irr", "tvpi", "dpi"].map((k) => data.metrics[k]).filter(Boolean);
  return (
    <div className="min-h-dvh bg-[#f6f4f0] text-[#1b1f24]" style={{ fontFamily: look.sans }}>
      <header style={{ background: look.primary }} className="text-white">
        <div className="mx-auto max-w-[1120px] px-6 pb-12 pt-6 sm:px-10">
          <div className="flex items-center gap-4">
            {back && (
              <Link href={back.href} className="inline-flex items-center gap-1.5 text-[12.5px] text-white/70 hover:text-white">
                <ArrowLeft size={13} /> {back.label}
              </Link>
            )}
            <div className="ml-auto">{look.logo("dark", 26)}</div>
          </div>
          <div className="mt-14 text-[12.5px] text-white/70">
            {periodName(report.period)} · figures as of {date(data.asOf)}
            {data.status !== "final" ? ` · ${STATUS_TEXT[data.status]}` : ""}
          </div>
          <h1 className="mt-2 text-[38px] leading-[1.08] tracking-[-0.02em] sm:text-[52px]" style={{ fontFamily: look.heading, fontWeight: 400 }}>
            {report.pages[0].blocks.find((b) => b.type === "cover")?.type === "cover" ? (report.pages[0].blocks[0] as Extract<Block, { type: "cover" }>).title : "Report"}
          </h1>
          <div className="mt-3 text-[18px] text-white/90" style={{ fontFamily: look.heading }}>
            {fund.name}
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/20 pt-5 sm:grid-cols-4">
            {kpis.map((m) => (
              <div key={m.key}>
                <dt className="text-[12px] text-white/65">{m.label}</dt>
                <dd className="mt-1 text-[26px] tabular-nums tracking-[-0.01em]">{fmt(m, { short: true })}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-black/10 bg-[#f6f4f0]/95 backdrop-blur lg:hidden" aria-label="Sections">
        <div className="flex gap-1 overflow-x-auto px-4 py-2">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] ${active === s.id ? "bg-black/[0.07] font-semibold" : "text-[#5c6168]"}`}>
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-[1120px] gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-8 text-[13px]" aria-label="Sections">
            <div className="mb-2 text-[12px] text-[#6a7079]">In this report</div>
            <ol className="space-y-0.5">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`flex gap-2 rounded-[6px] px-2 py-1.5 ${active === s.id ? "bg-black/[0.06] font-semibold text-[#1b1f24]" : "text-[#5c6168] hover:text-[#1b1f24]"}`}
                  >
                    <span className="w-5 tabular-nums text-[#8a8f96]">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
              <li>
                <a href="#documents" className="flex gap-2 rounded-[6px] px-2 py-1.5 text-[#5c6168] hover:text-[#1b1f24]">
                  <span className="w-5" />
                  Documents
                </a>
              </li>
            </ol>
            <a
              href={`/report-studio/${report.id}?print=1`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-[8px] border border-black/15 px-3 py-1.5 text-[12.5px] font-semibold hover:bg-black/[0.04]"
            >
              <FileDown size={14} /> PDF edition
            </a>
          </nav>
        </aside>

        <main className="min-w-0 space-y-6">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-16 rounded-[4px] bg-white px-6 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:px-10 sm:py-10">
              <div className="flex flex-col gap-7">
                {s.blocks.map((b) => (
                  <Expandable key={b.id} block={b} look={look}>
                    <BlockView b={b} c={c} />
                  </Expandable>
                ))}
              </div>
            </section>
          ))}
          <section id="documents" className="scroll-mt-16 rounded-[4px] bg-white px-6 py-8 sm:px-10">
            <h2 className="text-[22px] tracking-[-0.01em]" style={{ fontFamily: look.heading, fontWeight: 500 }}>
              Documents
            </h2>
            <p className="mt-1 text-[13px] text-[#6a7079]">Notices, statements and reports for {fund.name} referred to in this report.</p>
            <ul className="mt-5 divide-y divide-black/10 border-y border-black/10">
              {docs.length ? (
                docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3 text-[13px]">
                    <FileText size={15} className="shrink-0 text-[#8a8f96]" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{d.name}</span>
                      <span className="block text-[12px] text-[#6a7079]">
                        {d.category} · {date(d.date)} · {d.size}
                      </span>
                    </span>
                    {docsHref && (
                      <Link href={docsHref} className="text-[12.5px] font-semibold underline underline-offset-2">
                        Open
                      </Link>
                    )}
                  </li>
                ))
              ) : (
                <li className="py-4 text-[13px] text-[#6a7079]">No other documents yet.</li>
              )}
            </ul>
          </section>
          <p className="px-1 text-[11.5px] leading-relaxed text-[#6a7079]">
            Prepared by Aurum Asset Management as fund administrator for {look.owner.replace(/\.$/, "")}. Commentary is supplied by the investment manager. Confidential.
          </p>
        </main>
      </div>
    </div>
  );
}

/** Long tables open on request; everything else shows in full. */
function Expandable({ block, look, children }: { block: Block; look: Look; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  const [open, setOpen] = useState(false);
  const can = block.type === "table" && block.table !== "terms";
  useEffect(() => {
    if (can && ref.current) setTall(ref.current.scrollHeight > 300);
  }, [can]);
  if (!can) return <>{children}</>;
  return (
    <div>
      <div ref={ref} className="relative overflow-hidden transition-[max-height] duration-300" style={{ maxHeight: tall && !open ? 260 : undefined }}>
        {children}
        {tall && !open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white" />}
      </div>
      {tall && (
        <button onClick={() => setOpen((o) => !o)} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: look.ink }}>
          {open ? "Show less" : "Show all rows"} <ChevronDown size={14} className={open ? "rotate-180" : ""} />
        </button>
      )}
    </div>
  );
}

/* ───────── routes ───────── */

export function DigitalPreview({ id }: { id: string }) {
  const s = useStudio();
  const closes = useReporting();
  const report = getReport(s, id);
  const data = useMemo(() => (report ? dataFor(report, closes) : null), [report, closes]);
  if (!report || !data) return <p className="p-10 text-center text-[14px]">This report doesn’t exist in this browser.</p>;
  return <DigitalReport report={report} data={data} back={{ href: `/admin/report-studio/${report.id}`, label: "Back to the editor" }} />;
}

/** For investors: only published reports of funds they are a partner in, under their manager. */
export function InvestorDigital({ gpId, investorId }: { gpId: string; investorId: string }) {
  const s = useStudio();
  const closes = useReporting();
  const params = useSearchParams();
  const report = getReport(s, params.get("id") ?? "");
  const allowed =
    !!report && report.status === "published" && fundById(report.fundId)?.gpId === gpId && partnerRows(report.fundId, report.period).some((p) => p.investorId === investorId);
  const data = useMemo(() => (report && allowed ? dataFor(report, closes) : null), [report, allowed, closes]);
  if (!report || !allowed || !data)
    return (
      <main className="mx-auto max-w-[900px] px-6 py-16 text-center">
        <p className="text-[14px] text-stone-600">This report isn’t available to you. It may not have been published yet.</p>
        <Link href={`/investor/${gpId}/documents`} className="mt-3 inline-block text-[13px] font-semibold underline underline-offset-2">
          Back to documents
        </Link>
      </main>
    );
  return <DigitalReport report={report} data={data} back={{ href: `/investor/${gpId}/documents`, label: "Documents" }} docsHref={`/investor/${gpId}/documents`} />;
}

/** Published Studio reports an investor can open, for the investor's Documents page. */
export function useInvestorReports(gpId: string, investorId: string) {
  const s = useStudio();
  return useMemo(
    () => allReports(s).filter((r) => r.status === "published" && fundById(r.fundId)?.gpId === gpId && partnerRows(r.fundId, r.period).some((p) => p.investorId === investorId)),
    [s, gpId, investorId],
  );
}
