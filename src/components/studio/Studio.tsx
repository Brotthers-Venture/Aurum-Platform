"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Archive, ArrowRight, Copy, History, MoreHorizontal, Plus, RotateCcw, Search, X } from "lucide-react";
import { cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { PageHead, StatusPill } from "@/components/gp/GpKit";
import { useDismiss } from "@/components/shell/WorkstationTopBar";
import { fundById, funds } from "@/lib/data";
import { partnerRows } from "@/lib/reporting/figures";
import { FAMILIES } from "@/lib/wealth";
import { LOCALES, type Locale } from "@/lib/studio/i18n";
import { buildTemplate } from "@/lib/studio/templates";
import { date } from "@/lib/format";
import { CURRENT_PERIOD, periodName, prevPeriod, reportable, type Period } from "@/lib/reporting/figures";
import { useReporting } from "@/lib/reporting/store";
import { REPORT_STATUS, TEMPLATES, type Design, type Report, type ReportStatus, type Template } from "@/lib/studio/model";
import { allReports, dataFor, liveData, studio, subjectLongName, subjectName, useStudio } from "@/lib/studio/store";
import { PAGE_H, PAGE_W, ReportPage, useLook } from "./Render";

const btn = "inline-flex h-9 items-center gap-2 rounded-[8px] px-3.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const primary = cx(btn, "bg-brand text-brand-ink hover:opacity-90");
const secondary = cx(btn, "border border-stone-200 text-ink-900 hover:bg-stone-100");

/** A report's cover, scaled down: the real page, not a picture of it. */
export function Cover({ report, width = 200 }: { report: Pick<Report, "fundId" | "period" | "design" | "pages" | "snapshot"> & Partial<Report>; width?: number }) {
  const closes = useReporting();
  const look = useLook(report);
  const data = useMemo(() => dataFor(report, closes), [report, closes]);
  const k = width / PAGE_W;
  return (
    <div
      className="overflow-hidden rounded-[3px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12),0_10px_28px_-16px_rgba(0,0,0,0.45)]"
      style={{ width, height: PAGE_H * k }}
      aria-hidden
    >
      <div style={{ transform: `scale(${k})`, transformOrigin: "0 0", width: PAGE_W, height: PAGE_H, pointerEvents: "none" }}>
        <ReportPage report={report as Report} data={data} page={report.pages[0]} index={0} look={look} mode="print" />
      </div>
    </div>
  );
}

export function StudioHome() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const tab = params.get("tab") === "templates" ? "templates" : "library";
  return (
    <div>
      <PageHead
        eyebrow="Reporting"
        title="Report Studio"
        meta="Compose, review and publish institutional reports from the fund’s own records. Every figure is linked to the books and every report follows the manager’s brand."
        action={
          tab === "library" ? (
            <button onClick={() => router.replace(`${path}?tab=templates`)} className={primary}>
              <Plus size={15} /> New report
            </button>
          ) : undefined
        }
      />
      <div className="mb-4 flex items-end gap-1 border-b border-stone-200 px-1" role="tablist" aria-label="Report Studio">
        {(
          [
            ["library", "Library"],
            ["templates", "Templates"],
          ] as const
        ).map(([t, l]) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => router.replace(t === "library" ? path : `${path}?tab=${t}`)}
            className={cx("relative h-10 px-3 text-[13px] font-semibold", tab === t ? "text-ink-900" : "text-stone-500 hover:text-ink-900")}
          >
            {l}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[var(--d-accent)]" />}
          </button>
        ))}
        <Link href="/admin/fund/quarter-close" className="mb-2.5 ml-auto inline-flex items-center gap-1 text-[12.5px] text-stone-500 hover:text-ink-900">
          Quarterly packages are approved in Quarter close <ArrowRight size={12} />
        </Link>
      </div>
      {tab === "library" ? <Library /> : <Gallery />}
    </div>
  );
}

/* ───────── library ───────── */

function Library() {
  const s = useStudio();
  const { member, can } = usePreviewRole();
  const who = member.name;
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"active" | ReportStatus>("active");
  const [fund, setFund] = useState("all");
  const [history, setHistory] = useState<Report | null>(null);
  const reports = allReports(s);
  const shown = reports.filter(
    (r) =>
      (status === "active" ? r.status !== "archived" : r.status === status) &&
      (fund === "all" || r.fundId === fund) &&
      `${r.name} ${subjectLongName(r.fundId)}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const fundsInUse = [...new Set(reports.map((r) => r.fundId))];
  const sel = "h-9 rounded-[8px] border border-stone-200 bg-transparent px-2.5 text-[13px] text-ink-900 focus:outline-none";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex h-9 w-full max-w-[300px] items-center gap-2 rounded-[8px] border border-stone-200 px-2.5 text-stone-500 focus-within:border-stone-300">
          <Search size={14} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports"
            aria-label="Search reports"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 placeholder:text-stone-400 focus:outline-none"
          />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status" className={sel}>
          <option value="active">All current</option>
          {(Object.keys(REPORT_STATUS) as ReportStatus[]).map((k) => (
            <option key={k} value={k}>
              {REPORT_STATUS[k]}
            </option>
          ))}
        </select>
        <select value={fund} onChange={(e) => setFund(e.target.value)} aria-label="Fund or family" className={sel}>
          <option value="all">All funds and families</option>
          {fundsInUse.map((id) => (
            <option key={id} value={id}>
              {subjectName(id)}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[12.5px] text-stone-500">
          {shown.length} {shown.length === 1 ? "report" : "reports"}
        </span>
      </div>
      {shown.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-stone-300 px-6 py-14 text-center text-[13px] text-stone-500">
          No reports match. {status === "active" ? "Start one from a template." : "Try another filter."}
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-8">
          {shown.map((r) => (
            <li key={r.id}>
              <ReportCard
                r={r}
                onOpen={() => router.push(`/admin/report-studio/${r.id}`)}
                onDuplicate={() => router.push(`/admin/report-studio/${studio.duplicate(r, who)}`)}
                onArchive={() => (r.status === "archived" ? studio.restore(r, who) : studio.archive(r, who))}
                onHistory={() => setHistory(r)}
                prepare={can("reports.prepare")}
              />
            </li>
          ))}
        </ul>
      )}
      {history && <VersionDrawer r={reports.find((x) => x.id === history.id) ?? history} onClose={() => setHistory(null)} />}
    </div>
  );
}

function ReportCard({
  r,
  onOpen,
  onDuplicate,
  onArchive,
  onHistory,
  prepare,
}: {
  r: Report;
  onOpen: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onHistory: () => void;
  prepare: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const ref = useDismiss(menu, () => setMenu(false));
  return (
    <div className="group">
      <button onClick={onOpen} className="block rounded-[4px] outline-offset-4 transition-transform duration-200 hover:-translate-y-0.5" aria-label={`Open ${r.name}`}>
        <Cover report={r} width={200} />
      </button>
      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="block text-left text-[13.5px] font-semibold leading-snug text-ink-900 hover:underline">
            {r.name}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-stone-500">
            <StatusPill value={REPORT_STATUS[r.status]} />
            <span>
              Edited {date(r.modified.slice(0, 10))} · {r.modifiedBy}
            </span>
          </div>
        </div>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label={`Actions for ${r.name}`}
            aria-expanded={menu}
            className="rounded-[6px] p-1 text-stone-400 hover:bg-stone-100 hover:text-ink-900"
          >
            <MoreHorizontal size={16} />
          </button>
          {menu && (
            <div className="picker-in absolute right-0 top-8 z-20 w-[200px] rounded-[10px] border border-stone-200 bg-white p-1 text-[13px] shadow-lift" role="menu">
              {[
                { l: "Open", i: <ArrowRight size={14} />, f: onOpen },
                ...(prepare ? [{ l: "Duplicate", i: <Copy size={14} />, f: onDuplicate }] : []),
                { l: "Version history", i: <History size={14} />, f: onHistory },
                ...(prepare
                  ? [{ l: r.status === "archived" ? "Restore" : "Archive", i: r.status === "archived" ? <RotateCcw size={14} /> : <Archive size={14} />, f: onArchive }]
                  : []),
              ].map((x) => (
                <button
                  key={x.l}
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    x.f();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-ink-900 hover:bg-stone-100"
                >
                  <span className="text-stone-500">{x.i}</span>
                  {x.l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function VersionDrawer({ r, onClose }: { r: Report; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside className="drawer-in flex h-full w-full max-w-[420px] flex-col bg-d-surface" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Version history">
        <div className="flex items-center gap-3 border-b border-d-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-d-text-3">Version history</div>
            <div className="truncate text-[14px] font-semibold text-d-text">{r.name}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-[6px] p-1.5 text-d-text-3 hover:bg-d-raise hover:text-d-text">
            <X size={16} />
          </button>
        </div>
        <ol className="scroll-quiet flex-1 overflow-y-auto px-5 py-4">
          {[...r.versions].reverse().map((v) => (
            <li key={v.n} className="relative flex gap-3 pb-5 last:pb-0">
              <span className="tnum mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-d-line-strong text-[11px] text-d-text-2">{v.n}</span>
              <div className="min-w-0">
                <div className="text-[13px] text-d-text">{v.note}</div>
                <div className="mt-0.5 text-[12px] text-d-text-3">
                  {v.by} · {date(v.at.slice(0, 10))} {v.at.slice(11, 16)} · {REPORT_STATUS[v.status]}
                </div>
              </div>
            </li>
          ))}
        </ol>
        {r.snapshot && (
          <div className="border-t border-d-line px-5 py-3 text-[12px] text-d-text-3">
            Data frozen {date(r.snapshot.at.slice(0, 10))} by {r.snapshot.by}. Published versions never change; corrections open a new draft.
          </div>
        )}
      </aside>
    </div>
  );
}

/* ───────── templates ───────── */

const SAMPLE_FUND = "stx-brazil-housing";
const SAMPLE_FAMILY = "halvorsen";

/** Each template's first page, built from a sample fund (or family) exactly as a new report would be. */
function TemplateThumb({ t, brand, i }: { t: Template; brand: Design["brand"]; i: number }) {
  const subjectId = t.subject === "family" ? SAMPLE_FAMILY : SAMPLE_FUND;
  const report = useMemo(() => {
    const data = liveData(subjectId, CURRENT_PERIOD);
    const investorId = t.perInvestor ? data.partners[0]?.investorId : undefined;
    const pages = buildTemplate(t.id, { subjectId, period: CURRENT_PERIOD, data, signer: "", locale: "en", investorId });
    return {
      fundId: subjectId,
      period: CURRENT_PERIOD,
      template: t.id,
      subject: t.subject,
      investorId,
      design: {
        brand: t.subject === "family" ? ("administrator" as const) : brand,
        typography: i % 3 === 2 ? ("modern" as const) : ("editorial" as const),
        cover: (["field", "light", "minimal"] as const)[i % 3],
      },
      pages: [pages[0]],
    };
  }, [t, brand, i, subjectId]);
  return <Cover width={210} report={report} />;
}

function Gallery() {
  const [brand, setBrand] = useState<Design["brand"]>("manager");
  const [use, setUse] = useState<Template | null>(null);
  const sample = fundById(SAMPLE_FUND)!;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 text-[12.5px] text-stone-600">
        <span>Preview in the identity of</span>
        <div className="inline-flex rounded-[9px] border border-stone-200 p-0.5">
          {(
            [
              ["manager", "the fund manager"],
              ["administrator", "the administrator"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setBrand(k)}
              className={cx("h-7 rounded-[7px] px-2.5 font-semibold", brand === k ? "bg-stone-100 text-ink-900" : "text-stone-500 hover:text-ink-900")}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-stone-500">
          First pages shown with {sample.shortName} (the family report with a sample family). Each manager’s logo, colours and legal details come from their brand settings.
        </span>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-x-6 gap-y-9">
        {TEMPLATES.map((t, i) => (
          <li key={t.id}>
            <button
              onClick={() => setUse(t)}
              className="block rounded-[4px] outline-offset-4 transition-transform duration-200 hover:-translate-y-0.5"
              aria-label={`Use ${t.name}`}
            >
              <TemplateThumb t={t} brand={brand} i={i} />
            </button>
            <div className="mt-3 text-[13.5px] font-semibold text-ink-900">{t.name}</div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">{t.description}</p>
            <div className="mt-1 text-[11.5px] text-stone-500">
              {t.pages} {t.pages === 1 ? "page" : "pages"} · {t.audience}
            </div>
            <button onClick={() => setUse(t)} className={cx(secondary, "mt-3 h-8 px-3 text-[12.5px]")}>
              Use this template
            </button>
          </li>
        ))}
      </ul>
      {use && <UseTemplate t={use} onClose={() => setUse(null)} />}
    </div>
  );
}

function UseTemplate({ t, onClose }: { t: Template; onClose: () => void }) {
  const router = useRouter();
  const { member, can } = usePreviewRole();
  const who = member.name;
  const closes = useReporting();
  const family = t.subject === "family";
  const options = funds.filter((f) => reportable(f.id, CURRENT_PERIOD));
  const [subjectId, setSubjectId] = useState(family ? SAMPLE_FAMILY : SAMPLE_FUND);
  const [period, setPeriod] = useState<Period>(CURRENT_PERIOD);
  const [locale, setLocale] = useState<Locale>(fundById(SAMPLE_FUND)?.currency === "BRL" && !family ? "pt" : "en");
  const partners = useMemo(() => (t.perInvestor ? partnerRows(subjectId, period) : []), [t.perInvestor, subjectId, period]);
  const [investorId, setInvestorId] = useState("");
  const investor = partners.some((p) => p.investorId === investorId) ? investorId : (partners[0]?.investorId ?? "");
  const allowed = can("reports.prepare");
  const ok = allowed && (family || (reportable(subjectId, period) && (!t.perInvestor || !!investor)));
  const sel = "mt-1 h-9 w-full rounded-[8px] border border-stone-200 bg-transparent px-2.5 text-[13px] text-ink-900 focus:outline-none";
  const create = () => router.push(`/admin/report-studio/${studio.create(t.id, subjectId, period, who, closes, { locale, investorId: t.perInvestor ? investor : undefined })}`);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="picker-in w-full max-w-[440px] rounded-[14px] border border-stone-200 bg-white p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`New ${t.name}`}
      >
        <div className="text-[15px] font-semibold text-ink-900">New {t.name}</div>
        <p className="mt-1 text-[12.5px] text-stone-500">
          {family
            ? "The report is built from the family’s records: assets, entities and borrowing, consolidated in US dollars."
            : "The report is built from the fund’s books for the quarter."}{" "}
          You can change any wording, reorder sections and choose the look afterwards.
        </p>
        <label className="mt-4 block text-[12.5px] font-semibold text-ink-900">
          {family ? "Family" : "Fund"}
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              if (!family) setLocale(fundById(e.target.value)?.currency === "BRL" ? "pt" : "en");
            }}
            className={sel}
          >
            {family
              ? FAMILIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))
              : options.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
          </select>
        </label>
        {!family && (
          <label className="mt-3 block text-[12.5px] font-semibold text-ink-900">
            Quarter
            <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={sel}>
              {[CURRENT_PERIOD, prevPeriod(CURRENT_PERIOD)].map((p) => (
                <option key={p} value={p}>
                  {periodName(p)}
                </option>
              ))}
            </select>
          </label>
        )}
        {t.perInvestor && (
          <label className="mt-3 block text-[12.5px] font-semibold text-ink-900">
            Partner
            <select value={investor} onChange={(e) => setInvestorId(e.target.value)} className={sel} disabled={!partners.length}>
              {partners.map((p) => (
                <option key={p.investorId} value={p.investorId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="mt-3 block text-[12.5px] font-semibold text-ink-900">
          Language
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className={sel}>
            {LOCALES.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11.5px] font-normal text-stone-500">
            Headings, labels, numbers and dates follow the language. Values from the records are shown as recorded.
          </span>
        </label>
        {!allowed && <p className="mt-2 text-[12.5px] text-negative">Your role can’t prepare reports. A fund accountant or the Head of Fund Services can.</p>}
        {allowed && !ok && <p className="mt-2 text-[12.5px] text-negative">This fund had no capital called by the end of {periodName(period)}, so there is nothing to report.</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className={secondary}>
            Cancel
          </button>
          <button disabled={!ok} onClick={create} className={primary}>
            Create report
          </button>
        </div>
      </div>
    </div>
  );
}
