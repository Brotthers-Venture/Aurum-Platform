/**
 * Double-entry fund accounting engine.
 *
 * Takes a vehicle's commitments and source events, posts balanced journal
 * entries in chronological order, and maintains a partner (LP) subledger:
 * called capital, receivables, distributions and allocated income by bucket.
 * All arithmetic is done in integer cents so the books always tie out.
 *
 * Rules implemented:
 *  - Capital calls allocated pro rata to commitments of admitted partners.
 *  - Subsequent closes equalize: incoming partners contribute their share of
 *    prior calls plus interest; existing partners are refunded the excess.
 *  - P&L (income, gains, fees, expenses) allocated pro rata to commitments
 *    as of the posting date.
 *  - Distributions allocated pro rata to commitments (LP-only; carried
 *    interest is modelled separately in the waterfall).
 *  - Completed transfers move a fraction of the transferor's commitment and
 *    every capital component to the transferee.
 */
import { commitmentSeeds } from "./commitments";
import { EQUALIZATION_RATE, schedules, type CallEvent, type DistributionEvent, type TransferEvent } from "./schedules";

export const TODAY = "2026-11-24";

export type Line = { account: string; debit: number; credit: number; partnerId?: string };
export type JournalEntry = {
  id: string;
  fundId: string;
  date: string;
  memo: string;
  source: "Capital call" | "Receipt" | "Investment" | "Fees & expenses" | "Equalization" | "Distribution" | "Realization" | "Valuation" | "Transfer";
  ref?: string;
  lines: Line[];
};

export type Alloc = { income: number; realized: number; unrealized: number; fees: number; expenses: number; organizational: number };
const emptyAlloc = (): Alloc => ({ income: 0, realized: 0, unrealized: 0, fees: 0, expenses: 0, organizational: 0 });

export type PartnerState = {
  investorId: string;
  closeDate: string;
  commitment: number;
  called: number;
  receivable: number;
  distributed: number;
  alloc: Alloc;
};

export type CallRecord = {
  id: string;
  fundId: string;
  number: number;
  noticeDate: string;
  dueDate: string;
  amount: number;
  investments: { name: string; amount: number }[];
  fees: number;
  expenses: number;
  organizational: number;
  purpose: string;
  allocations: { investorId: string; amount: number; paid: number; paidDate: string | null }[];
  received: number;
  status: "Draft" | "Issued" | "Partially funded" | "Funded";
};

export type DistributionRecord = {
  id: string;
  fundId: string;
  date: string;
  amount: number;
  returnOfCapital: number;
  realizedGain: number;
  income: number;
  type: "Return of capital" | "Income" | "Realized gain" | "Mixed";
  source: string;
  status: "Scheduled" | "Paid";
  allocations: { investorId: string; amount: number }[];
};

export type EqualizationRecord = {
  fundId: string;
  closeDate: string;
  rate: number;
  priorCalled: number;
  incoming: { investorId: string; commitment: number; principal: number; interest: number }[];
  refunds: { investorId: string; amount: number; interestShare: number }[];
};

export type TransferRecord = TransferEvent & {
  fundId: string;
  commitmentMoved: number;
  navMoved: number;
};

export type Books = {
  fundId: string;
  asOf: string;
  journal: JournalEntry[];
  partners: PartnerState[];
  calls: CallRecord[];
  distributions: DistributionRecord[];
  equalizations: EqualizationRecord[];
  transfers: TransferRecord[];
};

// ---------- helpers (cents) ----------
const c = (v: number) => Math.round(v * 100);
const d = (v: number) => v / 100;

/** Largest-remainder allocation of an integer amount by weights. */
export function allocateCents(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, w) => a + w, 0);
  if (sum === 0 || total === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map((r) => Math.trunc(r));
  let rem = total - out.reduce((a, v) => a + v, 0);
  const order = raw
    .map((r, i) => ({ i, f: Math.abs(r - Math.trunc(r)) }))
    .sort((a, b) => b.f - a.f || a.i - b.i);
  const step = rem > 0 ? 1 : -1;
  for (let k = 0; rem !== 0; k = (k + 1) % order.length) {
    out[order[k].i] += step;
    rem -= step;
  }
  return out;
}

const days = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000;

function describe(e: CallEvent) {
  const parts = e.investments.map((i) => `Investment — ${i.name}`);
  if (e.fees) parts.push("management fee");
  if (e.expenses || e.organizational) parts.push(e.organizational ? "organizational expenses" : "fund expenses");
  return parts.join("; ");
}

// ---------- engine ----------
const cache = new Map<string, Books>();

export function buildBooks(fundId: string, asOf: string = TODAY): Books {
  const key = `${fundId}@${asOf}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const seeds = commitmentSeeds.filter((s) => s.fundId === fundId);
  const events = schedules[fundId] ?? [];
  const journal: JournalEntry[] = [];
  const partners = new Map<string, PartnerState & { cents: { commitment: number; called: number; receivable: number; distributed: number; alloc: Alloc } }>();
  const callLog: { amountCents: number; due: string }[] = [];
  const calls: CallRecord[] = [];
  const distributions: DistributionRecord[] = [];
  const equalizations: EqualizationRecord[] = [];
  const transfers: TransferRecord[] = [];
  let seq = 0;

  const post = (je: Omit<JournalEntry, "id" | "fundId">) => {
    const dr = je.lines.reduce((a, l) => a + l.debit, 0);
    const cr = je.lines.reduce((a, l) => a + l.credit, 0);
    if (dr !== cr) throw new Error(`Unbalanced entry ${je.memo}: ${dr} vs ${cr}`);
    journal.push({ ...je, id: `${fundId.slice(0, 4).toUpperCase()}-${String(++seq).padStart(4, "0")}`, fundId });
  };

  const admitted = () => [...partners.values()].filter((p) => p.cents.commitment > 0);

  /** Allocate a P&L amount (cents, signed: + increases capital) to partners by commitment. */
  const allocatePnl = (bucket: keyof Alloc, amount: number) => {
    const ps = admitted();
    const shares = allocateCents(amount, ps.map((p) => p.cents.commitment));
    ps.forEach((p, i) => (p.cents.alloc[bucket] += shares[i]));
  };

  // Build a timeline: closes, calls (notice / receipts / settlement), distributions, valuations, transfers.
  type Item = { date: string; order: number; run: () => void };
  const items: Item[] = [];

  const closeDates = [...new Set(seeds.map((s) => s.closeDate))].sort();
  closeDates.forEach((closeDate, idx) => {
    items.push({
      date: closeDate,
      order: 0,
      run: () => {
        const incoming = seeds.filter((s) => s.closeDate === closeDate);
        const existing = admitted();
        incoming.forEach((s) =>
          partners.set(s.investorId, {
            investorId: s.investorId,
            closeDate,
            commitment: 0,
            called: 0,
            receivable: 0,
            distributed: 0,
            alloc: emptyAlloc(),
            cents: { commitment: c(s.commitment), called: 0, receivable: 0, distributed: 0, alloc: emptyAlloc() },
          }),
        );
        const priorCalled = existing.reduce((a, p) => a + p.cents.called, 0);
        if (idx === 0 || priorCalled === 0) return;

        // Equalization
        const all = admitted();
        const totalCommit = all.reduce((a, p) => a + p.cents.commitment, 0);
        const targets = allocateCents(priorCalled, all.map((p) => p.cents.commitment));
        const target = new Map(all.map((p, i) => [p.investorId, targets[i]]));
        const lines: Line[] = [];
        const rec: EqualizationRecord = { fundId, closeDate, rate: EQUALIZATION_RATE, priorCalled: d(priorCalled), incoming: [], refunds: [] };
        let totalInterest = 0;
        for (const s of incoming) {
          const p = partners.get(s.investorId)!;
          const principal = target.get(p.investorId)!;
          const share = p.cents.commitment / totalCommit;
          const interest = Math.round(
            callLog.reduce((a, k) => a + k.amountCents * share * EQUALIZATION_RATE * (Math.max(0, days(k.due, closeDate)) / 365), 0),
          );
          totalInterest += interest;
          p.cents.called += principal;
          lines.push({ account: "1200", debit: principal, credit: 0, partnerId: p.investorId });
          lines.push({ account: "3000", debit: 0, credit: principal, partnerId: p.investorId });
          lines.push({ account: "1000", debit: principal, credit: 0 });
          lines.push({ account: "1200", debit: 0, credit: principal, partnerId: p.investorId });
          rec.incoming.push({ investorId: p.investorId, commitment: d(p.cents.commitment), principal: d(principal), interest: d(interest) });
        }
        const interestShares = allocateCents(totalInterest, existing.map((p) => p.cents.commitment));
        existing.forEach((p, i) => {
          const refund = p.cents.called - target.get(p.investorId)!;
          p.cents.called -= refund;
          lines.push({ account: "3000", debit: refund, credit: 0, partnerId: p.investorId });
          lines.push({ account: "1000", debit: 0, credit: refund });
          rec.refunds.push({ investorId: p.investorId, amount: d(refund), interestShare: d(interestShares[i]) });
        });
        post({ date: closeDate, memo: `Subsequent close equalization — ${incoming.length} incoming partner${incoming.length > 1 ? "s" : ""}`, source: "Equalization", lines });
        if (totalInterest > 0) {
          post({
            date: closeDate,
            memo: "Equalization interest received from incoming partners and paid to existing partners",
            source: "Equalization",
            lines: [
              { account: "1000", debit: totalInterest, credit: 0 },
              { account: "2300", debit: 0, credit: totalInterest },
              { account: "2300", debit: totalInterest, credit: 0 },
              { account: "1000", debit: 0, credit: totalInterest },
            ],
          });
        }
        equalizations.push(rec);
      },
    });
  });

  for (const e of events) {
    if (e.t === "call") {
      const total = c(e.investments.reduce((a, i) => a + i.amount, 0) + (e.fees ?? 0) + (e.expenses ?? 0) + (e.organizational ?? 0));
      const record: CallRecord = {
        id: `${fundId}-cc-${e.number}`,
        fundId,
        number: e.number,
        noticeDate: e.notice,
        dueDate: e.due,
        amount: d(total),
        investments: e.investments,
        fees: e.fees ?? 0,
        expenses: e.expenses ?? 0,
        organizational: e.organizational ?? 0,
        purpose: describe(e),
        allocations: [],
        received: 0,
        status: "Draft",
      };
      calls.push(record);
      const allocCents = new Map<string, number>();

      items.push({
        date: e.notice,
        order: 2,
        run: () => {
          const ps = admitted();
          const shares = allocateCents(total, ps.map((p) => p.cents.commitment));
          ps.forEach((p, i) => allocCents.set(p.investorId, shares[i]));
          record.allocations = ps.map((p, i) => ({ investorId: p.investorId, amount: d(shares[i]), paid: 0, paidDate: null }));
          if (e.draft) return;
          record.status = "Issued";
          callLog.push({ amountCents: total, due: e.due });
          const lines: Line[] = [];
          ps.forEach((p, i) => {
            p.cents.called += shares[i];
            p.cents.receivable += shares[i];
            lines.push({ account: "1200", debit: shares[i], credit: 0, partnerId: p.investorId });
            lines.push({ account: "3000", debit: 0, credit: shares[i], partnerId: p.investorId });
          });
          post({ date: e.notice, memo: `Capital Call No. ${e.number} issued`, source: "Capital call", ref: record.id, lines });
        },
      });

      if (!e.draft) {
        const payers = e.paid ?? null;
        const receipts: { date: string; ids: string[] | null }[] = payers
          ? [...new Set(payers.map((p) => p.date))].map((dt) => ({ date: dt, ids: payers.filter((p) => p.date === dt).map((p) => p.investorId) }))
          : [{ date: e.due, ids: null }];
        for (const r of receipts) {
          items.push({
            date: r.date,
            order: 3,
            run: () => {
              const lines: Line[] = [];
              for (const a of record.allocations) {
                if (r.ids && !r.ids.includes(a.investorId)) continue;
                const p = partners.get(a.investorId)!;
                const amt = allocCents.get(a.investorId)!;
                p.cents.receivable -= amt;
                a.paid = d(amt);
                a.paidDate = r.date;
                lines.push({ account: "1000", debit: amt, credit: 0 });
                lines.push({ account: "1200", debit: 0, credit: amt, partnerId: a.investorId });
              }
              record.received = d(record.allocations.reduce((s, a) => s + c(a.paid), 0));
              record.status = Math.abs(record.received - record.amount) < 0.005 ? "Funded" : "Partially funded";
              if (lines.length) post({ date: r.date, memo: `Receipt — Capital Call No. ${e.number}`, source: "Receipt", ref: record.id, lines });
            },
          });
        }
        items.push({
          date: e.due,
          order: 4,
          run: () => {
            for (const inv of e.investments) {
              post({
                date: e.due,
                memo: `Investment funded — ${inv.name}`,
                source: "Investment",
                ref: record.id,
                lines: [
                  { account: "1100", debit: c(inv.amount), credit: 0 },
                  { account: "1000", debit: 0, credit: c(inv.amount) },
                ],
              });
            }
            const fx: [string, keyof Alloc, number][] = [
              ["5000", "fees", c(e.fees ?? 0)],
              ["5100", "expenses", c(e.expenses ?? 0)],
              ["5200", "organizational", c(e.organizational ?? 0)],
            ];
            const lines: Line[] = [];
            for (const [acct, bucket, amt] of fx) {
              if (!amt) continue;
              lines.push({ account: acct, debit: amt, credit: 0 });
              lines.push({ account: "1000", debit: 0, credit: amt });
              allocatePnl(bucket, -amt);
            }
            if (lines.length) post({ date: e.due, memo: `Fees and expenses — Capital Call No. ${e.number}`, source: "Fees & expenses", ref: record.id, lines });
          },
        });
      }
    }

    if (e.t === "dist") {
      const ev = e as DistributionEvent;
      const roc = c(ev.returnOfCapital ?? 0);
      const gain = c(ev.realizedGain ?? 0);
      const inc = c(ev.income ?? 0);
      const total = roc + gain + inc;
      const type: DistributionRecord["type"] =
        [roc, gain, inc].filter(Boolean).length > 1 ? "Mixed" : roc ? "Return of capital" : gain ? "Realized gain" : "Income";
      const record: DistributionRecord = {
        id: `${fundId}-d-${ev.date}`,
        fundId,
        date: ev.date,
        amount: d(total),
        returnOfCapital: d(roc),
        realizedGain: d(gain),
        income: d(inc),
        type,
        source: ev.source,
        status: ev.scheduled ? "Scheduled" : "Paid",
        allocations: [],
      };
      distributions.push(record);
      items.push({
        date: ev.date,
        order: 5,
        run: () => {
          const ps = admitted();
          const shares = allocateCents(total, ps.map((p) => p.cents.commitment));
          record.allocations = ps.map((p, i) => ({ investorId: p.investorId, amount: d(shares[i]) }));
          if (ev.scheduled) return;
          const real: Line[] = [{ account: "1000", debit: total, credit: 0 }];
          if (roc) real.push({ account: "1100", debit: 0, credit: roc });
          if (gain) {
            real.push({ account: "4100", debit: 0, credit: gain });
            allocatePnl("realized", gain);
          }
          if (inc) {
            real.push({ account: "4000", debit: 0, credit: inc });
            allocatePnl("income", inc);
          }
          post({ date: ev.date, memo: `Proceeds received — ${ev.source}`, source: "Realization", ref: record.id, lines: real });
          const lines: Line[] = [];
          ps.forEach((p, i) => {
            p.cents.distributed += shares[i];
            lines.push({ account: "3100", debit: shares[i], credit: 0, partnerId: p.investorId });
          });
          lines.push({ account: "1000", debit: 0, credit: total });
          post({ date: ev.date, memo: `Distribution to partners — ${ev.source}`, source: "Distribution", ref: record.id, lines });
        },
      });
    }

    if (e.t === "val") {
      items.push({
        date: e.date,
        order: 6,
        run: () => {
          const amt = c(e.amount);
          post({
            date: e.date,
            memo: e.memo,
            source: "Valuation",
            lines:
              amt >= 0
                ? [
                    { account: "1150", debit: amt, credit: 0 },
                    { account: "4200", debit: 0, credit: amt },
                  ]
                : [
                    { account: "4200", debit: -amt, credit: 0 },
                    { account: "1150", debit: 0, credit: -amt },
                  ],
          });
          allocatePnl("unrealized", amt);
        },
      });
    }

    if (e.t === "transfer") {
      const record: TransferRecord = { ...e, fundId, commitmentMoved: 0, navMoved: 0 };
      transfers.push(record);
      items.push({
        date: e.date,
        order: 1,
        run: () => {
          const from = partners.get(e.from);
          if (!from) return;
          const f = e.fraction;
          const moved = {
            commitment: Math.round(from.cents.commitment * f),
            called: Math.round(from.cents.called * f),
            receivable: Math.round(from.cents.receivable * f),
            distributed: Math.round(from.cents.distributed * f),
          };
          record.commitmentMoved = d(moved.commitment);
          const allocMoved = emptyAlloc();
          (Object.keys(allocMoved) as (keyof Alloc)[]).forEach((k) => (allocMoved[k] = Math.round(from.cents.alloc[k] * f)));
          const allocSum = Object.values(allocMoved).reduce((a, v) => a + v, 0);
          record.navMoved = d(moved.called - moved.distributed + allocSum);
          if (e.status !== "Completed") return;
          let to = partners.get(e.to);
          if (!to) {
            to = { investorId: e.to, closeDate: e.date, commitment: 0, called: 0, receivable: 0, distributed: 0, alloc: emptyAlloc(), cents: { commitment: 0, called: 0, receivable: 0, distributed: 0, alloc: emptyAlloc() } };
            partners.set(e.to, to);
          }
          (["commitment", "called", "receivable", "distributed"] as const).forEach((k) => {
            from.cents[k] -= moved[k];
            to!.cents[k] += moved[k];
          });
          (Object.keys(allocMoved) as (keyof Alloc)[]).forEach((k) => {
            from.cents.alloc[k] -= allocMoved[k];
            to!.cents.alloc[k] += allocMoved[k];
          });
          const lines: Line[] = [];
          const move = (account: string, amt: number, creditNormal: boolean) => {
            if (!amt) return;
            // reclassify the balance from transferor to transferee
            lines.push({ account, debit: creditNormal ? amt : 0, credit: creditNormal ? 0 : amt, partnerId: e.from });
            lines.push({ account, debit: creditNormal ? 0 : amt, credit: creditNormal ? amt : 0, partnerId: e.to });
          };
          move("3000", moved.called, true);
          move("3100", moved.distributed, false);
          move("1200", moved.receivable, false);
          post({ date: e.date, memo: `Transfer of ${Math.round(f * 100)}% interest`, source: "Transfer", ref: e.id, lines });
        },
      });
    }
  }

  items
    .filter((i) => i.date <= asOf)
    .sort((a, b) => (a.date === b.date ? a.order - b.order : a.date < b.date ? -1 : 1))
    .forEach((i) => i.run());

  // Draft and scheduled items still need preview allocations against today's partners.
  const ps = admitted();
  for (const t of transfers)
    if (t.status !== "Completed" || t.date > asOf) {
      const from = partners.get(t.from);
      if (from) {
        t.commitmentMoved = d(Math.round(from.cents.commitment * t.fraction));
        const a = Object.values(from.cents.alloc).reduce((x, v) => x + v, 0);
        t.navMoved = d(Math.round((from.cents.called - from.cents.distributed + a) * t.fraction));
      }
    }
  for (const r of calls)
    if (r.allocations.length === 0) {
      const shares = allocateCents(c(r.amount), ps.map((p) => p.cents.commitment));
      r.allocations = ps.map((p, i) => ({ investorId: p.investorId, amount: d(shares[i]), paid: 0, paidDate: null }));
    }
  for (const r of distributions)
    if (r.allocations.length === 0) {
      const shares = allocateCents(c(r.amount), ps.map((p) => p.cents.commitment));
      r.allocations = ps.map((p, i) => ({ investorId: p.investorId, amount: d(shares[i]) }));
    }

  const out: Books = {
    fundId,
    asOf,
    journal,
    partners: [...partners.values()]
      .filter((p) => p.cents.commitment > 0 || p.cents.called > 0)
      .map((p) => ({
        investorId: p.investorId,
        closeDate: p.closeDate,
        commitment: d(p.cents.commitment),
        called: d(p.cents.called),
        receivable: d(p.cents.receivable),
        distributed: d(p.cents.distributed),
        alloc: Object.fromEntries(Object.entries(p.cents.alloc).map(([k, v]) => [k, d(v)])) as Alloc,
      })),
    calls: calls.sort((a, b) => b.noticeDate.localeCompare(a.noticeDate)),
    distributions: distributions.sort((a, b) => b.date.localeCompare(a.date)),
    equalizations,
    transfers,
  };
  cache.set(key, out);
  return out;
}

// ---------- reporting ----------

export const netAlloc = (a: Alloc) => a.income + a.realized + a.unrealized + a.fees + a.expenses + a.organizational;
export const partnerNav = (p: PartnerState) => p.called - p.distributed + netAlloc(p.alloc);

export type TrialBalanceRow = { account: string; debit: number; credit: number; balance: number };

export function trialBalance(journal: JournalEntry[], from?: string, to?: string): TrialBalanceRow[] {
  const m = new Map<string, { dr: number; cr: number }>();
  for (const je of journal) {
    if (to && je.date > to) continue;
    if (from && je.date < from) continue;
    for (const l of je.lines) {
      const r = m.get(l.account) ?? { dr: 0, cr: 0 };
      r.dr += l.debit;
      r.cr += l.credit;
      m.set(l.account, r);
    }
  }
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([account, r]) => ({ account, debit: d(r.dr), credit: d(r.cr), balance: d(r.dr - r.cr) }));
}

/** Journal entries carry cents internally; expose them in currency units for display. */
export function displayLines(je: JournalEntry) {
  return je.lines.map((l) => ({ ...l, debit: d(l.debit), credit: d(l.credit) }));
}
