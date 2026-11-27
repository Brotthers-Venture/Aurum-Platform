/**
 * Banking Solution — accounts, payments and payees for the entities the firm administers.
 *
 * Model (prototype): the firm is not a bank. New accounts are opened in each client entity's own name at a partner bank
 * (US) or a licensed partner institution (Brazil); the firm operates the platform under the client's mandate and never
 * holds the money. Existing accounts at other banks are connected read-only (Open Finance in Brazil, a data aggregator
 * in the US) or kept up to date from statements.
 *
 * Fund accounts mirror the fund's books (account 1000, Cash): every posted cash entry is a bank transaction, so the bank
 * and the ledger agree by construction. Company and family accounts, and the receipts waiting to be matched, are
 * illustrative and labelled as such.
 */
import { buildBooks, TODAY } from "@/lib/accounting/engine";
import { fundById, investorById, INDICATIVE_BRL_USD, type Currency } from "@/lib/data";

export { TODAY, INDICATIVE_BRL_USD };

/* ───────── entities and accounts ───────── */

export type EntityKind = "Fund" | "Company" | "Family holding";
export type Entity = { id: string; name: string; short: string; kind: EntityKind; client: string; clientOrg?: string; country: "US" | "BR" | "KY"; fundId?: string };

export const ENTITIES: Entity[] = [
  {
    id: "e-cordillera",
    name: "Cordillera Infrastructure Partners I, LP",
    short: "Cordillera I",
    kind: "Fund",
    client: "Cordillera Infrastructure",
    clientOrg: "cordillera",
    country: "US",
    fundId: "cordillera-infra-i",
  },
  { id: "e-horizonte", name: "FIP Horizonte", short: "FIP Horizonte", kind: "Fund", client: "Horizonte Gestão", country: "BR", fundId: "fip-horizonte" },
  { id: "e-meridian", name: "Meridian CVC", short: "Meridian CVC", kind: "Fund", client: "Meridian", clientOrg: "meridian", country: "US", fundId: "meridian-cvc" },
  { id: "e-portoreal", name: "Porto Real Holdings Inc.", short: "Porto Real", kind: "Company", client: "Porto Real Holdings", clientOrg: "portoreal", country: "US" },
  { id: "e-valenca", name: "Valença Participações Ltda.", short: "Valença Participações", kind: "Company", client: "Valença Family Office", clientOrg: "valenca", country: "BR" },
  {
    id: "e-halvorsen",
    name: "Halvorsen Holdings LLC",
    short: "Halvorsen Holdings",
    kind: "Family holding",
    client: "Halvorsen Family Office",
    clientOrg: "halvorsen",
    country: "US",
  },
];
export const entityById = (id: string) => ENTITIES.find((e) => e.id === id);

/** How the platform reaches the account. */
export type Connection = "Platform" | "Connected" | "Statements";
export const CONNECTION: Record<Connection, { label: string; detail: string }> = {
  Platform: { label: "Platform account", detail: "Opened through the platform at the partner bank: balances in real time, payments with approvals." },
  Connected: { label: "Connected, read-only", detail: "An existing account at another bank: balances and transactions sync daily. Payments are made at that bank." },
  Statements: { label: "Statements", detail: "Updated from statements uploaded by the team. No live data." },
};

export type Purpose = "Operating" | "Collections" | "Distributions" | "Reserve" | "Conta PJ";
export type Account = {
  id: string;
  entityId: string;
  name: string;
  purpose: Purpose;
  bank: string;
  connection: Connection;
  currency: Currency;
  mask: string;
  /** routing details shown masked; ABA for US, ISPB/agency for Brazil */
  routing: string;
  /** opened through the platform on this date */
  opened?: string;
  /** a unique receiving number per investor, so incoming money matches itself */
  virtual?: boolean;
  /** balance comes from the fund's books */
  fromBooks?: boolean;
  illustrative?: boolean;
  lastSync: string;
};

const US_PARTNER = "Partner bank (US)";
const BR_PARTNER = "Partner institution (Brazil)";

export const ACCOUNTS: Account[] = [
  {
    id: "a-cord-op",
    entityId: "e-cordillera",
    name: "Operating and collections",
    purpose: "Collections",
    bank: US_PARTNER,
    connection: "Platform",
    currency: "USD",
    mask: "4471",
    routing: "ABA ••• 0172",
    opened: "2023-02-14",
    virtual: true,
    fromBooks: true,
    lastSync: `${TODAY}T16:42`,
  },
  {
    id: "a-cord-dist",
    entityId: "e-cordillera",
    name: "Distributions",
    purpose: "Distributions",
    bank: US_PARTNER,
    connection: "Platform",
    currency: "USD",
    mask: "4489",
    routing: "ABA ••• 0172",
    opened: "2024-06-03",
    illustrative: true,
    lastSync: `${TODAY}T16:42`,
  },
  {
    id: "a-horiz",
    entityId: "e-horizonte",
    name: "Conta movimento",
    purpose: "Operating",
    bank: "Itaú Unibanco",
    connection: "Connected",
    currency: "BRL",
    mask: "2209",
    routing: "Ag. 0912",
    fromBooks: true,
    lastSync: `${TODAY}T06:10`,
  },
  {
    id: "a-meridian",
    entityId: "e-meridian",
    name: "Operating",
    purpose: "Operating",
    bank: "J.P. Morgan Chase",
    connection: "Statements",
    currency: "USD",
    mask: "7310",
    routing: "ABA ••• 0021",
    fromBooks: true,
    lastSync: "2026-10-31T23:59",
  },
  {
    id: "a-pr-op",
    entityId: "e-portoreal",
    name: "Operating",
    purpose: "Operating",
    bank: US_PARTNER,
    connection: "Platform",
    currency: "USD",
    mask: "6120",
    routing: "ABA ••• 0172",
    opened: "2025-04-22",
    illustrative: true,
    lastSync: `${TODAY}T16:42`,
  },
  {
    id: "a-pr-tax",
    entityId: "e-portoreal",
    name: "Tax reserve",
    purpose: "Reserve",
    bank: US_PARTNER,
    connection: "Platform",
    currency: "USD",
    mask: "6138",
    routing: "ABA ••• 0172",
    opened: "2025-04-22",
    illustrative: true,
    lastSync: `${TODAY}T16:42`,
  },
  {
    id: "a-val-pj",
    entityId: "e-valenca",
    name: "Conta PJ",
    purpose: "Conta PJ",
    bank: BR_PARTNER,
    connection: "Platform",
    currency: "BRL",
    mask: "0387",
    routing: "Ag. 0001",
    opened: "2025-09-10",
    illustrative: true,
    lastSync: `${TODAY}T16:40`,
  },
  {
    id: "a-hal-op",
    entityId: "e-halvorsen",
    name: "Operating",
    purpose: "Operating",
    bank: US_PARTNER,
    connection: "Platform",
    currency: "USD",
    mask: "5904",
    routing: "ABA ••• 0172",
    opened: "2024-11-05",
    illustrative: true,
    lastSync: `${TODAY}T16:42`,
  },
];
export const accountById = (id: string) => ACCOUNTS.find((a) => a.id === id);

/* ───────── transactions ───────── */

export type Rail = "Wire" | "ACH" | "Book transfer" | "SWIFT" | "Pix" | "TED" | "Boleto";
export type Category = "Capital call" | "Investment" | "Fees and expenses" | "Distribution" | "Proceeds" | "Operating" | "Tax" | "Transfer" | "Dividend" | "Unidentified";

export type Txn = {
  id: string;
  accountId: string;
  date: string;
  /** as the bank reports it */
  description: string;
  counterparty: string;
  amount: number;
  rail: Rail;
  status: "Posted" | "Pending";
  category: Category;
  /** what it is matched to in the books or the platform */
  match:
    { state: "Matched"; to: string } | { state: "Suggested"; to: string; investorId: string; callId: string; confidence: "High" | "Medium"; why: string } | { state: "Unmatched" };
  illustrative?: boolean;
};

const short = (s: string) => s.split(" — ")[0];

/** Fund accounts: one transaction per posted cash line in the fund's books. */
function fromBooks(accountId: string, fundId: string): Txn[] {
  const f = fundById(fundId)!;
  const b = buildBooks(fundId);
  const out: Txn[] = [];
  const domestic = f.currency === "BRL";
  for (const j of b.journal) {
    const cash = j.lines.filter((l) => l.account === "1000").reduce((a, l) => a + l.debit - l.credit, 0) / 100;
    if (!cash) continue;
    if (j.source === "Receipt") {
      const payers = j.lines.filter((l) => l.account === "1200" && l.credit > 0 && l.partnerId);
      payers.forEach((l, i) =>
        out.push({
          id: `${j.id}-${i}`,
          accountId,
          date: j.date,
          description: `${domestic ? "PIX RECEBIDO" : "WIRE IN"} ${(investorById(l.partnerId!)?.name ?? "").toUpperCase().slice(0, 26)} ${j.memo.replace("Receipt — ", "").toUpperCase()}`,
          counterparty: investorById(l.partnerId!)?.name ?? "Investor",
          amount: l.credit / 100,
          rail: domestic ? "TED" : "Wire",
          status: "Posted",
          category: "Capital call",
          match: { state: "Matched", to: `${j.memo.replace("Receipt — ", "")} · ${investorById(l.partnerId!)?.name ?? ""}` },
        }),
      );
      continue;
    }
    const map: Record<string, Category> = {
      Investment: "Investment",
      "Fees & expenses": "Fees and expenses",
      Distribution: "Distribution",
      Realization: "Proceeds",
      Transfer: "Transfer",
    };
    const memo = j.memo.replace(/^Investment funded — /, "").replace(/^Proceeds received — /, "");
    out.push({
      id: j.id,
      accountId,
      date: j.date,
      description: `${cash > 0 ? (domestic ? "TED RECEBIDA" : "WIRE IN") : domestic ? "TED ENVIADA" : "WIRE OUT"} ${memo.toUpperCase().slice(0, 44)}`,
      counterparty:
        j.source === "Fees & expenses"
          ? f.gp
          : j.source === "Distribution"
            ? "Limited partners"
            : j.source === "Investment" || j.source === "Realization"
              ? short(memo)
              : "Transfer",
      amount: cash,
      rail: domestic ? "TED" : "Wire",
      status: "Posted",
      category: map[j.source] ?? "Operating",
      match: { state: "Matched", to: j.memo },
    });
  }
  return out;
}

/** The investor's own receiving number on a fund's collections account. */
export function vaFor(fundId: string, investorId: string) {
  const i = buildBooks(fundId).partners.findIndex((p) => p.investorId === investorId);
  return `VA ••${String(601 + Math.max(0, i)).padStart(4, "0")}`;
}

/** Open allocations on issued calls of a fund: what each investor still owes. */
export function openAllocations(fundId: string) {
  const b = buildBooks(fundId);
  return b.calls
    .filter((c) => c.status !== "Draft" && c.status !== "Funded")
    .flatMap((c) =>
      c.allocations.filter((a) => a.paid < a.amount - 0.005).map((a) => ({ callId: c.id, number: c.number, due: c.dueDate, investorId: a.investorId, owed: a.amount - a.paid })),
    );
}

/** Receipts that reached the bank today and are not yet in the books: one clean, one short by a bank fee. */
function arrivals(): Txn[] {
  const open = openAllocations("cordillera-infra-i");
  const calloway = open.find((o) => o.investorId === "inv-calloway");
  const other = open.find((o) => o.investorId !== "inv-calloway" && o.owed > 100_000);
  const out: Txn[] = [];
  if (calloway)
    out.push({
      id: "t-arr-1",
      accountId: "a-cord-op",
      date: TODAY,
      description: `WIRE IN CALLOWAY FAMILY TRUST CORDILLERA CALL 7 ${vaFor("cordillera-infra-i", "inv-calloway")}`,
      counterparty: "Calloway Family Trust",
      amount: calloway.owed,
      rail: "Wire",
      status: "Posted",
      category: "Capital call",
      match: {
        state: "Suggested",
        to: `Capital Call No. ${calloway.number} · Calloway Family Trust`,
        investorId: calloway.investorId,
        callId: calloway.callId,
        confidence: "High",
        why: "Received on Calloway Family Trust’s own account number, for exactly the amount it owes on Call No. 7.",
      },
      illustrative: true,
    });
  if (other) {
    const name = investorById(other.investorId)?.name ?? "Investor";
    out.push({
      id: "t-arr-2",
      accountId: "a-cord-op",
      date: TODAY,
      description: `WIRE IN ${name.toUpperCase().slice(0, 22)} REF 88231`,
      counterparty: name,
      amount: other.owed - 25,
      rail: "Wire",
      status: "Posted",
      category: "Capital call",
      match: {
        state: "Suggested",
        to: `Capital Call No. ${other.number} · ${name}`,
        investorId: other.investorId,
        callId: other.callId,
        confidence: "Medium",
        why: `From ${name}, but $25.00 short of what it owes on Call No. ${other.number}: most likely an intermediary bank fee. Confirm and record the shortfall, or ask the investor to send the difference.`,
      },
      illustrative: true,
    });
  }
  out.push({
    id: "t-arr-3",
    accountId: "a-pr-op",
    date: TODAY,
    description: "ACH CREDIT HARBORVIEW LOGISTICS INV 2291",
    counterparty: "Harborview Logistics",
    amount: 48_200,
    rail: "ACH",
    status: "Posted",
    category: "Unidentified",
    match: { state: "Unmatched" },
    illustrative: true,
  });
  return out;
}

type Seed = [date: string, description: string, counterparty: string, amount: number, rail: Rail, category: Category, to?: string];
const seeded = (accountId: string, rows: Seed[]): Txn[] =>
  rows.map(([date, description, counterparty, amount, rail, category, to], i) => ({
    id: `${accountId}-s${i}`,
    accountId,
    date,
    description,
    counterparty,
    amount,
    rail,
    status: "Posted" as const,
    category,
    match: to ? { state: "Matched" as const, to } : { state: "Matched" as const, to: "Booked by the client’s accountant" },
    illustrative: true,
  }));

/** Opening balances for illustrative accounts, before the listed transactions. */
const OPENING: Record<string, number> = { "a-cord-dist": 0, "a-pr-op": 2_215_400, "a-pr-tax": 520_000, "a-val-pj": 2_940_000, "a-hal-op": 1_610_000 };

const SEEDED: Txn[] = [
  ...seeded("a-pr-op", [
    ["2026-09-30", "ACH CREDIT HARBORVIEW LOGISTICS INV 2214", "Harborview Logistics", 186_500, "ACH", "Operating", "Invoice 2214"],
    ["2026-10-01", "BOOK TRANSFER TO TAX RESERVE ••6138", "Porto Real · Tax reserve", -120_000, "Book transfer", "Transfer", "Tax reserve funding Q4"],
    ["2026-10-15", "WIRE OUT MORRIS & KENT LLP", "Morris & Kent LLP", -42_750, "Wire", "Operating", "Legal fees — September"],
    ["2026-10-31", "ACH DEBIT PAYROLL PROVIDER", "Payroll provider", -96_300, "ACH", "Operating", "Payroll October"],
    ["2026-11-03", "ACH CREDIT DUNMORE FREIGHT INV 2240", "Dunmore Freight", 214_000, "ACH", "Operating", "Invoice 2240"],
    ["2026-11-14", "WIRE OUT DELAWARE FRANCHISE TAX", "State of Delaware", -18_400, "Wire", "Tax", "Franchise tax 2026"],
    ["2026-11-18", "ACH CREDIT HARBORVIEW LOGISTICS INV 2251", "Harborview Logistics", 162_300, "ACH", "Operating", "Invoice 2251"],
    ["2026-11-20", "ACH DEBIT PAYROLL PROVIDER", "Payroll provider", -97_100, "ACH", "Operating", "Payroll November"],
  ]),
  ...seeded("a-pr-tax", [
    ["2026-10-01", "BOOK TRANSFER FROM OPERATING ••6120", "Porto Real · Operating", 120_000, "Book transfer", "Transfer", "Tax reserve funding Q4"],
    ["2026-11-01", "INTEREST CREDIT", "Partner bank", 1_840, "Book transfer", "Operating", "Interest October"],
  ]),
  ...seeded("a-val-pj", [
    ["2026-10-05", "PIX RECEBIDO ALUGUEL EDIFICIO AURORA", "Locatária Edifício Aurora", 186_000, "Pix", "Operating", "Aluguel outubro"],
    ["2026-10-10", "PIX ENVIADO ESCRITORIO CONTABIL MOURA", "Escritório Contábil Moura", -12_400, "Pix", "Operating", "Honorários contábeis"],
    ["2026-10-20", "DARF IRPJ CSLL", "Receita Federal", -64_900, "Boleto", "Tax", "IRPJ/CSLL 3º trimestre"],
    ["2026-11-05", "PIX RECEBIDO ALUGUEL EDIFICIO AURORA", "Locatária Edifício Aurora", 186_000, "Pix", "Operating", "Aluguel novembro"],
    ["2026-11-10", "PIX ENVIADO ESCRITORIO CONTABIL MOURA", "Escritório Contábil Moura", -12_400, "Pix", "Operating", "Honorários contábeis"],
    ["2026-11-19", "TED RECEBIDA DIVIDENDOS COMPANHIA SERRANA", "Companhia Serrana S.A.", 420_000, "TED", "Dividend", "Dividendos 3T"],
  ]),
  ...seeded("a-hal-op", [
    ["2026-10-02", "WIRE IN HALVORSEN FAMILY TRUST", "Halvorsen Family Trust", 400_000, "Wire", "Transfer", "Capital contribution"],
    ["2026-10-16", "WIRE OUT NORDIC TIMBER AS DIVIDEND RECEIPT RETURN", "Nordic Timber AS", -35_000, "SWIFT", "Operating", "Withholding refund to Nordic Timber"],
    ["2026-11-01", "ACH DEBIT PROPERTY MANAGER", "Lakeview Property Management", -28_600, "ACH", "Operating", "Property management November"],
    ["2026-11-12", "WIRE OUT MORRIS & KENT LLP", "Morris & Kent LLP", -24_400, "Wire", "Operating", "Estate planning — October"],
  ]),
];

export const TRANSACTIONS: Txn[] = [
  ...fromBooks("a-cord-op", "cordillera-infra-i"),
  ...fromBooks("a-horiz", "fip-horizonte"),
  ...fromBooks("a-meridian", "meridian-cvc"),
  ...SEEDED,
  ...arrivals(),
].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

/** Balance at the end of a date (inclusive), from the opening balance and the account's transactions. */
export function balanceOn(accountId: string, date: string, txns: Txn[] = TRANSACTIONS) {
  const open = OPENING[accountId] ?? 0;
  return open + txns.filter((t) => t.accountId === accountId && t.date <= date && t.status === "Posted").reduce((a, t) => a + t.amount, 0);
}

/** Business day before a date (weekends skipped). */
export function priorDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  do d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

export const toUsd = (v: number, ccy: Currency) => (ccy === "BRL" ? v / INDICATIVE_BRL_USD : v);

/* ───────── people, roles and approval policies ───────── */

export type Person = { id: string; name: string; title: string; side: "Firm" | "Client"; entityIds?: string[] };
export const PEOPLE: Person[] = [
  { id: "noah", name: "Noah Whitaker", title: "Head of Banking Operations", side: "Firm" },
  { id: "ines", name: "Inês Carvalho", title: "Banking Operations", side: "Firm" },
  { id: "luiza", name: "Luiza Andrade", title: "Head of Fund Services", side: "Firm" },
  { id: "rafael", name: "Rafael Mendes", title: "Fund Accountant", side: "Firm" },
  { id: "helena", name: "Helena Costa", title: "Head of Family Office", side: "Firm" },
  { id: "marcus", name: "Marcus Hale", title: "Managing Director · Cordillera", side: "Client", entityIds: ["e-cordillera"] },
  { id: "sofia", name: "Sofia Klein", title: "Investor Relations · Cordillera", side: "Client", entityIds: ["e-cordillera"] },
  { id: "kenji", name: "Kenji Moriyama", title: "Treasurer · Porto Real", side: "Client", entityIds: ["e-portoreal"] },
  { id: "dana", name: "Dana Whitfield", title: "CFO · Porto Real", side: "Client", entityIds: ["e-portoreal"] },
  { id: "pedro", name: "Pedro Valença", title: "Family CFO · Valença", side: "Client", entityIds: ["e-valenca"] },
  { id: "beatriz", name: "Beatriz Valença", title: "Diretora · Valença Participações", side: "Client", entityIds: ["e-valenca"] },
  { id: "victoria", name: "Victoria Halvorsen", title: "Family Principal · Halvorsen", side: "Client", entityIds: ["e-halvorsen"] },
];
export const personById = (id: string) => PEOPLE.find((p) => p.id === id);

/** One tier of an approval policy: payments up to `upTo` need these approvals. */
export type Tier = { upTo: number | null; approvals: number; clientRequired: boolean };
export type Policy = {
  entityId: string;
  currency: Currency;
  tiers: Tier[];
  /** client signatories who may approve */
  signatories: string[];
  /** firm people who may approve */
  firmApprovers: string[];
  /** firm people who release approved payments to the bank */
  releasers: string[];
  /** payments to a payee first used, or whose details changed, need a recorded callback */
  callback: true;
  /** after a callback, a payee's new details can be used once this many hours have passed */
  coolingHours: number;
};

export const POLICIES: Policy[] = [
  {
    entityId: "e-cordillera",
    currency: "USD",
    tiers: [
      { upTo: 250_000, approvals: 1, clientRequired: false },
      { upTo: null, approvals: 2, clientRequired: true },
    ],
    signatories: ["marcus", "sofia"],
    firmApprovers: ["luiza", "rafael"],
    releasers: ["noah", "ines"],
    callback: true,
    coolingHours: 24,
  },
  {
    entityId: "e-portoreal",
    currency: "USD",
    tiers: [
      { upTo: 100_000, approvals: 1, clientRequired: true },
      { upTo: null, approvals: 2, clientRequired: true },
    ],
    signatories: ["kenji", "dana"],
    firmApprovers: [],
    releasers: ["noah", "ines"],
    callback: true,
    coolingHours: 24,
  },
  {
    entityId: "e-valenca",
    currency: "BRL",
    tiers: [
      { upTo: 50_000, approvals: 1, clientRequired: true },
      { upTo: null, approvals: 2, clientRequired: true },
    ],
    signatories: ["pedro", "beatriz"],
    firmApprovers: ["helena"],
    releasers: ["noah", "ines"],
    callback: true,
    coolingHours: 24,
  },
  {
    entityId: "e-halvorsen",
    currency: "USD",
    tiers: [{ upTo: null, approvals: 1, clientRequired: true }],
    signatories: ["victoria"],
    firmApprovers: ["helena"],
    releasers: ["noah", "ines"],
    callback: true,
    coolingHours: 24,
  },
];
export const policyFor = (entityId: string) => POLICIES.find((p) => p.entityId === entityId);
export const tierFor = (p: Policy, amount: number) => p.tiers.find((t) => t.upTo === null || amount <= t.upTo) ?? p.tiers[p.tiers.length - 1];

/* ───────── payees ───────── */

export type PayeeState = "Verified" | "Callback required" | "Cooling off";
export type Payee = {
  id: string;
  name: string;
  kind: "Portfolio company" | "Manager" | "Vendor" | "Shareholder" | "Investor" | "Government" | "Own account";
  country: "US" | "BR" | "NO" | "KY";
  currency: Currency;
  bank: string;
  mask: string;
  /** entities allowed to pay this payee */
  entityIds: string[];
  state: PayeeState;
  verified?: { by: string; at: string; number: string; source: string; spokeWith: string };
  /** a change of bank details waiting for a callback */
  change?: { bank: string; mask: string; requestedAt: string; via: string };
  /** an account on the platform at the same partner: instant book transfer */
  onPlatform?: string;
  /** a number on record before any change was requested, for the callback */
  trustedPhone: string;
  phoneSource: string;
  illustrative?: boolean;
};

export const PAYEES: Payee[] = [
  {
    id: "py-ribeira",
    name: "Ribeira Solar Holdings",
    kind: "Portfolio company",
    country: "US",
    currency: "USD",
    bank: "Wells Fargo",
    mask: "8821",
    entityIds: ["e-cordillera"],
    state: "Verified",
    verified: { by: "Noah Whitaker", at: "2023-11-06T10:12", number: "+1 (415) 555-0148", source: "Share purchase agreement, notices clause", spokeWith: "Helen Ortiz, CFO" },
    trustedPhone: "+1 (415) 555-0148",
    phoneSource: "Share purchase agreement, notices clause",
  },
  {
    id: "py-cordgp",
    name: fundById("cordillera-infra-i")?.gp ?? "Cordillera Infrastructure GP I, LLC",
    kind: "Manager",
    country: "US",
    currency: "USD",
    bank: "City National Bank",
    mask: "3307",
    entityIds: ["e-cordillera"],
    state: "Verified",
    verified: { by: "Noah Whitaker", at: "2023-02-20T15:30", number: "+1 (212) 555-0190", source: "Limited partnership agreement, notices", spokeWith: "Marcus Hale" },
    trustedPhone: "+1 (212) 555-0190",
    phoneSource: "Limited partnership agreement, notices",
  },
  {
    id: "py-morris",
    name: "Morris & Kent LLP",
    kind: "Vendor",
    country: "US",
    currency: "USD",
    bank: "Bank of America",
    mask: "1150",
    entityIds: ["e-portoreal", "e-halvorsen"],
    state: "Verified",
    verified: { by: "Noah Whitaker", at: "2025-05-02T11:05", number: "+1 (302) 555-0122", source: "Engagement letter", spokeWith: "Accounts receivable, R. Diaz" },
    trustedPhone: "+1 (302) 555-0122",
    phoneSource: "Engagement letter",
    illustrative: true,
  },
  {
    id: "py-moura",
    name: "Escritório Contábil Moura",
    kind: "Vendor",
    country: "BR",
    currency: "BRL",
    bank: "Banco do Brasil",
    mask: "5521",
    entityIds: ["e-valenca"],
    state: "Verified",
    verified: { by: "Helena Costa", at: "2025-09-15T14:20", number: "+55 (11) 5555-0130", source: "Contrato de prestação de serviços", spokeWith: "Sr. Moura" },
    trustedPhone: "+55 (11) 5555-0130",
    phoneSource: "Contrato de prestação de serviços",
    illustrative: true,
  },
  {
    id: "py-atlas",
    name: "Construtora Atlas Ltda.",
    kind: "Vendor",
    country: "BR",
    currency: "BRL",
    bank: "Bradesco",
    mask: "7734",
    entityIds: ["e-valenca"],
    state: "Callback required",
    verified: {
      by: "Helena Costa",
      at: "2026-03-04T09:40",
      number: "+55 (11) 5555-0177",
      source: "Contrato de obra, cláusula de notificações",
      spokeWith: "Financeiro, Sra. Lima",
    },
    change: { bank: "Banco Inter", mask: "0419", requestedAt: "2026-11-23T18:02", via: "Email from financeiro@construtora-atlas.com.br with a letter on letterhead" },
    trustedPhone: "+55 (11) 5555-0177",
    phoneSource: "Contrato de obra, cláusula de notificações",
    illustrative: true,
  },
  {
    id: "py-delaware",
    name: "State of Delaware",
    kind: "Government",
    country: "US",
    currency: "USD",
    bank: "PNC Bank",
    mask: "0001",
    entityIds: ["e-portoreal"],
    state: "Verified",
    verified: { by: "Noah Whitaker", at: "2025-05-02T11:40", number: "+1 (302) 555-0100", source: "Division of Corporations website", spokeWith: "Franchise tax unit" },
    trustedPhone: "+1 (302) 555-0100",
    phoneSource: "Division of Corporations website",
    illustrative: true,
  },
  {
    id: "py-halvtrust",
    name: "Halvorsen Family Trust",
    kind: "Own account",
    country: "US",
    currency: "USD",
    bank: US_PARTNER,
    mask: "5912",
    entityIds: ["e-halvorsen"],
    state: "Verified",
    verified: { by: "Helena Costa", at: "2024-11-05T10:00", number: "+1 (617) 555-0161", source: "Trust agreement, trustee contact", spokeWith: "Victoria Halvorsen" },
    onPlatform: "Halvorsen Family Trust · Operating",
    trustedPhone: "+1 (617) 555-0161",
    phoneSource: "Trust agreement, trustee contact",
    illustrative: true,
  },
  {
    id: "py-pr-tax",
    name: "Porto Real Holdings · Tax reserve",
    kind: "Own account",
    country: "US",
    currency: "USD",
    bank: US_PARTNER,
    mask: "6138",
    entityIds: ["e-portoreal"],
    state: "Verified",
    onPlatform: "a-pr-tax",
    trustedPhone: "—",
    phoneSource: "Same owner, same partner bank",
    illustrative: true,
  },
  ...(
    [
      ["py-sh-1", "Moriyama Family Partners", "4410"],
      ["py-sh-2", "Bay Street Growth Fund II", "9012"],
      ["py-sh-3", "D. Whitfield Revocable Trust", "2277"],
    ] as const
  ).map(([id, name, mask]): Payee => ({
    id,
    name,
    kind: "Shareholder",
    country: "US",
    currency: "USD",
    bank: "Various",
    mask,
    entityIds: ["e-portoreal"],
    state: "Verified",
    verified: { by: "Noah Whitaker", at: "2025-12-10T10:00", number: "On file", source: "Stock ledger, shareholder contact", spokeWith: "Shareholder of record" },
    trustedPhone: "On file",
    phoneSource: "Stock ledger, shareholder contact",
    illustrative: true,
  })),
];

/* ───────── payments ───────── */

export type PayState = "Draft" | "Pending approval" | "Pending release" | "Scheduled" | "Sent" | "Settled" | "Rejected" | "Cancelled" | "On hold";
export type Decision = { who: string; at: string; kind: "Prepared" | "Approved" | "Rejected" | "Released" | "Sent" | "Settled" | "Held" | "Cancelled"; note?: string };
export type Payment = {
  id: string;
  ref: string;
  fromAccountId: string;
  payeeId: string;
  amount: number;
  currency: Currency;
  rail: Rail;
  /** value date requested */
  date: string;
  memo: string;
  /** what it pays, in the books */
  purpose?: { kind: "Capital call" | "Distribution" | "Bill" | "Transfer" | "Dividend" | "Tax"; label: string };
  state: PayState;
  trail: Decision[];
  /** a run of several payments released together */
  runId?: string;
  illustrative?: boolean;
};

const call7 = (() => {
  const c = buildBooks("cordillera-infra-i").calls.find((x) => x.number === 7);
  return c ? { invest: c.investments[0], fees: c.fees + c.expenses, due: c.dueDate } : null;
})();

export const SEED_PAYMENTS: Payment[] = [
  ...(call7
    ? [
        {
          id: "pm-1",
          ref: "PAY-2611-014",
          fromAccountId: "a-cord-op",
          payeeId: "py-ribeira",
          amount: call7.invest.amount,
          currency: "USD" as const,
          rail: "Wire" as const,
          date: call7.due,
          memo: `${call7.invest.name} — closing funding`,
          purpose: { kind: "Capital call" as const, label: "Capital Call No. 7 · investment" },
          state: "Pending approval" as const,
          trail: [
            { who: "Rafael Mendes", at: "2026-11-18T10:24", kind: "Prepared" as const, note: "Per Call No. 7 notice and the share purchase agreement, schedule 2." },
            { who: "Luiza Andrade", at: "2026-11-19T09:02", kind: "Approved" as const },
          ],
        },
        {
          id: "pm-2",
          ref: "PAY-2611-015",
          fromAccountId: "a-cord-op",
          payeeId: "py-cordgp",
          amount: call7.fees,
          currency: "USD" as const,
          rail: "Wire" as const,
          date: call7.due,
          memo: "Management fee — semi-annual, per LPA 8.1",
          purpose: { kind: "Capital call" as const, label: "Capital Call No. 7 · management fee" },
          state: "Pending release" as const,
          trail: [
            { who: "Rafael Mendes", at: "2026-11-18T10:31", kind: "Prepared" as const },
            { who: "Luiza Andrade", at: "2026-11-19T09:03", kind: "Approved" as const },
            { who: "Marcus Hale", at: "2026-11-20T16:45", kind: "Approved" as const },
          ],
        },
      ]
    : []),
  {
    id: "pm-3",
    ref: "PAY-2611-009",
    fromAccountId: "a-val-pj",
    payeeId: "py-moura",
    amount: 12_400,
    currency: "BRL",
    rail: "Pix",
    date: "2026-11-10",
    memo: "Honorários contábeis — novembro",
    purpose: { kind: "Bill", label: "Monthly accounting fee" },
    state: "Settled",
    trail: [
      { who: "Helena Costa", at: "2026-11-09T15:12", kind: "Prepared" },
      { who: "Pedro Valença", at: "2026-11-09T18:40", kind: "Approved" },
      { who: "Noah Whitaker", at: "2026-11-10T09:05", kind: "Released" },
      { who: "Partner institution", at: "2026-11-10T09:05", kind: "Settled", note: "Pix settled in 3 seconds. End-to-end ID E0038••••••0905" },
    ],
    illustrative: true,
  },
  {
    id: "pm-4",
    ref: "PAY-2611-016",
    fromAccountId: "a-val-pj",
    payeeId: "py-atlas",
    amount: 640_000,
    currency: "BRL",
    rail: "TED",
    date: "2026-11-27",
    memo: "Medição 4 — reforma Edifício Aurora",
    purpose: { kind: "Bill", label: "Construction progress payment 4" },
    state: "On hold",
    trail: [
      { who: "Helena Costa", at: "2026-11-24T08:55", kind: "Prepared" },
      {
        who: "System",
        at: "2026-11-24T08:55",
        kind: "Held",
        note: "The payee changed its bank details yesterday by email. Paused until a callback to the number on record confirms them.",
      },
    ],
    illustrative: true,
  },
  {
    id: "pm-5",
    ref: "PAY-2611-012",
    fromAccountId: "a-pr-op",
    payeeId: "py-morris",
    amount: 38_900,
    currency: "USD",
    rail: "Wire",
    date: "2026-12-01",
    memo: "Legal fees — October, invoice MK-10477",
    purpose: { kind: "Bill", label: "Invoice MK-10477" },
    state: "Scheduled",
    trail: [
      { who: "Noah Whitaker", at: "2026-11-21T13:20", kind: "Prepared" },
      { who: "Kenji Moriyama", at: "2026-11-21T17:02", kind: "Approved" },
      { who: "Noah Whitaker", at: "2026-11-22T09:00", kind: "Released", note: "Released for the value date. Sent automatically on Dec 1 before the wire cutoff." },
    ],
    illustrative: true,
  },
  {
    id: "pm-6",
    ref: "PAY-2611-010",
    fromAccountId: "a-hal-op",
    payeeId: "py-halvtrust",
    amount: 250_000,
    currency: "USD",
    rail: "Book transfer",
    date: "2026-11-25",
    memo: "Return of capital to the trust",
    purpose: { kind: "Transfer", label: "Intra-family transfer" },
    state: "Pending approval",
    trail: [{ who: "Helena Costa", at: "2026-11-24T11:10", kind: "Prepared", note: "Requested by Victoria on the family call of Nov 21." }],
    illustrative: true,
  },
  ...(
    [
      ["pm-7a", "py-sh-1", 96_000],
      ["pm-7b", "py-sh-2", 72_000],
      ["pm-7c", "py-sh-3", 32_000],
    ] as const
  ).map(([id, payeeId, amount], i): Payment => ({
    id,
    ref: `PAY-2611-02${i}`,
    fromAccountId: "a-pr-op",
    payeeId,
    amount,
    currency: "USD",
    rail: "ACH",
    date: "2026-12-15",
    memo: "Dividend Q4 2026 — $0.40 per share",
    purpose: { kind: "Dividend", label: "Q4 dividend run" },
    state: "Draft",
    trail: [{ who: "Noah Whitaker", at: "2026-11-24T14:00", kind: "Prepared", note: "From the board resolution of Nov 20 and the stock ledger." }],
    runId: "run-pr-q4",
    illustrative: true,
  })),
];

/** The rail the platform would use, and why. */
export function railFor(from: Account, payee: Payee, amount: number): { rail: Rail; why: string; speed: string; cutoff?: string } {
  if (payee.onPlatform) return { rail: "Book transfer", why: "Both accounts are at the partner bank.", speed: "Instant, any day" };
  if (from.currency === "BRL") {
    if (payee.country === "BR")
      return amount <= 1_000_000
        ? { rail: "Pix", why: "Domestic payment in reais.", speed: "Seconds, any day" }
        : { rail: "TED", why: "Above the Pix limit set for this account.", speed: "Same business day", cutoff: "5:00 PM Brasília" };
    return { rail: "SWIFT", why: "Payment abroad from a Brazilian account (needs an FX contract).", speed: "1–3 business days", cutoff: "2:00 PM Brasília" };
  }
  if (payee.country !== "US") return { rail: "SWIFT", why: "International payment.", speed: "1–2 business days", cutoff: "2:00 PM ET" };
  if (amount >= 100_000) return { rail: "Wire", why: "Large domestic payment: final on arrival.", speed: "Same business day", cutoff: "5:00 PM ET" };
  return { rail: "ACH", why: "Domestic payment under $100,000.", speed: "Next business day; same-day before 2:00 PM ET", cutoff: "2:00 PM ET same-day" };
}
