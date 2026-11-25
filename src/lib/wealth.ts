/**
 * Multi-Family Office — the wealth of each family the firm serves.
 * DEMO DATA: synthetic, internally consistent; not real families, assets or returns. Reporting date 24 Nov 2026.
 * Values are held in local currency and converted at the indicative rates below; every total is computed here,
 * so the overview, explorer, structure and reports always agree.
 */

export const REPORT_DATE = "2026-11-24";
export const REPORT_LABEL = "24 Nov 2026";

export type Ccy = "USD" | "EUR" | "CHF" | "GBP" | "BRL";
/** 1 unit of the currency in USD (indicative, demo). */
export const FX: Record<Ccy, number> = { USD: 1, EUR: 1.08, CHF: 1.13, GBP: 1.27, BRL: 1 / 5.4 };
export const REPORTING: Ccy[] = ["USD", "EUR", "CHF", "GBP", "BRL"];
const SYMBOL: Record<Ccy, string> = { USD: "$", EUR: "€", CHF: "CHF ", GBP: "£", BRL: "R$" };

export const toUsd = (v: number, c: Ccy) => v * FX[c];
export const fromUsd = (v: number, c: Ccy) => v / FX[c];

/** Compact money in the reporting currency: $85.5M, €410K. */
export function money(usd: number, ccy: Ccy = "USD", digits = 1) {
  const v = fromUsd(usd, ccy);
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e9) return `${sign}${SYMBOL[ccy]}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}${SYMBOL[ccy]}${(a / 1e6).toFixed(digits)}M`;
  if (a >= 1e3) return `${sign}${SYMBOL[ccy]}${Math.round(a / 1e3).toLocaleString("en-US")}K`;
  return `${sign}${SYMBOL[ccy]}${Math.round(a).toLocaleString("en-US")}`;
}
export const full = (usd: number, ccy: Ccy = "USD") => {
  const v = fromUsd(usd, ccy);
  return `${v < 0 ? "−" : ""}${SYMBOL[ccy]}${Math.round(Math.abs(v)).toLocaleString("en-US")}`;
};
export const local = (v: number, c: Ccy) => `${v < 0 ? "−" : ""}${SYMBOL[c]}${Math.round(Math.abs(v)).toLocaleString("en-US")}`;
export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;
export const signed = (s: string, v: number) => (v > 0 ? `+${s}` : s);
export const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const ageDays = (iso: string) => Math.round((Date.parse(`${REPORT_DATE}T12:00:00Z`) - Date.parse(`${iso}T12:00:00Z`)) / 864e5);

export type AssetClass =
  "Cash" | "Public equities" | "Fixed income" | "Hedge funds" | "Private equity" | "Private credit" | "Real estate" | "Direct business" | "Digital assets" | "Collectibles";
export const BANKABLE: AssetClass[] = ["Cash", "Public equities", "Fixed income", "Hedge funds", "Digital assets"];

export type Entity = { id: string; name: string; kind: string; where: string; parent?: string; pct?: number; note?: string; separate?: boolean; formationRef?: string };
export type Person = { id: string; name: string; role: string; memberId?: string };
export type Asset = {
  id: string;
  name: string;
  cls: AssetClass;
  owner: string;
  ccy: Ccy;
  value: number;
  cost?: number;
  /** year-to-date investment result in USD (price, income and currency of the holding) */
  ytd: number;
  income?: number;
  custodian?: string;
  manager?: string;
  region: "North America" | "Europe" | "Latin America" | "Global" | "Asia";
  country: string;
  sector?: string;
  source: string;
  asOf: string;
  liquid: boolean;
  manual?: boolean;
  linkedDebt?: string;
  maturity?: string;
  pm?: { commit: number; called: number; dist: number; vintage: number; strategy: string };
  re?: { city: string; type: string; rent: number; opex: number; occupancy?: number };
  docs?: string[];
};
export type Liability = { id: string; name: string; lender: string; owner: string; ccy: Ccy; value: number; rate: string; matures: string; secures?: string };
export type Obligation = { date: string; what: string; amt: number; confirmed: boolean; status: string; asset?: string };
export type Family = {
  id: string;
  name: string;
  /** tenant id when served by a tenant (white label); undefined = the firm's own client */
  tenantId?: string;
  rm: { name: string; title: string };
  people: Person[];
  entities: Entity[];
  assets: Asset[];
  liabilities: Liability[];
  obligations: Obligation[];
  ytd: { flows: number; fx: number };
  targets?: Partial<Record<AssetClass, number>>;
};

const HALVORSEN: Family = {
  id: "halvorsen",
  name: "Halvorsen Family",
  rm: { name: "Helena Costa", title: "Head of Family Office" },
  people: [
    { id: "victoria", name: "Victoria Halvorsen", role: "Family principal · trustee", memberId: "victoria" },
    { id: "erik", name: "Erik Halvorsen", role: "Beneficiary" },
    { id: "ingrid", name: "Ingrid Halvorsen", role: "Beneficiary" },
  ],
  entities: [
    { id: "trust", name: "Halvorsen Family Trust", kind: "Trust", where: "Delaware, US" },
    { id: "hold", name: "Halvorsen Holdings LLC", kind: "Holding company", where: "Delaware, US", parent: "trust", pct: 100, formationRef: "AF-2024-031" },
    { id: "nordvik", name: "Nordvik Investments Ltd.", kind: "Holding company", where: "Cayman Islands", parent: "trust", pct: 100 },
    { id: "relp", name: "Halvorsen Real Estate LP", kind: "Partnership", where: "Florida, US", parent: "hold", pct: 99 },
    { id: "regp", name: "Halvorsen RE GP LLC", kind: "General partner", where: "Florida, US", parent: "hold", pct: 100, note: "General partner · 1% of the LP" },
    { id: "marine", name: "Halvorsen Marine AS", kind: "Operating company", where: "Norway", parent: "nordvik", pct: 35 },
    { id: "found", name: "Halvorsen Foundation", kind: "Foundation", where: "New York, US", separate: true, note: "Separate charity · not in family net worth" },
  ],
  assets: [
    {
      id: "a1",
      name: "Operating account",
      cls: "Cash",
      custodian: "J.P. Morgan Private Bank",
      owner: "hold",
      ccy: "USD",
      value: 4_200_000,
      ytd: 110_000,
      region: "North America",
      country: "United States",
      source: "Bank statement",
      asOf: "2026-11-21",
      liquid: true,
    },
    {
      id: "a2",
      name: "EUR current account",
      cls: "Cash",
      custodian: "UBS Switzerland",
      owner: "nordvik",
      ccy: "EUR",
      value: 2_400_000,
      ytd: 40_000,
      region: "Europe",
      country: "Switzerland",
      source: "Bank statement",
      asOf: "2026-11-20",
      liquid: true,
    },
    {
      id: "a3",
      name: "Property operating account",
      cls: "Cash",
      custodian: "City National Bank",
      owner: "relp",
      ccy: "USD",
      value: 1_100_000,
      ytd: 30_000,
      region: "North America",
      country: "United States",
      source: "Bank statement",
      asOf: "2026-11-21",
      liquid: true,
    },
    {
      id: "a4",
      name: "US equity mandate",
      cls: "Public equities",
      custodian: "Morgan Stanley",
      manager: "Morgan Stanley PWM",
      owner: "hold",
      ccy: "USD",
      value: 18_400_000,
      cost: 12_100_000,
      ytd: 2_300_000,
      income: 210_000,
      region: "North America",
      country: "United States",
      sector: "Diversified",
      source: "Custodian statement",
      asOf: "2026-11-21",
      liquid: true,
      docs: ["October statement", "Investment mandate"],
    },
    {
      id: "a5",
      name: "Global equity mandate",
      cls: "Public equities",
      custodian: "UBS Switzerland",
      manager: "UBS Discretionary",
      owner: "nordvik",
      ccy: "USD",
      value: 9_700_000,
      cost: 8_300_000,
      ytd: 950_000,
      income: 140_000,
      region: "Global",
      country: "Global",
      sector: "Diversified",
      source: "Custodian statement",
      asOf: "2026-11-20",
      liquid: true,
    },
    {
      id: "a6",
      name: "Municipal bond ladder",
      cls: "Fixed income",
      custodian: "Goldman Sachs PWM",
      manager: "Goldman Sachs PWM",
      owner: "hold",
      ccy: "USD",
      value: 12_500_000,
      cost: 12_200_000,
      ytd: 420_000,
      income: 380_000,
      region: "North America",
      country: "United States",
      sector: "Municipal",
      source: "Custodian statement",
      asOf: "2026-11-21",
      liquid: true,
      maturity: "2027-06-01",
    },
    {
      id: "a7",
      name: "Arden Macro Fund",
      cls: "Hedge funds",
      manager: "Arden Capital (sample)",
      owner: "nordvik",
      ccy: "USD",
      value: 3_000_000,
      cost: 2_500_000,
      ytd: 210_000,
      region: "Global",
      country: "Cayman Islands",
      source: "Administrator NAV",
      asOf: "2026-10-31",
      liquid: false,
    },
    {
      id: "a8",
      name: "Kestrel Growth Fund III",
      cls: "Private equity",
      manager: "Kestrel Partners (sample)",
      owner: "hold",
      ccy: "USD",
      value: 3_600_000,
      ytd: 380_000,
      region: "North America",
      country: "United States",
      sector: "Growth equity",
      source: "Quarterly report Q3",
      asOf: "2026-09-30",
      liquid: false,
      maturity: "2032-12-31",
      pm: { commit: 4_000_000, called: 3_000_000, dist: 900_000, vintage: 2022, strategy: "Growth equity" },
      docs: ["Capital call notice No. 9", "Q3 2026 quarterly report", "Subscription agreement", "Schedule K-1 (2025)"],
    },
    {
      id: "a9",
      name: "Meridian Credit Opportunities II",
      cls: "Private credit",
      manager: "Meridian (sample)",
      owner: "nordvik",
      ccy: "USD",
      value: 2_150_000,
      ytd: 170_000,
      income: 160_000,
      region: "North America",
      country: "United States",
      sector: "Direct lending",
      source: "Quarterly report Q3",
      asOf: "2026-09-30",
      liquid: false,
      maturity: "2030-06-30",
      pm: { commit: 2_500_000, called: 2_000_000, dist: 260_000, vintage: 2023, strategy: "Direct lending" },
    },
    {
      id: "a10",
      name: "220 Brickell Avenue",
      cls: "Real estate",
      owner: "relp",
      ccy: "USD",
      value: 14_500_000,
      cost: 11_200_000,
      ytd: 550_000,
      income: 1_120_000,
      region: "North America",
      country: "United States",
      sector: "Office",
      source: "Appraisal · CBRE",
      asOf: "2026-06-30",
      liquid: false,
      linkedDebt: "m1",
      re: { city: "Miami, FL", type: "Office", rent: 1_120_000, opex: 410_000, occupancy: 0.94 },
      docs: ["Appraisal June 2026", "Lease schedule", "Loan agreement"],
    },
    {
      id: "a11",
      name: "Palm Beach residence",
      cls: "Real estate",
      owner: "trust",
      ccy: "USD",
      value: 9_800_000,
      cost: 6_400_000,
      ytd: 400_000,
      region: "North America",
      country: "United States",
      sector: "Residential",
      source: "Appraisal · Douglas Elliman",
      asOf: "2026-03-31",
      liquid: false,
      re: { city: "Palm Beach, FL", type: "Residence", rent: 0, opex: 180_000 },
    },
    {
      id: "a12",
      name: "Rua da Prata 112",
      cls: "Real estate",
      owner: "nordvik",
      ccy: "EUR",
      value: 4_100_000,
      cost: 3_300_000,
      ytd: 120_000,
      income: 238_000,
      region: "Europe",
      country: "Portugal",
      sector: "Residential",
      source: "Appraisal · JLL",
      asOf: "2026-06-30",
      liquid: false,
      linkedDebt: "m2",
      re: { city: "Lisbon", type: "Residential · 14 units", rent: 238_000, opex: 61_000, occupancy: 0.93 },
    },
    {
      id: "a13",
      name: "Halvorsen Marine AS · 35%",
      cls: "Direct business",
      owner: "nordvik",
      ccy: "USD",
      value: 6_000_000,
      cost: 2_100_000,
      ytd: 620_000,
      region: "Europe",
      country: "Norway",
      sector: "Shipping",
      source: "Board valuation",
      asOf: "2025-12-31",
      liquid: false,
    },
    {
      id: "a14",
      name: "Digital assets",
      cls: "Digital assets",
      custodian: "Coinbase Prime",
      owner: "hold",
      ccy: "USD",
      value: 600_000,
      cost: 410_000,
      ytd: 180_000,
      region: "Global",
      country: "Global",
      source: "Custodian statement",
      asOf: "2026-11-24",
      liquid: true,
    },
    {
      id: "a15",
      name: "Art collection · 11 works",
      cls: "Collectibles",
      owner: "trust",
      ccy: "USD",
      value: 2_300_000,
      ytd: 0,
      region: "North America",
      country: "United States",
      source: "Insurance schedule",
      asOf: "2025-06-30",
      liquid: false,
      manual: true,
    },
  ],
  liabilities: [
    {
      id: "m1",
      name: "Mortgage · 220 Brickell",
      lender: "City National Bank",
      owner: "relp",
      ccy: "USD",
      value: 6_200_000,
      rate: "SOFR + 1.85%",
      matures: "2031-09-01",
      secures: "a10",
    },
    {
      id: "m2",
      name: "Mortgage · Rua da Prata",
      lender: "Millennium bcp",
      owner: "nordvik",
      ccy: "EUR",
      value: 1_500_000,
      rate: "3.40% fixed",
      matures: "2033-03-01",
      secures: "a12",
    },
    { id: "l3", name: "Credit line", lender: "J.P. Morgan Private Bank", owner: "hold", ccy: "USD", value: 1_500_000, rate: "SOFR + 1.10%", matures: "2027-06-30" },
  ],
  obligations: [
    { date: "2026-12-04", what: "Capital call · Kestrel Growth Fund III", amt: -400_000, confirmed: true, status: "Notice received", asset: "a8" },
    { date: "2026-12-15", what: "Property tax · Palm Beach residence", amt: -96_000, confirmed: true, status: "Scheduled", asset: "a11" },
    { date: "2026-12-20", what: "Distribution · Meridian Credit Opportunities II", amt: 85_000, confirmed: false, status: "Expected", asset: "a9" },
    { date: "2027-01-02", what: "Mortgage payment · 220 Brickell", amt: -142_000, confirmed: true, status: "Scheduled", asset: "a10" },
    { date: "2027-01-15", what: "Rent receipts · 220 Brickell", amt: 280_000, confirmed: false, status: "Projected", asset: "a10" },
    { date: "2027-02-10", what: "Capital call · Meridian Credit Opportunities II (estimated)", amt: -250_000, confirmed: false, status: "Projected", asset: "a9" },
  ],
  ytd: { flows: -1_350_000, fx: 310_000 },
  targets: { "Public equities": 0.3, "Fixed income": 0.2, "Real estate": 0.25, Cash: 0.05, "Private equity": 0.08 },
};

const VALENCA: Family = {
  id: "valenca",
  name: "Valença Family",
  tenantId: "northbridge",
  rm: { name: "Sam Ito", title: "Client Services, Northbridge" },
  people: [
    { id: "ricardo", name: "Ricardo Valença", role: "Family principal" },
    { id: "pedro", name: "Pedro Valença", role: "Family CFO", memberId: "pedro" },
  ],
  entities: [
    { id: "vpart", name: "Valença Participações Ltda.", kind: "Holding company", where: "São Paulo, Brazil" },
    { id: "voff", name: "Valença Offshore Ltd.", kind: "Holding company", where: "British Virgin Islands" },
  ],
  assets: [
    {
      id: "v1",
      name: "Itaú current accounts",
      cls: "Cash",
      custodian: "Itaú Private Bank",
      owner: "vpart",
      ccy: "BRL",
      value: 18_000_000,
      ytd: 220_000,
      region: "Latin America",
      country: "Brazil",
      source: "Bank statement",
      asOf: "2026-11-21",
      liquid: true,
    },
    {
      id: "v2",
      name: "BTG equities",
      cls: "Public equities",
      custodian: "BTG Pactual",
      owner: "vpart",
      ccy: "BRL",
      value: 42_000_000,
      cost: 36_000_000,
      ytd: 310_000,
      region: "Latin America",
      country: "Brazil",
      sector: "Diversified",
      source: "Custodian statement",
      asOf: "2026-11-21",
      liquid: true,
    },
    {
      id: "v3",
      name: "CDB and LCI",
      cls: "Fixed income",
      custodian: "BTG Pactual",
      owner: "vpart",
      ccy: "BRL",
      value: 61_000_000,
      cost: 58_500_000,
      ytd: 550_000,
      region: "Latin America",
      country: "Brazil",
      sector: "Bank credit",
      source: "Custodian statement",
      asOf: "2026-11-21",
      liquid: true,
      maturity: "2027-03-15",
    },
    {
      id: "v4",
      name: "Av. Faria Lima office",
      cls: "Real estate",
      owner: "vpart",
      ccy: "BRL",
      value: 28_000_000,
      cost: 22_000_000,
      ytd: 90_000,
      region: "Latin America",
      country: "Brazil",
      sector: "Office",
      source: "Appraisal",
      asOf: "2026-06-30",
      liquid: false,
      linkedDebt: "vl1",
    },
    {
      id: "v5",
      name: "UBS global portfolio",
      cls: "Public equities",
      custodian: "UBS Switzerland",
      owner: "voff",
      ccy: "USD",
      value: 9_400_000,
      cost: 8_100_000,
      ytd: 210_000,
      region: "Global",
      country: "Global",
      sector: "Diversified",
      source: "Custodian statement",
      asOf: "2026-11-20",
      liquid: true,
    },
    {
      id: "v6",
      name: "Private equity fund",
      cls: "Private equity",
      manager: "Sample manager",
      owner: "voff",
      ccy: "USD",
      value: 3_200_000,
      ytd: 40_000,
      region: "Global",
      country: "Global",
      source: "Quarterly report Q3",
      asOf: "2026-09-30",
      liquid: false,
      pm: { commit: 4_000_000, called: 3_000_000, dist: 200_000, vintage: 2021, strategy: "Buyout" },
    },
  ],
  liabilities: [{ id: "vl1", name: "Office loan", lender: "Itaú BBA", owner: "vpart", ccy: "BRL", value: 6_000_000, rate: "CDI + 1.6%", matures: "2029-11-30", secures: "v4" }],
  obligations: [{ date: "2026-12-09", what: "Quarterly family meeting · Northbridge", amt: 0, confirmed: true, status: "Scheduled" }],
  ytd: { flows: -380_000, fx: -910_000 },
};

export const FAMILIES: Family[] = [HALVORSEN, VALENCA];
export const familyOf = (org: string) => FAMILIES.find((f) => f.id === org);
export const entityName = (f: Family, id: string) => f.entities.find((e) => e.id === id)?.name ?? id;

export type Valued = Asset & { usd: number; usdCost?: number; ytdPct: number; debtUsd: number };
export type Totals = ReturnType<typeof totals>;

export function totals(f: Family) {
  const liabs = f.liabilities.map((l) => ({ ...l, usd: toUsd(l.value, l.ccy) }));
  const assets: Valued[] = f.assets.map((a) => {
    const usd = toUsd(a.value, a.ccy);
    const debt = liabs.find((l) => l.id === a.linkedDebt)?.usd ?? 0;
    return { ...a, usd, usdCost: a.cost === undefined ? undefined : toUsd(a.cost, a.ccy), ytdPct: a.ytd / (usd - a.ytd || 1), debtUsd: debt };
  });
  const gross = assets.reduce((s, a) => s + a.usd, 0);
  const debt = liabs.reduce((s, l) => s + l.usd, 0);
  const liquid = assets.filter((a) => a.liquid).reduce((s, a) => s + a.usd, 0);
  const cash = assets.filter((a) => a.cls === "Cash").reduce((s, a) => s + a.usd, 0);
  const investmentReturn = assets.reduce((s, a) => s + a.ytd, 0);
  const change = investmentReturn + f.ytd.flows + f.ytd.fx;
  const net = gross - debt;
  return { assets, liabs, gross, debt, net, liquid, cash, investmentReturn, change, start: net - change };
}

export type GroupKey = "cls" | "ccy" | "region" | "custodian" | "owner" | "liquidity";
export const GROUPS: { id: GroupKey; label: string }[] = [
  { id: "cls", label: "Asset class" },
  { id: "ccy", label: "Currency" },
  { id: "region", label: "Region" },
  { id: "custodian", label: "Custodian or manager" },
  { id: "owner", label: "Legal owner" },
  { id: "liquidity", label: "Liquidity" },
];
export function keyOf(f: Family, a: Valued, g: GroupKey): string {
  switch (g) {
    case "cls":
      return a.cls;
    case "ccy":
      return a.ccy;
    case "region":
      return a.region;
    case "custodian":
      return a.custodian ?? a.manager ?? "Held directly";
    case "owner":
      return entityName(f, a.owner);
    case "liquidity":
      return a.liquid ? "Liquid" : "Illiquid";
  }
}
export function groupBy(f: Family, assets: Valued[], g: GroupKey) {
  const m = new Map<string, Valued[]>();
  assets.forEach((a) => {
    const k = keyOf(f, a, g);
    m.set(k, [...(m.get(k) ?? []), a]);
  });
  return [...m.entries()].map(([k, list]) => ({ key: k, list, usd: list.reduce((s, a) => s + a.usd, 0), ytd: list.reduce((s, a) => s + a.ytd, 0) })).sort((a, b) => b.usd - a.usd);
}

/** Net value held by an entity directly (assets less its own liabilities). */
export function heldBy(t: Totals, entityId: string) {
  return t.assets.filter((a) => a.owner === entityId).reduce((s, a) => s + a.usd, 0) - t.liabs.filter((l) => l.owner === entityId).reduce((s, l) => s + l.usd, 0);
}

/** Freshness of a valuation: current within a week, dated within a quarter, stale beyond. */
export function freshness(asOf: string): { label: string; tone: "good" | "muted" | "warn" } {
  const d = ageDays(asOf);
  if (d <= 7) return { label: "Current", tone: "good" };
  if (d <= 95) return { label: `${d} days old`, tone: "muted" };
  return { label: `Stale · ${d} days`, tone: "warn" };
}

/** A deterministic sample series ending at `end` (history is illustrative until statements are imported). */
export function sampleSeries(n: number, start: number, end: number, seed = 3) {
  const out: number[] = [];
  let r = seed;
  for (let i = 0; i < n; i++) {
    r = (r * 9301 + 49297) % 233280;
    const t = i / (n - 1);
    out.push(start + (end - start) * (t * t * 0.35 + t * 0.65) + (r / 233280 - 0.5) * (end - start) * 0.18 * Math.sin(t * Math.PI));
  }
  out[0] = start;
  out[n - 1] = end;
  return out;
}

/* ───────────── maturities: what ends, renews or falls due ───────────── */
export function maturities(f: Family, t: Totals) {
  const rows = [
    ...t.assets.filter((a) => a.maturity).map((a) => ({ date: a.maturity!, what: a.name, kind: a.pm ? "Fund term ends" : "Matures", usd: a.usd, side: "asset" as const })),
    ...t.liabs.map((l) => ({ date: l.matures, what: `${l.name} · ${l.lender}`, kind: "Facility matures", usd: -l.usd, side: "liability" as const })),
  ];
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/* ───────────── watch rules (alerts) ───────────── */
export type WatchRule = { id: string; asset: string; rule: string; state: "ok" | "triggered" };
export const WATCH: Record<string, WatchRule[]> = {
  halvorsen: [
    { id: "w1", asset: "a4", rule: "Value moves more than 5% in a week", state: "ok" },
    { id: "w2", asset: "a14", rule: "Value falls below $500,000", state: "ok" },
    { id: "w3", asset: "a15", rule: "Valuation older than 12 months", state: "triggered" },
    { id: "w4", asset: "a13", rule: "Valuation older than 9 months", state: "triggered" },
  ],
  valenca: [{ id: "w5", asset: "v3", rule: "Matures within 6 months", state: "triggered" }],
};

/* ───────────── to-dos (shared between the family and the office) ───────────── */
export type Todo = { id: string; family: string; text: string; owner: string; due?: string; done?: boolean; asset?: string };
export const SEED_TODOS: Todo[] = [
  {
    id: "t1",
    family: "halvorsen",
    text: "Approve funding of the Kestrel capital call — $400,000 from the J.P. Morgan operating account",
    owner: "Victoria Halvorsen",
    due: "2026-12-03",
    asset: "a8",
  },
  { id: "t2", family: "halvorsen", text: "Sign the restated trust deed", owner: "Victoria Halvorsen", due: "2026-12-10" },
  { id: "t3", family: "halvorsen", text: "Commission a new valuation of the art collection", owner: "Helena Costa", due: "2027-01-31", asset: "a15" },
  { id: "t4", family: "halvorsen", text: "Confirm Lisbon Q3 rent roll (13 of 14 units let)", owner: "Helena Costa", due: "2026-11-28", asset: "a12" },
  { id: "t5", family: "halvorsen", text: "Review refinancing options for the J.P. Morgan credit line", owner: "Helena Costa", due: "2027-03-31" },
  { id: "t6", family: "valenca", text: "Decide on reinvestment of the CDB maturing in March", owner: "Pedro Valença", due: "2027-02-15", asset: "v3" },
];
const TODO_KEY = "aurum-wealth-todos-v1";
export function loadTodos(): Todo[] {
  try {
    const raw = window.localStorage.getItem(TODO_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : SEED_TODOS;
  } catch {
    return SEED_TODOS;
  }
}
export function saveTodos(t: Todo[]) {
  try {
    window.localStorage.setItem(TODO_KEY, JSON.stringify(t));
  } catch {}
}

/* ───────────── delegates: who else sees this family's wealth, and how much ───────────── */
export type DelegateLevel = "full" | "read" | "partial";
export const DELEGATE_LABEL: Record<DelegateLevel, string> = { full: "Full access", read: "Read only", partial: "Selected entities" };
export type Delegate = { id: string; family: string; name: string; email: string; relation: string; level: DelegateLevel; entities?: string[]; since: string };
export const SEED_DELEGATES: Delegate[] = [
  { id: "d1", family: "halvorsen", name: "Erik Halvorsen", email: "erik@halvorsen.family", relation: "Beneficiary", level: "read", since: "2025-01-10" },
  {
    id: "d2",
    family: "halvorsen",
    name: "Ingrid Halvorsen",
    email: "ingrid@halvorsen.family",
    relation: "Beneficiary",
    level: "partial",
    entities: ["trust", "hold"],
    since: "2025-01-10",
  },
  {
    id: "d3",
    family: "halvorsen",
    name: "Margaret Lindqvist",
    email: "m.lindqvist@lindqvistlaw.com",
    relation: "Trust counsel",
    level: "partial",
    entities: ["trust"],
    since: "2026-02-01",
  },
  { id: "d4", family: "halvorsen", name: "Brennan & Shaw CPAs", email: "tax@brennanshaw.com", relation: "Tax adviser", level: "read", since: "2025-03-15" },
  { id: "d5", family: "valenca", name: "Ricardo Valença", email: "ricardo@valencafo.com", relation: "Family principal", level: "full", since: "2024-06-01" },
];
const DELEGATE_KEY = "aurum-wealth-delegates-v1";
export function loadDelegates(): Delegate[] {
  try {
    const raw = window.localStorage.getItem(DELEGATE_KEY);
    return raw ? (JSON.parse(raw) as Delegate[]) : SEED_DELEGATES;
  } catch {
    return SEED_DELEGATES;
  }
}
export function saveDelegates(d: Delegate[]) {
  try {
    window.localStorage.setItem(DELEGATE_KEY, JSON.stringify(d));
  } catch {}
}
