"use client";

/**
 * Banking Solution — the simulated bank state, kept in this browser. Payments follow one control model:
 * the person who prepares a payment cannot approve it; approvals come from the entity's policy (tier by amount, client
 * signatory where required); a separate release sends it to the bank. Payees whose bank details change are held until a
 * callback to a number on record confirms the change. Every action is written to the audit log.
 * No bank is connected: references, settlement and balances after release are simulated.
 */
import { useMemo, useSyncExternalStore } from "react";
import { recordAudit } from "@/lib/audit-local";
import {
  ACCOUNTS,
  openAllocations,
  PAYEES,
  PEOPLE,
  SEED_PAYMENTS,
  TODAY,
  TRANSACTIONS,
  accountById,
  balanceOn,
  entityById,
  personById,
  policyFor,
  priorDay,
  tierFor,
  toUsd,
  type Decision,
  type Payee,
  type Payment,
  type Txn,
} from "./data";

const KEY = "aurum-banking-v1";
type MatchEdit = { state: "Matched" | "Dismissed"; to: string; by: string; at: string; note?: string };
type State = { created: Payment[]; edits: Record<string, Partial<Payment>>; payeeEdits: Record<string, Partial<Payee>>; matches: Record<string, MatchEdit>; sent: Txn[] };
const EMPTY: State = { created: [], edits: {}, payeeEdits: {}, matches: {}, sent: [] };
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
const useBankState = () => useSyncExternalStore(subscribe, load, () => EMPTY);

const now = () => new Date().toISOString().slice(0, 16);
let seq = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Where a payment stands against its policy. */
export function approvalStatus(p: Payment) {
  const acct = accountById(p.fromAccountId)!;
  const policy = policyFor(acct.entityId);
  const maker = p.trail.find((d) => d.kind === "Prepared")?.who ?? "";
  const approvedBy = p.trail.filter((d) => d.kind === "Approved").map((d) => d.who);
  if (!policy) return { policy, tier: null, maker, approvedBy, needed: 0, clientOk: true, complete: true, eligible: [] as string[], waitingFor: "" };
  const tier = tierFor(policy, p.amount);
  const clientNames = policy.signatories.map((id) => personById(id)!.name);
  const clientOk = !tier.clientRequired || approvedBy.some((n) => clientNames.includes(n));
  const complete = approvedBy.length >= tier.approvals && clientOk;
  const pool = [...policy.signatories, ...policy.firmApprovers].map((id) => personById(id)!.name);
  // once the count is reached without a client, only a client may complete it
  const eligible = pool.filter((n) => n !== maker && !approvedBy.includes(n) && (approvedBy.length < tier.approvals - 1 || clientOk || clientNames.includes(n)));
  const remaining = Math.max(0, tier.approvals - approvedBy.length);
  const waitingFor = complete
    ? ""
    : !clientOk && remaining <= 1
      ? `a client signatory (${clientNames.join(" or ")})`
      : `${remaining} more approval${remaining === 1 ? "" : "s"}${tier.clientRequired && !clientOk ? ", one from a client signatory" : ""}`;
  return { policy, tier, maker, approvedBy, needed: tier.approvals, clientOk, complete, eligible, waitingFor };
}

function merge(s: State) {
  const payees = PAYEES.map((p) => (s.payeeEdits[p.id] ? { ...p, ...s.payeeEdits[p.id] } : p));
  const payments = [...SEED_PAYMENTS, ...s.created].map((p) => (s.edits[p.id] ? { ...p, ...s.edits[p.id] } : p)).sort((a, b) => b.ref.localeCompare(a.ref));
  const txns: Txn[] = [...s.sent, ...TRANSACTIONS].map((t) => {
    const m = s.matches[t.id];
    if (!m) return t;
    return m.state === "Matched"
      ? { ...t, match: { state: "Matched" as const, to: m.to } }
      : { ...t, category: "Operating" as const, match: { state: "Matched" as const, to: m.to } };
  });
  const bal = (id: string, date = TODAY) => balanceOn(id, date, txns);
  const outgoing = (id: string) =>
    payments.filter((p) => p.fromAccountId === id && ["Pending approval", "Pending release", "Scheduled", "On hold"].includes(p.state)).reduce((a, p) => a + p.amount, 0);
  const accounts = ACCOUNTS.map((a) => ({ ...a, balance: bal(a.id), prior: bal(a.id, priorDay(TODAY)), committed: outgoing(a.id) }));
  const exceptions = txns.filter((t) => t.match.state !== "Matched");
  const toApprove = payments.filter((p) => p.state === "Pending approval");
  const toRelease = payments.filter((p) => p.state === "Pending release");
  const onHold = payments.filter((p) => p.state === "On hold");
  const callbacks = payees.filter((p) => p.state === "Callback required");
  return {
    payees,
    payments,
    txns,
    accounts,
    exceptions,
    toApprove,
    toRelease,
    onHold,
    callbacks,
    payee: (id: string) => payees.find((p) => p.id === id),
    payment: (id: string) => payments.find((p) => p.id === id),
    account: (id: string) => accounts.find((a) => a.id === id),
    totalUsd: accounts.reduce((a, x) => a + toUsd(x.balance, x.currency), 0),
    priorUsd: accounts.reduce((a, x) => a + toUsd(x.prior, x.currency), 0),
    matches: s.matches,
  };
}
export type BankData = ReturnType<typeof merge>;
export function useBanking() {
  const s = useBankState();
  return useMemo(() => merge(s), [s]);
}

const audit = (who: string, action: string, object: string) => recordAudit({ user: who, action, object });
const edit = (p: Payment, patch: Partial<Payment>) => {
  const s = load();
  const created = s.created.some((c) => c.id === p.id);
  if (created) return { ...s, created: s.created.map((c) => (c.id === p.id ? { ...c, ...patch } : c)) };
  return { ...s, edits: { ...s.edits, [p.id]: { ...s.edits[p.id], ...patch } } };
};
const current = (id: string) => merge(load()).payment(id);
const step = (who: string, kind: Decision["kind"], note?: string): Decision => ({ who, at: now(), kind, ...(note ? { note } : {}) });

export type Result = { ok: true; message: string } | { ok: false; message: string };

export const bank = {
  /** Prepare a payment; it goes for approval at once unless kept as a draft. Held if the payee is not verified. */
  create(input: Omit<Payment, "id" | "ref" | "state" | "trail">, who: string, submit: boolean): Result & { id?: string } {
    const s = load();
    const payee = merge(s).payee(input.payeeId);
    if (!payee) return { ok: false, message: "Choose a payee." };
    if (!payee.entityIds.includes(accountById(input.fromAccountId)!.entityId)) return { ok: false, message: "This payee is not set up for that entity." };
    if (!(input.amount > 0)) return { ok: false, message: "Enter an amount above zero." };
    const id = nid("pm");
    const ref = `PAY-${TODAY.slice(2, 4)}${TODAY.slice(5, 7)}-${String(100 + s.created.length).padStart(3, "0")}`;
    const held = payee.state !== "Verified";
    const trail = [step(who, "Prepared")];
    if (held && submit) trail.push(step("System", "Held", "The payee’s bank details are not confirmed by a callback yet."));
    const p: Payment = { ...input, id, ref, state: !submit ? "Draft" : held ? "On hold" : "Pending approval", trail };
    save({ ...s, created: [p, ...s.created] });
    audit(who, submit ? "Payment submitted for approval" : "Payment drafted", `${ref} · ${payee.name}`);
    return {
      ok: true,
      id,
      message: held && submit ? `${ref} is on hold until ${payee.name}’s details are confirmed.` : submit ? `${ref} sent for approval.` : `${ref} saved as a draft.`,
    };
  },

  submit(id: string, who: string): Result {
    const p = current(id);
    if (!p || p.state !== "Draft") return { ok: false, message: "Only drafts can be submitted." };
    const payee = merge(load()).payee(p.payeeId)!;
    const held = payee.state !== "Verified";
    save(edit(p, { state: held ? "On hold" : "Pending approval", trail: [...p.trail, ...(held ? [step("System", "Held", "Payee details not confirmed.")] : [])] }));
    audit(who, "Payment submitted for approval", p.ref);
    return { ok: true, message: held ? `${p.ref} is on hold until the payee is confirmed.` : `${p.ref} sent for approval.` };
  },

  approve(id: string, who: string): Result {
    const p = current(id);
    if (!p || p.state !== "Pending approval") return { ok: false, message: "This payment is not waiting for approval." };
    const st = approvalStatus(p);
    if (who === st.maker) return { ok: false, message: "The person who prepared a payment cannot approve it." };
    if (st.approvedBy.includes(who)) return { ok: false, message: `${who} has already approved it.` };
    if (!st.eligible.includes(who)) return { ok: false, message: `${who} cannot approve this payment under the entity’s policy.` };
    const trail = [...p.trail, step(who, "Approved")];
    const done = approvalStatus({ ...p, trail }).complete;
    save(edit(p, { trail, state: done ? "Pending release" : "Pending approval" }));
    audit(who, "Payment approved", p.ref);
    return { ok: true, message: done ? `${p.ref} approved. Ready for release.` : `${p.ref}: approval recorded. Still needs ${approvalStatus({ ...p, trail }).waitingFor}.` };
  },

  reject(id: string, who: string, note: string): Result {
    const p = current(id);
    if (!p || !["Pending approval", "Pending release", "On hold"].includes(p.state)) return { ok: false, message: "This payment can no longer be rejected." };
    if (!note.trim()) return { ok: false, message: "Say why it is rejected; the preparer sees the reason." };
    save(edit(p, { state: "Rejected", trail: [...p.trail, step(who, "Rejected", note.trim())] }));
    audit(who, "Payment rejected", `${p.ref}: ${note.trim()}`);
    return { ok: true, message: `${p.ref} rejected.` };
  },

  /** Send an approved payment to the bank, or schedule it for its value date. */
  release(id: string, who: string): Result {
    const p = current(id);
    if (!p || p.state !== "Pending release") return { ok: false, message: "Only approved payments can be released." };
    const acct = accountById(p.fromAccountId)!;
    const policy = policyFor(acct.entityId);
    const releaser = PEOPLE.find((x) => x.name === who);
    if (!policy || !releaser || !policy.releasers.includes(releaser.id)) return { ok: false, message: `${who} is not a releaser for this entity.` };
    if (p.trail.some((d) => d.kind === "Prepared" && d.who === who)) return { ok: false, message: "The person who prepared a payment cannot release it." };
    const d = merge(load());
    const available = d.account(acct.id)!.balance;
    const future = p.date > TODAY;
    if (!future && p.amount > available)
      return {
        ok: false,
        message: `The account holds ${available.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${acct.currency}; this payment needs ${p.amount.toLocaleString("en-US")} ${acct.currency}.`,
      };
    const instant = p.rail === "Book transfer" || p.rail === "Pix";
    const trail = [...p.trail, step(who, "Released", future ? `Scheduled for ${p.date}; sent automatically before the cutoff.` : undefined)];
    if (!future)
      trail.push(
        step(
          "Partner bank",
          instant ? "Settled" : "Sent",
          instant ? "Settled instantly (simulated)." : `Reference ${p.ref.replace("PAY", "FED")}-SIM. Usually credited the same business day.`,
        ),
      );
    const s = load();
    const sent: Txn[] = future
      ? []
      : [
          {
            id: nid("tx"),
            accountId: acct.id,
            date: TODAY,
            description: `${p.rail.toUpperCase()} OUT ${d.payee(p.payeeId)!.name.toUpperCase().slice(0, 30)} ${p.ref}`,
            counterparty: d.payee(p.payeeId)!.name,
            amount: -p.amount,
            rail: p.rail,
            status: "Posted",
            category: p.purpose?.kind === "Capital call" ? "Investment" : p.purpose?.kind === "Dividend" ? "Dividend" : "Operating",
            match: { state: "Matched", to: `${p.ref} · released by ${who}` },
            illustrative: true,
          },
        ];
    save({ ...edit(p, { state: future ? "Scheduled" : instant ? "Settled" : "Sent", trail }), sent: [...sent, ...s.sent] });
    audit(who, future ? "Payment released for its value date" : "Payment released to the bank", p.ref);
    return { ok: true, message: future ? `${p.ref} scheduled for ${p.date}.` : `${p.ref} sent to the bank (simulated).` };
  },

  /** Release every approved payment of a run at once. */
  releaseRun(runId: string, who: string): Result {
    const ps = merge(load()).payments.filter((p) => p.runId === runId && p.state === "Pending release");
    const results = ps.map((p) => bank.release(p.id, who));
    const failed = results.filter((r) => !r.ok);
    return failed.length ? { ok: false, message: failed[0].message } : { ok: true, message: `${ps.length} payments released.` };
  },

  cancel(id: string, who: string): Result {
    const p = current(id);
    if (!p || !["Draft", "Pending approval", "Pending release", "Scheduled", "On hold"].includes(p.state))
      return { ok: false, message: "This payment can no longer be cancelled." };
    save(edit(p, { state: "Cancelled", trail: [...p.trail, step(who, "Cancelled")] }));
    audit(who, "Payment cancelled", p.ref);
    return { ok: true, message: `${p.ref} cancelled.` };
  },

  /**
   * Record a callback on a payee's change of bank details. Confirmed: the new details apply and held payments return to
   * approval. Not confirmed: the change is refused, the old details stay, and the request is flagged to compliance.
   */
  callback(payeeId: string, who: string, r: { confirmed: boolean; spokeWith: string; note?: string }): Result {
    const s = load();
    const d = merge(s);
    const py = d.payee(payeeId);
    if (!py || !py.change) return { ok: false, message: "There is no change waiting for this payee." };
    if (!r.spokeWith.trim()) return { ok: false, message: "Record who you spoke with." };
    const held = d.payments.filter((p) => p.payeeId === payeeId && p.state === "On hold");
    let next: State = {
      ...s,
      payeeEdits: {
        ...s.payeeEdits,
        [payeeId]: r.confirmed
          ? {
              state: "Verified",
              bank: py.change.bank,
              mask: py.change.mask,
              change: undefined,
              verified: { by: who, at: now(), number: py.trustedPhone, source: py.phoneSource, spokeWith: r.spokeWith.trim() },
            }
          : { state: "Verified", change: undefined },
      },
    };
    for (const p of held) {
      const patch: Partial<Payment> = r.confirmed
        ? { state: "Pending approval", trail: [...p.trail, step("System", "Held", `Released from hold: change confirmed by callback to ${py.trustedPhone}.`)] }
        : { trail: [...p.trail, step("System", "Held", "Change of bank details NOT confirmed. The payment stays on hold; flagged to compliance.")] };
      next = { ...next, edits: { ...next.edits, [p.id]: { ...next.edits[p.id], ...patch } } };
    }
    save(next);
    audit(who, r.confirmed ? "Payee bank details confirmed by callback" : "Payee bank change refused after callback", `${py.name} · ${py.trustedPhone} · ${r.spokeWith}`);
    return {
      ok: true,
      message: r.confirmed
        ? `${py.name}: new details confirmed. ${held.length ? "Held payments are back in approval." : ""}`
        : `${py.name}: change refused and flagged to compliance. The old details remain.`,
    };
  },

  /** Confirm the suggested match for a receipt. */
  confirmMatch(txnId: string, who: string, note?: string): Result {
    const t = merge(load()).txns.find((x) => x.id === txnId);
    if (!t || t.match.state !== "Suggested") return { ok: false, message: "Nothing to confirm." };
    const s = load();
    save({ ...s, matches: { ...s.matches, [txnId]: { state: "Matched", to: t.match.to, by: who, at: now(), note } } });
    audit(who, "Receipt matched", `${t.counterparty} · ${t.amount} · ${t.match.to}`);
    return { ok: true, message: `Matched to ${t.match.to}. Posting to the general ledger is simulated.` };
  },

  /** Classify a receipt by hand. */
  classify(txnId: string, who: string, to: string): Result {
    if (!to.trim()) return { ok: false, message: "Say what this receipt is." };
    const s = load();
    save({ ...s, matches: { ...s.matches, [txnId]: { state: "Dismissed", to: to.trim(), by: who, at: now() } } });
    audit(who, "Receipt classified", `${txnId} · ${to.trim()}`);
    return { ok: true, message: "Recorded." };
  },
};

/** Cash position rows by entity, with what is already committed and what is expected in. */
export function entityRows(d: BankData) {
  return [...new Set(d.accounts.map((a) => a.entityId))].map((id) => {
    const e = entityById(id)!;
    const accts = d.accounts.filter((a) => a.entityId === id);
    const ccy = accts[0].currency;
    // capital still owed on issued calls, less what has reached the bank and waits to be booked
    const owed = e.fundId ? openAllocations(e.fundId).reduce((a, o) => a + o.owed, 0) : 0;
    const arrived = d.txns.filter((t) => accts.some((a) => a.id === t.accountId) && t.category === "Capital call" && t.illustrative).reduce((a, t) => a + t.amount, 0);
    const due = e.fundId
      ? openAllocations(e.fundId)
          .map((o) => o.due)
          .sort()[0]
      : undefined;
    return {
      expected: Math.max(0, owed - arrived),
      expectedBy: due,
      e,
      accts,
      ccy,
      balance: accts.reduce((a, x) => a + x.balance, 0),
      prior: accts.reduce((a, x) => a + x.prior, 0),
      committed: accts.reduce((a, x) => a + x.committed, 0),
    };
  });
}
