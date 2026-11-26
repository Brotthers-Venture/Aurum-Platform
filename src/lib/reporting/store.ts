"use client";

/**
 * Quarter-close state, kept in this browser until the database is connected. Each fund and quarter has one
 * close: the checklist, the valuation request to the manager, the investor letter (with linked figures), the
 * statements batch, review and sign-off, comments and an activity log. Seeds are deterministic so the server
 * render and the first client render agree; changes made here are layered on top and persisted.
 */
import { useSyncExternalStore } from "react";
import { recordAudit } from "@/lib/audit-local";
import { funds } from "@/lib/data";
import { CURRENT_PERIOD, FIGURE_KEYS, carryingValue, computeFigures, periodDue, periodName, prevPeriod, reportable, type Adjustment, type Period } from "./figures";

export type CloseStatus = "not_started" | "preparing" | "in_review" | "with_gp" | "approved" | "published";
export type RequestStatus = "not_sent" | "sent" | "submitted" | "posted";
export type Block = { id: string; text: string; kind?: "para" | "commentary" };
export type Comment = {
  id: string;
  target: string;
  author: string;
  side: "aurum" | "gp";
  text: string;
  at: string;
  resolved?: boolean;
  replies: { author: string; side: "aurum" | "gp"; text: string; at: string }[];
};
export type LogEvent = { at: string; who: string; what: string };
export type Stamp = { by: string; at: string };

export type Close = {
  fundId: string;
  period: Period;
  status: CloseStatus;
  rolledFrom?: Period;
  booksClosed?: Stamp;
  request: {
    status: RequestStatus;
    due?: string;
    sent?: Stamp;
    submitted?: Stamp;
    fairValue?: number;
    carrying?: number;
    commentary?: string;
    posted?: Stamp;
  };
  adjustments: Adjustment[];
  blocks: Block[];
  statements?: Stamp;
  snapshot?: Record<string, number | string>;
  sentForReview?: Stamp;
  reviewed?: Stamp;
  gpApproved?: Stamp & { statement: string };
  changesRequested?: Stamp & { side: "aurum" | "gp"; note: string };
  published?: Stamp;
  comments: Comment[];
  log: LogEvent[];
};

export const STATUS_LABEL: Record<CloseStatus, string> = {
  not_started: "Not started",
  preparing: "Preparing",
  in_review: "In review",
  with_gp: "With the manager",
  approved: "Approved",
  published: "Published",
};

export const CERTIFICATION =
  "I have reviewed the quarterly reporting package. To the best of my knowledge the valuations and commentary provided are accurate and complete, and I approve its release to the fund's investors.";

/* ───────── template ───────── */

export const TEMPLATE: Block[] = [
  {
    id: "b1",
    text: "Dear Partners, this letter reports on the {{quarter}}. As of {{period_end}}, the net asset value of {{fund}} was {{nav}}, and total value to paid-in capital stood at {{tvpi}}.",
  },
  {
    id: "b2",
    text: "Partners have contributed {{called}} of the {{commitments}} committed ({{called_pct}}), leaving {{unfunded}} available for future investment. During the quarter the fund called {{q_called}} and distributed {{q_distributed}}.",
  },
  {
    id: "b3",
    text: "The net result for the quarter was {{q_pnl}}, including a change in unrealized value of {{q_unrealized}}. Distributions to date total {{distributed}}, a DPI of {{dpi}}.",
  },
  { id: "b4", kind: "commentary", text: "" },
  { id: "b5", text: "Each partner's capital account statement is available in the investor portal. Please contact us with any questions." },
];

export const tokensIn = (blocks: Block[]) => [...new Set(blocks.flatMap((b) => [...b.text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])))];

/* ───────── seeds ───────── */

const at = (d: string, t = "10:00") => `${d}T${t}:00`;
const AURUM_PREPARER = "Rafaela Duarte";
const AURUM_REVIEWER = "Luiza Andrade";

/** What each fund's managers would sign with, in the seeded history. */
const GP_SIGNER: Record<string, string> = { strlex: "Lucas Prado" };

function emptyClose(fundId: string, period: Period): Close {
  return { fundId, period, status: "not_started", request: { status: "not_sent" }, adjustments: [], blocks: [], comments: [], log: [] };
}

function snapshotOf(fundId: string, period: Period, adjustments: Adjustment[]) {
  const figs = computeFigures(fundId, period, adjustments);
  return Object.fromEntries(FIGURE_KEYS.map((k) => [k, figs[k].value]));
}

function done(fundId: string, period: Period, upTo: CloseStatus, dates: string[]): Close {
  const fund = funds.find((f) => f.id === fundId)!;
  const signer = GP_SIGNER[fund.gpId] ?? fund.manager;
  const c = emptyClose(fundId, period);
  const order: CloseStatus[] = ["preparing", "in_review", "with_gp", "approved", "published"];
  const reach = (s: CloseStatus) => order.indexOf(upTo) >= order.indexOf(s);
  const carrying = carryingValue(fundId, period);
  c.status = upTo;
  c.rolledFrom = period === CURRENT_PERIOD ? prevPeriod(period) : undefined;
  c.blocks = TEMPLATE.map((b) => ({ ...b }));
  c.booksClosed = { by: AURUM_PREPARER, at: at(dates[0]) };
  c.request = {
    status: "posted",
    due: dates[1],
    sent: { by: AURUM_PREPARER, at: at(dates[0], "11:00") },
    submitted: { by: signer, at: at(dates[1], "16:20") },
    fairValue: carrying,
    carrying,
    commentary: `Portfolio companies performed in line with plan during the ${periodName(period)} period. No impairments were identified and the manager's fair value equals the carrying value at quarter end.`,
    posted: { by: AURUM_PREPARER, at: at(dates[2], "09:30") },
  };
  c.statements = { by: AURUM_PREPARER, at: at(dates[2], "14:00") };
  c.log = [
    { at: at(dates[0]), who: AURUM_PREPARER, what: `Closed the books for ${periodName(period)}` },
    { at: at(dates[0], "11:00"), who: AURUM_PREPARER, what: "Asked the manager for quarter-end valuations and commentary" },
    { at: at(dates[1], "16:20"), who: signer, what: "Submitted valuations and commentary" },
    { at: at(dates[2], "09:30"), who: AURUM_PREPARER, what: "Posted the valuation (no change to carrying value)" },
    { at: at(dates[2], "14:00"), who: AURUM_PREPARER, what: "Generated capital account statements" },
  ];
  if (reach("in_review")) {
    c.sentForReview = { by: AURUM_PREPARER, at: at(dates[3], "09:00") };
    c.snapshot = snapshotOf(fundId, period, []);
    c.log.push({ at: at(dates[3], "09:00"), who: AURUM_PREPARER, what: "Sent the package for review" });
  }
  if (reach("with_gp")) {
    c.reviewed = { by: AURUM_REVIEWER, at: at(dates[3], "15:10") };
    c.log.push({ at: at(dates[3], "15:10"), who: AURUM_REVIEWER, what: "Reviewed the package and sent it to the manager for approval" });
  }
  if (reach("approved")) {
    c.gpApproved = { by: signer, at: at(dates[4], "11:45"), statement: CERTIFICATION };
    c.log.push({ at: at(dates[4], "11:45"), who: signer, what: "Approved the package with the certification statement" });
  }
  if (reach("published")) {
    c.published = { by: AURUM_REVIEWER, at: at(dates[4], "16:00") };
    c.log.push({ at: at(dates[4], "16:00"), who: AURUM_REVIEWER, what: "Published the letter, report and statements to investors" });
  }
  return c;
}

function seed(fundId: string, period: Period): Close | null {
  if (!reportable(fundId, period)) return null;
  if (period === "2026-Q2") return done(fundId, period, "published", ["2026-07-08", "2026-07-17", "2026-07-21", "2026-08-04", "2026-08-12"]);
  if (period !== CURRENT_PERIOD) return emptyClose(fundId, period);
  const q3 = ["2026-10-06", "2026-10-16", "2026-10-21", "2026-11-12", "2026-11-18"];
  switch (fundId) {
    case "cordillera-infra-i":
      return done(fundId, period, "published", q3);
    case "stx-anchor":
      return done(fundId, period, "with_gp", ["2026-10-08", "2026-10-22", "2026-10-27", "2026-11-24"]);
    case "fip-horizonte": {
      const c = done(fundId, period, "in_review", ["2026-10-09", "2026-10-23", "2026-11-03", "2026-11-25"]);
      c.comments.push({
        id: "cm-seed-1",
        target: "b3",
        author: AURUM_REVIEWER,
        side: "aurum",
        text: "The quarter shows no change in unrealized value. Please confirm the manager's valuation memo was received before we send this on.",
        at: at("2026-11-25", "12:05"),
        replies: [],
      });
      return c;
    }
    case "stx-brazil-housing": {
      const c = emptyClose(fundId, period);
      c.status = "preparing";
      c.rolledFrom = prevPeriod(period);
      c.blocks = TEMPLATE.map((b) => ({ ...b }));
      c.booksClosed = { by: AURUM_PREPARER, at: at("2026-11-17") };
      c.request = { status: "sent", due: "2026-11-28", sent: { by: AURUM_PREPARER, at: at("2026-11-18", "09:15") } };
      c.log = [
        { at: at("2026-11-16", "17:00"), who: AURUM_PREPARER, what: `Started the ${periodName(period)} close, rolled forward from ${periodName(prevPeriod(period))}` },
        { at: at("2026-11-17"), who: AURUM_PREPARER, what: `Closed the books for ${periodName(period)}` },
        { at: at("2026-11-18", "09:15"), who: AURUM_PREPARER, what: "Asked the manager for quarter-end valuations and commentary" },
      ];
      return c;
    }
    case "atlantico-vp-ii": {
      const c = emptyClose(fundId, period);
      c.status = "preparing";
      c.rolledFrom = prevPeriod(period);
      c.blocks = TEMPLATE.map((b) => ({ ...b }));
      c.log = [{ at: at("2026-11-20", "10:40"), who: AURUM_PREPARER, what: `Started the ${periodName(period)} close, rolled forward from ${periodName(prevPeriod(period))}` }];
      return c;
    }
    default:
      return emptyClose(fundId, period);
  }
}

/* ───────── store ───────── */

const KEY = "aurum-reporting-v1";
type State = Record<string, Close>;
const EMPTY: State = {};
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (state) return state;
  try {
    state = JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as State;
  } catch {
    state = {};
  }
  return state;
}
function save(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: changes last for this visit */
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

export const closeKey = (fundId: string, period: Period) => `${fundId}@${period}`;
const seedCache = new Map<string, Close | null>();
function seeded(fundId: string, period: Period) {
  const k = closeKey(fundId, period);
  if (!seedCache.has(k)) seedCache.set(k, seed(fundId, period));
  return seedCache.get(k)!;
}

export function getClose(s: State, fundId: string, period: Period): Close | null {
  return s[closeKey(fundId, period)] ?? seeded(fundId, period);
}

/** All posted valuation adjustments for a fund, across its closes up to the period. */
export function fundAdjustments(s: State, fundId: string, period: Period): Adjustment[] {
  const out: Adjustment[] = [];
  let p: Period = period;
  for (let i = 0; i < 8; i++) {
    out.push(...(getClose(s, fundId, p)?.adjustments ?? []));
    p = prevPeriod(p);
  }
  return out;
}

export function useReporting() {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

function update(fundId: string, period: Period, who: string, what: string, fn: (c: Close) => void, audit = true) {
  const s = load();
  const base = getClose(s, fundId, period) ?? emptyClose(fundId, period);
  const c: Close = structuredClone(base);
  fn(c);
  const now = new Date().toISOString().slice(0, 19);
  c.log = [...c.log, { at: now, who, what }];
  save({ ...s, [closeKey(fundId, period)]: c });
  if (audit) recordAudit({ user: who, action: what, object: `${funds.find((f) => f.id === fundId)?.shortName} · ${periodName(period)} close` });
}
const stamp = (by: string): Stamp => ({ by, at: new Date().toISOString().slice(0, 19) });

/* ───────── actions ───────── */

export const actions = {
  start(fundId: string, period: Period, who: string) {
    const prev = getClose(load(), fundId, prevPeriod(period));
    const from = prev && prev.blocks.length ? prev : null;
    update(
      fundId,
      period,
      who,
      from ? `Started the ${periodName(period)} close, rolled forward from ${periodName(prev!.period)}` : `Started the ${periodName(period)} close from the standard letter`,
      (c) => {
        c.status = "preparing";
        c.blocks = (from ? from.blocks : TEMPLATE).map((b) => ({ ...b }));
        c.rolledFrom = from ? from.period : undefined;
      },
    );
  },
  closeBooks(fundId: string, period: Period, who: string) {
    update(fundId, period, who, `Closed the books for ${periodName(period)}`, (c) => {
      c.booksClosed = stamp(who);
    });
  },
  reopenBooks(fundId: string, period: Period, who: string) {
    update(fundId, period, who, `Reopened the books for ${periodName(period)}`, (c) => {
      c.booksClosed = undefined;
    });
  },
  sendRequest(fundId: string, period: Period, who: string, due: string) {
    update(fundId, period, who, "Asked the manager for quarter-end valuations and commentary", (c) => {
      c.request = { status: "sent", due, sent: stamp(who) };
    });
  },
  submitRequest(fundId: string, period: Period, who: string, fairValue: number, commentary: string) {
    const s = load();
    const carrying = carryingValue(fundId, period, fundAdjustments(s, fundId, period));
    update(fundId, period, who, "Submitted valuations and commentary", (c) => {
      c.request = { ...c.request, status: "submitted", submitted: stamp(who), fairValue, carrying, commentary };
    });
  },
  returnRequest(fundId: string, period: Period, who: string, note: string) {
    update(fundId, period, who, `Returned the valuation request to the manager: ${note}`, (c) => {
      c.request = { status: "sent", due: c.request.due, sent: c.request.sent };
    });
  },
  postValuation(fundId: string, period: Period, who: string) {
    update(fundId, period, who, "Posted the manager's quarter-end valuation", (c) => {
      const diff = (c.request.fairValue ?? 0) - (c.request.carrying ?? 0);
      if (Math.abs(diff) >= 0.01) c.adjustments = [...c.adjustments, { period, amount: diff, memo: `Manager's fair value at ${periodName(period)} end` }];
      c.request = { ...c.request, status: "posted", posted: stamp(who) };
    });
  },
  postAdjustment(fundId: string, period: Period, who: string, amount: number, memo: string) {
    update(fundId, period, who, `Posted a valuation adjustment: ${memo}`, (c) => {
      c.adjustments = [...c.adjustments, { period, amount, memo }];
    });
  },
  generateStatements(fundId: string, period: Period, who: string, count: number) {
    update(fundId, period, who, `Generated ${count} capital account statements`, (c) => {
      c.statements = stamp(who);
    });
  },
  saveBlocks(fundId: string, period: Period, who: string, blocks: Block[]) {
    update(fundId, period, who, "Edited the investor letter", (c) => {
      c.blocks = blocks;
    });
  },
  sendForReview(fundId: string, period: Period, who: string) {
    const s = load();
    const snap = snapshotOf(fundId, period, fundAdjustments(s, fundId, period));
    update(fundId, period, who, "Sent the package for review", (c) => {
      c.status = "in_review";
      c.sentForReview = stamp(who);
      c.snapshot = snap;
      c.changesRequested = undefined;
    });
  },
  approveReview(fundId: string, period: Period, who: string) {
    update(fundId, period, who, "Reviewed the package and sent it to the manager for approval", (c) => {
      c.status = "with_gp";
      c.reviewed = stamp(who);
    });
  },
  requestChanges(fundId: string, period: Period, who: string, side: "aurum" | "gp", note: string) {
    update(fundId, period, who, `Requested changes: ${note}`, (c) => {
      c.status = "preparing";
      c.changesRequested = { ...stamp(who), side, note };
      c.reviewed = undefined;
      c.gpApproved = undefined;
    });
  },
  gpApprove(fundId: string, period: Period, who: string) {
    update(fundId, period, who, "Approved the package with the certification statement", (c) => {
      c.status = "approved";
      c.gpApproved = { ...stamp(who), statement: CERTIFICATION };
    });
  },
  /** Figures changed after review: the reviewer accepts the new values; an approval already given is withdrawn. */
  acceptChanges(fundId: string, period: Period, who: string) {
    const s = load();
    const snap = snapshotOf(fundId, period, fundAdjustments(s, fundId, period));
    update(fundId, period, who, "Reviewed the figures that changed after review", (c) => {
      c.snapshot = snap;
      c.reviewed = stamp(who);
      if (c.status === "approved") {
        c.status = "with_gp";
        c.gpApproved = undefined;
      }
    });
  },
  publish(fundId: string, period: Period, who: string) {
    update(fundId, period, who, "Published the letter, report and statements to investors", (c) => {
      c.status = "published";
      c.published = stamp(who);
    });
  },
  comment(fundId: string, period: Period, who: string, side: "aurum" | "gp", target: string, text: string) {
    update(
      fundId,
      period,
      who,
      "Commented on the investor letter",
      (c) => {
        c.comments = [...c.comments, { id: `cm-${Date.now()}`, target, author: who, side, text, at: stamp(who).at, replies: [] }];
      },
      false,
    );
  },
  reply(fundId: string, period: Period, who: string, side: "aurum" | "gp", id: string, text: string) {
    update(
      fundId,
      period,
      who,
      "Replied to a comment",
      (c) => {
        c.comments = c.comments.map((x) => (x.id === id ? { ...x, replies: [...x.replies, { author: who, side, text, at: stamp(who).at }] } : x));
      },
      false,
    );
  },
  resolve(fundId: string, period: Period, who: string, id: string) {
    update(fundId, period, who, "Resolved a comment", (c) => {
      c.comments = c.comments.map((x) => (x.id === id ? { ...x, resolved: true } : x));
    });
  },
};

/* ───────── derived ───────── */

export function staleKeys(c: Close, current: Record<string, number | string>) {
  if (!c.snapshot) return [];
  return Object.keys(c.snapshot).filter((k) => {
    const a = c.snapshot![k];
    const b = current[k];
    return typeof a === "number" && typeof b === "number" ? Math.abs(a - b) >= 0.005 : a !== b;
  });
}

export const dueDate = (p: Period) => periodDue(p);
