"use client";

/**
 * Offering Solution records kept in this browser until the database is connected: offerings and prospects created
 * here, investors added to an offering's pipeline, hand-recorded amounts, stage changes and follow-ups. They are
 * layered on the records derived from Fund Solution and Data Rooms, which stay the source for anything they hold
 * (accepted, called and received capital; subscriptions; data room NDAs). Every change is written to the audit log.
 */
import { useMemo, useSyncExternalStore } from "react";
import { recordAudit } from "@/lib/audit-local";
import { AGREEMENTS, OFFERINGS, OPPORTUNITIES, PARTIES, figures as baseFigures, stageOf, type Amounts, type Offering, type Opportunity, type Party, type StageId } from "./data";

const KEY = "aurum-offering-v1";

export type FollowUp = {
  id: string;
  oppId?: string;
  partyId: string;
  offeringId?: string;
  action: string;
  due: string;
  owner: string;
  createdBy: string;
  createdAt: string;
  done?: { by: string; at: string };
};
type Move = { id: string; from: StageId; to: StageId; by: string; at: string; reason?: string };
type State = {
  stages: Record<string, StageId>;
  moves: Move[];
  offerings: Offering[];
  offeringEdits: Record<string, Partial<Offering>>;
  parties: Party[];
  partyEdits: Record<string, Partial<Party>>;
  opps: Opportunity[];
  /** hand-recorded amounts (potential, indicative, soft) by opportunity */
  amounts: Record<string, Pick<Amounts, "potential" | "indicative" | "soft">>;
  followUps: FollowUp[];
};
const EMPTY: State = { stages: {}, moves: [], offerings: [], offeringEdits: {}, parties: [], partyEdits: {}, opps: [], amounts: {}, followUps: [] };
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

const now = () => new Date().toISOString().slice(0, 19);
let seq = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

/* ───────── the merged view ───────── */

export type OfferingData = ReturnType<typeof merge>;

function merge(s: State) {
  const offerings = [...OFFERINGS.map((o) => (s.offeringEdits[o.id] ? { ...o, ...s.offeringEdits[o.id] } : o)), ...s.offerings.map((o) => ({ ...o, ...s.offeringEdits[o.id] }))];
  const parties = [...PARTIES.map((p) => (s.partyEdits[p.id] ? { ...p, ...s.partyEdits[p.id] } : p)), ...s.parties.map((p) => ({ ...p, ...s.partyEdits[p.id] }))];
  const opps = [...OPPORTUNITIES, ...s.opps].map((o) => {
    let x: Opportunity = s.stages[o.id] ? { ...o, stage: s.stages[o.id] } : o;
    // amounts recorded by a person replace estimates
    if (s.amounts[o.id]) x = { ...x, amounts: { ...x.amounts, ...s.amounts[o.id] }, amountsIllustrative: false };
    return x;
  });
  const offering = (id: string) => offerings.find((o) => o.id === id);
  const party = (id: string) => parties.find((p) => p.id === id);
  return {
    offerings,
    parties,
    opps,
    followUps: s.followUps,
    moves: s.moves,
    offering,
    party,
    figures: (ids: string[]) => baseFigures(ids, opps, offerings),
    openFollowUps: (pred: (f: FollowUp) => boolean = () => true) => s.followUps.filter((f) => !f.done && pred(f)).sort((a, b) => a.due.localeCompare(b.due)),
  };
}
export function useOffering() {
  const s = useOfferingState();
  return useMemo(() => merge(s), [s]);
}
export const movesFor = (moves: Move[], id: string) => moves.filter((m) => m.id === id);

/* ───────── gates ───────── */

/** Why a stage can't be set for this opportunity, or null when its evidence is on file. */
export function gateBlock(o: Opportunity, to: StageId, party?: Party): string | null {
  if (to === "nda_executed") {
    const nda = AGREEMENTS.find((a) => a.kind === "NDA" && a.offeringId === o.offeringId && a.partyId === o.partyId && a.status === "Fully executed" && a.evidence);
    return nda ? null : "No executed NDA with evidence is on file for this investor and offering.";
  }
  if (to === "accepted") {
    const sub = AGREEMENTS.find(
      (a) => a.kind === "Subscription agreement" && a.offeringId === o.offeringId && a.partyId === o.partyId && a.status === "Fully executed" && a.evidence,
    );
    if (!sub) return "The subscription isn’t countersigned by the general partner yet.";
    if (party?.kyc !== "Clear") return "The investor’s compliance file isn’t cleared.";
    return null;
  }
  if (to === "funded") {
    const { called, received } = o.amounts;
    return o.source === "Fund ledger" && called && received === called ? null : "No receipt of the called capital is recorded in the fund’s books.";
  }
  return null;
}

/* ───────── actions ───────── */

const audit = (who: string, action: string, object: string) => recordAudit({ user: who, action, object });

export type OfferingInput = Omit<Offering, "id" | "illustrative" | "currency">;
export type PartyInput = Pick<Party, "name" | "type" | "jurisdiction" | "contact" | "email" | "owner" | "source"> & { preferences?: Party["preferences"] };

export const offering = {
  move(o: Opportunity, to: StageId, who: string, party?: Party): string | null {
    if (o.stage === to) return null;
    const block = stageOf(to).gate ? gateBlock(o, to, party) : null;
    if (block) return block;
    const s = load();
    save({ ...s, stages: { ...s.stages, [o.id]: to }, moves: [...s.moves, { id: o.id, from: o.stage, to, by: who, at: now() }] });
    audit(who, `Moved an investor opportunity from ${stageOf(o.stage).label} to ${stageOf(to).label}`, `${party?.name ?? o.partyId} · ${o.offeringId}`);
    return null;
  },
  createOffering(input: OfferingInput, who: string) {
    const s = load();
    const id = `of-${slug(input.short || input.name)}-${Date.now().toString(36)}`;
    const o: Offering = { ...input, id, currency: "USD", illustrative: [] };
    save({ ...s, offerings: [...s.offerings, o] });
    audit(who, "Created an offering", o.name);
    return id;
  },
  /** Edits are recorded as entered; a field someone sets is no longer illustrative. */
  editOffering(o: Offering, patch: Partial<Offering>, who: string) {
    const s = load();
    // a field counts as confirmed only when someone changed it
    const set = Object.keys(patch).filter((k) => JSON.stringify(patch[k as keyof Offering] ?? null) !== JSON.stringify(o[k as keyof Offering] ?? null));
    save({ ...s, offeringEdits: { ...s.offeringEdits, [o.id]: { ...s.offeringEdits[o.id], ...patch, illustrative: o.illustrative.filter((k) => !set.includes(k)) } } });
    audit(who, "Edited the terms of an offering", o.name);
  },
  createParty(input: PartyInput, who: string) {
    const s = load();
    const id = `pr-${slug(input.name)}-${Date.now().toString(36)}`;
    save({ ...s, parties: [...s.parties, { ...input, id }] });
    audit(who, "Added a prospective investor", input.name);
    return id;
  },
  editParty(p: Party, patch: Partial<Party>, who: string) {
    const s = load();
    save({ ...s, partyEdits: { ...s.partyEdits, [p.id]: { ...s.partyEdits[p.id], ...patch } } });
    audit(who, "Edited an investor’s relationship record", p.name);
  },
  /** One opportunity per investor and offering; returns the existing one if already tracked. */
  addToPipeline(
    d: OfferingData,
    input: { offeringId: string; partyId: string; stage: StageId; potential?: number; owner: string; next?: { action: string; date: string } },
    who: string,
  ) {
    const existing = d.opps.find((o) => o.offeringId === input.offeringId && o.partyId === input.partyId);
    if (existing) return { id: existing.id, existed: true };
    const s = load();
    const opp: Opportunity = {
      id: newId("op"),
      offeringId: input.offeringId,
      partyId: input.partyId,
      stage: input.stage,
      amounts: input.potential ? { potential: input.potential } : {},
      owner: input.owner,
      source: "Recorded by hand",
      lastInteraction: now().slice(0, 10),
    };
    const fu: FollowUp[] = input.next
      ? [
          {
            id: newId("fu"),
            oppId: opp.id,
            partyId: input.partyId,
            offeringId: input.offeringId,
            action: input.next.action,
            due: input.next.date,
            owner: input.owner,
            createdBy: who,
            createdAt: now(),
          },
        ]
      : [];
    save({ ...s, opps: [...s.opps, opp], followUps: [...s.followUps, ...fu] });
    audit(who, `Added an investor to the pipeline at ${stageOf(input.stage).label}`, `${d.party(input.partyId)?.name} · ${d.offering(input.offeringId)?.short}`);
    return { id: opp.id, existed: false };
  },
  /** Only the amounts a person records: potential, indicated and soft. Accepted, called and received come from the books. */
  setAmounts(o: Opportunity, a: Pick<Amounts, "potential" | "indicative" | "soft">, who: string) {
    const s = load();
    save({ ...s, amounts: { ...s.amounts, [o.id]: a } });
    audit(who, "Recorded investor amounts for an opportunity", o.id);
  },
  addFollowUp(f: Omit<FollowUp, "id" | "createdAt" | "createdBy">, who: string) {
    const s = load();
    save({ ...s, followUps: [...s.followUps, { ...f, id: newId("fu"), createdBy: who, createdAt: now() }] });
    audit(who, "Scheduled a follow-up", f.action);
  },
  completeFollowUp(id: string, who: string) {
    const s = load();
    save({ ...s, followUps: s.followUps.map((f) => (f.id === id ? { ...f, done: { by: who, at: now() } } : f)) });
    audit(who, "Completed a follow-up", id);
  },
  reopenFollowUp(id: string, who: string) {
    const s = load();
    save({ ...s, followUps: s.followUps.map((f) => (f.id === id ? { ...f, done: undefined } : f)) });
    audit(who, "Reopened a follow-up", id);
  },
};
