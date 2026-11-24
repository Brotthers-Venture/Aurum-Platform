/**
 * Analytics built from the ledger: point-in-time snapshots per fund at each quarter end,
 * period roll-forwards, cash-flow IRR and a GP › fund › investor tree.
 * Everything is in USD so vehicles can be aggregated: BRL vehicles are converted at the
 * official PTAX of each snapshot's or cash flow's own date (rates supplied by fx-server).
 */
import { buildBooks, netAlloc, partnerNav, TODAY } from "@/lib/accounting/engine";
import { funds, investorById, type Fund } from "@/lib/data";
import { gpById } from "@/lib/gps";

/** BRL per USD on a date (PTAX). */
export type RateOn = (date: string) => number;
const usd = (v: number, f: Fund, brlPerUsd: number) => (f.currency === "BRL" ? v / brlPerUsd : v);

export type Snapshot = {
  date: string;
  commitment: number;
  paidIn: number; // capital called (incl. receivable)
  distributed: number;
  nav: number;
  income: number;
  realized: number;
  unrealized: number;
  fees: number; // negative = expense to partners
  expenses: number; // incl. organizational
};

const ZERO = (date: string): Snapshot => ({ date, commitment: 0, paidIn: 0, distributed: 0, nav: 0, income: 0, realized: 0, unrealized: 0, fees: 0, expenses: 0 });

export function snapshot(f: Fund, date: string, fx: number): Snapshot {
  const b = buildBooks(f.id, date);
  const s = ZERO(date);
  for (const p of b.partners) {
    s.commitment += usd(p.commitment, f, fx);
    s.paidIn += usd(p.called, f, fx);
    s.distributed += usd(p.distributed, f, fx);
    s.nav += usd(partnerNav(p), f, fx);
    s.income += usd(p.alloc.income, f, fx);
    s.realized += usd(p.alloc.realized, f, fx);
    s.unrealized += usd(p.alloc.unrealized, f, fx);
    s.fees += usd(p.alloc.fees, f, fx);
    s.expenses += usd(p.alloc.expenses + p.alloc.organizational, f, fx);
  }
  return s;
}

/** Quarter ends from Q1 2023, plus today. */
export const PERIODS: string[] = (() => {
  const out: string[] = [];
  for (let y = 2023; y <= 2026; y++) for (const md of ["03-31", "06-30", "09-30", "12-31"]) if (`${y}-${md}` < TODAY) out.push(`${y}-${md}`);
  return [...out, TODAY];
})();

export const periodLabel = (d: string) => {
  if (d === TODAY) return "Today";
  const [y, m] = d.split("-").map(Number);
  return `Q${Math.ceil(m / 3)} ${String(y).slice(2)}`;
};

/** Cash flows to and from LPs (USD), for IRR. */
export function lpFlows(f: Fund, asOf: string, rateOn: RateOn) {
  const b = buildBooks(f.id, asOf);
  const flows: { date: string; amount: number }[] = [];
  for (const c of b.calls) for (const a of c.allocations) if (a.paid && a.paidDate && a.paidDate <= asOf) flows.push({ date: a.paidDate, amount: -usd(a.paid, f, rateOn(a.paidDate)) });
  for (const d of b.distributions) if (d.status === "Paid" && d.date <= asOf) flows.push({ date: d.date, amount: usd(d.amount, f, rateOn(d.date)) });
  return flows;
}

/** Annualised IRR of dated cash flows with a terminal value (XIRR, bisection). Null when undefined. */
export function xirr(flows: { date: string; amount: number }[], terminal: { date: string; amount: number }): number | null {
  const all = [...flows, terminal].filter((x) => x.amount !== 0).sort((a, b) => a.date.localeCompare(b.date));
  if (all.length < 2 || !all.some((x) => x.amount < 0) || !all.some((x) => x.amount > 0)) return null;
  const t0 = Date.parse(all[0].date);
  const yrs = all.map((x) => (Date.parse(x.date) - t0) / (365.25 * 864e5));
  if (yrs[yrs.length - 1] < 0.25) return null; // too young to annualise meaningfully
  const npv = (r: number) => all.reduce((s, x, i) => s + x.amount / Math.pow(1 + r, yrs[i]), 0);
  let lo = -0.99;
  let hi = 5;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export type FundAnalytics = {
  id: string;
  name: string;
  shortName: string;
  gpId: string;
  gpName: string;
  strategy: string;
  currency: string;
  vintage: number;
  series: Snapshot[]; // one per PERIODS entry
  flows: { date: string; amount: number }[];
  investors: { id: string; name: string; commitment: number; paidIn: number; distributed: number; nav: number }[];
};

/** Everything the analytics workspace needs, serialisable for the client. */
export type PeriodFx = { rate: number; date: string | null; source: "PTAX" | "indicative" };

export function analyticsData(fxOn: (date: string) => PeriodFx): { periods: string[]; fx: PeriodFx[]; funds: FundAnalytics[] } {
  const rateOn: RateOn = (d) => fxOn(d).rate;
  return {
    periods: PERIODS,
    fx: PERIODS.map(fxOn),
    funds: funds.map((f) => {
      const now = buildBooks(f.id, TODAY);
      return {
        id: f.id,
        name: f.name,
        shortName: f.shortName,
        gpId: f.gpId,
        gpName: gpById(f.gpId)?.shortName ?? f.gp,
        strategy: f.strategy.split(" — ")[0],
        currency: f.currency,
        vintage: f.vintage,
        series: PERIODS.map((d) => snapshot(f, d, rateOn(d))),
        flows: lpFlows(f, TODAY, rateOn),
        investors: now.partners.map((p) => ({
          id: p.investorId,
          name: investorById(p.investorId)?.name ?? p.investorId,
          commitment: usd(p.commitment, f, rateOn(TODAY)),
          paidIn: usd(p.called, f, rateOn(TODAY)),
          distributed: usd(p.distributed, f, rateOn(TODAY)),
          nav: usd(partnerNav(p), f, rateOn(TODAY)),
        })),
      };
    }),
  };
}

/* ---------- client-side aggregation helpers (pure) ---------- */

export function sumSnapshots(list: Snapshot[], date: string): Snapshot {
  return list.reduce(
    (a, s) => ({
      date,
      commitment: a.commitment + s.commitment,
      paidIn: a.paidIn + s.paidIn,
      distributed: a.distributed + s.distributed,
      nav: a.nav + s.nav,
      income: a.income + s.income,
      realized: a.realized + s.realized,
      unrealized: a.unrealized + s.unrealized,
      fees: a.fees + s.fees,
      expenses: a.expenses + s.expenses,
    }),
    ZERO(date),
  );
}

/** Roll-forward between two snapshots: beginning NAV + flows + P&L = ending NAV (exact). */
export function rollForward(start: Snapshot, end: Snapshot) {
  const contributions = end.paidIn - start.paidIn;
  const distributions = end.distributed - start.distributed;
  const income = end.income - start.income;
  const realized = end.realized - start.realized;
  const unrealized = end.unrealized - start.unrealized;
  const fees = end.fees - start.fees;
  const expenses = end.expenses - start.expenses;
  return { beginning: start.nav, contributions, distributions: -distributions, fees, expenses, income, realized, unrealized, ending: end.nav };
}

export const multiples = (s: Snapshot) => ({
  dpi: s.paidIn ? s.distributed / s.paidIn : 0,
  rvpi: s.paidIn ? s.nav / s.paidIn : 0,
  tvpi: s.paidIn ? (s.distributed + s.nav) / s.paidIn : 0,
});

export { netAlloc };
