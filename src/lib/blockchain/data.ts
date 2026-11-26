/**
 * Blockchain Solution — tokenized share registers (prototype, simulation).
 *
 * A client's company is tokenized so its owners hold their shares, units or quotas in their own wallets. This is not
 * an offering: nothing is sold or distributed. Tokens follow the ERC-3643 model — every holder is a verified identity,
 * every transfer is checked against the company's rules, and an agent can freeze or recover tokens.
 *
 * What the token legally is depends on the jurisdiction (the legal record, or a mirror of the official register);
 * counsel confirms each case. No blockchain is connected: addresses, transactions and blocks are simulated and
 * labelled as such.
 */
import { formations } from "@/lib/formation";
import { FAMILIES, heldBy, totals } from "@/lib/wealth";

export const B_TODAY = "2026-11-24";

/* ───────── what the token is, by jurisdiction and form ───────── */

export type Treatment = "record" | "record-agreement" | "mirror";
export const TREATMENT: Record<Treatment, { label: string; short: string }> = {
  record: { label: "The token ledger is the legal share record", short: "Legal record" },
  "record-agreement": { label: "The legal record if the operating agreement adopts it", short: "Record by agreement" },
  mirror: { label: "A digital mirror of the official register", short: "Register mirror" },
};

export type Form = "corp" | "llc" | "ltda" | "exempt" | "bvi";
export function treatmentFor(jurisdiction: string, form: Form): { t: Treatment; basis: string; transferNote: string } {
  if (jurisdiction === "de" && form === "corp")
    return {
      t: "record",
      basis: "Delaware General Corporation Law §219 and §224 let a corporation keep its stock ledger on a distributed ledger.",
      transferNote: "A transfer recorded on the token ledger is the transfer of record.",
    };
  if (jurisdiction === "wy" && form === "corp")
    return {
      t: "record",
      basis: "Wyoming lets the articles of incorporation or bylaws provide that shares are represented by certificate tokens.",
      transferNote: "A transfer of the token is a transfer of the certificated share.",
    };
  if ((jurisdiction === "de" || jurisdiction === "wy") && form === "llc")
    return {
      t: "record-agreement",
      basis: "An LLC’s operating agreement can adopt the token ledger as its record of membership interests; counsel confirms the wording.",
      transferNote: "Once the operating agreement adopts the ledger, a recorded transfer is the transfer of record.",
    };
  if (jurisdiction === "br")
    return {
      t: "mirror",
      basis: "Quota transfers follow the Civil Code and the contrato social: an amendment registered at the Junta Comercial. The token mirrors the register.",
      transferNote: "The amendment is registered first; the token moves once the Junta’s registration is on file.",
    };
  if (jurisdiction === "ky")
    return {
      t: "mirror",
      basis: "The register of members kept by the company or its registered office remains the legal record; the token mirrors it.",
      transferNote: "The register of members is updated first; the token follows.",
    };
  return {
    t: "mirror",
    basis: "The company’s own register remains the legal record; the token mirrors it until counsel confirms otherwise.",
    transferNote: "The register is updated first; the token follows.",
  };
}

/* ───────── holders and identities ───────── */

export type Kyc = "Clear" | "Pending" | "Needs info";
export type Holder = {
  id: string;
  name: string;
  kind: "Individual" | "Trust" | "Company";
  country: string;
  kyc: Kyc;
  /** who controls the wallet for a trust or company */
  signer?: string;
  wallet: string | null;
  custody: "Self-custody" | "Not connected";
  units: number;
  frozen: number;
};

/** A simulated, deterministic wallet address (never a real one). */
export function simAddress(seed: string) {
  let h = 0x811c9dc5;
  let out = "";
  for (let r = 0; r < 5; r++) {
    for (const ch of `${seed}:${r}`) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
    out += h.toString(16).padStart(8, "0");
  }
  return `0x${out.slice(0, 40)}`;
}
export const shortAddr = (a: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "Not connected");

/* ───────── rules ───────── */

export type Rules = {
  /** who approves a transfer, in the company's own terms */
  approval: string;
  rofr: boolean;
  lockupUntil?: string;
  blockedCountries: string[];
  maxHolders?: number;
  /** transfers only to verified identities */
  identityRequired: true;
};

/* ───────── tokens ───────── */

export type TokenStatus = "Live" | "Ready to issue" | "Waiting for incorporation" | "Identity review";
export type Token = {
  id: string;
  symbol: string;
  company: string;
  /** where the company comes from */
  source: { kind: "formation"; ref: string } | { kind: "family"; familyId: string; entityId: string };
  clientOrg?: string;
  jurisdiction: string;
  jurisdictionName: string;
  form: Form;
  unitWord: "shares" | "units" | "quotas";
  status: TokenStatus;
  supply: number;
  holders: Holder[];
  /** the official register the token reconciles to */
  register: { name: string; units: number }[];
  rules: Rules;
  agent: string;
  issued?: string;
  /** value per unit, where a recorded valuation exists */
  valuation?: { perUnit: number; source: string; asOf: string };
  documents: { name: string; status: "Signed" | "Draft" | "Not started" | "Filed" }[];
  illustrative: string[];
};

const J_NAME: Record<string, string> = { de: "Delaware, US", wy: "Wyoming, US", fl: "Florida, US", ky: "Cayman Islands", br: "Brazil", bvi: "British Virgin Islands" };
const formation = (ref: string) => formations.find((f) => f.ref === ref)!;
const hold = (id: string, name: string, kind: Holder["kind"], country: string, units: number, kyc: Kyc = "Clear", opts: Partial<Holder> = {}): Holder => ({
  id,
  name,
  kind,
  country,
  kyc,
  wallet: kyc === "Clear" ? simAddress(id) : null,
  custody: kyc === "Clear" ? "Self-custody" : "Not connected",
  units,
  frozen: 0,
  ...opts,
});

function halvorsen(): Token {
  const fam = FAMILIES.find((f) => f.id === "halvorsen")!;
  const t = totals(fam);
  const value = heldBy(t, "hold");
  const units = 1_000_000;
  return {
    id: "tk-halvorsen-hold",
    symbol: "HHLLC",
    company: "Halvorsen Holdings LLC",
    source: { kind: "family", familyId: "halvorsen", entityId: "hold" },
    clientOrg: "halvorsen",
    jurisdiction: "de",
    jurisdictionName: J_NAME.de,
    form: "llc",
    unitWord: "units",
    status: "Live",
    supply: units,
    holders: [
      hold("h-hft", "Halvorsen Family Trust", "Trust", "United States", 950_000, "Clear", { signer: "Victoria Halvorsen, trustee", frozen: 50_000 }),
      hold("h-victoria", "Victoria Halvorsen", "Individual", "United States", 50_000),
    ],
    register: [
      { name: "Halvorsen Family Trust", units: 950_000 },
      { name: "Victoria Halvorsen", units: 50_000 },
    ],
    rules: { approval: "Manager’s written consent", rofr: true, blockedCountries: ["Sanctioned jurisdictions"], maxHolders: 25, identityRequired: true },
    agent: "Aurum Asset Management, as corporate secretary",
    issued: "2026-10-15",
    valuation: { perUnit: value / units, source: "Family office records (net value held by the company)", asOf: "2026-11-24" },
    documents: [
      { name: "Operating agreement amendment adopting the token ledger", status: "Signed" },
      { name: "Manager’s consent to issue", status: "Signed" },
      { name: "Counsel memo on the token ledger", status: "Signed" },
    ],
    illustrative: ["holders", "issued", "documents"],
  };
}

function valenca(): Token {
  return {
    id: "tk-valenca-part",
    symbol: "VPART",
    company: "Valença Participações Ltda.",
    source: { kind: "family", familyId: "valenca", entityId: "vpart" },
    clientOrg: "valenca",
    jurisdiction: "br",
    jurisdictionName: J_NAME.br,
    form: "ltda",
    unitWord: "quotas",
    status: "Live",
    supply: 10_000_000,
    holders: [
      hold("v-ricardo", "Ricardo Valença", "Individual", "Brazil", 7_000_000),
      hold("v-pedro", "Pedro Valença", "Individual", "Brazil", 3_000_000, "Clear", { frozen: 500_000 }),
    ],
    register: [
      { name: "Ricardo Valença", units: 7_000_000 },
      { name: "Pedro Valença", units: 2_500_000 },
      { name: "Marina Valença", units: 500_000 },
    ],
    rules: {
      approval: "Consent of the other quota holders (Civil Code art. 1.057, unless the contrato social provides otherwise)",
      rofr: true,
      blockedCountries: ["Sanctioned jurisdictions"],
      identityRequired: true,
    },
    agent: "Northbridge Fiduciary Partners, as administrator",
    issued: "2026-08-03",
    documents: [
      { name: "Contrato social amendment referencing the token register", status: "Filed" },
      { name: "Quota holders’ agreement", status: "Signed" },
    ],
    illustrative: ["holders", "register", "issued", "documents"],
  };
}

function fromFormation(ref: string, o: Partial<Token> & Pick<Token, "id" | "symbol" | "form" | "unitWord" | "status" | "supply" | "holders" | "rules" | "documents">): Token {
  const f = formation(ref);
  return {
    company: f.company,
    source: { kind: "formation", ref },
    jurisdiction: f.jurisdiction,
    jurisdictionName: J_NAME[f.jurisdiction] ?? f.jurisdiction,
    register: o.holders.map((h) => ({ name: h.name, units: h.units })),
    agent: "Aurum Asset Management, as corporate secretary",
    illustrative: ["holders"],
    ...o,
  };
}

export const TOKENS: Token[] = [
  halvorsen(),
  valenca(),
  fromFormation("AF-2611-015", {
    id: "tk-cascade-spv",
    symbol: "CRSPV",
    form: "llc",
    unitWord: "units",
    status: "Ready to issue",
    supply: 100_000,
    holders: [hold("c-crp", "Cascade Ridge Partners", "Company", "United States", 100_000, "Clear", { signer: "Tom Ashford", custody: "Not connected", wallet: null })],
    rules: { approval: "Managing member’s consent", rofr: false, blockedCountries: ["Sanctioned jurisdictions"], identityRequired: true },
    documents: [
      { name: "Operating agreement amendment adopting the token ledger", status: "Draft" },
      { name: "Managing member’s consent to issue", status: "Not started" },
    ],
  }),
  fromFormation("AF-2611-017", {
    id: "tk-ledgerline",
    symbol: "LDGR",
    form: "corp",
    unitWord: "shares",
    status: "Waiting for incorporation",
    supply: 10_000_000,
    holders: [
      hold("l-chen", "Laura Chen", "Individual", "United States", 6_000_000, "Clear", { custody: "Not connected", wallet: null }),
      hold("l-digital", "Ledgerline Digital Inc.", "Company", "United States", 4_000_000, "Clear", { custody: "Not connected", wallet: null }),
    ],
    rules: { approval: "Board approval", rofr: true, lockupUntil: "2027-12-31", blockedCountries: ["Sanctioned jurisdictions"], identityRequired: true },
    documents: [
      { name: "Articles providing for certificate tokens", status: "Draft" },
      { name: "Bylaws: transfer restrictions", status: "Draft" },
    ],
  }),
  fromFormation("AF-2611-016", {
    id: "tk-mazal",
    symbol: "MAZAL",
    form: "ltda",
    unitWord: "quotas",
    status: "Identity review",
    supply: 1_000_000,
    holders: [
      hold("m-ana", "Ana Mazal", "Individual", "Brazil", 500_000),
      hold("m-davi", "Davi Mazal", "Individual", "Brazil", 300_000),
      hold("m-rute", "Rute Mazal", "Individual", "Brazil", 200_000, "Needs info"),
    ],
    rules: { approval: "Consent of the other quota holders (Civil Code art. 1.057)", rofr: true, blockedCountries: ["Sanctioned jurisdictions"], identityRequired: true },
    documents: [{ name: "Contrato social amendment referencing the token register", status: "Not started" }],
  }),
  fromFormation("AF-2611-014", {
    id: "tk-strlex-feeder",
    symbol: "SBHF",
    form: "exempt",
    unitWord: "shares",
    status: "Waiting for incorporation",
    supply: 1_000,
    holders: [hold("s-strlex", "Strlex Capital Group Inc.", "Company", "United States", 1_000, "Clear", { custody: "Not connected", wallet: null })],
    rules: { approval: "Directors’ approval", rofr: false, blockedCountries: ["Sanctioned jurisdictions"], identityRequired: true },
    documents: [{ name: "Directors’ resolution adopting the token register", status: "Not started" }],
  }),
];

/** Companies the Corporate Solution and the family office know that aren't tokenized yet, with a starting cap table. */
export type Candidate = {
  key: string;
  company: string;
  jurisdiction: string;
  form: Form;
  client: string;
  clientOrg?: string;
  stage: string;
  incorporated: boolean;
  kyc: Kyc;
  holders: { name: string; kind: Holder["kind"]; country: string; pct: number }[];
};
export function candidates(tokenized: string[]): Candidate[] {
  const taken = (name: string) => TOKENS.some((t) => t.company === name) || tokenized.includes(name);
  const fromForms = formations
    .filter((f) => !taken(f.company))
    .map((f): Candidate => ({
      key: f.ref,
      company: f.company,
      jurisdiction: f.jurisdiction,
      form: f.type === "corp" ? "corp" : f.type === "llc" ? "llc" : f.type === "ltda" ? "ltda" : "exempt",
      client: f.client,
      stage: f.stage,
      incorporated: f.stage === "Incorporated" || f.stage === "Post-formation",
      kyc: f.kyc === "Clear" ? "Clear" : f.kyc === "Pending" ? "Pending" : "Needs info",
      holders: [{ name: f.client, kind: "Company", country: f.jurisdiction === "br" ? "Brazil" : "United States", pct: 100 }],
    }));
  const fromFamilies = FAMILIES.flatMap((fam) =>
    fam.entities
      .filter((e) => e.kind === "Holding company" && !taken(e.name))
      .map((e): Candidate => {
        const parent = fam.entities.find((x) => x.id === e.parent);
        const j = e.where.includes("Delaware") ? "de" : e.where.includes("Cayman") ? "ky" : e.where.includes("Virgin") ? "bvi" : e.where.includes("Brazil") ? "br" : "fl";
        return {
          key: `${fam.id}/${e.id}`,
          company: e.name,
          jurisdiction: j,
          form: e.name.endsWith("LLC") ? "llc" : e.name.endsWith("Ltda.") ? "ltda" : j === "bvi" ? "bvi" : "exempt",
          client: fam.name,
          clientOrg: fam.id,
          stage: "Administered",
          incorporated: true,
          kyc: "Clear",
          holders: [
            parent
              ? { name: parent.name, kind: parent.kind === "Trust" ? "Trust" : "Company", country: "United States", pct: e.pct ?? 100 }
              : { name: fam.people[0].name, kind: "Individual", country: j === "br" ? "Brazil" : "United States", pct: 100 },
          ],
        };
      }),
  );
  return [...fromFamilies, ...fromForms];
}
export const jurisdictionName = (id: string) => J_NAME[id] ?? id;

/* ───────── transfers ───────── */

export type StepId = "identity" | "approval" | "agreement" | "register" | "chain";
export type Step = { id: StepId; label: string; state: "done" | "waiting" | "blocked" | "skipped"; note?: string; by?: string; at?: string };
export type Transfer = {
  id: string;
  tokenId: string;
  kind: "Private sale" | "Gift" | "Estate planning" | "Wallet recovery";
  fromId: string;
  to: { name: string; kind: Holder["kind"]; country: string; kyc: Kyc; existingId?: string };
  units: number;
  requested: string;
  requestedBy: string;
  steps: Step[];
  status: "In progress" | "Completed" | "Rejected";
  note?: string;
  illustrative?: boolean;
};

/** The steps a transfer goes through, in the company's own order. */
export function stepsFor(t: Token): Step[] {
  const tr = treatmentFor(t.jurisdiction, t.form);
  return [
    { id: "identity", label: "Recipient’s identity verified by Compliance", state: "waiting" },
    { id: "approval", label: `${t.rules.approval}${t.rules.rofr ? ", after the right of first refusal" : ""}`, state: "waiting" },
    { id: "agreement", label: "Transfer agreement signed by both parties", state: "waiting" },
    tr.t === "mirror"
      ? { id: "register", label: t.jurisdiction === "br" ? "Amendment registered at the Junta Comercial" : "Official register updated", state: "waiting" }
      : { id: "register", label: "Recorded on the token ledger (the register of record)", state: "skipped", note: "The token ledger is the record." },
    { id: "chain", label: "Tokens move between wallets", state: "waiting" },
  ];
}

export const SEED_TRANSFERS: Transfer[] = [
  {
    id: "tr-hhllc-erik",
    tokenId: "tk-halvorsen-hold",
    kind: "Estate planning",
    fromId: "h-hft",
    to: { name: "Erik Halvorsen", kind: "Individual", country: "United States", kyc: "Clear" },
    units: 50_000,
    requested: "2026-11-20",
    requestedBy: "Victoria Halvorsen",
    steps: [
      { id: "identity", label: "Recipient’s identity verified by Compliance", state: "done", by: "Carla Nogueira", at: "2026-11-21" },
      { id: "approval", label: "Manager’s written consent, after the right of first refusal", state: "waiting" },
      { id: "agreement", label: "Transfer agreement signed by both parties", state: "waiting" },
      { id: "register", label: "Recorded on the token ledger (the register of record)", state: "skipped", note: "The operating agreement adopts the token ledger." },
      { id: "chain", label: "Tokens move between wallets", state: "waiting" },
    ],
    status: "In progress",
    illustrative: true,
  },
  {
    id: "tr-vpart-marina",
    tokenId: "tk-valenca-part",
    kind: "Private sale",
    fromId: "v-pedro",
    to: { name: "Marina Valença", kind: "Individual", country: "Brazil", kyc: "Clear" },
    units: 500_000,
    requested: "2026-11-10",
    requestedBy: "Pedro Valença",
    steps: [
      { id: "identity", label: "Recipient’s identity verified by Compliance", state: "done", by: "Carla Nogueira", at: "2026-11-11" },
      { id: "approval", label: "Consent of the other quota holders, after the right of first refusal", state: "done", by: "Ricardo Valença", at: "2026-11-14" },
      { id: "agreement", label: "Transfer agreement signed by both parties", state: "done", at: "2026-11-17" },
      { id: "register", label: "Amendment registered at the Junta Comercial", state: "done", at: "2026-11-21", note: "Register updated; the token hasn’t moved yet." },
      { id: "chain", label: "Tokens move between wallets", state: "blocked", note: "The recipient hasn’t connected a wallet." },
    ],
    status: "In progress",
    note: "The quotas are frozen on Pedro’s wallet while the transfer completes.",
    illustrative: true,
  },
];

/* ───────── the simulated ledger ───────── */

export type LedgerEvent = {
  id: string;
  tokenId: string;
  at: string;
  kind: "Issued" | "Transferred" | "Frozen" | "Unfrozen" | "Recovered" | "Paused";
  from?: string;
  to?: string;
  units?: number;
  hash: string;
  block: number;
  by: string;
};
export const simHash = (seed: string) => `0x${simAddress(`tx:${seed}`).slice(2)}${simAddress(`tx2:${seed}`).slice(2, 26)}`;

export const SEED_EVENTS: LedgerEvent[] = [
  {
    id: "e1",
    tokenId: "tk-halvorsen-hold",
    at: "2026-10-15T15:02:00",
    kind: "Issued",
    to: "Halvorsen Family Trust",
    units: 950_000,
    hash: simHash("e1"),
    block: 18_204_551,
    by: "Aurum (agent)",
  },
  {
    id: "e2",
    tokenId: "tk-halvorsen-hold",
    at: "2026-10-15T15:02:00",
    kind: "Issued",
    to: "Victoria Halvorsen",
    units: 50_000,
    hash: simHash("e2"),
    block: 18_204_551,
    by: "Aurum (agent)",
  },
  {
    id: "e3",
    tokenId: "tk-valenca-part",
    at: "2026-08-03T13:40:00",
    kind: "Issued",
    to: "Ricardo Valença",
    units: 7_000_000,
    hash: simHash("e3"),
    block: 17_655_120,
    by: "Northbridge (agent)",
  },
  {
    id: "e4",
    tokenId: "tk-valenca-part",
    at: "2026-08-03T13:40:00",
    kind: "Issued",
    to: "Pedro Valença",
    units: 3_000_000,
    hash: simHash("e4"),
    block: 17_655_120,
    by: "Northbridge (agent)",
  },
  {
    id: "e5",
    tokenId: "tk-valenca-part",
    at: "2026-11-10T18:12:00",
    kind: "Frozen",
    from: "Pedro Valença",
    units: 500_000,
    hash: simHash("e5"),
    block: 18_390_004,
    by: "Northbridge (agent)",
  },
];

/* ───────── checks ───────── */

export type Check = { rule: string; pass: boolean; reason: string };

/** Would this transfer pass the token's rules? Every rule says why, in plain words. */
export function checkTransfer(
  t: Token,
  fromId: string,
  to: { name: string; country: string; kyc: Kyc; existingId?: string; walletConnected: boolean },
  units: number,
  approved = false,
): Check[] {
  const from = t.holders.find((h) => h.id === fromId);
  const available = from ? from.units - from.frozen : 0;
  const newHolder = !to.existingId;
  const holdersAfter = t.holders.filter((h) => h.units > 0).length + (newHolder ? 1 : 0) - (from && units === from.units ? 1 : 0);
  const out: Check[] = [
    {
      rule: "Verified identity",
      pass: to.kyc === "Clear",
      reason:
        to.kyc === "Clear" ? `${to.name} is verified by Compliance.` : `${to.name} isn’t verified yet (KYC ${to.kyc.toLowerCase()}); tokens can only reach verified identities.`,
    },
    {
      rule: "Available balance",
      pass: !!from && units > 0 && units <= available,
      reason: !from
        ? "Choose who is transferring."
        : units <= 0
          ? "Enter how many to transfer."
          : units <= available
            ? `${from.name} has ${available.toLocaleString("en-US")} available${from.frozen ? ` (${from.frozen.toLocaleString("en-US")} frozen)` : ""}.`
            : `${from.name} has only ${available.toLocaleString("en-US")} available${from.frozen ? `; ${from.frozen.toLocaleString("en-US")} are frozen` : ""}.`,
    },
    {
      rule: "Country",
      pass: !/iran|north korea|syria|cuba|russia/i.test(to.country),
      reason: /iran|north korea|syria|cuba|russia/i.test(to.country) ? `${to.country} is on the blocked list.` : `${to.country} isn’t restricted.`,
    },
    {
      rule: "Company approval",
      pass: approved,
      reason: approved
        ? `${t.rules.approval} is on file.`
        : `Needs ${t.rules.approval.charAt(0).toLowerCase()}${t.rules.approval.slice(1)}${t.rules.rofr ? " after the other holders’ right of first refusal" : ""}. Transfers go through a request, never directly.`,
    },
    {
      rule: "Wallet",
      pass: to.walletConnected,
      reason: to.walletConnected ? "The recipient’s wallet is connected and bound to their identity." : "The recipient hasn’t connected a wallet yet.",
    },
  ];
  if (t.rules.lockupUntil)
    out.push({
      rule: "Lock-up",
      pass: B_TODAY > t.rules.lockupUntil,
      reason: B_TODAY > t.rules.lockupUntil ? "The lock-up has ended." : `Transfers are locked until ${t.rules.lockupUntil}.`,
    });
  if (t.rules.maxHolders)
    out.push({
      rule: "Maximum holders",
      pass: holdersAfter <= t.rules.maxHolders,
      reason: `${holdersAfter} holder${holdersAfter === 1 ? "" : "s"} after the transfer; the limit is ${t.rules.maxHolders}.`,
    });
  return out;
}

/** The rules in plain English, as the owner and the company read them. */
export function rulesText(t: Token): string[] {
  const tr = treatmentFor(t.jurisdiction, t.form);
  return [
    `Only people and entities verified by Compliance can hold ${t.symbol}. Each wallet is bound to one verified identity.`,
    `Every transfer needs ${t.rules.approval.charAt(0).toLowerCase()}${t.rules.approval.slice(1)}${t.rules.rofr ? ", after the other holders have had the chance to buy first" : ""}.`,
    tr.transferNote,
    ...(t.rules.lockupUntil ? [`No transfers until ${t.rules.lockupUntil}.`] : []),
    ...(t.rules.maxHolders ? [`No more than ${t.rules.maxHolders} holders at any time.`] : []),
    "No transfers to sanctioned jurisdictions or people.",
    `If a holder loses access to their wallet, ${t.agent.split(",")[0]} can move their ${t.unitWord} to a new verified wallet after checking their identity and getting approval.`,
    `Nothing is offered or sold through this token. A sale to new investors goes through a licensed venue or an offering, never this register.`,
  ];
}
