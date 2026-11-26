/**
 * What one limited partner sees in a sponsor's portal, computed from the books: their position in each fund at every
 * quarter end, their own capital calls and distributions, and a cash-flow IRR. BRL vehicles are shown in USD at the
 * rate of each date (PTAX where available), so positions across vehicles can be added up.
 */
import { buildBooks, partnerNav, TODAY } from "@/lib/accounting/engine";
import { PERIODS, periodLabel, xirr, type RateOn } from "@/lib/analytics";
import { documents, fundById, funds, onboarding, type Currency, type Fund } from "@/lib/data";

/** `paidIn` is capital called to date, including any amount due on an open call. */
export type InvPoint = { date: string; label: string; commitment: number; paidIn: number; distributed: number; nav: number };

export type InvFund = {
  id: string;
  name: string;
  shortName: string;
  strategy: string;
  domicile: string;
  currency: Currency;
  vintage: number;
  /** today, in the fund's own currency */
  local: { commitment: number; paidIn: number; receivable: number; distributed: number; nav: number; unfunded: number };
  /** quarter ends and today, in USD */
  series: InvPoint[];
  irr: number | null;
};

export type InvCall = {
  id: string;
  fundId: string;
  fund: string;
  number: number;
  notice: string;
  due: string;
  currency: Currency;
  amount: number;
  paid: number;
  paidDate: string | null;
  purpose: string;
  status: "Paid" | "Due" | "Overdue" | "Part paid";
};

export type InvDistribution = { id: string; fundId: string; fund: string; date: string; currency: Currency; amount: number; type: string; status: "Paid" | "Scheduled" };

export type InvDocument = { id: string; name: string; fundId: string; fund: string; category: string; date: string; size: string };

export type InvSubscription = { id: string; fundId: string; fund: string; commitment: number; status: string; progress: number; invitedOn: string };

export type InvestorView = {
  investorId: string;
  today: string;
  funds: InvFund[];
  /** every period, all funds together, USD */
  total: InvPoint[];
  /** per period: paid in and distributions received, USD */
  flows: { label: string; paidIn: number; distributed: number }[];
  calls: InvCall[];
  distributions: InvDistribution[];
  documents: InvDocument[];
  subscriptions: InvSubscription[];
  irr: number | null;
  /** called and not yet paid, USD */
  receivable: number;
  brl: boolean;
};

const usd = (v: number, f: Fund, rate: number) => (f.currency === "BRL" ? v / rate : v);

export function investorView(gpId: string, investorId: string, investorName: string, rateOn: RateOn): InvestorView {
  const mine = funds.filter((f) => f.gpId === gpId && buildBooks(f.id).partners.some((p) => p.investorId === investorId));
  const allFlows: { date: string; amount: number }[] = [];
  let terminal = 0;
  let receivable = 0;

  const fs: InvFund[] = mine.map((f) => {
    const books = buildBooks(f.id);
    const p = books.partners.find((x) => x.investorId === investorId)!;
    const series = PERIODS.map((d) => {
      const q = buildBooks(f.id, d).partners.find((x) => x.investorId === investorId);
      const r = rateOn(d);
      return {
        date: d,
        label: periodLabel(d),
        commitment: q ? usd(q.commitment, f, r) : 0,
        paidIn: q ? usd(q.called, f, r) : 0,
        distributed: q ? usd(q.distributed, f, r) : 0,
        nav: q ? usd(partnerNav(q), f, r) : 0,
      };
    });
    const flows: { date: string; amount: number }[] = [];
    for (const c of books.calls)
      for (const a of c.allocations) if (a.investorId === investorId && a.paid && a.paidDate) flows.push({ date: a.paidDate, amount: -usd(a.paid, f, rateOn(a.paidDate)) });
    for (const d of books.distributions)
      if (d.status === "Paid") for (const a of d.allocations) if (a.investorId === investorId && a.amount) flows.push({ date: d.date, amount: usd(a.amount, f, rateOn(d.date)) });
    const nav = partnerNav(p);
    // amounts called but not yet paid sit in both the value and the amount called; IRR uses money actually paid
    const net = usd(nav - p.receivable, f, rateOn(TODAY));
    allFlows.push(...flows);
    terminal += net;
    receivable += usd(p.receivable, f, rateOn(TODAY));
    return {
      id: f.id,
      name: f.name,
      shortName: f.shortName,
      strategy: f.strategy.split(" — ")[0],
      domicile: f.domicile,
      currency: f.currency,
      vintage: f.vintage,
      local: { commitment: p.commitment, paidIn: p.called, receivable: p.receivable, distributed: p.distributed, nav, unfunded: p.commitment - p.called },
      series,
      irr: flows.length ? xirr(flows, { date: TODAY, amount: net }) : null,
    };
  });

  const total: InvPoint[] = PERIODS.map((d, i) => ({
    date: d,
    label: periodLabel(d),
    commitment: fs.reduce((a, f) => a + f.series[i].commitment, 0),
    paidIn: fs.reduce((a, f) => a + f.series[i].paidIn, 0),
    distributed: fs.reduce((a, f) => a + f.series[i].distributed, 0),
    nav: fs.reduce((a, f) => a + f.series[i].nav, 0),
  }));
  const flows = total.map((t, i) => ({
    label: t.label,
    paidIn: Math.max(0, i ? t.paidIn - total[i - 1].paidIn : t.paidIn),
    distributed: Math.max(0, i ? t.distributed - total[i - 1].distributed : t.distributed),
  }));

  const calls: InvCall[] = mine
    .flatMap((f) =>
      buildBooks(f.id)
        .calls.filter((c) => c.status !== "Draft")
        .flatMap((c) => {
          const a = c.allocations.find((x) => x.investorId === investorId);
          if (!a || !a.amount) return [];
          const status: InvCall["status"] = a.paid >= a.amount - 0.005 ? "Paid" : a.paid > 0 ? "Part paid" : c.dueDate < TODAY ? "Overdue" : "Due";
          return [
            {
              id: c.id,
              fundId: f.id,
              fund: f.shortName,
              number: c.number,
              notice: c.noticeDate,
              due: c.dueDate,
              currency: f.currency,
              amount: a.amount,
              paid: a.paid,
              paidDate: a.paidDate,
              purpose: c.purpose,
              status,
            },
          ];
        }),
    )
    .sort((x, y) => y.notice.localeCompare(x.notice));

  const distributions: InvDistribution[] = mine
    .flatMap((f) =>
      buildBooks(f.id).distributions.flatMap((d) => {
        const a = d.allocations.find((x) => x.investorId === investorId);
        return a && a.amount ? [{ id: d.id, fundId: f.id, fund: f.shortName, date: d.date, currency: f.currency, amount: a.amount, type: d.type, status: d.status }] : [];
      }),
    )
    .sort((x, y) => y.date.localeCompare(x.date));

  const subscriptions: InvSubscription[] = onboarding
    .filter((o) => o.investorName === investorName && fundById(o.fundId)?.gpId === gpId)
    .map((o) => ({ id: o.id, fundId: o.fundId, fund: fundById(o.fundId)!.name, commitment: o.commitment, status: o.status, progress: o.progress, invitedOn: o.invitedOn }));

  const ids = new Set([...mine.map((f) => f.id), ...subscriptions.map((s) => s.fundId)]);
  const docs: InvDocument[] = documents
    .filter((d) => ids.has(d.fundId) && d.visibility !== "Internal")
    .map((d) => ({ id: d.id, name: d.name, fundId: d.fundId, fund: fundById(d.fundId)!.shortName, category: d.category, date: d.date, size: d.size }))
    .sort((x, y) => y.date.localeCompare(x.date));

  return {
    investorId,
    today: TODAY,
    funds: fs,
    total,
    flows,
    calls,
    distributions,
    documents: docs,
    subscriptions,
    irr: allFlows.length ? xirr(allFlows, { date: TODAY, amount: terminal }) : null,
    receivable,
    brl: mine.some((f) => f.currency === "BRL"),
  };
}
