/**
 * The connective spine (blueprint §3): record references and the event ledger.
 * Every state change is written once here; activity feeds, the audit log and Corporate Chat timelines read it.
 * Today the ledger lives in this browser; the same contract moves to Supabase (events table + realtime) in P4.
 */
import { recordAudit } from "./audit-local";

export type RefKind = "subscription" | "investor" | "screening" | "call" | "room" | "plan" | "formation" | "deal" | "bank" | "person" | "family" | "checklist";
export type Ref = { kind: RefKind; id: string };
export const refKey = (r: Ref) => `${r.kind}:${r.id}`;
export const parseRef = (k: string): Ref | null => {
  const i = k.indexOf(":");
  return i > 0 ? { kind: k.slice(0, i) as RefKind, id: k.slice(i + 1) } : null;
};

export type LedgerEvent = {
  id: string;
  at: string;
  actor: string;
  /** dotted type, e.g. onboarding.submitted, screening.first_review, screening.cleared */
  type: string;
  /** the record the event is about, plus any related records (an investor, a fund …) */
  ref: Ref;
  related?: Ref[];
  /** one plain sentence, written for people */
  text: string;
  /** client-visible events may appear in channels with external participants; internal ones never do */
  visibility: "internal" | "client";
};

const KEY = "aurum-ledger-v1";
const BUS = "aurum-ledger";

function read(): LedgerEvent[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LedgerEvent[]) : [];
  } catch {
    return [];
  }
}

/** Seeded history (from the sample data) plus everything recorded in this browser, newest first. */
export function ledger(seed: LedgerEvent[] = []): LedgerEvent[] {
  return [...seed, ...read()].sort((a, b) => b.at.localeCompare(a.at));
}
export const eventsFor = (all: LedgerEvent[], ref: Ref) => all.filter((e) => refKey(e.ref) === refKey(ref) || e.related?.some((r) => refKey(r) === refKey(ref)));

/**
 * Record a change. It joins the ledger, the audit log, and the timeline of every Corporate Chat matter linked
 * to the same record — so nobody has to post "FYI" by hand.
 */
export function emit(e: Omit<LedgerEvent, "id" | "at" | "visibility"> & { at?: string; visibility?: LedgerEvent["visibility"] }) {
  const ev: LedgerEvent = { visibility: "internal", ...e, id: `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: e.at ?? new Date().toISOString() };
  try {
    const all = read();
    all.push(ev);
    window.localStorage.setItem(KEY, JSON.stringify(all.slice(-3000)));
  } catch {
    /* storage unavailable: the event lasts for this visit */
  }
  recordAudit({ user: ev.actor, action: ev.type, object: ev.text });
  postToLinkedMatters(ev);
  try {
    window.dispatchEvent(new CustomEvent(BUS, { detail: ev }));
  } catch {
    /* server render */
  }
  return ev;
}

export function onLedger(cb: (e: LedgerEvent) => void) {
  const h = (x: Event) => cb((x as CustomEvent<LedgerEvent>).detail);
  window.addEventListener(BUS, h);
  return () => window.removeEventListener(BUS, h);
}

/** Chat matters link to records with their own kinds; the ledger's references map onto them. */
const CHAT_KIND: Partial<Record<RefKind, string>> = {
  subscription: "subscription",
  investor: "investor",
  call: "call",
  room: "room",
  plan: "plan",
  formation: "formation",
  bank: "bank",
  screening: "screening",
};

function postToLinkedMatters(ev: LedgerEvent) {
  // loaded on demand: Corporate Chat's store depends on records that themselves emit to the ledger
  import("./chat-store").then(({ loadChat, saveChat }) => {
    try {
      const st = loadChat(); // seeded if this browser has not opened Corporate Chat yet
      const refs = [ev.ref, ...(ev.related ?? [])];
      const hit = st.matters.filter((m) => refs.some((r) => CHAT_KIND[r.kind] === m.linked.kind && r.id === m.linked.id));
      if (!hit.length) return;
      saveChat({
        ...st,
        matters: st.matters.map((m) => (hit.includes(m) ? { ...m, updatedAt: ev.at } : m)),
        messages: [...st.messages, ...hit.map((m) => ({ id: `msg-${ev.id}-${m.id}`, where: m.id, author: "system", at: ev.at, body: ev.text, kind: "event" as const }))],
      });
    } catch {
      /* the event still sits in the ledger */
    }
  });
}

/** Where a reference opens. */
export function hrefOf(r: Ref) {
  switch (r.kind) {
    case "subscription":
      return `/admin/fund/onboarding/${r.id}`;
    case "screening":
      return `/admin/compliance?tab=screening#${r.id}`;
    case "investor":
      return `/admin/fund/investors`;
    case "call":
      return `/admin/fund/capital-calls`;
    case "room":
      return `/admin/dataroom`;
    case "plan":
      return `/admin/pmo?tab=plan`;
    case "deal":
      return `/admin/sales`;
    case "family":
      return `/admin/multi-family/${r.id}`;
    case "checklist":
      return `/admin/multi-family/onboarding#${r.id}`;
    default:
      return "/admin";
  }
}

/** Open (or start) the Corporate Chat conversation about a record. */
export const discussHref = (r: Ref, label: string, title?: string) =>
  `/admin/communication?discuss=${encodeURIComponent(refKey(r))}&label=${encodeURIComponent(label)}${title ? `&title=${encodeURIComponent(title)}` : ""}`;
