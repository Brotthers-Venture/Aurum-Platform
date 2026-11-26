"use client";

/**
 * Blockchain Solution — the simulated token ledger, kept in this browser. Every action follows the ERC-3643 model
 * (verified identities, rule checks on each transfer, agent freeze and recovery) and is written to the audit log.
 * No blockchain is connected; hashes, blocks and addresses are simulated.
 */
import { useMemo, useSyncExternalStore } from "react";
import { recordAudit } from "@/lib/audit-local";
import { SEED_EVENTS, SEED_TRANSFERS, TOKENS, simAddress, simHash, stepsFor, treatmentFor, type Holder, type LedgerEvent, type StepId, type Token, type Transfer } from "./data";

const KEY = "aurum-chain-v1";
type State = { created: Token[]; tokenEdits: Record<string, Partial<Token>>; transfers: Transfer[]; transferEdits: Record<string, Partial<Transfer>>; events: LedgerEvent[] };
const EMPTY: State = { created: [], tokenEdits: {}, transfers: [], transferEdits: {}, events: [] };
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
const useChainState = () => useSyncExternalStore(subscribe, load, () => EMPTY);

const now = () => new Date().toISOString().slice(0, 19);
let seq = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;
let blockSeq = 18_400_000;

function merge(s: State) {
  const tokens = [...TOKENS, ...s.created].map((t) => (s.tokenEdits[t.id] ? { ...t, ...s.tokenEdits[t.id] } : t));
  const transfers = [...SEED_TRANSFERS, ...s.transfers].map((t) => (s.transferEdits[t.id] ? { ...t, ...s.transferEdits[t.id] } : t));
  const events = [...SEED_EVENTS, ...s.events].sort((a, b) => b.at.localeCompare(a.at));
  return { tokens, transfers, events, token: (id: string) => tokens.find((t) => t.id === id) };
}
export type ChainData = ReturnType<typeof merge>;
export function useChain() {
  const s = useChainState();
  return useMemo(() => merge(s), [s]);
}

/** Differences between the token holdings and the official register, by name. */
export function reconcile(t: Token) {
  const names = new Set([...t.holders.map((h) => h.name), ...t.register.map((r) => r.name)]);
  return [...names].map((name) => {
    const chain = t.holders.find((h) => h.name === name)?.units ?? 0;
    const reg = t.register.find((r) => r.name === name)?.units ?? 0;
    return { name, chain, register: reg, diff: chain - reg };
  });
}

const audit = (who: string, action: string, object: string) => recordAudit({ user: who, action, object });
const editToken = (t: Token, patch: Partial<Token>) => {
  const s = load();
  return { ...s, tokenEdits: { ...s.tokenEdits, [t.id]: { ...s.tokenEdits[t.id], ...patch } } };
};
const event = (e: Omit<LedgerEvent, "id" | "hash" | "block" | "at">): LedgerEvent => {
  const id = nid("ev");
  return { ...e, id, at: now(), hash: simHash(id), block: blockSeq++ };
};

export const chain = {
  /** Prepare a company's token from its cap table; nothing is issued yet. */
  tokenize(input: Omit<Token, "id" | "status" | "illustrative" | "agent" | "register" | "documents"> & { documents?: Token["documents"]; incorporated: boolean }, who: string) {
    const s = load();
    const id = nid("tk");
    const tr = treatmentFor(input.jurisdiction, input.form);
    const { incorporated, ...rest } = input;
    const t: Token = {
      ...rest,
      id,
      status: !incorporated ? "Waiting for incorporation" : input.holders.some((h) => h.kyc !== "Clear") ? "Identity review" : "Ready to issue",
      register: input.holders.map((h) => ({ name: h.name, units: h.units })),
      agent: "Aurum Asset Management, as corporate secretary",
      documents: input.documents ?? [
        {
          name:
            tr.t === "record"
              ? input.jurisdiction === "wy"
                ? "Articles or bylaws providing for certificate tokens"
                : "Board resolution adopting the token ledger as the stock ledger"
              : tr.t === "record-agreement"
                ? "Operating agreement amendment adopting the token ledger"
                : input.jurisdiction === "br"
                  ? "Contrato social amendment referencing the token register"
                  : "Directors’ resolution adopting the token register",
          status: "Draft",
        },
        { name: "Counsel memo on what the token represents", status: "Not started" },
      ],
      illustrative: [],
    };
    save({ ...s, created: [...s.created, t] });
    audit(who, "Prepared a company’s share token", t.company);
    return id;
  },
  /** Recording the signed document as evidence (simulation: no file is stored). */
  signDocument(t: Token, name: string, who: string) {
    save(editToken(t, { documents: t.documents.map((d) => (d.name === name ? { ...d, status: "Signed" } : d)) }));
    audit(who, `Recorded a signed document: ${name}`, t.company);
  },
  connectWallet(t: Token, holderId: string, who: string) {
    save(editToken(t, { holders: t.holders.map((h) => (h.id === holderId ? { ...h, wallet: simAddress(`${t.id}:${holderId}`), custody: "Self-custody" } : h)) }));
    audit(who, "Connected a holder’s wallet (simulated)", t.company);
  },
  /** Why the token can't be issued yet, or null. */
  issueBlock(t: Token): string | null {
    if (t.status === "Live") return "Already issued.";
    if (t.status === "Waiting for incorporation") return "The company isn’t incorporated yet.";
    const unsigned = t.documents.filter((d) => d.status !== "Signed" && d.status !== "Filed");
    if (unsigned.length) return `Waiting for: ${unsigned.map((d) => d.name).join("; ")}.`;
    const unverified = t.holders.filter((h) => h.kyc !== "Clear");
    if (unverified.length) return `Identity not verified for ${unverified.map((h) => h.name).join(", ")}.`;
    const noWallet = t.holders.filter((h) => !h.wallet);
    if (noWallet.length) return `No wallet connected for ${noWallet.map((h) => h.name).join(", ")}.`;
    return null;
  },
  issue(t: Token, who: string) {
    const block = chain.issueBlock(t);
    if (block) return block;
    const s = editToken(t, { status: "Live", issued: now().slice(0, 10) });
    save({ ...s, events: [...s.events, ...t.holders.map((h) => event({ tokenId: t.id, kind: "Issued", to: h.name, units: h.units, by: who }))] });
    audit(who, `Issued ${t.symbol} to ${t.holders.length} holder(s) (simulated)`, t.company);
    return null;
  },
  freeze(t: Token, holderId: string, units: number, reason: string, who: string) {
    const h = t.holders.find((x) => x.id === holderId)!;
    const frozen = Math.max(0, Math.min(h.units, h.frozen + units));
    const s = editToken(t, { holders: t.holders.map((x) => (x.id === holderId ? { ...x, frozen } : x)) });
    save({ ...s, events: [...s.events, event({ tokenId: t.id, kind: units > 0 ? "Frozen" : "Unfrozen", from: h.name, units: Math.abs(units), by: who })] });
    audit(who, `${units > 0 ? "Froze" : "Unfroze"} ${Math.abs(units).toLocaleString("en-US")} ${t.unitWord}: ${reason}`, `${t.company} · ${h.name}`);
  },
  /** Lost wallet: the holder's balance moves to a new wallet bound to the same verified identity. */
  recover(t: Token, holderId: string, reason: string, who: string) {
    const h = t.holders.find((x) => x.id === holderId)!;
    const wallet = simAddress(`${t.id}:${holderId}:${Date.now()}`);
    const s = editToken(t, { holders: t.holders.map((x) => (x.id === holderId ? { ...x, wallet, custody: "Self-custody" } : x)) });
    save({ ...s, events: [...s.events, event({ tokenId: t.id, kind: "Recovered", from: `${h.name} (old wallet)`, to: `${h.name} (new wallet)`, units: h.units, by: who })] });
    audit(who, `Recovered a holder’s ${t.unitWord} to a new wallet: ${reason}`, `${t.company} · ${h.name}`);
  },
  /** The owner asks to transfer; the units are frozen until the transfer completes or is rejected. */
  requestTransfer(t: Token, input: Pick<Transfer, "kind" | "fromId" | "to" | "units">, who: string) {
    const s0 = load();
    const tr: Transfer = { ...input, id: nid("tr"), tokenId: t.id, requested: now().slice(0, 10), requestedBy: who, steps: stepsFor(t), status: "In progress" };
    if (input.to.kyc === "Clear") tr.steps = tr.steps.map((x) => (x.id === "identity" ? { ...x, state: "done", note: "Already verified by Compliance" } : x));
    save({ ...s0, transfers: [...s0.transfers, tr] });
    chain.freeze(merge(load()).token(t.id)!, input.fromId, input.units, "held for a transfer request", who);
    audit(who, `Requested a ${input.kind.toLowerCase()} of ${input.units.toLocaleString("en-US")} ${t.unitWord} to ${input.to.name}`, t.company);
    return tr.id;
  },
  /** Mark a step done, in order; the token moves only when every earlier step is done. */
  completeStep(tr: Transfer, step: StepId, who: string): string | null {
    const i = tr.steps.findIndex((x) => x.id === step);
    const before = tr.steps.slice(0, i).filter((x) => x.state !== "done" && x.state !== "skipped");
    if (before.length) return `First: ${before[0].label.toLowerCase()}.`;
    if (step === "identity" && tr.to.kyc !== "Clear") return "Compliance hasn’t verified the recipient yet.";
    const d = merge(load());
    const t = d.token(tr.tokenId)!;
    if (step === "chain") {
      if (tr.steps.find((x) => x.id === "chain")?.state === "blocked") return "The recipient hasn’t connected a wallet yet.";
      const from = t.holders.find((h) => h.id === tr.fromId)!;
      const existing = t.holders.find((h) => h.name === tr.to.name);
      // a new recipient becomes a holder, with a wallet bound to their verified identity (simulated)
      const toHolder: Holder = existing
        ? { ...existing, units: existing.units + tr.units }
        : {
            id: nid("h"),
            name: tr.to.name,
            kind: tr.to.kind,
            country: tr.to.country,
            kyc: tr.to.kyc,
            wallet: simAddress(`${t.id}:${tr.to.name}`),
            custody: "Self-custody",
            units: tr.units,
            frozen: 0,
          };
      const holders = [
        ...t.holders.map((h) => (h.id === from.id ? { ...h, units: h.units - tr.units, frozen: Math.max(0, h.frozen - tr.units) } : h.id === toHolder.id ? toHolder : h)),
        ...(existing ? [] : [toHolder]),
      ].filter((h) => h.units > 0);
      const tr2 = treatmentFor(t.jurisdiction, t.form);
      // where the token is the record, the register follows the token; otherwise it was updated in the previous step
      const register = tr2.t === "mirror" ? t.register : holders.map((h) => ({ name: h.name, units: h.units }));
      const s = editToken(t, { holders, register });
      save({
        ...s,
        transferEdits: {
          ...s.transferEdits,
          [tr.id]: { status: "Completed", steps: tr.steps.map((x) => (x.id === "chain" ? { ...x, state: "done", by: who, at: now().slice(0, 10) } : x)) },
        },
        events: [...s.events, event({ tokenId: t.id, kind: "Transferred", from: from.name, to: tr.to.name, units: tr.units, by: who })],
      });
      audit(who, `Completed a transfer of ${tr.units.toLocaleString("en-US")} ${t.unitWord} to ${tr.to.name} (simulated)`, t.company);
      return null;
    }
    let s = load();
    if (step === "register") {
      // a mirror: the official register changes first
      const reg = [...t.register.map((r) => (r.name === t.holders.find((h) => h.id === tr.fromId)?.name ? { ...r, units: r.units - tr.units } : r))];
      const at = reg.find((r) => r.name === tr.to.name);
      const register = (at ? reg.map((r) => (r.name === tr.to.name ? { ...r, units: r.units + tr.units } : r)) : [...reg, { name: tr.to.name, units: tr.units }]).filter(
        (r) => r.units > 0,
      );
      s = editToken(t, { register });
    }
    save({
      ...s,
      transferEdits: {
        ...s.transferEdits,
        [tr.id]: { ...s.transferEdits[tr.id], steps: tr.steps.map((x) => (x.id === step ? { ...x, state: "done", by: who, at: now().slice(0, 10) } : x)) },
      },
    });
    audit(who, `Completed a transfer step: ${tr.steps[i].label}`, t.company);
    return null;
  },
  /** The recipient connects a wallet bound to their verified identity (simulated); the token step can then run. */
  connectRecipient(tr: Transfer, who: string) {
    const s = load();
    save({
      ...s,
      transferEdits: {
        ...s.transferEdits,
        [tr.id]: {
          ...s.transferEdits[tr.id],
          steps: tr.steps.map((x) => (x.id === "chain" && x.state === "blocked" ? { ...x, state: "waiting", note: "Recipient’s wallet connected (simulated)." } : x)),
        },
      },
    });
    audit(who, `Recipient connected a wallet (simulated): ${tr.to.name}`, tr.tokenId);
  },
  reject(tr: Transfer, reason: string, who: string) {
    const t = merge(load()).token(tr.tokenId)!;
    chain.freeze(t, tr.fromId, -tr.units, "released after a rejected transfer", who);
    const s = load();
    save({ ...s, transferEdits: { ...s.transferEdits, [tr.id]: { ...s.transferEdits[tr.id], status: "Rejected", note: reason } } });
    audit(who, `Rejected a transfer request: ${reason}`, t.company);
  },
};
