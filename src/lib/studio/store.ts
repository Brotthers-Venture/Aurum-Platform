"use client";

/**
 * Report library, kept in this browser until the database is connected. Seeds are deterministic (built from the
 * books) so the server render and the first client render agree; edits are layered on top and persisted.
 */
import { useSyncExternalStore } from "react";
import { recordAudit } from "@/lib/audit-local";
import { fundById } from "@/lib/data";
import { CURRENT_PERIOD, periodName, prevPeriod, type Period } from "@/lib/reporting/figures";
import { fundAdjustments, getClose, type Close } from "@/lib/reporting/store";
import { reportData, type ReportData } from "./data";
import { newId, quarterlyFundReport, type Design, type Page, type Report, type ReportStatus } from "./model";

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
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useStudio = () => useSyncExternalStore(subscribe, load, () => EMPTY);

/* ───────── data for a report ───────── */

/** The data a report shows: its frozen snapshot if it has one, otherwise live from the books. */
export function dataFor(r: Pick<Report, "fundId" | "period" | "snapshot">, closes?: Record<string, Close>): ReportData {
  if (r.snapshot) return r.snapshot.data;
  return liveData(r.fundId, r.period, closes);
}
export function liveData(fundId: string, period: Period, closes: Record<string, Close> = {}) {
  const close = getClose(closes, fundId, period);
  return reportData(fundId, period, fundAdjustments(closes, fundId, period), close?.status === "published");
}

/* ───────── seeds ───────── */

const DESIGN: Design = { brand: "manager", typography: "editorial", cover: "field" };
const signerOf = (fundId: string) => (fundById(fundId)!.gpId === "strlex" ? "Lucas Prado" : fundById(fundId)!.manager);

function seedReport(id: string, fundId: string, period: Period, status: ReportStatus, days: string[], design: Partial<Design> = {}): Report {
  const f = fundById(fundId)!;
  const data = liveData(fundId, period);
  const at = (d: string, t = "10:00") => `${d}T${t}:00`;
  const versions = [{ n: 1, at: at(days[0]), by: "Rafaela Duarte", note: "Created from the Quarterly Fund Report template", status: "draft" as ReportStatus }];
  if (status !== "draft") versions.push({ n: 2, at: at(days[1]), by: "Rafaela Duarte", note: "Sent for review", status: "in_review" });
  if (status === "published" || status === "archived")
    versions.push(
      { n: 3, at: at(days[2], "11:30"), by: signerOf(fundId), note: "Approved by the manager", status: "approved" },
      { n: 4, at: at(days[2], "16:00"), by: "Luiza Andrade", note: "Published to the investor portal with a frozen data snapshot", status: "published" },
    );
  return {
    id,
    template: "quarterly-fund",
    name: `${f.shortName} — ${periodName(period)} Quarterly Report`,
    fundId,
    period,
    status,
    archivedFrom: status === "archived" ? "published" : undefined,
    design: { ...DESIGN, ...design },
    pages: quarterlyFundReport(fundId, period, data, signerOf(fundId)),
    snapshot: status === "published" || status === "archived" ? { at: at(days[2], "15:55"), by: "Luiza Andrade", data } : undefined,
    versions,
    created: at(days[0]),
    modified: at(days[days.length - 1], "16:00"),
    modifiedBy: status === "draft" ? "Rafaela Duarte" : "Luiza Andrade",
  };
}

let seedCache: Record<string, Report> | null = null;
function seeds(): Record<string, Report> {
  if (seedCache) return seedCache;
  const list = [
    seedReport("r-stx-brazil-q3", "stx-brazil-housing", CURRENT_PERIOD, "draft", ["2026-11-20", "2026-11-26"]),
    seedReport("r-stx-anchor-q3", "stx-anchor", CURRENT_PERIOD, "in_review", ["2026-11-18", "2026-11-24"]),
    seedReport("r-cordillera-q3", "cordillera-infra-i", CURRENT_PERIOD, "published", ["2026-10-28", "2026-11-12", "2026-11-18"], { cover: "light" }),
    seedReport("r-horizonte-q2", "fip-horizonte", prevPeriod(CURRENT_PERIOD), "published", ["2026-07-22", "2026-08-04", "2026-08-12"], { cover: "minimal" }),
    seedReport("r-serra-q2", "serra-re-spv", prevPeriod(CURRENT_PERIOD), "archived", ["2026-07-24", "2026-08-05", "2026-08-12"], { typography: "modern" }),
  ];
  seedCache = Object.fromEntries(list.map((r) => [r.id, r]));
  return seedCache;
}

export function allReports(s: State): Report[] {
  const merged = { ...seeds(), ...s.reports };
  for (const id of s.removed) delete merged[id];
  return Object.values(merged).sort((a, b) => b.modified.localeCompare(a.modified));
}
export const getReport = (s: State, id: string): Report | null => (s.removed.includes(id) ? null : (s.reports[id] ?? seeds()[id] ?? null));

/* ───────── actions ───────── */

const now = () => new Date().toISOString().slice(0, 19);

function put(r: Report, who: string, audit?: string) {
  const s = load();
  save({ ...s, reports: { ...s.reports, [r.id]: { ...r, modified: now(), modifiedBy: who } } });
  if (audit) recordAudit({ user: who, action: audit, object: r.name });
}

function version(r: Report, who: string, note: string, status: ReportStatus = r.status): Report {
  return { ...r, status, versions: [...r.versions, { n: (r.versions.at(-1)?.n ?? 0) + 1, at: now(), by: who, note, status }] };
}

export const studio = {
  create(fundId: string, period: Period, who: string, closes?: Record<string, Close>) {
    const f = fundById(fundId)!;
    const data = liveData(fundId, period, closes);
    const r: Report = {
      id: newId("r-"),
      template: "quarterly-fund",
      name: `${f.shortName} — ${periodName(period)} Quarterly Report`,
      fundId,
      period,
      status: "draft",
      design: DESIGN,
      pages: quarterlyFundReport(fundId, period, data, signerOf(fundId)),
      versions: [{ n: 1, at: now(), by: who, note: "Created from the Quarterly Fund Report template", status: "draft" }],
      created: now(),
      modified: now(),
      modifiedBy: who,
    };
    put(r, who, "Created a report");
    return r.id;
  },
  /** Content edits: saved continuously, no new version. Published or archived reports are never edited silently. */
  edit(r: Report, who: string, change: Partial<Pick<Report, "pages" | "design" | "name">>) {
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
    put({ ...version(r, who, "Sent for review with a frozen data snapshot", "in_review"), snapshot: frozen }, who, "Sent a report for review");
  },
  returnToDraft(r: Report, who: string, note: string) {
    put(version(r, who, `Returned to draft: ${note}`, "draft"), who, "Returned a report to draft");
  },
  approve(r: Report, who: string) {
    put(version(r, who, "Approved", "approved"), who, "Approved a report");
  },
  publish(r: Report, who: string) {
    put(version(r, who, "Published to the investor portal", "published"), who, "Published a report");
  },
  /** A correction never edits the published version: it opens a new draft that keeps the history. */
  correct(r: Report, who: string, note: string) {
    put({ ...version(r, who, `Correction opened: ${note}`, "draft"), snapshot: undefined }, who, "Opened a correction to a published report");
  },
  setPages(r: Report, who: string, pages: Page[]) {
    studio.edit(r, who, { pages });
  },
};
