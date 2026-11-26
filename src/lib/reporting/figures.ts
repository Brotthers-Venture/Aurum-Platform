/**
 * Linked figures for quarter-close reporting. Every number a report shows is computed here from the books
 * (buildBooks as of the quarter end) and carries its source: the ledger accounts and the records behind it,
 * so a reader can trace it and a reviewer can see when it changes.
 */
import { buildBooks, netAlloc, partnerNav, trialBalance } from "@/lib/accounting/engine";
import { accountByCode } from "@/lib/accounting/coa";
import { fundById, investorById } from "@/lib/data";
import { gpById } from "@/lib/gps";
import { date, money, multiple, pct } from "@/lib/format";

export type Period = `${number}-Q${1 | 2 | 3 | 4}`;
export const CURRENT_PERIOD: Period = "2026-Q3";

export function periodEnd(p: Period) {
  const [y, q] = p.split("-Q").map(Number);
  return ["03-31", "06-30", "09-30", "12-31"].map((d) => `${y}-${d}`)[q - 1];
}
export function periodStart(p: Period) {
  const [y, q] = p.split("-Q").map(Number);
  return `${y}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01`;
}
export function prevPeriod(p: Period): Period {
  const [y, q] = p.split("-Q").map(Number);
  return (q === 1 ? `${y - 1}-Q4` : `${y}-Q${q - 1}`) as Period;
}
export function nextPeriod(p: Period): Period {
  const [y, q] = p.split("-Q").map(Number);
  return (q === 4 ? `${y + 1}-Q1` : `${y}-Q${q + 1}`) as Period;
}
export const periodName = (p: Period) => `Q${p.split("-Q")[1]} ${p.split("-Q")[0]}`;
export const quarterWords = (p: Period) => `${["first", "second", "third", "fourth"][Number(p.split("-Q")[1]) - 1]} quarter of ${p.split("-Q")[0]}`;
/** Reports are due 60 days after the quarter end. */
export function periodDue(p: Period) {
  const d = new Date(`${periodEnd(p)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 60);
  return d.toISOString().slice(0, 10);
}

export type FigureKind = "money" | "multiple" | "percent" | "count" | "text" | "date";
export type SourceAccount = { code: string; name: string; balance: number };
export type SourceRecord = { ref: string; label: string; date: string; amount: number };
export type Figure = {
  key: string;
  label: string;
  kind: FigureKind;
  value: number | string;
  currency: "USD" | "BRL";
  /** how it is computed, in words */
  formula: string;
  accounts: SourceAccount[];
  records: SourceRecord[];
  /** a valuation adjustment from the GP is included */
  adjusted?: boolean;
};

export const FIGURE_KEYS = [
  "fund",
  "gp",
  "quarter",
  "period_end",
  "nav",
  "commitments",
  "called",
  "called_pct",
  "unfunded",
  "distributed",
  "tvpi",
  "dpi",
  "q_called",
  "q_distributed",
  "q_pnl",
  "q_unrealized",
  "q_fees",
  "lps",
] as const;
export type FigureKey = (typeof FIGURE_KEYS)[number];

/** Figures a person can insert into a document, grouped for the picker. */
export const FIGURE_GROUPS: { label: string; keys: FigureKey[] }[] = [
  { label: "Fund", keys: ["fund", "gp", "quarter", "period_end", "lps"] },
  { label: "Position", keys: ["nav", "commitments", "called", "called_pct", "unfunded", "distributed"] },
  { label: "Performance", keys: ["tvpi", "dpi"] },
  { label: "This quarter", keys: ["q_called", "q_distributed", "q_pnl", "q_unrealized", "q_fees"] },
];

const tbFor = (journal: ReturnType<typeof buildBooks>["journal"], to: string) => {
  const tb = trialBalance(journal, undefined, to);
  const bal = (code: string) => tb.find((r) => r.account === code)?.balance ?? 0;
  const acct = (code: string): SourceAccount => ({ code, name: accountByCode(code).name, balance: bal(code) });
  return { tb, bal, acct };
};

/** Posted valuation adjustments (GP fair value at quarter end vs carrying value), cumulative to the period. */
export type Adjustment = { period: Period; amount: number; memo: string };

export function computeFigures(fundId: string, period: Period, adjustments: Adjustment[] = []): Record<FigureKey, Figure> {
  const f = fundById(fundId)!;
  const cur = f.currency;
  const end = periodEnd(period);
  const start = periodStart(period);
  const prevEnd = periodEnd(prevPeriod(period));
  const b = buildBooks(fundId, end);
  const bp = buildBooks(fundId, prevEnd);
  const { acct } = tbFor(b.journal, end);
  const adj = adjustments.filter((a) => a.period <= period).reduce((s, a) => s + a.amount, 0);
  const adjQ = adjustments.filter((a) => a.period === period).reduce((s, a) => s + a.amount, 0);

  const sum = (xs: number[]) => xs.reduce((a, v) => a + v, 0);
  const commitments = sum(b.partners.map((p) => p.commitment));
  const called = sum(b.partners.map((p) => p.called));
  const distributed = sum(b.partners.map((p) => p.distributed));
  const nav = sum(b.partners.map(partnerNav)) + adj;
  const pnlNow = sum(b.partners.map((p) => netAlloc(p.alloc)));
  const pnlPrev = sum(bp.partners.map((p) => netAlloc(p.alloc)));
  const unrealNow = sum(b.partners.map((p) => p.alloc.unrealized));
  const unrealPrev = sum(bp.partners.map((p) => p.alloc.unrealized));
  const feesNow = sum(b.partners.map((p) => p.alloc.fees));
  const feesPrev = sum(bp.partners.map((p) => p.alloc.fees));

  const callsAll = b.calls.filter((c) => c.noticeDate <= end && c.status !== "Draft");
  const callsQ = callsAll.filter((c) => c.noticeDate >= start);
  const distAll = b.distributions.filter((d) => d.date <= end && d.status === "Paid");
  const distQ = distAll.filter((d) => d.date >= start);
  const callRec = (c: (typeof callsAll)[number]): SourceRecord => ({ ref: `Call No. ${c.number}`, label: c.purpose, date: c.noticeDate, amount: c.amount });
  const distRec = (d: (typeof distAll)[number]): SourceRecord => ({ ref: d.id.toUpperCase(), label: `${d.type} — ${d.source}`, date: d.date, amount: d.amount });
  const adjRec = adjustments
    .filter((a) => a.period <= period)
    .map((a) => ({ ref: `Valuation ${periodName(a.period)}`, label: a.memo, date: periodEnd(a.period), amount: a.amount }));

  const base = { currency: cur, accounts: [] as SourceAccount[], records: [] as SourceRecord[] };
  const fig = (key: FigureKey, label: string, kind: FigureKind, value: number | string, formula: string, more: Partial<Figure> = {}): Figure => ({
    ...base,
    key,
    label,
    kind,
    value,
    formula,
    ...more,
  });

  return {
    fund: fig("fund", "Fund name", "text", f.name, "The fund's legal name, from the fund record."),
    gp: fig("gp", "Manager", "text", gpById(f.gpId)?.name ?? f.manager, "The general partner, from the GP record."),
    quarter: fig("quarter", "Quarter", "text", quarterWords(period), "The reporting period. It moves forward when the document is rolled to the next quarter."),
    period_end: fig("period_end", "Period end", "date", end, "The last day of the reporting period; every figure is as of this date."),
    lps: fig("lps", "Limited partners", "count", b.partners.length, "Partners admitted to the fund as of the period end, from the capital accounts."),
    nav: fig("nav", "Net asset value", "money", nav, "Sum of the partners' capital accounts: contributions less distributions plus allocated income, gains, fees and expenses.", {
      accounts: ["1000", "1100", "1150", "1200", "2300"].map(acct),
      records: adjRec,
      adjusted: adj !== 0,
    }),
    commitments: fig("commitments", "Total commitments", "money", commitments, "Sum of the partners' commitments admitted at each close.", {
      records: [...new Set(b.partners.map((p) => p.closeDate))].sort().map((d) => ({
        ref: "Close",
        label: `${b.partners.filter((p) => p.closeDate === d).length} partners admitted`,
        date: d,
        amount: sum(b.partners.filter((p) => p.closeDate === d).map((p) => p.commitment)),
      })),
    }),
    called: fig("called", "Paid-in capital", "money", called, "Capital called from partners to date (contributions), per the call notices.", {
      accounts: [acct("3000")],
      records: callsAll.map(callRec),
    }),
    called_pct: fig("called_pct", "Share of commitments called", "percent", commitments ? called / commitments : 0, "Paid-in capital divided by total commitments."),
    unfunded: fig("unfunded", "Unfunded commitments", "money", commitments - called, "Total commitments less paid-in capital."),
    distributed: fig("distributed", "Distributions to date", "money", distributed, "Distributions paid to partners to date.", {
      accounts: [acct("3100")],
      records: distAll.map(distRec),
    }),
    tvpi: fig("tvpi", "TVPI", "multiple", called ? (nav + distributed) / called : 0, "(Net asset value + distributions to date) ÷ paid-in capital.", { adjusted: adj !== 0 }),
    dpi: fig("dpi", "DPI", "multiple", called ? distributed / called : 0, "Distributions to date ÷ paid-in capital."),
    q_called: fig("q_called", "Called this quarter", "money", sum(callsQ.map((c) => c.amount)), "Capital calls with a notice date inside the quarter.", {
      records: callsQ.map(callRec),
    }),
    q_distributed: fig("q_distributed", "Distributed this quarter", "money", sum(distQ.map((d) => d.amount)), "Distributions paid inside the quarter.", {
      records: distQ.map(distRec),
    }),
    q_pnl: fig("q_pnl", "Net result this quarter", "money", pnlNow - pnlPrev + adjQ, "Change in allocated income, gains, fees and expenses between the two quarter ends.", {
      accounts: ["4000", "4100", "4200", "5000", "5100", "5200"].map(acct),
      adjusted: adjQ !== 0,
    }),
    q_unrealized: fig(
      "q_unrealized",
      "Change in unrealized value",
      "money",
      unrealNow - unrealPrev + adjQ,
      "Change in unrealized appreciation during the quarter, including valuations posted for it.",
      {
        accounts: [acct("1150"), acct("4200")],
        records: adjRec.filter((r) => r.date === end),
        adjusted: adjQ !== 0,
      },
    ),
    q_fees: fig("q_fees", "Management fees this quarter", "money", -(feesNow - feesPrev), "Management fees allocated to partners during the quarter.", {
      accounts: [acct("5000")],
    }),
  };
}

export function formatFigure(fg: Figure) {
  const v = fg.value;
  switch (fg.kind) {
    case "money":
      return money(v as number, fg.currency);
    case "multiple":
      return (v as number) === 0 ? "0.00x" : multiple(v as number);
    case "percent":
      return pct(v as number, 0);
    case "count":
      return String(v);
    case "date":
      return date(v as string);
    default:
      return String(v);
  }
}

/** Partner-level capital accounts at the period end, including each partner's share of posted valuations. */
export function partnerRows(fundId: string, period: Period, adjustments: Adjustment[] = []) {
  const end = periodEnd(period);
  const b = buildBooks(fundId, end);
  const bp = buildBooks(fundId, periodEnd(prevPeriod(period)));
  const adj = adjustments.filter((a) => a.period <= period).reduce((s, a) => s + a.amount, 0);
  const total = b.partners.reduce((a, p) => a + p.commitment, 0);
  return b.partners
    .map((p) => {
      const share = total ? p.commitment / total : 0;
      const prev = bp.partners.find((x) => x.investorId === p.investorId);
      const openNav = prev ? partnerNav(prev) : 0;
      const nav = partnerNav(p) + adj * share;
      return {
        investorId: p.investorId,
        name: investorById(p.investorId)?.name ?? p.investorId,
        commitment: p.commitment,
        called: p.called,
        unfunded: p.commitment - p.called,
        distributed: p.distributed,
        openNav,
        contributions: p.called - (prev?.called ?? 0),
        distributions: p.distributed - (prev?.distributed ?? 0),
        result: nav - openNav - (p.called - (prev?.called ?? 0)) + (p.distributed - (prev?.distributed ?? 0)),
        nav,
        share,
      };
    })
    .sort((a, b) => b.commitment - a.commitment);
}

export type CheckStatus = "pass" | "fail" | "waiting" | "na";
export type Check = { id: string; label: string; detail: string; status: CheckStatus; expected?: string; actual?: string };

/**
 * Tie-out checks run before anything is published. Book-level checks compare independent records; the last two
 * depend on the close itself (valuations received, documents current since review).
 */
export function runChecks(
  fundId: string,
  period: Period,
  adjustments: Adjustment[],
  ctx: { valuations: "missing" | "submitted" | "posted"; staleFigures: number; reviewed: boolean },
): Check[] {
  const f = fundById(fundId)!;
  const cur = f.currency;
  const end = periodEnd(period);
  const b = buildBooks(fundId, end);
  const { tb, bal } = tbFor(b.journal, end);
  const adj = adjustments.filter((a) => a.period <= period).reduce((s, a) => s + a.amount, 0);
  const near = (x: number, y: number) => Math.abs(x - y) < 1;
  const m = (v: number) => money(v, cur);

  const partnersNav = b.partners.reduce((a, p) => a + partnerNav(p), 0) + adj;
  const netAssets = bal("1000") + bal("1100") + bal("1150") + bal("1200") - bal("2300") + adj;
  const called = b.partners.reduce((a, p) => a + p.called, 0);
  const noticed = b.calls.filter((c) => c.noticeDate <= end && c.status !== "Draft").reduce((a, c) => a + c.allocations.reduce((x, y) => x + y.amount, 0), 0);
  const dist = b.partners.reduce((a, p) => a + p.distributed, 0);
  const paid = b.distributions.filter((d) => d.status === "Paid" && d.date <= end).reduce((a, d) => a + d.amount, 0);
  const dr = tb.reduce((a, r) => a + r.debit, 0);
  const cr = tb.reduce((a, r) => a + r.credit, 0);
  const fees = b.calls.filter((c) => c.noticeDate <= end && c.status !== "Draft").reduce((a, c) => a + c.fees, 0);

  return [
    {
      id: "capital",
      label: "Partners' capital equals net assets",
      detail: "The capital accounts add up to the fund's assets less liabilities on the balance sheet.",
      status: near(partnersNav, netAssets) ? "pass" : "fail",
      expected: m(netAssets),
      actual: m(partnersNav),
    },
    {
      id: "called",
      label: "Paid-in capital ties to the call notices",
      detail: "Contributions on the capital accounts equal the allocations on the call notices issued.",
      status: near(called, noticed) ? "pass" : "fail",
      expected: m(noticed),
      actual: m(called),
    },
    {
      id: "distributions",
      label: "Distributions tie to payments",
      detail: "Distributions on the capital accounts equal the distributions paid from the bank.",
      status: near(dist, paid) ? "pass" : "fail",
      expected: m(paid),
      actual: m(dist),
    },
    {
      id: "ledger",
      label: "The ledger balances",
      detail: "Total debits equal total credits in the trial balance at the period end.",
      status: near(dr, cr) ? "pass" : "fail",
      expected: m(dr),
      actual: m(cr),
    },
    {
      id: "fees",
      label: "Management fees agree with the call notices",
      detail: "Fees booked to the ledger equal the fees charged on the call notices.",
      status: near(Math.abs(bal("5000")), fees) ? "pass" : "fail",
      expected: m(fees),
      actual: m(Math.abs(bal("5000"))),
    },
    {
      id: "valuations",
      label: "Quarter-end valuations are posted",
      detail: "The manager's fair value for the portfolio at the period end has been received and posted.",
      status: ctx.valuations === "posted" ? "pass" : "waiting",
      actual: ctx.valuations === "submitted" ? "Received, not posted" : ctx.valuations === "missing" ? "Not received" : "Posted",
    },
    {
      id: "current",
      label: "Documents match the books",
      detail: "No linked figure has changed since the documents were reviewed.",
      status: !ctx.reviewed ? "na" : ctx.staleFigures === 0 ? "pass" : "fail",
      actual: !ctx.reviewed ? "Runs once the documents are reviewed" : ctx.staleFigures ? `${ctx.staleFigures} changed since review` : "All current",
    },
  ];
}

/** Carrying value of the portfolio at the period end (investments at cost + unrealized, with posted valuations). */
export function carryingValue(fundId: string, period: Period, adjustments: Adjustment[] = []) {
  const end = periodEnd(period);
  const { bal } = tbFor(buildBooks(fundId, end).journal, end);
  return bal("1100") + bal("1150") + adjustments.filter((a) => a.period <= period).reduce((s, a) => s + a.amount, 0);
}

/** Funds with capital in at the period end, i.e. something to report. */
export function reportable(fundId: string, period: Period) {
  return buildBooks(fundId, periodEnd(period)).partners.some((p) => p.called > 0);
}
