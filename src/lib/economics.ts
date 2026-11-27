"use client";

/**
 * Fund economics as numbered versions. Version 1 is what the vehicle was set up with. Every later version is a
 * proposed change that names a reason and, for each term it changes, the clause or amendment behind it. It applies
 * only after two decisions: an approver at the firm who did not prepare it, then the GP principal.
 *
 * Kept in this browser until the database is connected, like the PMO plans and the reporting closes.
 */
import { useSyncExternalStore } from "react";
import { fundById, type Fund } from "@/lib/data";

export type Terms = Pick<Fund, "managementFee" | "carry" | "hurdle" | "term" | "hurdleRate" | "carryRate">;
export type TermKey = keyof Terms;

export const TERM_FIELDS: { key: TermKey; label: string; kind: "text" | "rate"; hint: string }[] = [
  { key: "managementFee", label: "Management fee", kind: "text", hint: "Rate and basis, e.g. 1.75% on commitments, then on invested capital" },
  { key: "carry", label: "Carried interest", kind: "text", hint: "As stated in the LPA, e.g. 20%" },
  { key: "hurdle", label: "Hurdle", kind: "text", hint: "e.g. 8% preferred return, compounding annually" },
  { key: "term", label: "Fund term", kind: "text", hint: "e.g. 10 years + 2 × 1-year extensions" },
  { key: "hurdleRate", label: "Hurdle rate used in the waterfall", kind: "rate", hint: "Percent per year" },
  { key: "carryRate", label: "Carry rate used in the waterfall", kind: "rate", hint: "Percent of profits" },
];

export type Change = { key: TermKey; from: string | number; to: string | number; source: string };

export type Version = {
  version: number;
  status: "proposed" | "approved" | "applied" | "rejected";
  terms: Terms;
  changes: Change[];
  reason: string;
  effective: string;
  preparedBy: string;
  preparedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  rejectedBy?: string;
  rejectedNote?: string;
};

const KEY = "aurum-economics-v1";
type State = Record<string, Version[]>;
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

export const seedTerms = (f: Fund): Terms => ({
  managementFee: f.managementFee,
  carry: f.carry,
  hurdle: f.hurdle,
  term: f.term,
  hurdleRate: f.hurdleRate,
  carryRate: f.carryRate,
});

/** Version 1: the terms the vehicle was set up with. */
const original = (f: Fund): Version => ({
  version: 1,
  status: "applied",
  terms: seedTerms(f),
  changes: [],
  reason: "Terms entered when the vehicle was set up",
  effective: f.firstClose,
  preparedBy: "Set-up",
  preparedAt: f.firstClose,
});

export function versionsOf(s: State, f: Fund): Version[] {
  return [original(f), ...(s[f.id] ?? [])];
}
export const currentOf = (vs: Version[]) => [...vs].reverse().find((v) => v.status === "applied")!;
export const openOf = (vs: Version[]) => vs.find((v) => v.status === "proposed" || v.status === "approved");

/** Every version of one fund, newest last, with the one in force and any change waiting for a decision. */
export function useEconomics(fundId: string) {
  const s = useSyncExternalStore(subscribe, load, () => EMPTY);
  const f = fundById(fundId)!;
  const versions = versionsOf(s, f);
  return { versions, current: currentOf(versions), open: openOf(versions) };
}

const now = () => new Date().toISOString();
function patch(fundId: string, version: number, fn: (v: Version) => Version) {
  const s = load();
  save({ ...s, [fundId]: (s[fundId] ?? []).map((v) => (v.version === version ? fn(v) : v)) });
}

export function propose(fundId: string, v: Pick<Version, "terms" | "changes" | "reason" | "effective" | "preparedBy">) {
  const s = load();
  const all = versionsOf(s, fundById(fundId)!);
  if (openOf(all)) throw new Error("A change is already waiting for a decision");
  save({ ...s, [fundId]: [...(s[fundId] ?? []), { ...v, version: all.length + 1, status: "proposed", preparedAt: now() }] });
}
export const approve = (fundId: string, version: number, by: string) => patch(fundId, version, (v) => ({ ...v, status: "approved", approvedBy: by, approvedAt: now() }));
export const confirm = (fundId: string, version: number, by: string) => patch(fundId, version, (v) => ({ ...v, status: "applied", confirmedBy: by, confirmedAt: now() }));
export const reject = (fundId: string, version: number, by: string, note: string) =>
  patch(fundId, version, (v) => ({ ...v, status: "rejected", rejectedBy: by, rejectedNote: note }));

export const showTerm = (key: TermKey, v: string | number) => (typeof v === "number" ? `${+(v * 100).toFixed(2)}%` : v);
