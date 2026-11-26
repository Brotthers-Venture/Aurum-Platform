/**
 * Report Studio — the data a report may bind to, computed in the data layer (never in a block).
 * Every metric carries its source, method, currency, reporting date and status, so the editor can show where a
 * number comes from and a published report can say whether it is final. Nothing missing is ever filled in: a metric
 * Aurum does not hold is "unavailable", and the block that needs it says so.
 */
import { buildBooks, partnerNav } from "@/lib/accounting/engine";
import { trialBalance } from "@/lib/accounting/engine";
import { xirr } from "@/lib/analytics";
import { fundById, funds } from "@/lib/data";
import { gpById } from "@/lib/gps";
import { moneyShort } from "@/lib/format";
import { formatter, type Fmt } from "./i18n";
import { computeFigures, partnerRows, periodEnd, periodName, periodStart, prevPeriod, type Adjustment, type Period } from "@/lib/reporting/figures";
import { FAMILIES, REPORT_DATE, entityName, groupBy, heldBy, totals } from "@/lib/wealth";

export type ValueStatus = "final" | "preliminary" | "estimated" | "unavailable" | "illustrative";
export const STATUS_TEXT: Record<ValueStatus, string> = {
  final: "Final",
  preliminary: "Preliminary",
  estimated: "Estimated",
  unavailable: "Unavailable",
  illustrative: "Illustrative",
};

export type MetricKind = "money" | "multiple" | "percent" | "count" | "text" | "date";
export type Metric = {
  key: string;
  label: string;
  kind: MetricKind;
  value: number | string | null;
  currency: "USD" | "BRL";
  status: ValueStatus;
  source: string;
  method: string;
  asOf: string;
};

export type SeriesPoint = {
  period: Period;
  label: string;
  nav: number;
  paidIn: number;
  distributed: number;
  called: number;
  distributedQ: number;
  commitments: number;
  /** management fees and fund expenses charged in the quarter */
  fees: number;
  expenses: number;
};
export type Holding = { name: string; cost: number; first: string; share: number };
export type CallRow = { ref: string; notice: string; due: string; amount: number; purpose: string; status: string };
export type DistRow = { ref: string; date: string; amount: number; type: string; source: string };

export type ReportData = {
  fundId: string;
  period: Period;
  asOf: string;
  currency: "USD" | "BRL";
  status: ValueStatus;
  metrics: Record<string, Metric>;
  series: SeriesPoint[];
  holdings: Holding[];
  calls: CallRow[];
  distributions: DistRow[];
  terms: [string, string][];
  /** what the data describes: a fund, or a family's consolidated wealth */
  subject: "fund" | "family";
  name: string;
  partners: PartnerRow[];
  /** statement lines from the ledger; keys are translated by the renderer */
  balance: StatementLine[];
  operations: StatementLine[];
  family?: FamilyData;
};

export type PartnerRow = ReturnType<typeof partnerRows>[number];
export type StatementLine = { key: string; ytd: number | null; itd: number; total?: boolean };
export type FamilyData = {
  classes: { name: string; usd: number; share: number; ytd: number }[];
  byCurrency: { name: string; usd: number; share: number }[];
  byRegion: { name: string; usd: number; share: number }[];
  entities: { name: string; kind: string; where: string; net: number }[];
  liabilities: { name: string; lender: string; rate: string; matures: string; usd: number }[];
  principal: string;
  rm: string;
};

const qOf = (d: string): Period => `${d.slice(0, 4)}-Q${Math.ceil(Number(d.slice(5, 7)) / 3)}` as Period;

/**
 * @param final the quarter close for this period has been published; otherwise figures are preliminary.
 */
export function reportData(fundId: string, period: Period, adjustments: Adjustment[] = [], final = false): ReportData {
  const f = fundById(fundId)!;
  const gp = gpById(f.gpId);
  const cur = f.currency;
  const end = periodEnd(period);
  const status: ValueStatus = final ? "final" : "preliminary";
  const figs = computeFigures(fundId, period, adjustments);
  const b = buildBooks(fundId, end);
  const tb = trialBalance(b.journal, undefined, end);
  const bal = (code: string) => tb.find((r) => r.account === code)?.balance ?? 0;
  const adj = adjustments.filter((a) => a.period <= period).reduce((s, a) => s + a.amount, 0);

  const nav = figs.nav.value as number;
  const called = figs.called.value as number;
  const distributed = figs.distributed.value as number;
  const flows = [
    ...b.calls.flatMap((c) => c.allocations.filter((a) => a.paid && a.paidDate && a.paidDate <= end).map((a) => ({ date: a.paidDate!, amount: -a.paid }))),
    ...b.distributions.filter((d) => d.status === "Paid" && d.date <= end).map((d) => ({ date: d.date, amount: d.amount })),
  ];
  const irr = xirr(flows, { date: end, amount: nav });
  const gpFunds = funds.filter((x) => x.gpId === f.gpId && x.currency === cur);
  const aua = gpFunds.reduce((s, x) => s + buildBooks(x.id, end).partners.reduce((a, p) => a + partnerNav(p), 0), 0) + adj;

  const base = { currency: cur, asOf: end };
  const books = "Fund ledger and capital accounts, as administered by Aurum";
  const m = (key: string, label: string, kind: MetricKind, value: number | string | null, source: string, method: string, st: ValueStatus = status): Metric => ({
    ...base,
    key,
    label,
    kind,
    value,
    status: value === null ? "unavailable" : st,
    source,
    method,
  });
  const fromFig = (k: keyof typeof figs, src = books): Metric => {
    const x = figs[k];
    const fixed = x.kind === "text" || x.kind === "date";
    return m(x.key, x.label, x.kind, x.value, src, x.formula, fixed ? "final" : status);
  };

  const metrics: Record<string, Metric> = {};
  for (const k of [
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
  ] as const)
    metrics[k] = fromFig(k, k === "fund" || k === "gp" ? "Fund record" : books);
  Object.assign(metrics, {
    period_name: m("period_name", "Period", "text", periodName(period), "Reporting period", "The quarter the report covers.", "final"),
    rvpi: m("rvpi", "RVPI", "multiple", called ? nav / called : null, books, "Net asset value ÷ paid-in capital."),
    moic: m(
      "moic",
      "MOIC (net)",
      "multiple",
      called ? (nav + distributed) / called : null,
      books,
      "(Net asset value + distributions) ÷ paid-in capital, net of fees and expenses.",
    ),
    net_irr: m(
      "net_irr",
      "Net IRR",
      "percent",
      irr,
      "Partner cash flows from the capital accounts",
      "Annualised internal rate of return on dated contributions and distributions, with net asset value as the terminal value. Not shown for funds younger than three months.",
    ),
    gross_irr: m(
      "gross_irr",
      "Gross IRR",
      "percent",
      null,
      "Investment-level cash flows",
      "Requires investment-level cash flows and valuations, which are not recorded for this fund yet.",
    ),
    cash: m("cash", "Cash and equivalents", "money", bal("1000"), "Ledger account 1000", "Balance of cash and cash equivalents at the period end."),
    investments_cost: m("investments_cost", "Investments at cost", "money", bal("1100"), "Ledger account 1100", "Cost of investments held at the period end."),
    unrealized: m("unrealized", "Unrealized appreciation", "money", bal("1150") + adj, "Ledger account 1150 and posted valuations", "Fair value of investments less cost."),
    fees_total: m("fees_total", "Management fees to date", "money", Math.abs(bal("5000")), "Ledger account 5000", "Management fees charged since inception."),
    expenses_total: m(
      "expenses_total",
      "Fund expenses to date",
      "money",
      Math.abs(bal("5100")) + Math.abs(bal("5200")),
      "Ledger accounts 5100 and 5200",
      "Fund and organizational expenses since inception.",
    ),
    aua: m(
      "aua",
      `Assets under administration (${gp?.shortName ?? f.manager})`,
      "money",
      aua,
      "Capital accounts of the manager's funds in the same currency",
      "Net asset value of the manager's funds administered by Aurum.",
    ),
    benchmark: m("benchmark", "Benchmark return", "percent", null, "Benchmark provider", "No benchmark is configured for this fund."),
  });

  // quarterly series from the first close
  const first = b.partners.map((p) => p.closeDate).sort()[0] ?? end;
  const series: SeriesPoint[] = [];
  for (let p = qOf(first); p <= period; p = nextQ(p)) {
    const e = periodEnd(p);
    const bb = buildBooks(fundId, e);
    const a = adjustments.filter((x) => x.period <= p).reduce((s, x) => s + x.amount, 0);
    const s = periodStart(p);
    const qtb = trialBalance(bb.journal, s, e);
    const qb = (code: string) => Math.abs(qtb.find((r) => r.account === code)?.balance ?? 0);
    series.push({
      period: p,
      label: periodName(p),
      nav: bb.partners.reduce((acc, x) => acc + partnerNav(x), 0) + a,
      paidIn: bb.partners.reduce((acc, x) => acc + x.called, 0),
      distributed: bb.partners.reduce((acc, x) => acc + x.distributed, 0),
      commitments: bb.partners.reduce((acc, x) => acc + x.commitment, 0),
      called: bb.calls.filter((c) => c.status !== "Draft" && c.noticeDate >= s && c.noticeDate <= e).reduce((acc, c) => acc + c.amount, 0),
      distributedQ: bb.distributions.filter((d) => d.status === "Paid" && d.date >= s && d.date <= e).reduce((acc, d) => acc + d.amount, 0),
      fees: qb("5000"),
      expenses: qb("5100") + qb("5200"),
    });
  }

  const byName = new Map<string, Holding>();
  for (const c of b.calls.filter((x) => x.status !== "Draft" && x.noticeDate <= end))
    for (const inv of c.investments) {
      const h = byName.get(inv.name) ?? { name: inv.name, cost: 0, first: c.noticeDate, share: 0 };
      h.cost += inv.amount;
      byName.set(inv.name, h);
    }
  const totalCost = [...byName.values()].reduce((s, h) => s + h.cost, 0);
  const holdings = [...byName.values()].map((h) => ({ ...h, share: totalCost ? h.cost / totalCost : 0 })).sort((a, z) => z.cost - a.cost);

  const pending = "Pending LPA review";
  const terms: [string, string][] = [
    ["Legal form", f.legalForm],
    ["Domicile", f.domicile],
    ["Vintage", String(f.vintage)],
    ["Strategy", f.strategy.split(" — ")[0]],
    ["Currency", cur],
    ["Target size", f.targetSize ? moneyShort(f.targetSize, cur) : pending],
    ["Management fee", f.economicsPending ? pending : f.managementFee],
    ["Carried interest", f.economicsPending ? pending : f.carry],
    ["Preferred return", f.economicsPending ? pending : f.hurdle],
    ["Term", f.term],
    ["Auditor", f.auditor],
    ["Administrator", "Aurum Asset Management"],
  ];

  // statements from the ledger: year to date (from 1 January of the period's year) and since inception
  const ytb = trialBalance(b.journal, `${period.slice(0, 4)}-01-01`, end);
  const ybal = (code: string) => ytb.find((r) => r.account === code)?.balance ?? 0;
  const assets = bal("1000") + bal("1100") + bal("1150") + adj + bal("1200");
  const liabilities = -bal("2300");
  const balance: StatementLine[] = [
    { key: "cash", ytd: null, itd: bal("1000") },
    { key: "investments_cost", ytd: null, itd: bal("1100") },
    { key: "unrealized", ytd: null, itd: bal("1150") + adj },
    { key: "receivable", ytd: null, itd: bal("1200") },
    { key: "total_assets", ytd: null, itd: assets, total: true },
    { key: "liabilities", ytd: null, itd: liabilities },
    { key: "partners_capital", ytd: null, itd: assets - liabilities, total: true },
  ];
  const adjY = adjustments.filter((a) => a.period.slice(0, 4) === period.slice(0, 4) && a.period <= period).reduce((s, a) => s + a.amount, 0);
  const line = (key: string, codes: string[], sign: 1 | -1, extraY = 0, extraI = 0): StatementLine => ({
    key,
    ytd: sign * codes.reduce((s, c) => s + ybal(c), 0) + extraY,
    itd: sign * codes.reduce((s, c) => s + bal(c), 0) + extraI,
  });
  const ops = [
    line("income", ["4000"], -1),
    line("realized", ["4100"], -1),
    line("unrealized_change", ["4200"], -1, adjY, adj),
    line("fees", ["5000"], -1),
    line("expenses", ["5100"], -1),
    line("organizational", ["5200"], -1),
  ];
  const operations: StatementLine[] = [...ops, { key: "net_result", ytd: ops.reduce((s, l) => s + (l.ytd ?? 0), 0), itd: ops.reduce((s, l) => s + l.itd, 0), total: true }];

  return {
    subject: "fund",
    name: f.name,
    partners: partnerRows(fundId, period, adjustments),
    balance,
    operations,
    fundId,
    period,
    asOf: end,
    currency: cur,
    status,
    metrics,
    series,
    holdings,
    calls: b.calls
      .filter((c) => c.status !== "Draft" && c.noticeDate <= end)
      .map((c) => ({ ref: `No. ${c.number}`, notice: c.noticeDate, due: c.dueDate, amount: c.amount, purpose: c.purpose, status: c.status }))
      .reverse(),
    distributions: b.distributions
      .filter((d) => d.status === "Paid" && d.date <= end)
      .map((d) => ({ ref: d.id.toUpperCase(), date: d.date, amount: d.amount, type: d.type, source: d.source }))
      .reverse(),
    terms,
  };
}

/**
 * A family's consolidated wealth, in US dollars, from the family office records. Valuations carry their own dates;
 * the report is as of the family office's reporting date.
 */
export function familyData(familyId: string, period: Period): ReportData {
  const fam = FAMILIES.find((x) => x.id === familyId)!;
  const t = totals(fam);
  const src = "Custodian statements and recorded valuations";
  const m = (key: string, label: string, kind: MetricKind, value: number | string | null, method: string): Metric => ({
    key,
    label,
    kind,
    value,
    currency: "USD",
    asOf: REPORT_DATE,
    status: value === null ? "unavailable" : kind === "text" ? "final" : "preliminary",
    source: kind === "text" ? "Family record" : src,
    method,
  });
  const share = (v: number) => (t.gross ? v / t.gross : 0);
  const group = (g: "cls" | "ccy" | "region") => groupBy(fam, t.assets, g).map((x) => ({ name: x.key, usd: x.usd, share: share(x.usd), ytd: x.ytd }));
  const classes = group("cls");
  const metrics: Record<string, Metric> = Object.fromEntries(
    [
      m("fund", "Family", "text", fam.name, "The family's name, from the family record."),
      m("gp", "Family office", "text", fam.rm.title, "The relationship lead's role."),
      m("period_end", "Reporting date", "date", REPORT_DATE, "Every value is as of this date or the valuation date shown."),
      m("net_worth", "Net worth", "money", t.net, "Total assets less liabilities, in US dollars at indicative rates."),
      m("gross_assets", "Total assets", "money", t.gross, "Sum of every asset, in US dollars at indicative rates."),
      m("liabilities_total", "Liabilities", "money", t.debt, "Sum of recorded borrowing."),
      m("liquid", "Liquid assets", "money", t.liquid, "Assets that can be sold within a month."),
      m("liquid_pct", "Liquid share", "percent", t.gross ? t.liquid / t.gross : null, "Liquid assets ÷ total assets."),
      m("cash", "Cash", "money", t.cash, "Cash and deposits."),
      m("ytd_return", "Investment result this year", "money", t.investmentReturn, "Price, income and currency result of the holdings since 1 January."),
      m("ytd_flows", "Contributions and withdrawals this year", "money", fam.ytd.flows, "Money added to or taken from the family's accounts since 1 January."),
      m("ytd_fx", "Currency effect this year", "money", fam.ytd.fx, "Effect of converting holdings into US dollars."),
      m("ytd_change", "Change this year", "money", t.change, "Investment result + contributions and withdrawals + currency effect."),
      m("entities", "Entities", "count", fam.entities.length, "Trusts, companies and accounts that hold the family's assets."),
      m("assets_count", "Assets", "count", fam.assets.length, "Positions recorded for the family."),
    ].map((x) => [x.key, x]),
  );
  return {
    subject: "family",
    name: fam.name,
    fundId: familyId,
    period,
    asOf: REPORT_DATE,
    currency: "USD",
    status: "preliminary",
    metrics,
    series: [],
    holdings: classes.map((c) => ({ name: c.name, cost: c.usd, share: c.share, first: "" })),
    calls: [],
    distributions: [],
    terms: [],
    partners: [],
    balance: [],
    operations: [],
    family: {
      classes,
      byCurrency: group("ccy"),
      byRegion: group("region"),
      entities: fam.entities.map((e) => ({ name: e.name, kind: e.kind, where: e.where, net: heldBy(t, e.id) })),
      liabilities: t.liabs.map((l) => ({ name: l.name, lender: l.lender, rate: l.rate, matures: l.matures, usd: l.usd })),
      principal: fam.people[0]?.name ?? fam.name,
      rm: `${fam.rm.name}, ${fam.rm.title}`,
    },
  };
}
export const isFamily = (id: string) => FAMILIES.some((x) => x.id === id);
export { entityName };

function nextQ(p: Period): Period {
  const [y, q] = p.split("-Q").map(Number);
  return (q === 4 ? `${y + 1}-Q1` : `${y}-Q${q + 1}`) as Period;
}
export { prevPeriod };

/** A metric as text for the page, in the report's language. Unavailable values never print as zero. */
export function fmt(mt: Metric | undefined, opts: { short?: boolean; f?: Fmt } = {}) {
  if (!mt) return "—";
  if (mt.value === null) return "n/a";
  const f = opts.f ?? formatter("en");
  const v = mt.value;
  switch (mt.kind) {
    case "money":
      return opts.short ? f.short(v as number, mt.currency) : f.money(v as number, mt.currency);
    case "multiple":
      return (v as number) === 0 ? f.mult(0) : f.mult(v as number);
    case "percent":
      return f.pct(v as number, 1);
    case "date":
      return f.dateLong(v as string);
    case "count":
      return f.num(v as number);
    default:
      if (f.locale !== "en" && mt.key === "quarter") return f.quarterWords(qOf(mt.asOf));
      if (f.locale !== "en" && mt.key === "period_name") return f.period(qOf(mt.asOf));
      return String(v);
  }
}

/** Metrics offered in the inspector, grouped. */
export const METRIC_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Position", keys: ["nav", "commitments", "called", "unfunded", "distributed", "called_pct", "aua"] },
  { label: "Performance", keys: ["net_irr", "tvpi", "dpi", "rvpi", "moic", "gross_irr", "benchmark"] },
  { label: "This quarter", keys: ["q_called", "q_distributed", "q_pnl", "q_unrealized", "q_fees"] },
  { label: "Balance sheet", keys: ["cash", "investments_cost", "unrealized", "fees_total", "expenses_total"] },
  {
    label: "Family",
    keys: ["net_worth", "gross_assets", "liabilities_total", "liquid", "liquid_pct", "ytd_return", "ytd_flows", "ytd_fx", "ytd_change", "entities", "assets_count"],
  },
  { label: "Text", keys: ["fund", "gp", "quarter", "period_name", "period_end", "lps"] },
];
