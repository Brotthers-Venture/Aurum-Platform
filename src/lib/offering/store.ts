"use client";

/**
 * Stage changes made in this browser, layered on the derived opportunities (prototype; moves to the database with
 * the rest of the Offering Solution). Gated stages need their evidence; every change is written to the audit log.
 */
import { useSyncExternalStore } from "react";
import { recordAudit } from "@/lib/audit-local";
import { AGREEMENTS, OPPORTUNITIES, partyById, stageOf, type Opportunity, type StageId } from "./data";

const KEY = "aurum-offering-v1";
type Move = { id: string; from: StageId; to: StageId; by: string; at: string; reason?: string };
type State = { stages: Record<string, StageId>; moves: Move[] };
const EMPTY: State = { stages: {}, moves: [] };
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
const save = (s: State) => {
  state = s;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useOfferingState = () => useSyncExternalStore(subscribe, load, () => EMPTY);

export const applyMoves = (s: State): Opportunity[] => OPPORTUNITIES.map((o) => (s.stages[o.id] ? { ...o, stage: s.stages[o.id] } : o));
export const movesFor = (s: State, id: string) => s.moves.filter((m) => m.id === id);

/** Why a stage can't be set for this opportunity, or null when its evidence is on file. */
export function gateBlock(o: Opportunity, to: StageId): string | null {
  if (to === "nda_executed") {
    const nda = AGREEMENTS.find((a) => a.kind === "NDA" && a.offeringId === o.offeringId && a.partyId === o.partyId && a.status === "Fully executed" && a.evidence);
    return nda ? null : "No executed NDA with evidence is on file for this investor and offering.";
  }
  if (to === "accepted") {
    const sub = AGREEMENTS.find(
      (a) => a.kind === "Subscription agreement" && a.offeringId === o.offeringId && a.partyId === o.partyId && a.status === "Fully executed" && a.evidence,
    );
    const kyc = partyById(o.partyId)?.kyc;
    if (!sub) return "The subscription isn’t countersigned by the general partner yet.";
    if (kyc !== "Clear") return "The investor’s compliance file isn’t cleared.";
    return null;
  }
  if (to === "funded") {
    const { called, received } = o.amounts;
    return o.source === "Fund ledger" && called && received === called ? null : "No receipt of the called capital is recorded in the fund’s books.";
  }
  return null;
}

export const offering = {
  move(o: Opportunity, to: StageId, who: string, reason?: string): string | null {
    if (o.stage === to) return null;
    const block = stageOf(to).gate ? gateBlock(o, to) : null;
    if (block) return block;
    const s = load();
    save({ stages: { ...s.stages, [o.id]: to }, moves: [...s.moves, { id: o.id, from: o.stage, to, by: who, at: new Date().toISOString().slice(0, 19), reason }] });
    recordAudit({
      user: who,
      action: `Moved an investor opportunity from ${stageOf(o.stage).label} to ${stageOf(to).label}`,
      object: `${partyById(o.partyId)?.name} · ${o.offeringId}`,
    });
    return null;
  },
};
