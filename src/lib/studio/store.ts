"use client";

/**
 * Report library, kept in this browser until the database is connected. Seeds are deterministic (built from the
 * books) so the server render and the first client render agree; edits are layered on top and persisted.
 */
import { useSyncExternalStore } from "react";
import { recordAudit } from "@/lib/audit-local";
import { fundById } from "@/lib/data";
import { CURRENT_PERIOD, prevPeriod, type Period } from "@/lib/reporting/figures";
import { fundAdjustments, getClose, type Close } from "@/lib/reporting/store";
import { investorById } from "@/lib/data";
import { FAMILIES } from "@/lib/wealth";
import { familyData, isFamily, reportData, type ReportData } from "./data";
import { formatter, type Locale } from "./i18n";
import { pull, push, syncMode } from "./persist";
import { newId, templateById, type Design, type Page, type Report, type ReportStatus, type TemplateId } from "./model";
import { buildTemplate, templateTitle } from "./templates";

const KEY = "aurum-studio-v1";
type State = { reports: Record<string, Report>; removed: string[] };
const EMPTY: State = { reports: {}, removed: [] };
let state: State | null = null;
const listeners = new Set<() => void>();

const load = (): State => {
  if (state) return state;
  try {
    state = { ...EMPTY, ...(JSON.parse(window.localStorage.getItem(KEY) ?? "null") ?? {}) };
  } catch {
    state = EMPTY;
  }
  return state!;
};
const save = (next: State) => {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
};
let pulled = false;
const subscribe = (l: () => void) => {
  listeners.add(l);
  // with a database connected, reports this user may read replace the browser copies once per session
  if (!pulled && syncMode() === "database") {
    pulled = true;
    pull()
      .then((rows) => rows.length && save({ ...load(), reports: { ...load().reports, ...Object.fromEntries(rows.map((r) => [r.id, r])) } }))
      .catch((e) => console.warn("Report Studio: could not load reports from the database", e));
  }
  return () => listeners.delete(l);
};
export const useStudio = () => useSyncExternalStore(subscribe, load, () => EMPTY);

/* ───────── data for a report ───────── */

/** The data a report shows: its frozen snapshot if it has one, otherwise live from the books. */
export function dataFor(r: Pick<Report, "fundId" | "period" | "snapshot">, closes?: Record<string, Close>): ReportData {
  if (r.snapshot) return normalize(r.snapshot.data);
  return liveData(r.fundId, r.period, closes);
}
/** Snapshots frozen before a field existed get safe empty values, never invented ones. */
function normalize(d: ReportData): ReportData {
  return {
    ...d,
    subject: d.subject ?? "fund",
    name: d.name ?? subjectLongName(d.fundId),
    partners: d.partners ?? [],
    balance: d.balance ?? [],
    operations: d.operations ?? [],
  };
}
export function liveData(fundId: string, period: Period, closes: Record<string, Close> = {}) {
  if (isFamily(fundId)) return familyData(fundId, period);
  const close = getClose(closes, fundId, period);
  return reportData(fundId, period, fundAdjustments(closes, fundId, period), close?.status === "published");
}

/* ───────── seeds ───────── */

const DESIGN: Design = { brand: "manager", typography: "editorial", cover: "field" };
const signerOf = (id: string) => {
  const fam = FAMILIES.find((x) => x.id === id);
  if (fam) return fam.rm.name;
  return fundById(id)!.gpId === "strlex" ? "Lucas Prado" : fundById(id)!.manager;
};
/** The subject's short name: a fund's short name or a family's name. */
export const subjectName = (id: string) => fundById(id)?.shortName ?? FAMILIES.find((x) => x.id === id)?.name ?? id;
export const subjectLongName = (id: string) => fundById(id)?.name ?? FAMILIES.find((x) => x.id === id)?.name ?? id;

/** A report's name in the library: subject, period and document. */
export function reportName(t: TemplateId, subjectId: string, period: Period, locale: Locale = "en", investorId?: string) {
  const f = formatter(locale);
  const who = investorId ? ` — ${investorById(investorId)?.name ?? investorId}` : "";
  const when = templateById(t).subject === "family" ? "" : ` ${f.period(period)}`;
  return `${subjectName(subjectId)} —${when} ${templateTitle(t, locale)}${who}`;
}

function seedReport(
  id: string,
  fundId: string,
  period: Period,
  status: ReportStatus,
  days: string[],
  design: Partial<Design> = {},
  template: TemplateId = "quarterly-fund",
  locale: Locale = "en",
): Report {
  const data = liveData(fundId, period);
  const tpl = templateById(template);
  const at = (d: string, t = "10:00") => `${d}T${t}:00`;
  const versions = [{ n: 1, at: at(days[0]), by: "Rafaela Duarte", note: `Created from the ${tpl.name} template`, status: "draft" as ReportStatus }];
  if (status !== "draft") versions.push({ n: 2, at: at(days[1]), by: "Rafaela Duarte", note: "Sent for review with a frozen data snapshot", status: "in_review" });
  if (status === "approved") versions.push({ n: 3, at: at(days[2], "11:30"), by: "Luiza Andrade", note: "Approved", status: "approved" });
  if (status === "published" || status === "archived")
    versions.push(
      { n: 3, at: at(days[2], "11:30"), by: signerOf(fundId), note: "Approved by the manager", status: "approved" },
      { n: 4, at: at(days[2], "16:00"), by: "Luiza Andrade", note: "Published to the investor portal with a frozen data snapshot", status: "published" },
    );
  return {
    id,
    template,
    subject: tpl.subject,
    locale,
    name: reportName(template, fundId, period, locale),
    fundId,
    period,
    status,
    archivedFrom: status === "archived" ? "published" : undefined,
    design: { ...DESIGN, ...(tpl.subject === "family" ? { brand: "administrator" as const } : {}), ...design },
    pages: buildTemplate(template, { subjectId: fundId, period, data, signer: signerOf(fundId), locale }),
    snapshot: status !== "draft" ? { at: at(days[1]), by: "Rafaela Duarte", data } : undefined,
    versions,
    created: at(days[0]),
    modified: at(days[days.length - 1], "16:00"),
    modifiedBy: status === "draft" ? "Rafaela Duarte" : "Luiza Andrade",
  };
}

/** A report half-way through section review, with an open comment, to show the review flow. */
function atlanticoInReview(): Report {
  const r = seedReport("r-atlantico-q3", "atlantico-vp-ii", CURRENT_PERIOD, "in_review", ["2026-11-19", "2026-11-25"], { typography: "modern", cover: "light" });
  const [, summary, overview, performance] = r.pages;
  r.review = {
    [r.pages[0].id]: { state: "ok", by: "Luiza Andrade", at: "2026-11-26T09:10:00" },
    [summary.id]: { state: "ok", by: "Luiza Andrade", at: "2026-11-26T09:24:00" },
    [overview.id]: { state: "changes", by: "Luiza Andrade", at: "2026-11-26T09:41:00", note: "Target size should read as approved in the LPA once terms are final." },
  };
  r.comments = [
    {
      id: "c-seed-1",
      pageId: performance.id,
      blockId: performance.blocks[2].id,
      author: "Luiza Andrade",
      text: "Net IRR is young for this fund — should we add a note that it is not meaningful before the first full year?",
      at: "2026-11-26T09:52:00",
      replies: [],
    },
  ];
  return r;
}

let seedCache: Record<string, Report> | null = null;
function seeds(): Record<string, Report> {
  if (seedCache) return seedCache;
  const list = [
    seedReport("r-stx-brazil-q3", "stx-brazil-housing", CURRENT_PERIOD, "draft", ["2026-11-20", "2026-11-26"]),
    seedReport("r-stx-anchor-q3", "stx-anchor", CURRENT_PERIOD, "approved", ["2026-11-18", "2026-11-21", "2026-11-23"]),
    seedReport("r-horizonte-q3", "fip-horizonte", CURRENT_PERIOD, "approved", ["2026-11-10", "2026-11-19", "2026-11-24"], { cover: "minimal" }),
    atlanticoInReview(),
    seedReport("r-cordillera-q3", "cordillera-infra-i", CURRENT_PERIOD, "published", ["2026-10-28", "2026-11-12", "2026-11-18"], { cover: "light" }),
    seedReport("r-horizonte-q2", "fip-horizonte", prevPeriod(CURRENT_PERIOD), "published", ["2026-07-22", "2026-08-04", "2026-08-12"], { cover: "minimal" }),
    seedReport("r-serra-q2", "serra-re-spv", prevPeriod(CURRENT_PERIOD), "archived", ["2026-07-24", "2026-08-05", "2026-08-12"], { typography: "modern" }),
    seedReport("r-stx-brazil-letter-pt", "stx-brazil-housing", CURRENT_PERIOD, "draft", ["2026-11-24", "2026-11-25"], {}, "investor-letter", "pt"),
    seedReport("r-halvorsen-wealth", "halvorsen", CURRENT_PERIOD, "draft", ["2026-11-24", "2026-11-25"], { cover: "light", typography: "modern" }, "family-wealth"),
  ];
  seedCache = Object.fromEntries(list.map((r) => [r.id, r]));
  return seedCache;
}

export function allReports(s: State): Report[] {
  const merged = { ...seeds(), ...s.reports };
  for (const id of s.removed) delete merged[id];
  return Object.values(merged).sort((a, b) => b.modified.localeCompare(a.modified));
}
/** The quarterly report a fund's quarter close uses: the latest non-archived Quarterly Fund Report for the fund and period. */
export function quarterlyFor(s: State, fundId: string, period: Period): Report | null {
  return allReports(s).find((r) => r.template === "quarterly-fund" && r.fundId === fundId && r.period === period && r.status !== "archived") ?? null;
}

export const getReport = (s: State, id: string): Report | null => (s.removed.includes(id) ? null : (s.reports[id] ?? seeds()[id] ?? null));

/* ───────── actions ───────── */

const now = () => new Date().toISOString().slice(0, 19);

function put(r: Report, who: string, audit?: string) {
  const s = load();
  const prev = s.reports[r.id] ?? seeds()[r.id];
  const next = { ...r, modified: now(), modifiedBy: who };
  save({ ...s, reports: { ...s.reports, [r.id]: next } });
  // the database, when connected, has the last word: a change it refuses is reported, not hidden
  push(next, prev).catch((e) => console.warn(`Report Studio: the database refused a change to “${r.name}”`, e));
  if (audit) recordAudit({ user: who, action: audit, object: r.name });
}

function version(r: Report, who: string, note: string, status: ReportStatus = r.status): Report {
  return { ...r, status, versions: [...r.versions, { n: (r.versions.at(-1)?.n ?? 0) + 1, at: now(), by: who, note, status }] };
}

export const studio = {
  create(
    template: TemplateId,
    subjectId: string,
    period: Period,
    who: string,
    closes?: Record<string, Close>,
    opts: { locale?: Locale; investorId?: string; brand?: Design["brand"] } = {},
  ) {
    const tpl = templateById(template);
    const locale = opts.locale ?? "en";
    const data = liveData(subjectId, period, closes);
    const r: Report = {
      id: newId("r-"),
      template,
      subject: tpl.subject,
      locale,
      investorId: opts.investorId,
      name: reportName(template, subjectId, period, locale, opts.investorId),
      fundId: subjectId,
      period,
      status: "draft",
      design: { ...DESIGN, brand: tpl.subject === "family" ? "administrator" : (opts.brand ?? DESIGN.brand) },
      pages: buildTemplate(template, { subjectId, period, data, signer: signerOf(subjectId), locale, investorId: opts.investorId }),
      versions: [{ n: 1, at: now(), by: who, note: `Created from the ${tpl.name} template`, status: "draft" }],
      created: now(),
      modified: now(),
      modifiedBy: who,
    };
    put(r, who, "Created a report");
    return r.id;
  },
  /** Content edits: saved continuously, no new version. Published or archived reports are never edited silently. */
  edit(r: Report, who: string, change: Partial<Pick<Report, "pages" | "design" | "name" | "locale" | "investorId">>) {
    if (r.status === "published" || r.status === "archived" || r.status === "approved") return;
    put({ ...r, ...change }, who);
  },
  duplicate(r: Report, who: string) {
    const copy: Report = {
      ...structuredClone(r),
      id: newId("r-"),
      name: `${r.name} (copy)`,
      status: "draft",
      archivedFrom: undefined,
      snapshot: undefined,
      versions: [{ n: 1, at: now(), by: who, note: `Duplicated from “${r.name}”`, status: "draft" }],
      created: now(),
    };
    put(copy, who, `Duplicated “${r.name}”`);
    return copy.id;
  },
  archive(r: Report, who: string) {
    put({ ...version(r, who, "Archived", "archived"), archivedFrom: r.status }, who, "Archived a report");
  },
  restore(r: Report, who: string) {
    put(version(r, who, "Restored from the archive", r.archivedFrom ?? "draft"), who, "Restored a report");
  },
  freeze(r: Report, who: string, closes?: Record<string, Close>) {
    put({ ...r, snapshot: { at: now(), by: who, data: liveData(r.fundId, r.period, closes) } }, who, "Froze the report’s data snapshot");
  },
  unfreeze(r: Report, who: string) {
    if (r.status !== "draft") return;
    put({ ...r, snapshot: undefined }, who, "Returned the report to live data");
  },
  sendForReview(r: Report, who: string, closes?: Record<string, Close>) {
    const frozen = r.snapshot ?? { at: now(), by: who, data: liveData(r.fundId, r.period, closes) };
    put({ ...version(r, who, "Sent for review with a frozen data snapshot", "in_review"), snapshot: frozen, review: {} }, who, "Sent a report for review");
  },
  returnToDraft(r: Report, who: string, note: string) {
    // section notes stay visible to the preparer; the ticks are cleared for the next review round
    const notes = Object.fromEntries(Object.entries(r.review ?? {}).filter(([, v]) => v.state === "changes"));
    put({ ...version(r, who, `Returned to draft: ${note}`, "draft"), review: notes }, who, "Returned a report to draft");
  },
  /** An approved report goes back to draft on live figures (e.g. the books moved after approval); it is reviewed again. */
  reopen(r: Report, who: string, note: string) {
    if (r.status !== "approved") return;
    put({ ...version(r, who, `Returned to draft: ${note}`, "draft"), snapshot: undefined, review: {} }, who, "Returned an approved report to draft");
  },
  approve(r: Report, who: string) {
    put(version(r, who, "Approved", "approved"), who, "Approved a report");
  },
  publish(r: Report, who: string, note = "Published to the investor portal") {
    put(version(r, who, note, "published"), who, "Published a report");
  },
  /* ───── section-level review ───── */
  reviewPage(r: Report, who: string, pageId: string, state: "ok" | "changes", note?: string) {
    if (r.status !== "in_review") return;
    put(
      { ...r, review: { ...(r.review ?? {}), [pageId]: { state, by: who, at: now(), note } } },
      who,
      state === "ok" ? "Marked a report section as reviewed" : "Asked for changes to a report section",
    );
  },
  clearPageReview(r: Report, who: string, pageId: string) {
    const review = { ...(r.review ?? {}) };
    delete review[pageId];
    put({ ...r, review }, who);
  },
  /* ───── internal comments (any status; never published) ───── */
  comment(r: Report, who: string, pageId: string, blockId: string, text: string) {
    const c = { id: newId("c"), pageId, blockId, author: who, text, at: now(), replies: [] };
    put({ ...r, comments: [...(r.comments ?? []), c] }, who);
  },
  reply(r: Report, who: string, id: string, text: string) {
    put({ ...r, comments: (r.comments ?? []).map((c) => (c.id === id ? { ...c, replies: [...c.replies, { author: who, text, at: now() }] } : c)) }, who);
  },
  resolveComment(r: Report, who: string, id: string) {
    put({ ...r, comments: (r.comments ?? []).map((c) => (c.id === id ? { ...c, resolved: true } : c)) }, who, "Resolved a report comment");
  },
  /** A correction never edits the published version: it opens a new draft that keeps the history. */
  correct(r: Report, who: string, note: string) {
    put({ ...version(r, who, `Correction opened: ${note}`, "draft"), snapshot: undefined }, who, "Opened a correction to a published report");
  },
  setPages(r: Report, who: string, pages: Page[]) {
    studio.edit(r, who, { pages });
  },
};
