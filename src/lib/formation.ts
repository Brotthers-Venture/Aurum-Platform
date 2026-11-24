/**
 * Company formation — the Corporate Solution's client onboarding. A client picks a jurisdiction and entity type,
 * proposes names, sets up ownership and management, completes identity checks, chooses services and pays.
 * Fees below are Aurum's illustrative schedule; government fees are estimates and confirmed at filing.
 */

export type EntityType = {
  id: string;
  name: string;
  short: string;
  about: string;
  govFee: number;
  days: string;
  suffixes: string[];
  units: "shares" | "units" | "interests" | "quotas";
};
export type Jurisdiction = { id: string; name: string; region: string; code: string; about: string; serviceFee: number; us: boolean; offshore: boolean; types: EntityType[] };

export const jurisdictions: Jurisdiction[] = [
  {
    id: "de",
    name: "Delaware",
    region: "United States",
    code: "US-DE",
    about: "Default for venture-backed companies and fund vehicles; specialised business court.",
    serviceFee: 450,
    us: true,
    offshore: false,
    types: [
      {
        id: "llc",
        name: "Limited liability company",
        short: "LLC",
        about: "Flexible governance, pass-through tax by default.",
        govFee: 110,
        days: "1–3 business days",
        suffixes: ["LLC", "L.L.C."],
        units: "units",
      },
      {
        id: "corp",
        name: "C corporation",
        short: "Inc.",
        about: "Preferred by institutional investors; issues stock and options.",
        govFee: 109,
        days: "1–3 business days",
        suffixes: ["Inc.", "Corp.", "Corporation"],
        units: "shares",
      },
      {
        id: "lp",
        name: "Limited partnership",
        short: "LP",
        about: "Classic fund structure with a general partner and limited partners.",
        govFee: 200,
        days: "2–4 business days",
        suffixes: ["LP", "L.P."],
        units: "interests",
      },
    ],
  },
  {
    id: "wy",
    name: "Wyoming",
    region: "United States",
    code: "US-WY",
    about: "Low annual cost and strong privacy for holding companies.",
    serviceFee: 350,
    us: true,
    offshore: false,
    types: [
      {
        id: "llc",
        name: "Limited liability company",
        short: "LLC",
        about: "Low-cost holding or operating entity.",
        govFee: 100,
        days: "1–2 business days",
        suffixes: ["LLC"],
        units: "units",
      },
      {
        id: "corp",
        name: "Corporation",
        short: "Inc.",
        about: "Stock corporation with a simple annual report.",
        govFee: 100,
        days: "1–2 business days",
        suffixes: ["Inc.", "Corp."],
        units: "shares",
      },
    ],
  },
  {
    id: "fl",
    name: "Florida",
    region: "United States",
    code: "US-FL",
    about: "Close to Aurum’s Orlando office; suits operating businesses based in the state.",
    serviceFee: 350,
    us: true,
    offshore: false,
    types: [
      {
        id: "llc",
        name: "Limited liability company",
        short: "LLC",
        about: "Operating company with members and managers.",
        govFee: 125,
        days: "2–5 business days",
        suffixes: ["LLC"],
        units: "units",
      },
      {
        id: "corp",
        name: "Profit corporation",
        short: "Inc.",
        about: "Stock corporation for operating businesses.",
        govFee: 70,
        days: "2–5 business days",
        suffixes: ["Inc.", "Corp."],
        units: "shares",
      },
    ],
  },
  {
    id: "ky",
    name: "Cayman Islands",
    region: "Caribbean",
    code: "KY",
    about: "Leading domicile for offshore funds and feeder vehicles.",
    serviceFee: 2400,
    us: false,
    offshore: true,
    types: [
      {
        id: "exempt",
        name: "Exempted company",
        short: "Ltd.",
        about: "Standard offshore company for holding and fund use.",
        govFee: 850,
        days: "3–5 business days",
        suffixes: ["Ltd.", "Limited"],
        units: "shares",
      },
      {
        id: "elp",
        name: "Exempted limited partnership",
        short: "LP",
        about: "Partnership vehicle for closed-ended funds.",
        govFee: 1500,
        days: "3–5 business days",
        suffixes: ["LP", "L.P."],
        units: "interests",
      },
    ],
  },
  {
    id: "vg",
    name: "British Virgin Islands",
    region: "Caribbean",
    code: "VG",
    about: "Cost-effective holding companies with a light reporting load.",
    serviceFee: 1900,
    us: false,
    offshore: true,
    types: [
      {
        id: "bc",
        name: "BVI business company",
        short: "Ltd.",
        about: "Holding company with a single-tier board.",
        govFee: 550,
        days: "2–4 business days",
        suffixes: ["Ltd.", "Limited", "Corp."],
        units: "shares",
      },
    ],
  },
  {
    id: "br",
    name: "Brazil",
    region: "Latin America",
    code: "BR",
    about: "Local operating companies and SPEs for Brazilian projects.",
    serviceFee: 1800,
    us: false,
    offshore: false,
    types: [
      {
        id: "ltda",
        name: "Sociedade limitada",
        short: "Ltda.",
        about: "Most common Brazilian company; quota holders and administrators.",
        govFee: 250,
        days: "10–25 business days",
        suffixes: ["Ltda."],
        units: "quotas",
      },
      {
        id: "sa",
        name: "Sociedade anônima (closely held)",
        short: "S.A.",
        about: "Share company suited to larger structures and SPEs.",
        govFee: 400,
        days: "15–30 business days",
        suffixes: ["S.A."],
        units: "shares",
      },
    ],
  },
];

export type Service = { id: string; name: string; about: string; price: number; per: "once" | "year"; required?: boolean; only?: "us" | "offshore" | "non-us" };
export const services: Service[] = [
  { id: "agent", name: "Registered agent and office", about: "Statutory address and service of process. First year included.", price: 0, per: "year", required: true },
  { id: "docs", name: "Governing documents", about: "Operating agreement, bylaws or articles drafted to your ownership.", price: 450, per: "once" },
  { id: "ein", name: "Federal tax ID (EIN)", about: "We apply to the IRS and send you the confirmation letter.", price: 150, per: "once", only: "us" },
  { id: "taxid", name: "Local tax registration", about: "Tax registration with the local authority after formation.", price: 400, per: "once", only: "non-us" },
  { id: "register", name: "Ownership and officer registers", about: "Members, directors and beneficial owner registers kept current.", price: 250, per: "year" },
  { id: "bank", name: "Bank account introduction", about: "We prepare the bank’s onboarding pack and introduce you.", price: 350, per: "once" },
  { id: "mail", name: "Mail handling", about: "Mail received at the registered office, scanned the same day.", price: 300, per: "year" },
  { id: "substance", name: "Economic substance filing", about: "Annual notification and report required for offshore entities.", price: 600, per: "year", only: "offshore" },
  { id: "compliance", name: "Annual compliance plan", about: "Annual reports, franchise tax and filing calendar handled for you.", price: 650, per: "year" },
  { id: "express", name: "Priority filing", about: "Same-day submission once identity checks clear.", price: 250, per: "once" },
];
export const servicesFor = (j?: Jurisdiction) => services.filter((s) => !s.only || (s.only === "us" ? j?.us : s.only === "offshore" ? j?.offshore : !j?.us));

export type Person = {
  id: string;
  kind: "individual" | "company";
  name: string;
  email: string;
  country: string;
  director: boolean;
  officer: boolean;
  owner: boolean;
  pct: number;
  title: string;
  idDoc?: string;
  addressDoc?: string;
  pep?: "yes" | "no";
};

export type Draft = {
  step: number;
  email: string;
  consent: boolean;
  updates: boolean;
  jurisdiction?: string;
  entityType?: string;
  name: string;
  alt1: string;
  alt2: string;
  suffix: string;
  purpose: string;
  activity: string;
  addressMode: "agent" | "own";
  address: string;
  units: number;
  par: string;
  people: Person[];
  funds: string;
  fundsNote: string;
  services: string[];
  pay: "wire" | "card";
  ref?: string;
  submittedAt?: string;
};

export const blankDraft = (): Draft => ({
  step: 0,
  email: "",
  consent: false,
  updates: false,
  name: "",
  alt1: "",
  alt2: "",
  suffix: "",
  purpose: "Holding company",
  activity: "",
  addressMode: "agent",
  address: "",
  units: 1000,
  par: "0.0001",
  people: [],
  funds: "",
  fundsNote: "",
  services: ["agent", "docs", "register"],
  pay: "wire",
});

export const jurisdictionOf = (d: Draft) => jurisdictions.find((j) => j.id === d.jurisdiction);
export const typeOf = (d: Draft) => jurisdictionOf(d)?.types.find((t) => t.id === d.entityType);
export const beneficialOwners = (d: Draft) => d.people.filter((p) => p.owner && p.pct >= 25);
/** People who must pass identity checks: beneficial owners (25%+), directors/managers and officers. */
export const checkedPeople = (d: Draft) => d.people.filter((p) => (p.owner && p.pct >= 25) || p.director || p.officer);

export function quote(d: Draft) {
  const j = jurisdictionOf(d);
  const t = typeOf(d);
  const lines: { label: string; amount: number; note?: string }[] = [];
  if (j && t) {
    lines.push({ label: `Formation — ${t.short}, ${j.name}`, amount: j.serviceFee });
    lines.push({ label: "Government filing fee", amount: t.govFee, note: "estimate" });
  }
  const chosen = servicesFor(j).filter((s) => d.services.includes(s.id));
  for (const s of chosen) if (s.price) lines.push({ label: s.name, amount: s.price, note: s.per === "year" ? "first year" : undefined });
  const today = lines.reduce((a, l) => a + l.amount, 0);
  const yearly = chosen.filter((s) => s.per === "year").reduce((a, s) => a + s.price, 0) + (j ? (j.offshore ? 1200 : 300) : 0);
  return { lines, today, yearly };
}

/** Indicative name check until the registry lookup is connected. */
const TAKEN = ["aurum", "atlas", "summit", "pinnacle", "apex", "blackrock", "vanguard", "meridian"];
const RESTRICTED = ["bank", "trust", "insurance", "assurance", "reserve", "federal", "university"];
export function nameCheck(name: string): { state: "empty" | "ok" | "taken" | "restricted"; note: string } {
  const n = name.trim().toLowerCase();
  if (n.length < 3) return { state: "empty", note: "" };
  const words = n.split(/\s+/);
  const r = RESTRICTED.find((w) => words.includes(w));
  if (r) return { state: "restricted", note: `“${r}” needs regulator consent in most jurisdictions.` };
  if (TAKEN.includes(words[0])) return { state: "taken", note: "A similar name is already on the register." };
  return { state: "ok", note: "Looks available. We confirm with the registry before filing." };
}

export const STEPS = ["Start", "Jurisdiction", "Company", "People", "Identity", "Services", "Review"] as const;

/* ───────────────────────── admin pipeline ───────────────────────── */

export const STAGES = ["Received", "Identity review", "Name reserved", "Filed", "Incorporated", "Post-formation"] as const;
export type Stage = (typeof STAGES)[number];
export type Formation = {
  ref: string;
  company: string;
  jurisdiction: string;
  type: string;
  client: string;
  contact: string;
  email: string;
  submitted: string;
  stage: Stage;
  owners: number;
  kyc: "Clear" | "Pending" | "Needs info";
  total: number;
  services: string[];
  note?: string;
  local?: boolean;
};

export const formations: Formation[] = [
  {
    ref: "AF-2611-014",
    company: "Strlex Brazil Housing Feeder Ltd.",
    jurisdiction: "ky",
    type: "exempt",
    client: "Strlex Capital",
    contact: "Darci Welter",
    email: "darci@strlexcapital.com",
    submitted: "2026-11-18",
    stage: "Filed",
    owners: 2,
    kyc: "Clear",
    total: 5850,
    services: ["agent", "docs", "register", "substance", "compliance"],
  },
  {
    ref: "AF-2611-015",
    company: "Cascade Ridge SPV I LLC",
    jurisdiction: "de",
    type: "llc",
    client: "Cascade Ridge Partners",
    contact: "Tom Ashford",
    email: "tom@cascaderidge.com",
    submitted: "2026-11-19",
    stage: "Incorporated",
    owners: 1,
    kyc: "Clear",
    total: 1410,
    services: ["agent", "docs", "ein", "register"],
  },
  {
    ref: "AF-2611-016",
    company: "Mazal Empreendimentos SPE Ltda.",
    jurisdiction: "br",
    type: "ltda",
    client: "Mazal Group",
    contact: "Ana Mazal",
    email: "ana@mazalgroup.com.br",
    submitted: "2026-11-20",
    stage: "Identity review",
    owners: 3,
    kyc: "Needs info",
    total: 3100,
    services: ["agent", "docs", "taxid", "register"],
    note: "Proof of address for one quota holder is older than 3 months.",
  },
  {
    ref: "AF-2611-017",
    company: "Ledgerline Holdings Corp.",
    jurisdiction: "wy",
    type: "corp",
    client: "Ledgerline Digital",
    contact: "Laura Chen",
    email: "laura@ledgerline.io",
    submitted: "2026-11-22",
    stage: "Name reserved",
    owners: 2,
    kyc: "Clear",
    total: 1150,
    services: ["agent", "docs", "ein", "mail"],
  },
  {
    ref: "AF-2611-018",
    company: "Altamira Orlando Properties LLC",
    jurisdiction: "fl",
    type: "llc",
    client: "Altamira Holdings",
    contact: "Priscila Nunes",
    email: "priscila@altamira.com",
    submitted: "2026-11-24",
    stage: "Received",
    owners: 2,
    kyc: "Pending",
    total: 1725,
    services: ["agent", "docs", "ein", "bank", "compliance"],
  },
];

const KEY = "aurum-formations";
const DRAFT = "aurum-formation-draft";
export function localFormations(): Formation[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Formation[];
  } catch {
    return [];
  }
}
export function saveFormation(f: Formation) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...localFormations().filter((x) => x.ref !== f.ref), f]));
  } catch {
    /* storage unavailable */
  }
}
export function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT);
    return raw ? ({ ...blankDraft(), ...JSON.parse(raw) } as Draft) : null;
  } catch {
    return null;
  }
}
export function storeDraft(d: Draft | null) {
  try {
    if (d) window.localStorage.setItem(DRAFT, JSON.stringify(d));
    else window.localStorage.removeItem(DRAFT);
  } catch {
    /* storage unavailable */
  }
}
export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
