"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bold,
  Italic,
  Superscript,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Eye,
  FileDown,
  GripVertical,
  History,
  Link2,
  Lock,
  Maximize2,
  MessageSquare,
  MonitorSmartphone,
  Minimize2,
  PanelLeft,
  PanelRight,
  Plus,
  Snowflake,
  Trash2,
  X,
} from "lucide-react";
import { cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { StatusPill } from "@/components/gp/GpKit";
import { useDismiss } from "@/components/shell/WorkstationTopBar";
import { fundById } from "@/lib/data";
import { date } from "@/lib/format";
import { periodName } from "@/lib/reporting/figures";
import { useReporting } from "@/lib/reporting/store";
import { METRIC_GROUPS, STATUS_TEXT, fmt, type Metric, type ReportData } from "@/lib/studio/data";
import {
  BLOCK_NAME,
  CHART_NAME,
  PALETTE,
  REPORT_STATUS,
  TABLE_NAME,
  blankBlock,
  newId,
  type Block,
  type BlockType,
  type ChartKind,
  type Design,
  type Page,
  type Report,
  type ReportComment,
  type TableKind,
  templateById,
} from "@/lib/studio/model";
import type { Locale } from "@/lib/studio/i18n";
import { syncMode } from "@/lib/studio/persist";
import { dataFor, getReport, liveData, reportName, studio, subjectName, useStudio } from "@/lib/studio/store";
import { PAGE_H, PAGE_W, ReportPage, useLook } from "./Render";
import { VersionDrawer } from "./Studio";

type Sel = { kind: "report" } | { kind: "page"; pageId: string } | { kind: "block"; pageId: string; blockId: string } | { kind: "figure"; key: string };

const field =
  "mt-1 w-full rounded-[8px] border border-d-line bg-transparent px-2.5 py-1.5 text-[13px] text-d-text placeholder:text-d-text-3 focus:border-d-line-strong focus:outline-none";
const lbl = "block text-[12px] font-medium text-d-text-2";

export function ReportEditor({ id }: { id: string }) {
  const s = useStudio();
  const closes = useReporting();
  const { member, can } = usePreviewRole();
  const who = member.name;
  const report = getReport(s, id);
  const [sel, setSel] = useState<Sel>({ kind: "report" });
  const [left, setLeft] = useState(true);
  const [right, setRight] = useState(true);
  const [focus, setFocus] = useState(false);
  const [zoom, setZoom] = useState(0.8);
  const [history, setHistory] = useState(false);
  const [overflow, setOverflow] = useState<Record<string, boolean>>({});
  const canvas = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]");
      if (e.key === "Escape" && focus) setFocus(false);
      if (!typing && e.key === "\\") setFocus((f) => !f);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [focus]);

  const data = useMemo(() => (report ? dataFor(report, closes) : null), [report, closes]);
  const live = useMemo(() => (report?.snapshot ? liveData(report.fundId, report.period, closes) : null), [report, closes]);

  if (!report || !data)
    return (
      <div className="px-8 py-16 text-center text-[13px] text-d-text-2">
        This report doesn’t exist or was removed.{" "}
        <Link href="/admin/fund/reports" className="underline">
          Back to Report Studio
        </Link>
      </div>
    );

  // content changes need a draft and the right to prepare reports; reviewers comment and mark sections instead
  const editable = report.status === "draft" && can("reports.prepare");
  const set = (pages: Page[]) => studio.setPages(report, who, pages);
  const setDesign = (d: Partial<Design>) => studio.edit(report, who, { design: { ...report.design, ...d } });
  // the library name follows the language or partner only while it is still the generated one
  const autoName = reportName(report.template, report.fundId, report.period, report.locale ?? "en", report.investorId);
  const setLocale = (locale: Locale) =>
    studio.edit(report, who, { locale, ...(report.name === autoName ? { name: reportName(report.template, report.fundId, report.period, locale, report.investorId) } : {}) });
  const setInvestor = (investorId: string) =>
    studio.edit(report, who, {
      investorId,
      ...(report.name === autoName ? { name: reportName(report.template, report.fundId, report.period, report.locale ?? "en", investorId) } : {}),
    });
  const changed = live ? Object.keys(live.metrics).filter((k) => live.metrics[k].value !== data.metrics[k]?.value).length : 0;

  /* ───── page and block operations ───── */
  const updateBlock = (pageId: string, blockId: string, patch: Partial<Block>) =>
    set(report.pages.map((p) => (p.id !== pageId ? p : { ...p, blocks: p.blocks.map((b) => (b.id === blockId ? ({ ...b, ...patch } as Block) : b)) })));
  const moveBlock = (pageId: string, blockId: string, dir: -1 | 1) =>
    set(
      report.pages.map((p) => {
        if (p.id !== pageId) return p;
        const i = p.blocks.findIndex((b) => b.id === blockId);
        const j = i + dir;
        if (j < 0 || j >= p.blocks.length) return p;
        const blocks = [...p.blocks];
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        return { ...p, blocks };
      }),
    );
  const dropBlock = (fromPage: string, blockId: string, toPage: string, toIndex: number) => {
    const block = report.pages.find((p) => p.id === fromPage)?.blocks.find((b) => b.id === blockId);
    if (!block || block.type === "cover") return;
    const without = report.pages.map((p) => (p.id === fromPage ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) } : p));
    set(without.map((p) => (p.id === toPage ? { ...p, blocks: [...p.blocks.slice(0, toIndex), block, ...p.blocks.slice(toIndex)] } : p)));
    setSel({ kind: "block", pageId: toPage, blockId });
  };
  const duplicateBlock = (pageId: string, blockId: string) => {
    const copy = { ...structuredClone(report.pages.find((p) => p.id === pageId)!.blocks.find((b) => b.id === blockId)!), id: newId() };
    set(report.pages.map((p) => (p.id !== pageId ? p : { ...p, blocks: p.blocks.flatMap((b) => (b.id === blockId ? [b, copy] : [b])) })));
    setSel({ kind: "block", pageId, blockId: copy.id });
  };
  const deleteBlock = (pageId: string, blockId: string) => {
    set(report.pages.map((p) => (p.id !== pageId ? p : { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) })));
    setSel({ kind: "page", pageId });
  };
  const addBlock = (pageId: string, type: BlockType) => {
    const b = blankBlock(type);
    const after = sel.kind === "block" && sel.pageId === pageId ? sel.blockId : null;
    set(report.pages.map((p) => (p.id !== pageId ? p : { ...p, blocks: after ? p.blocks.flatMap((x) => (x.id === after ? [x, b] : [x])) : [...p.blocks, b] })));
    setSel({ kind: "block", pageId, blockId: b.id });
  };
  const movePage = (pageId: string, dir: -1 | 1) => {
    const i = report.pages.findIndex((p) => p.id === pageId);
    const j = i + dir;
    if (i <= 0 || j <= 0 || j >= report.pages.length) return; // the cover stays first
    const pages = [...report.pages];
    [pages[i], pages[j]] = [pages[j], pages[i]];
    set(pages);
  };
  const addPage = () => {
    const p: Page = { id: newId("p"), title: "New page", blocks: [{ ...blankBlock("heading"), text: "New section" } as Block] };
    set([...report.pages, p]);
    setSel({ kind: "page", pageId: p.id });
  };
  const deletePage = (pageId: string) => {
    set(report.pages.filter((p) => p.id !== pageId));
    setSel({ kind: "report" });
  };
  const scrollTo = (pageId: string, blockId?: string) => {
    const el = canvas.current?.querySelector(blockId ? `[data-block="${blockId}"]` : `[data-page="${pageId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const selBlock = sel.kind === "block" ? report.pages.find((p) => p.id === sel.pageId)?.blocks.find((b) => b.id === sel.blockId) : null;
  const showLeft = left && !focus;
  const showRight = right && !focus;

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col">
      <TopBar
        report={report}
        who={who}
        focus={focus}
        onFocus={() => setFocus((f) => !f)}
        onHistory={() => setHistory(true)}
        left={left}
        right={right}
        onLeft={() => setLeft((v) => !v)}
        onRight={() => setRight((v) => !v)}
        zoom={zoom}
        onZoom={setZoom}
      />
      <div className="flex min-h-0 flex-1">
        {showLeft && (
          <Outline
            report={report}
            sel={sel}
            editable={editable}
            overflow={overflow}
            onSelect={(x) => {
              setSel(x);
              if (x.kind === "page") scrollTo(x.pageId);
              if (x.kind === "block") scrollTo(x.pageId, x.blockId);
            }}
            onMovePage={movePage}
            onAddPage={addPage}
            onDrop={dropBlock}
          />
        )}
        <div ref={canvas} className="scroll-quiet relative min-w-0 flex-1 overflow-auto bg-[color-mix(in_oklab,var(--d-bg)_88%,#000)]" onClick={() => setSel({ kind: "report" })}>
          <div className="flex flex-col items-center gap-8 px-6 pb-16 pt-6">
            {report.pages.map((p, i) => (
              <div key={p.id} data-page={p.id} style={{ width: PAGE_W * zoom }}>
                <div className="mb-2 flex items-center gap-2 text-[11.5px] text-d-text-3">
                  <span className="tnum">{i + 1}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSel({ kind: "page", pageId: p.id });
                    }}
                    className="hover:text-d-text"
                  >
                    {p.title}
                  </button>
                  {overflow[p.id] && (
                    <span className="ml-auto inline-flex items-center gap-1 text-gold-700">
                      <AlertTriangle size={12} /> Content runs past the page — move a block to the next page
                    </span>
                  )}
                  <PageReviewBar report={report} pageId={p.id} who={who} />
                </div>
                <div style={{ width: PAGE_W * zoom, height: PAGE_H * zoom }} className="shadow-[0_1px_2px_rgba(0,0,0,0.25),0_18px_50px_-24px_rgba(0,0,0,0.6)]">
                  <div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0", width: PAGE_W, height: PAGE_H }}>
                    <CanvasPage
                      report={report}
                      data={data}
                      page={p}
                      index={i}
                      sel={sel}
                      editable={editable}
                      onSel={setSel}
                      onMove={(b, d) => moveBlock(p.id, b, d)}
                      onDuplicate={(b) => duplicateBlock(p.id, b)}
                      onDelete={(b) => deleteBlock(p.id, b)}
                      onOverflow={(v) => setOverflow((o) => (o[p.id] === v ? o : { ...o, [p.id]: v }))}
                      comments={(report.comments ?? []).filter((c) => c.pageId === p.id && !c.resolved)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {showRight && (
          <aside className="scroll-quiet w-[320px] shrink-0 overflow-y-auto border-l border-d-line bg-d-chrome" aria-label="Properties">
            {sel.kind === "figure" ? (
              <FigurePanel mt={data.metrics[sel.key]} frozen={!!report.snapshot} onClose={() => setSel({ kind: "report" })} />
            ) : sel.kind === "block" && selBlock ? (
              <BlockInspector
                report={report}
                pageId={sel.pageId}
                who={who}
                block={selBlock}
                data={data}
                editable={editable}
                onChange={(patch) => updateBlock(sel.pageId, selBlock.id, patch)}
                onDuplicate={() => duplicateBlock(sel.pageId, selBlock.id)}
                onDelete={() => deleteBlock(sel.pageId, selBlock.id)}
                onFigure={(k) => setSel({ kind: "figure", key: k })}
              />
            ) : sel.kind === "page" ? (
              <PageInspector
                page={report.pages.find((p) => p.id === sel.pageId)!}
                isCover={report.pages[0].id === sel.pageId}
                editable={editable}
                onRename={(t) => set(report.pages.map((p) => (p.id === sel.pageId ? { ...p, title: t } : p)))}
                onAdd={(t) => addBlock(sel.pageId, t)}
                onDelete={() => deletePage(sel.pageId)}
              />
            ) : (
              <ReportInspector
                report={report}
                data={data}
                editable={editable}
                changed={changed}
                onDesign={setDesign}
                onLocale={setLocale}
                onInvestor={setInvestor}
                who={who}
                closes={closes}
              />
            )}
          </aside>
        )}
      </div>
      {history && <VersionDrawer r={report} onClose={() => setHistory(false)} />}
      <FigureClickBridge onFigure={(k) => setSel({ kind: "figure", key: k })} />
    </div>
  );
}

/** Figures inside paragraphs on the canvas announce themselves through a DOM event, so the renderer stays editor-agnostic. */
function FigureClickBridge({ onFigure }: { onFigure: (k: string) => void }) {
  useEffect(() => {
    const h = (e: Event) => onFigure((e as CustomEvent<string>).detail);
    window.addEventListener("studio-figure", h);
    return () => window.removeEventListener("studio-figure", h);
  }, [onFigure]);
  return null;
}

/* ───────── canvas ───────── */

function CanvasPage({
  report,
  data,
  page,
  index,
  sel,
  editable,
  onSel,
  onMove,
  onDuplicate,
  onDelete,
  onOverflow,
  comments,
}: {
  report: Report;
  data: ReportData;
  page: Page;
  index: number;
  sel: Sel;
  editable: boolean;
  onSel: (s: Sel) => void;
  onMove: (b: string, d: -1 | 1) => void;
  onDuplicate: (b: string) => void;
  onDelete: (b: string) => void;
  onOverflow: (v: boolean) => void;
  comments: ReportComment[];
}) {
  const look = useLook(report);
  const ref = useRef<HTMLDivElement | null>(null);
  const report_ = useRef(onOverflow);
  useEffect(() => {
    report_.current = onOverflow;
  });
  // Watch the page's content for overflow; re-attach only when the page, its look or its data change.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => report_.current(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => ro.disconnect();
  }, [page, report.design, data]);
  return (
    <ReportPage
      report={report}
      data={data}
      page={page}
      index={index}
      look={look}
      mode="edit"
      contentRef={(el) => {
        ref.current = el;
      }}
      onFigure={(k) => window.dispatchEvent(new CustomEvent("studio-figure", { detail: k }))}
      wrap={(b, node) => {
        const on = sel.kind === "block" && sel.blockId === b.id;
        const i = page.blocks.findIndex((x) => x.id === b.id);
        return (
          <div
            data-block={b.id}
            onClick={(e) => {
              e.stopPropagation();
              onSel({ kind: "block", pageId: page.id, blockId: b.id });
            }}
            className={cx(
              "group/block relative cursor-default rounded-[2px] outline-offset-[6px] transition-[outline-color] duration-150",
              on ? "outline outline-2 outline-[#3d7bd9]" : "outline outline-1 outline-transparent hover:outline-[#9fb9df]",
            )}
            style={b.type === "cover" ? { position: "absolute", inset: 0, outlineOffset: -3 } : undefined}
          >
            {node}
            {comments.some((c) => c.blockId === b.id) && (
              <span
                className="absolute -right-[46px] top-0 flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full bg-[#f6e3b4] px-1.5 font-sans text-[11px] font-semibold text-[#6b4a00]"
                aria-label={`${comments.filter((c) => c.blockId === b.id).length} open comments`}
              >
                <MessageSquare size={11} />
                {comments.filter((c) => c.blockId === b.id).length}
              </span>
            )}
            {editable && b.type !== "cover" && (
              <div
                className={cx(
                  "absolute -top-[30px] right-0 z-10 flex items-center gap-0.5 rounded-[7px] border border-[#d9d4cb] bg-white p-0.5 font-sans text-[#3b4048] shadow-sm transition-opacity",
                  on ? "opacity-100" : "pointer-events-none opacity-0 group-hover/block:pointer-events-auto group-hover/block:opacity-100",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="px-1.5 text-[11px] font-semibold">{BLOCK_NAME[b.type]}</span>
                <IconBtn label="Move up" disabled={i === 0} onClick={() => onMove(b.id, -1)}>
                  <ArrowUp size={13} />
                </IconBtn>
                <IconBtn label="Move down" disabled={i === page.blocks.length - 1} onClick={() => onMove(b.id, 1)}>
                  <ArrowDown size={13} />
                </IconBtn>
                <IconBtn label="Duplicate" onClick={() => onDuplicate(b.id)}>
                  <Copy size={13} />
                </IconBtn>
                <IconBtn label="Delete" onClick={() => onDelete(b.id)}>
                  <Trash2 size={13} />
                </IconBtn>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="rounded-[5px] p-1 hover:bg-[#eef0f3] disabled:opacity-30">
      {children}
    </button>
  );
}

/* ───────── top bar ───────── */

function TopBar({
  report,
  who,
  focus,
  onFocus,
  onHistory,
  left,
  right,
  onLeft,
  onRight,
  zoom,
  onZoom,
}: {
  zoom: number;
  onZoom: (z: number) => void;
  report: Report;
  who: string;
  focus: boolean;
  onFocus: () => void;
  onHistory: () => void;
  left: boolean;
  right: boolean;
  onLeft: () => void;
  onRight: () => void;
}) {
  const [publish, setPublish] = useState(false);
  const { can } = usePreviewRole();
  const editable = report.status === "draft" && can("reports.prepare");
  const icon = "flex h-8 w-8 items-center justify-center rounded-[7px] text-d-text-3 hover:bg-d-raise hover:text-d-text";
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-d-line bg-d-chrome px-3">
      <Link href="/admin/fund/reports" aria-label="Back to Report Studio" className={icon}>
        <ArrowLeft size={16} />
      </Link>
      {!focus && (
        <button onClick={onLeft} aria-label={left ? "Hide the outline" : "Show the outline"} aria-pressed={left} className={cx(icon, "max-md:hidden")}>
          <PanelLeft size={16} />
        </button>
      )}
      <input
        key={report.name}
        defaultValue={report.name}
        onBlur={(e) => {
          const name = e.target.value.trim();
          if (name && name !== report.name) studio.edit(report, who, { name });
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        readOnly={!editable}
        aria-label="Report name"
        className="min-w-0 max-w-[420px] flex-1 truncate rounded-[6px] bg-transparent px-2 py-1 text-[14px] font-semibold text-d-text hover:bg-d-raise focus:bg-d-raise focus:outline-none read-only:hover:bg-transparent"
      />
      <span className="hidden shrink-0 text-[12.5px] text-d-text-3 lg:inline">
        {templateById(report.template).subject === "family" ? "Family" : periodName(report.period)} · {subjectName(report.fundId)}
      </span>
      <StatusPill value={REPORT_STATUS[report.status]} />
      <span className="hidden shrink-0 items-center gap-1 text-[12px] text-d-text-3 xl:inline-flex">
        {editable ? (
          <span title={syncMode() === "database" ? "Saved to the database" : "Saved in this browser until the database is connected"} className="inline-flex items-center gap-1">
            <Check size={12} /> Saved {report.modified.slice(11, 16)}
            {syncMode() === "browser" && " in this browser"}
          </span>
        ) : (
          <>
            <Lock size={12} /> {report.status === "draft" ? "Read-only for your role" : `Read-only while ${REPORT_STATUS[report.status].toLowerCase()}`}
          </>
        )}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <div className="mr-1 hidden items-center rounded-[8px] border border-d-line p-0.5 text-[11.5px] text-d-text-3 xl:flex" role="group" aria-label="Zoom">
          {[0.6, 0.8, 1].map((z) => (
            <button
              key={z}
              onClick={() => onZoom(z)}
              aria-pressed={zoom === z}
              className={cx("h-6 rounded-[6px] px-1.5 font-semibold", zoom === z ? "bg-d-raise text-d-text" : "hover:text-d-text")}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>
        <button onClick={onHistory} aria-label="Version history" title="Version history" className={icon}>
          <History size={16} />
        </button>
        <button onClick={onFocus} aria-label={focus ? "Leave focus mode" : "Focus mode"} title={focus ? "Leave focus mode (Esc)" : "Focus mode (\\)"} className={icon}>
          {focus ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        {!focus && (
          <button onClick={onRight} aria-label={right ? "Hide properties" : "Show properties"} aria-pressed={right} className={cx(icon, "max-md:hidden")}>
            <PanelRight size={16} />
          </button>
        )}
        <a
          href={`/report-studio/${report.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-d-text-2 hover:bg-d-raise hover:text-d-text"
        >
          <Eye size={14} /> Preview
        </a>
        <a
          href={`/report-studio/${report.id}/digital`}
          target="_blank"
          rel="noreferrer"
          title="The interactive edition investors see in their portal"
          className="hidden h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-d-text-2 hover:bg-d-raise hover:text-d-text lg:inline-flex"
        >
          <MonitorSmartphone size={14} /> Digital
        </a>
        <a
          href={`/report-studio/${report.id}?print=1`}
          target="_blank"
          rel="noreferrer"
          title="Opens the print-ready report; choose “Save as PDF”. Text stays selectable and charts stay sharp."
          className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[12.5px] font-semibold text-d-text-2 hover:bg-d-raise hover:text-d-text"
        >
          <FileDown size={14} /> Export PDF
        </a>
        <div className="relative">
          <button
            onClick={() => setPublish((p) => !p)}
            aria-expanded={publish}
            className="inline-flex h-8 items-center gap-1.5 rounded-[7px] bg-brand px-3 text-[12.5px] font-semibold text-brand-ink hover:opacity-90"
          >
            Publish <ChevronDown size={13} />
          </button>
          {publish && <PublishPanel report={report} who={who} onClose={() => setPublish(false)} />}
        </div>
      </div>
    </div>
  );
}

const STEPS: { s: Report["status"]; l: string }[] = [
  { s: "draft", l: "Draft" },
  { s: "in_review", l: "In review" },
  { s: "approved", l: "Approved" },
  { s: "published", l: "Published" },
];

const allReviewed = (r: Report) => r.pages.every((p) => r.review?.[p.id]?.state === "ok");

function ReviewSummary({ report }: { report: Report }) {
  const ok = report.pages.filter((p) => report.review?.[p.id]?.state === "ok").length;
  const changes = report.pages.filter((p) => report.review?.[p.id]?.state === "changes");
  return (
    <div className="text-d-text-2">
      <p>
        {ok} of {report.pages.length} sections reviewed. Mark each page on the canvas; approval needs every section reviewed.
      </p>
      {changes.length > 0 && (
        <ul className="mt-2 space-y-1 text-[12px] text-gold-700">
          {changes.map((p) => (
            <li key={p.id}>
              {p.title}: {report.review![p.id].note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PublishPanel({ report, who, onClose }: { report: Report; who: string; onClose: () => void }) {
  const closes = useReporting();
  const { can } = usePreviewRole();
  const ref = useDismiss(true, onClose);
  const [note, setNote] = useState("");
  const idx = STEPS.findIndex((x) => x.s === report.status);
  const act = (f: () => void) => () => {
    f();
    setNote("");
    onClose();
  };
  const b = "h-8 rounded-[7px] px-3 text-[12.5px] font-semibold";
  return (
    <div ref={ref} className="picker-in absolute right-0 top-10 z-30 w-[340px] rounded-[12px] border border-d-line bg-d-surface p-4 text-[12.5px] text-d-text shadow-lift">
      <ol className="mb-3 flex items-center gap-1.5">
        {STEPS.map((x, i) => (
          <li key={x.s} className="flex items-center gap-1.5">
            <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", i < idx ? "text-up-ink" : i === idx ? "bg-d-raise text-d-text" : "text-d-text-3")}>
              {x.l}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-2.5 bg-d-line-strong" />}
          </li>
        ))}
      </ol>
      {report.status === "draft" && (
        <>
          <p className="text-d-text-2">Sending for review freezes the data snapshot, so reviewers approve exactly the figures investors will see.</p>
          <button
            disabled={!can("reports.prepare")}
            title={can("reports.prepare") ? undefined : "Your role can’t prepare reports"}
            onClick={act(() => studio.sendForReview(report, who, closes))}
            className={cx(b, "mt-3 bg-brand text-brand-ink disabled:opacity-40")}
          >
            Send for review
          </button>
        </>
      )}
      {report.status === "in_review" && (
        <>
          <ReviewSummary report={report} />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Note for the preparer (to return it)" aria-label="Note" className={field} />
          <div className="mt-2 flex gap-2">
            <button
              disabled={!allReviewed(report) || !can("reports.review")}
              title={!can("reports.review") ? "Your role can’t approve reports" : !allReviewed(report) ? "Mark every section reviewed first" : undefined}
              onClick={act(() => studio.approve(report, who))}
              className={cx(b, "bg-brand text-brand-ink disabled:opacity-40")}
            >
              Approve
            </button>
            <button disabled={!note.trim()} onClick={act(() => studio.returnToDraft(report, who, note.trim()))} className={cx(b, "border border-d-line disabled:opacity-40")}>
              Return to draft
            </button>
          </div>
        </>
      )}
      {report.status === "approved" && (
        <>
          <p className="text-d-text-2">Publishing makes this version available to the fund’s investors. It can’t be edited afterwards — only corrected with a new version.</p>
          <button
            disabled={!can("reports.publish")}
            title={can("reports.publish") ? undefined : "Your role can’t publish reports"}
            onClick={act(() => studio.publish(report, who))}
            className={cx(b, "mt-3 bg-brand text-brand-ink disabled:opacity-40")}
          >
            Publish to investors
          </button>
          <div className="mt-4 border-t border-d-line pt-3">
            <p className="text-[12px] leading-relaxed text-d-text-3">
              If the books changed after approval, return the report to draft: it picks up the current figures and goes through review again.
            </p>
            <button
              disabled={!can("reports.prepare") && !can("reports.review")}
              onClick={act(() => studio.reopen(report, who, "figures changed after approval"))}
              className={cx(b, "mt-2 border border-d-line disabled:opacity-40")}
            >
              Return to draft
            </button>
          </div>
        </>
      )}
      {report.status === "published" && (
        <>
          <p className="text-d-text-2">
            This version is published and stays as it is. To fix something, open a correction: a new draft that goes through review again; the published version remains on record.
          </p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What needs correcting?" aria-label="Correction" className={field} />
          <button disabled={!note.trim()} onClick={act(() => studio.correct(report, who, note.trim()))} className={cx(b, "mt-2 border border-d-line disabled:opacity-40")}>
            Open a correction
          </button>
        </>
      )}
      {report.status === "archived" && (
        <>
          <p className="text-d-text-2">This report is archived.</p>
          <button onClick={act(() => studio.restore(report, who))} className={cx(b, "mt-3 border border-d-line")}>
            Restore
          </button>
        </>
      )}
    </div>
  );
}

/* ───────── outline ───────── */

function Outline({
  report,
  sel,
  editable,
  overflow,
  onSelect,
  onMovePage,
  onAddPage,
  onDrop,
}: {
  report: Report;
  sel: Sel;
  editable: boolean;
  overflow: Record<string, boolean>;
  onSelect: (s: Sel) => void;
  onMovePage: (id: string, d: -1 | 1) => void;
  onAddPage: () => void;
  onDrop: (fromPage: string, blockId: string, toPage: string, index: number) => void;
}) {
  const [drag, setDrag] = useState<{ page: string; block: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  return (
    <nav className="scroll-quiet w-[248px] shrink-0 overflow-y-auto border-r border-d-line bg-d-chrome py-2 text-[12.5px]" aria-label="Outline">
      <div className="px-4 pb-2 pt-1 text-[12px] font-semibold text-d-text">Outline</div>
      {report.pages.map((p, pi) => {
        const pageOn = (sel.kind === "page" && sel.pageId === p.id) || (sel.kind === "block" && sel.pageId === p.id);
        return (
          <div key={p.id} className="px-2">
            <div className={cx("group flex items-center gap-1 rounded-[6px] pr-1", pageOn && "bg-d-raise")}>
              <button onClick={() => onSelect({ kind: "page", pageId: p.id })} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left">
                <span className="tnum w-4 text-d-text-3">{pi + 1}</span>
                <span className={cx("truncate", pageOn ? "font-semibold text-d-text" : "text-d-text-2")}>{p.title}</span>
                {overflow[p.id] && <AlertTriangle size={12} className="shrink-0 text-gold-700" aria-label="Content runs past the page" />}
                {report.review?.[p.id]?.state === "ok" && <Check size={12} className="ml-auto shrink-0 text-up-ink" aria-label="Reviewed" />}
                {report.review?.[p.id]?.state === "changes" && <AlertTriangle size={12} className="ml-auto shrink-0 text-gold-700" aria-label="Changes asked" />}
              </button>
              {editable && pi > 0 && (
                <span className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    aria-label={`Move ${p.title} up`}
                    disabled={pi <= 1}
                    onClick={() => onMovePage(p.id, -1)}
                    className="rounded-[4px] p-0.5 text-d-text-3 hover:text-d-text disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    aria-label={`Move ${p.title} down`}
                    disabled={pi === report.pages.length - 1}
                    onClick={() => onMovePage(p.id, 1)}
                    className="rounded-[4px] p-0.5 text-d-text-3 hover:text-d-text disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </span>
              )}
            </div>
            {pi > 0 && (
              <ul
                className={cx("mb-1 ml-[22px] border-l border-d-line-soft pl-1", over === p.id && "border-[var(--d-accent)]")}
                onDragOver={(e) => {
                  if (!drag) return;
                  e.preventDefault();
                  setOver(p.id);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag) onDrop(drag.page, drag.block, p.id, p.blocks.length);
                  setDrag(null);
                  setOver(null);
                }}
              >
                {p.blocks.map((b, bi) => {
                  const on = sel.kind === "block" && sel.blockId === b.id;
                  return (
                    <li
                      key={b.id}
                      draggable={editable}
                      onDragStart={() => setDrag({ page: p.id, block: b.id })}
                      onDragEnd={() => setDrag(null)}
                      onDragOver={(e) => drag && e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (drag && drag.block !== b.id) onDrop(drag.page, drag.block, p.id, bi);
                        setDrag(null);
                        setOver(null);
                      }}
                      className={cx("group/row flex items-center rounded-[5px]", drag?.block === b.id && "opacity-40")}
                    >
                      {editable && <GripVertical size={12} className="-ml-0.5 shrink-0 cursor-grab text-d-text-3 opacity-0 group-hover/row:opacity-100" aria-hidden />}
                      <button
                        onClick={() => onSelect({ kind: "block", pageId: p.id, blockId: b.id })}
                        className={cx(
                          "min-w-0 flex-1 truncate rounded-[5px] px-1.5 py-1 text-left text-[12px]",
                          on ? "bg-d-raise font-semibold text-d-text" : "text-d-text-3 hover:text-d-text",
                        )}
                      >
                        {outlineLabel(b)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      {editable && (
        <button onClick={onAddPage} className="mx-4 mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-d-text-2 hover:text-d-text">
          <Plus size={13} /> Add page
        </button>
      )}
      {editable && <p className="px-4 pt-3 text-[11.5px] leading-relaxed text-d-text-3">Drag blocks to reorder them or move them to another page.</p>}
    </nav>
  );
}

function outlineLabel(b: Block) {
  switch (b.type) {
    case "heading":
      return b.text;
    case "chart":
      return `Chart · ${b.title || CHART_NAME[b.chart]}`;
    case "table":
      return `Table · ${b.title || TABLE_NAME[b.table]}`;
    case "notes":
      return `Note · ${b.title}`;
    default:
      return BLOCK_NAME[b.type];
  }
}

/* ───────── inspectors ───────── */

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-b border-d-line-soft px-4 py-4">
      <div className="mb-2.5 flex items-center gap-2">
        <h3 className="flex-1 text-[12.5px] font-semibold text-d-text">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Seg<T extends string>({ value, options, onChange, disabled }: { value: T; options: [T, string][]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="grid rounded-[8px] border border-d-line p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, l]) => (
        <button
          key={v}
          disabled={disabled}
          onClick={() => onChange(v)}
          className={cx("h-7 rounded-[6px] text-[12px] font-semibold disabled:opacity-50", value === v ? "bg-d-raise text-d-text" : "text-d-text-3 hover:text-d-text")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Locked() {
  const { can } = usePreviewRole();
  return (
    <p className="mx-4 mt-4 flex gap-2 rounded-[8px] border border-d-line px-3 py-2 text-[12px] leading-relaxed text-d-text-2">
      <Lock size={13} className="mt-0.5 shrink-0" />
      {can("reports.prepare")
        ? "The report is read-only outside Draft. Return it to draft, or open a correction if it’s published."
        : "Your role can read, comment and review this report, not change its content."}
    </p>
  );
}

function ReportInspector({
  report,
  data,
  editable,
  changed,
  onDesign,
  onLocale,
  onInvestor,
  who,
  closes,
}: {
  report: Report;
  data: ReportData;
  editable: boolean;
  changed: number;
  onDesign: (d: Partial<Design>) => void;
  onLocale: (l: Locale) => void;
  onInvestor: (id: string) => void;
  who: string;
  closes: ReturnType<typeof useReporting>;
}) {
  const fund = fundById(report.fundId);
  const family = data.subject === "family";
  const tpl = templateById(report.template);
  return (
    <div>
      <div className="px-4 pb-1 pt-4 text-[12px] text-d-text-3">Report</div>
      <div className="px-4 text-[14px] font-semibold text-d-text">{report.name}</div>
      {!editable && <Locked />}
      <Section title="Language">
        <Seg<Locale>
          value={report.locale ?? "en"}
          disabled={!editable}
          onChange={(v) => onLocale(v)}
          options={[
            ["en", "English"],
            ["pt", "Português"],
          ]}
        />
        <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
          Page headers, figure labels, tables, charts, numbers and dates switch at once. Text you or the template wrote stays as written; a new report from the template is written
          in the chosen language.
        </p>
      </Section>
      {tpl.perInvestor && (
        <Section title="Addressed to">
          <select disabled={!editable} value={report.investorId ?? ""} onChange={(e) => onInvestor(e.target.value)} aria-label="Partner" className={field}>
            {!report.investorId && <option value="">Choose a partner</option>}
            {data.partners.map((p) => (
              <option key={p.investorId} value={p.investorId}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">Only this partner sees the statement in the investor portal once it is published.</p>
        </Section>
      )}
      {!family && (
        <Section title="Identity">
          <Seg<Design["brand"]>
            value={report.design.brand}
            disabled={!editable}
            onChange={(v) => onDesign({ brand: v })}
            options={[
              ["manager", "Fund manager"],
              ["administrator", "Administrator"],
            ]}
          />
          <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
            {report.design.brand === "manager" ? `Published in ${fund?.manager}’s logo and colours, administered by Aurum.` : "Published in the administrator’s identity."} Logos,
            colours and legal details come from the brand settings.
          </p>
        </Section>
      )}
      <Section title="Typography">
        <Seg<Design["typography"]>
          value={report.design.typography}
          disabled={!editable}
          onChange={(v) => onDesign({ typography: v })}
          options={[
            ["editorial", "Editorial serif"],
            ["modern", "Modern sans"],
          ]}
        />
      </Section>
      <Section title="Cover">
        <Seg<Design["cover"]>
          value={report.design.cover}
          disabled={!editable}
          onChange={(v) => onDesign({ cover: v })}
          options={[
            ["field", "Colour field"],
            ["light", "Light"],
            ["minimal", "Minimal"],
          ]}
        />
      </Section>
      <Section title="Data">
        <dl className="space-y-1.5 text-[12px]">
          {[
            [family ? "Family" : "Fund", data.name],
            ["Period", family ? `As of ${date(data.asOf)}` : `${periodName(report.period)} · as of ${date(data.asOf)}`],
            ["Currency", family ? "USD, converted at indicative rates" : data.currency],
            ["Status", `${STATUS_TEXT[data.status]}${data.status === "preliminary" ? (family ? " — valuations are unaudited" : " — the quarter isn’t closed yet") : ""}`],
            [
              "Source",
              report.snapshot
                ? `Snapshot frozen ${date(report.snapshot.at.slice(0, 10))} by ${report.snapshot.by}`
                : family
                  ? "Live from the family office records"
                  : "Live from the books",
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="w-16 shrink-0 text-d-text-3">{k}</dt>
              <dd className="text-d-text">{v}</dd>
            </div>
          ))}
        </dl>
        {report.snapshot && changed > 0 && (
          <p className="mt-3 flex gap-2 rounded-[8px] border border-attn-line px-3 py-2 text-[12px] text-gold-700">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {changed} figure{changed > 1 ? "s have" : " has"} changed in the books since the snapshot. The report keeps the
            frozen values.
          </p>
        )}
        {editable && (
          <div className="mt-3">
            {report.snapshot ? (
              <button
                onClick={() => studio.unfreeze(report, who)}
                className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-d-line px-3 text-[12px] font-semibold text-d-text hover:bg-d-raise"
              >
                Use live data again
              </button>
            ) : (
              <button
                onClick={() => studio.freeze(report, who, closes)}
                className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-d-line px-3 text-[12px] font-semibold text-d-text hover:bg-d-raise"
              >
                <Snowflake size={13} /> Freeze the data
              </button>
            )}
            <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
              A frozen report keeps its figures even if the books change. Sending for review freezes it automatically.
            </p>
          </div>
        )}
      </Section>
      <p className="px-4 py-4 text-[11.5px] leading-relaxed text-d-text-3">Select a page or a block to change it. Select an underlined figure to see where it comes from.</p>
    </div>
  );
}

function PageInspector({
  page,
  isCover,
  editable,
  onRename,
  onAdd,
  onDelete,
}: {
  page: Page;
  isCover: boolean;
  editable: boolean;
  onRename: (t: string) => void;
  onAdd: (t: BlockType) => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="px-4 pb-1 pt-4 text-[12px] text-d-text-3">Page</div>
      <div className="px-4 text-[14px] font-semibold text-d-text">{page.title}</div>
      {!editable ? (
        <Locked />
      ) : (
        <>
          <Section title="Title">
            <input key={page.id} defaultValue={page.title} onBlur={(e) => e.target.value.trim() && onRename(e.target.value.trim())} aria-label="Page title" className={field} />
            <p className="mt-1.5 text-[11.5px] text-d-text-3">Used in the contents and the outline.</p>
          </Section>
          {!isCover && (
            <Section title="Add a block">
              <div className="grid grid-cols-2 gap-1.5">
                {PALETTE.map((x) => (
                  <button key={x.type} onClick={() => onAdd(x.type)} className="rounded-[8px] border border-d-line px-2.5 py-2 text-left hover:bg-d-raise">
                    <span className="block text-[12px] font-semibold text-d-text">{x.label}</span>
                    <span className="block text-[11px] leading-snug text-d-text-3">{x.hint}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}
          {!isCover && (
            <div className="px-4 py-4">
              <button onClick={onDelete} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-negative hover:underline">
                <Trash2 size={13} /> Delete this page
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricRow({ mt, onClick }: { mt: Metric; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12px] hover:bg-d-raise">
      <span className="min-w-0 flex-1 truncate text-d-text">{mt.label}</span>
      <span className={cx("tnum shrink-0", mt.value === null ? "text-d-text-3" : "text-d-text-2")}>{fmt(mt, { short: true })}</span>
      {mt.status !== "final" && <span className="shrink-0 text-[10.5px] text-d-text-3">{STATUS_TEXT[mt.status]}</span>}
    </button>
  );
}

function FigurePanel({ mt, frozen, onClose }: { mt?: Metric; frozen: boolean; onClose: () => void }) {
  if (!mt) return null;
  return (
    <div>
      <div className="flex items-start gap-2 px-4 pb-2 pt-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[12px] text-d-text-3">
            <Link2 size={12} /> Linked figure
          </div>
          <div className="mt-0.5 text-[14px] font-semibold text-d-text">{mt.label}</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-[6px] p-1 text-d-text-3 hover:bg-d-raise hover:text-d-text">
          <X size={15} />
        </button>
      </div>
      <div className="px-4">
        <div className="fig text-[26px] text-d-text">{fmt(mt)}</div>
      </div>
      <Section title="Source">
        <dl className="space-y-2 text-[12px]">
          {[
            ["Status", STATUS_TEXT[mt.status]],
            ["As of", date(mt.asOf)],
            ["Currency", mt.kind === "money" ? mt.currency : "—"],
            ["Source", mt.source],
            ["Data", frozen ? "Frozen snapshot" : "Live from the records"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="w-16 shrink-0 text-d-text-3">{k}</dt>
              <dd className="text-d-text">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section title="How it is calculated">
        <p className="text-[12px] leading-relaxed text-d-text-2">{mt.method}</p>
      </Section>
    </div>
  );
}

function BlockInspector({
  report,
  pageId,
  who,
  block: b,
  data,
  editable,
  onChange,
  onDuplicate,
  onDelete,
  onFigure,
}: {
  report: Report;
  pageId: string;
  who: string;
  block: Block;
  data: ReportData;
  editable: boolean;
  onChange: (p: Partial<Block>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFigure: (k: string) => void;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const insert = (k: string) => {
    if (b.type !== "paragraph") return;
    const pos = ta.current?.selectionStart ?? b.text.length;
    onChange({ text: `${b.text.slice(0, pos)}{{${k}}}${b.text.slice(pos)}` } as Partial<Block>);
  };
  /** Wrap the selection in **bold** or *italic*, or add a ^[footnote] after it; the inserted text is selected for typing. */
  const format = (kind: "bold" | "italic" | "note") => {
    if (b.type !== "paragraph") return;
    const el = ta.current;
    const a = el?.selectionStart ?? b.text.length;
    const z = el?.selectionEnd ?? a;
    const picked = b.text.slice(a, z);
    let next: string;
    let from: number;
    let to: number;
    if (kind === "note") {
      const ph = "Footnote text";
      next = `${b.text.slice(0, z)}^[${ph}]${b.text.slice(z)}`;
      from = z + 2;
      to = from + ph.length;
    } else {
      const mark = kind === "bold" ? "**" : "*";
      const inner = picked || (kind === "bold" ? "bold text" : "italic text");
      next = `${b.text.slice(0, a)}${mark}${inner}${mark}${b.text.slice(z)}`;
      from = a + mark.length;
      to = from + inner.length;
    }
    onChange({ text: next } as Partial<Block>);
    requestAnimationFrame(() => {
      ta.current?.focus();
      ta.current?.setSelectionRange(from, to);
    });
  };
  const dis = !editable;
  const bound = b.type === "kpis" ? b.keys : b.type === "paragraph" ? [...b.text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]) : [];

  return (
    <div key={b.id}>
      <div className="flex items-center gap-2 px-4 pb-1 pt-4">
        <span className="flex-1 text-[12px] text-d-text-3">Block</span>
        {editable && b.type !== "cover" && (
          <>
            <button onClick={onDuplicate} aria-label="Duplicate" title="Duplicate" className="rounded-[6px] p-1 text-d-text-3 hover:bg-d-raise hover:text-d-text">
              <Copy size={14} />
            </button>
            <button onClick={onDelete} aria-label="Delete" title="Delete" className="rounded-[6px] p-1 text-d-text-3 hover:bg-d-raise hover:text-negative">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
      <div className="px-4 text-[14px] font-semibold text-d-text">{BLOCK_NAME[b.type]}</div>
      {dis && <Locked />}

      {b.type === "cover" && (
        <Section title="Text">
          <label className={lbl}>
            Title
            <input disabled={dis} value={b.title} onChange={(e) => onChange({ title: e.target.value })} className={field} />
          </label>
          <label className={cx(lbl, "mt-3")}>
            Above the title
            <input disabled={dis} value={b.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} className={field} />
          </label>
          <p className="mt-2 text-[11.5px] text-d-text-3">The cover’s look, logo and colours are set on the report (select the canvas background).</p>
        </Section>
      )}
      {b.type === "heading" && (
        <Section title="Text">
          <label className={lbl}>
            Heading
            <input disabled={dis} value={b.text} onChange={(e) => onChange({ text: e.target.value })} className={field} />
          </label>
          <label className={cx(lbl, "mt-3")}>
            Section number
            <input disabled={dis} value={b.kicker ?? ""} onChange={(e) => onChange({ kicker: e.target.value })} placeholder="e.g. 03" className={field} />
          </label>
        </Section>
      )}
      {b.type === "paragraph" && (
        <>
          <Section title="Text">
            {editable && (
              <div className="mb-1.5 flex items-center gap-0.5" role="toolbar" aria-label="Formatting">
                {(
                  [
                    ["bold", "Bold", <Bold key="b" size={14} />],
                    ["italic", "Italic", <Italic key="i" size={14} />],
                    ["note", "Add a footnote", <Superscript key="n" size={14} />],
                  ] as const
                ).map(([k, l, icon]) => (
                  <button
                    key={k}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => format(k)}
                    aria-label={l}
                    title={l}
                    className="flex h-7 w-7 items-center justify-center rounded-[6px] text-d-text-2 hover:bg-d-raise hover:text-d-text"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={ta}
              disabled={dis}
              value={b.text}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={8}
              className={cx(field, "resize-y leading-relaxed")}
              aria-label="Paragraph text"
            />
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-d-text-3">
              Linked figures appear as {"{{name}}"} here and as live values on the page. **Bold**, *italic* and ^[footnotes] show formatted; footnotes are numbered at the foot of
              the page.
            </p>
          </Section>
          {editable && (
            <Section title="Insert a linked figure">
              {METRIC_GROUPS.map((g) => (
                <div key={g.label} className="mb-2">
                  <div className="px-2 pb-0.5 text-[11px] font-semibold text-d-text-3">{g.label}</div>
                  {g.keys
                    .map((k) => data.metrics[k])
                    .filter(Boolean)
                    .map((mt) => (
                      <MetricRow key={mt.key} mt={mt} onClick={() => insert(mt.key)} />
                    ))}
                </div>
              ))}
            </Section>
          )}
        </>
      )}
      {b.type === "commentary" && (
        <Section title="Commentary">
          <textarea
            disabled={dis}
            value={b.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={7}
            className={cx(field, "resize-y leading-relaxed")}
            aria-label="Commentary"
          />
          <label className={cx(lbl, "mt-3")}>
            Attributed to
            <input disabled={dis} value={b.author} onChange={(e) => onChange({ author: e.target.value })} className={field} />
          </label>
          <label className={cx(lbl, "mt-3")}>
            Role
            <input disabled={dis} value={b.role} onChange={(e) => onChange({ role: e.target.value })} className={field} />
          </label>
          <div className="mt-3">
            <div className={lbl}>Supplied by</div>
            <div className="mt-1">
              <Seg<"manager" | "administrator">
                value={b.supplied}
                disabled={dis}
                onChange={(v) => onChange({ supplied: v })}
                options={[
                  ["manager", "Investment manager"],
                  ["administrator", "Administrator"],
                ]}
              />
            </div>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">The page states who supplied the commentary, keeping it apart from the administrator’s figures.</p>
        </Section>
      )}
      {b.type === "kpis" && (
        <Section title="Figures" aside={<span className="text-[11px] text-d-text-3">{b.keys.length} of 4</span>}>
          {METRIC_GROUPS.slice(0, 4).map((g) => (
            <div key={g.label} className="mb-2">
              <div className="px-2 pb-0.5 text-[11px] font-semibold text-d-text-3">{g.label}</div>
              {g.keys.map((k) => {
                const mt = data.metrics[k];
                if (!mt) return null;
                const on = b.keys.includes(k);
                return (
                  <label
                    key={k}
                    className={cx("flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-[12px] hover:bg-d-raise", !on && b.keys.length >= 4 && "opacity-50")}
                  >
                    <input
                      type="checkbox"
                      disabled={dis || (!on && b.keys.length >= 4)}
                      checked={on}
                      onChange={() => onChange({ keys: on ? b.keys.filter((x) => x !== k) : [...b.keys, k] })}
                      className="accent-[var(--d-accent)]"
                    />
                    <span className="min-w-0 flex-1 truncate text-d-text">{mt.label}</span>
                    <span className="tnum text-d-text-3">{fmt(mt, { short: true })}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </Section>
      )}
      {b.type === "chart" && (
        <Section title="Chart">
          <label className={lbl}>
            Shows
            <select
              disabled={dis}
              value={b.chart}
              onChange={(e) => onChange({ chart: e.target.value as ChartKind, title: CHART_NAME[e.target.value as ChartKind] })}
              className={field}
            >
              {(Object.keys(CHART_NAME) as ChartKind[])
                .filter((k) => data.subject !== "family" || k === "allocation" || k === b.chart)
                .map((k) => (
                  <option key={k} value={k}>
                    {CHART_NAME[k]}
                  </option>
                ))}
            </select>
          </label>
          <label className={cx(lbl, "mt-3")}>
            Title
            <input disabled={dis} value={b.title} onChange={(e) => onChange({ title: e.target.value })} className={field} />
          </label>
          <label className={cx(lbl, "mt-3")}>
            Caption
            <textarea disabled={dis} value={b.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} rows={2} className={cx(field, "resize-y")} />
          </label>
          <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
            {data.subject === "family" ? "Drawn from the family’s recorded assets, in US dollars." : `Drawn from the fund ledger, quarter by quarter, in ${data.currency}.`} The
            source line is added under the caption automatically.
          </p>
        </Section>
      )}
      {b.type === "table" && (
        <Section title="Table">
          <label className={lbl}>
            Shows
            <select
              disabled={dis}
              value={b.table}
              onChange={(e) => onChange({ table: e.target.value as TableKind, title: TABLE_NAME[e.target.value as TableKind] })}
              className={field}
            >
              {(Object.keys(TABLE_NAME) as TableKind[])
                .filter((k) => k === b.table || k === "sources" || (data.subject === "family") === ["classes", "entities", "liabilities"].includes(k))
                .map((k) => (
                  <option key={k} value={k}>
                    {TABLE_NAME[k]}
                  </option>
                ))}
            </select>
          </label>
          <label className={cx(lbl, "mt-3")}>
            Title
            <input disabled={dis} value={b.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} className={field} />
          </label>
        </Section>
      )}
      {b.type === "holdings" && (
        <Section title="Updates by investment">
          {data.holdings.map((h) => (
            <label key={h.name} className={cx(lbl, "mb-3")}>
              {h.name}
              <textarea
                disabled={dis}
                value={b.updates[h.name] ?? ""}
                onChange={(e) => onChange({ updates: { ...b.updates, [h.name]: e.target.value } })}
                rows={3}
                placeholder="The manager’s update for the quarter"
                className={cx(field, "resize-y leading-relaxed")}
              />
            </label>
          ))}
          <p className="text-[11.5px] leading-relaxed text-d-text-3">
            Investments, cost and share come from the capital calls in the ledger. An investment without an update shows only its figures.
          </p>
        </Section>
      )}
      {b.type === "exposure" && (
        <Section title="Exposure">
          <Seg<"sector" | "geography" | "currency">
            value={b.dimension}
            disabled={dis}
            onChange={(v) => onChange({ dimension: v })}
            options={[
              ["sector", "Sector"],
              ["geography", "Geography"],
              ["currency", "Currency"],
            ]}
          />
          <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
            {data.subject === "family"
              ? "Currency and region come from each asset’s record. Sector isn’t recorded for every asset, so a sector block stays hidden until it is."
              : "Aurum doesn’t hold this classification for the fund’s investments yet, so nothing is invented: the block is hidden in the published report until the data is recorded."}
          </p>
        </Section>
      )}
      {b.type === "notes" && (
        <Section title="Note">
          <label className={lbl}>
            Title
            <input disabled={dis} value={b.title} onChange={(e) => onChange({ title: e.target.value })} className={field} />
          </label>
          <label className={cx(lbl, "mt-3")}>
            Text
            <textarea disabled={dis} value={b.text} onChange={(e) => onChange({ text: e.target.value })} rows={6} className={cx(field, "resize-y leading-relaxed")} />
          </label>
        </Section>
      )}
      {b.type === "disclosures" && (
        <Section title="Disclosures">
          <textarea
            disabled={dis}
            value={b.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={8}
            className={cx(field, "resize-y leading-relaxed")}
            aria-label="Disclosures"
          />
          <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">The administrator’s statement and the commentary attribution are added after this text.</p>
        </Section>
      )}
      {b.type === "signature" && (
        <Section title="Signatures">
          {b.signers.map((sg, i) => (
            <div key={i} className="mb-3 rounded-[8px] border border-d-line p-2.5">
              <input
                disabled={dis}
                value={sg.name}
                placeholder="Name"
                aria-label="Name"
                onChange={(e) => onChange({ signers: b.signers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                className={cx(field, "mt-0")}
              />
              <input
                disabled={dis}
                value={sg.role}
                placeholder="Role"
                aria-label="Role"
                onChange={(e) => onChange({ signers: b.signers.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })}
                className={field}
              />
              {editable && b.signers.length > 1 && (
                <button onClick={() => onChange({ signers: b.signers.filter((_, j) => j !== i) })} className="mt-1.5 text-[11.5px] text-d-text-3 hover:text-negative">
                  Remove
                </button>
              )}
            </div>
          ))}
          {editable && b.signers.length < 3 && (
            <button
              onClick={() => onChange({ signers: [...b.signers, { name: "", role: "" }] })}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-d-text-2 hover:text-d-text"
            >
              <Plus size={13} /> Add a signer
            </button>
          )}
        </Section>
      )}
      {b.type === "statement" && (
        <Section title="Capital account">
          <p className="text-[12px] leading-relaxed text-d-text-2">
            The partner’s opening and closing capital, contributions, distributions and allocated result for the quarter, with commitment and share of the fund, from the capital
            accounts. Choose the partner on the report (select the canvas background).
          </p>
        </Section>
      )}
      {b.type === "toc" && (
        <Section title="Contents">
          <p className="text-[12px] leading-relaxed text-d-text-2">Generated from the page titles and their order. Rename or reorder pages to change it.</p>
        </Section>
      )}

      {bound.length > 0 && (
        <Section title="Linked data">{[...new Set(bound)].map((k) => data.metrics[k] && <MetricRow key={k} mt={data.metrics[k]} onClick={() => onFigure(k)} />)}</Section>
      )}
      <BlockComments report={report} pageId={pageId} blockId={b.id} who={who} />
    </div>
  );
}

/** Internal comments on a block: for the team preparing and reviewing the report; never printed or published. */
function BlockComments({ report, pageId, blockId, who }: { report: Report; pageId: string; blockId: string; who: string }) {
  const [text, setText] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const list = (report.comments ?? []).filter((c) => c.blockId === blockId && c.pageId === pageId);
  return (
    <Section title="Comments" aside={<span className="text-[11px] text-d-text-3">Internal · never published</span>}>
      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c.id} className={cx("rounded-[8px] border border-d-line px-3 py-2 text-[12px]", c.resolved && "opacity-60")}>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-d-text">{c.author}</span>
              <span className="ml-auto text-[11px] text-d-text-3">{date(c.at.slice(0, 10))}</span>
            </div>
            <p className="mt-0.5 leading-relaxed text-d-text-2">{c.text}</p>
            {c.replies.map((x, i) => (
              <div key={i} className="mt-1.5 border-l-2 border-d-line pl-2">
                <span className="font-semibold text-d-text">{x.author}</span> <span className="text-d-text-2">{x.text}</span>
              </div>
            ))}
            {c.resolved ? (
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-up-ink">
                <Check size={11} /> Resolved
              </div>
            ) : (
              <div className="mt-1.5 flex gap-1.5">
                <input
                  value={reply[c.id] ?? ""}
                  onChange={(e) => setReply({ ...reply, [c.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && reply[c.id]?.trim()) {
                      studio.reply(report, who, c.id, reply[c.id].trim());
                      setReply({ ...reply, [c.id]: "" });
                    }
                  }}
                  placeholder="Reply and press Enter"
                  aria-label="Reply"
                  className="h-7 min-w-0 flex-1 rounded-[6px] border border-d-line bg-transparent px-2 text-[12px] text-d-text placeholder:text-d-text-3 focus:outline-none"
                />
                <button
                  onClick={() => studio.resolveComment(report, who, c.id)}
                  className="h-7 rounded-[6px] border border-d-line px-2 text-[11.5px] font-semibold text-d-text hover:bg-d-raise"
                >
                  Resolve
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Comment for the team"
        aria-label="New comment"
        className={cx(field, list.length ? "mt-2" : "mt-0", "resize-none")}
      />
      <button
        disabled={!text.trim()}
        onClick={() => {
          studio.comment(report, who, pageId, blockId, text.trim());
          setText("");
        }}
        className="mt-1.5 h-7 rounded-[6px] bg-brand px-2.5 text-[12px] font-semibold text-brand-ink disabled:opacity-40"
      >
        Add comment
      </button>
    </Section>
  );
}

/** Section review: in review, each page is marked reviewed or sent back with a note; in draft, notes stay visible. */
function PageReviewBar({ report, pageId, who }: { report: Report; pageId: string; who: string }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const rv = report.review?.[pageId];
  const chip = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold";
  if (report.status === "draft")
    return rv?.state === "changes" ? (
      <span className={cx(chip, "ml-auto max-w-[70%] truncate bg-[color-mix(in_oklab,var(--color-gold-500)_16%,transparent)] text-gold-700")} title={rv.note}>
        <AlertTriangle size={11} className="shrink-0" /> Changes asked: {rv.note}
      </span>
    ) : null;
  if (report.status !== "in_review") return null;
  if (asking)
    return (
      <span className="ml-auto flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What should change on this page?"
          aria-label="Change requested"
          className="h-7 w-[260px] rounded-[6px] border border-d-line bg-d-surface px-2 text-[12px] text-d-text placeholder:text-d-text-3 focus:outline-none"
        />
        <button
          disabled={!note.trim()}
          onClick={() => {
            studio.reviewPage(report, who, pageId, "changes", note.trim());
            setAsking(false);
            setNote("");
          }}
          className="h-7 rounded-[6px] bg-brand px-2 text-[11.5px] font-semibold text-brand-ink disabled:opacity-40"
        >
          Send
        </button>
        <button onClick={() => setAsking(false)} className="h-7 rounded-[6px] px-1.5 text-[11.5px] text-d-text-3 hover:text-d-text">
          Cancel
        </button>
      </span>
    );
  return (
    <span className="ml-auto flex min-w-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {rv?.state === "ok" && (
        <span className={cx(chip, "text-up-ink")}>
          <Check size={11} /> Reviewed by {rv.by}
        </span>
      )}
      {rv?.state === "changes" && (
        <span className={cx(chip, "min-w-0 truncate bg-[color-mix(in_oklab,var(--color-gold-500)_16%,transparent)] text-gold-700")} title={rv.note}>
          <AlertTriangle size={11} className="shrink-0" /> Changes: {rv.note}
        </span>
      )}
      {rv ? (
        <button onClick={() => studio.clearPageReview(report, who, pageId)} className="shrink-0 text-[11px] text-d-text-3 hover:text-d-text">
          Undo
        </button>
      ) : (
        <>
          <button
            onClick={() => setAsking(true)}
            className="h-6 rounded-[6px] border border-d-line px-2 text-[11px] font-semibold text-d-text-2 hover:bg-d-raise hover:text-d-text"
          >
            Needs changes
          </button>
          <button
            onClick={() => studio.reviewPage(report, who, pageId, "ok")}
            className="inline-flex h-6 items-center gap-1 rounded-[6px] bg-brand px-2 text-[11px] font-semibold text-brand-ink"
          >
            <Check size={11} /> Mark reviewed
          </button>
        </>
      )}
    </span>
  );
}
