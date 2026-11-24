import { buildBooks, partnerNav, type Alloc, type CallRecord, type DistributionRecord } from "./accounting/engine";
/**
 * Mock data for the skeleton. Every shape here mirrors a future Supabase table
 * so the UI can be switched to live queries without restructuring pages.
 */

export type Currency = "USD" | "BRL";

export type Fund = {
  id: string;
  /** the GP client this vehicle belongs to (white-label brand) */
  gpId: string;
  /** true until the LPA review has been approved — terms below are not yet set */
  economicsPending?: boolean;
  name: string;
  shortName: string;
  legalForm: string;
  domicile: string;
  currency: Currency;
  vintage: number;
  strategy: string;
  status: "Fundraising" | "Investing" | "Harvesting" | "Fully called";
  targetSize: number;
  gp: string;
  manager: string;
  managementFee: string;
  carry: string;
  hurdle: string;
  term: string;
  firstClose: string;
  finalClose: string | null;
  auditor: string;
  bank: string;
  coAdministrator?: string;
  /** waterfall terms */
  hurdleRate: number;
  carryRate: number;
};

export const FX_BRL_USD = 5.4; // reporting rate for consolidated USD figures

export const funds: Fund[] = [
  {
    id: "cordillera-infra-i",
    gpId: "cordillera",
    name: "Cordillera Infrastructure Partners I, LP",
    shortName: "Cordillera Infrastructure I",
    legalForm: "Delaware limited partnership",
    domicile: "Delaware, US",
    currency: "USD",
    vintage: 2023,
    strategy: "Infrastructure",
    status: "Investing",
    targetSize: 250_000_000,
    gp: "Cordillera Infrastructure GP I, LLC",
    manager: "Cordillera Infrastructure Advisors",
    managementFee: "1.75% on commitments",
    carry: "20%",
    hurdle: "8% preferred return",
    term: "10 years + 2 × 1-year extensions",
    firstClose: "2023-03-15",
    finalClose: "2024-03-15",
    auditor: "Grant Thornton LLP",
    bank: "City National Bank",
    hurdleRate: 0.08,
    carryRate: 0.2,
  },
  {
    id: "atlantico-vp-ii",
    gpId: "atlantico",
    name: "Atlântico Venture Partners II, L.P.",
    shortName: "Atlântico Venture II",
    legalForm: "Cayman Islands exempted limited partnership",
    domicile: "Cayman Islands",
    currency: "USD",
    vintage: 2025,
    strategy: "Venture capital",
    status: "Fundraising",
    targetSize: 150_000_000,
    gp: "Atlântico GP II Ltd.",
    manager: "Atlântico Capital Gestão",
    managementFee: "2.00% on commitments",
    carry: "20%",
    hurdle: "None",
    term: "10 years + 2 × 1-year extensions",
    firstClose: "2025-09-30",
    finalClose: null,
    auditor: "KPMG Cayman",
    bank: "Butterfield Bank (Cayman)",
    hurdleRate: 0,
    carryRate: 0.2,
  },
  {
    id: "serra-re-spv",
    gpId: "serra",
    name: "Serra Real Estate Co-Invest SPV, Ltd.",
    shortName: "Serra RE Co-Invest SPV",
    legalForm: "BVI business company",
    domicile: "British Virgin Islands",
    currency: "USD",
    vintage: 2024,
    strategy: "Real estate co-investment",
    status: "Fully called",
    targetSize: 40_000_000,
    gp: "Serra SPV Director Ltd.",
    manager: "Serra Partners",
    managementFee: "1.00% on invested capital",
    carry: "15%",
    hurdle: "7% preferred return",
    term: "5 years",
    firstClose: "2024-06-01",
    finalClose: "2024-06-01",
    auditor: "BDO",
    bank: "Bank of Butterfield",
    hurdleRate: 0.07,
    carryRate: 0.15,
  },
  {
    id: "fip-horizonte",
    gpId: "horizonte",
    name: "FIP Horizonte Infraestrutura Multiestratégia",
    shortName: "FIP Horizonte",
    legalForm: "Fundo de Investimento em Participações (CVM 175)",
    domicile: "São Paulo, Brazil",
    currency: "BRL",
    vintage: 2022,
    strategy: "Infrastructure",
    status: "Harvesting",
    targetSize: 450_000_000,
    gp: "Horizonte Gestão de Recursos Ltda.",
    manager: "Horizonte Gestão de Recursos Ltda.",
    managementFee: "1.50% on committed capital",
    carry: "20%",
    hurdle: "IPCA + 6%",
    term: "8 years",
    firstClose: "2022-05-10",
    finalClose: "2023-05-10",
    auditor: "PwC Brasil",
    bank: "Itaú Unibanco",
    coAdministrator: "MF Pepper (CVM-authorized administrator)",
    hurdleRate: 0.06,
    carryRate: 0.2,
  },
  {
    id: "meridian-cvc",
    gpId: "meridian",
    name: "Meridian Corporate Venture Fund, LP",
    shortName: "Meridian CVC",
    legalForm: "Delaware limited partnership",
    domicile: "Delaware, US",
    currency: "USD",
    vintage: 2024,
    strategy: "Corporate venture capital",
    status: "Investing",
    targetSize: 75_000_000,
    gp: "Meridian Ventures GP, LLC",
    manager: "Meridian Industrial Holdings",
    managementFee: "Fee-free (sponsor-funded)",
    carry: "10%",
    hurdle: "None",
    term: "12 years",
    firstClose: "2024-01-22",
    finalClose: "2024-11-30",
    auditor: "Deloitte & Touche LLP",
    bank: "J.P. Morgan Chase",
    hurdleRate: 0,
    carryRate: 0.1,
  },
  {
    id: "stx-achor",
    gpId: "strlex",
    economicsPending: true,
    name: "STX-Achor Capital Formation Fund, LP",
    shortName: "STX-Achor Capital Formation",
    legalForm: "Limited partnership",
    domicile: "Delaware, US",
    currency: "USD",
    vintage: 2025,
    strategy: "Capital formation",
    status: "Investing",
    targetSize: 75_000_000,
    gp: "Strlex Capital Group Inc.",
    manager: "Strlex Capital Group Inc.",
    managementFee: "Pending LPA review",
    carry: "Pending LPA review",
    hurdle: "Pending LPA review",
    term: "Pending LPA review",
    firstClose: "2025-06-30",
    finalClose: null,
    auditor: "Pending LPA review",
    bank: "City National Bank",
    hurdleRate: 0,
    carryRate: 0,
  },
  {
    id: "stx-brazil-housing",
    gpId: "strlex",
    economicsPending: true,
    name: "STX-Brazil Affordable Housing Fund I, LP",
    shortName: "STX-Brazil Affordable Housing I",
    legalForm: "Limited partnership",
    domicile: "Delaware, US",
    currency: "USD",
    vintage: 2024,
    strategy: "Affordable housing — Brazil",
    status: "Investing",
    targetSize: 60_000_000,
    gp: "Strlex Capital Group Inc.",
    manager: "Strlex Capital Group Inc.",
    managementFee: "Pending LPA review",
    carry: "Pending LPA review",
    hurdle: "Pending LPA review",
    term: "Pending LPA review",
    firstClose: "2024-09-30",
    finalClose: null,
    auditor: "Pending LPA review",
    bank: "City National Bank",
    coAdministrator: "MF Pepper (Brazilian property-level administration)",
    hurdleRate: 0,
    carryRate: 0,
  },
  {
    id: "stx-global",
    gpId: "strlex",
    economicsPending: true,
    name: "Strlex Global Engind Fund LP",
    shortName: "Strlex Global Engind",
    legalForm: "Limited partnership",
    domicile: "Delaware, US",
    currency: "USD",
    vintage: 2026,
    strategy: "Global",
    status: "Fundraising",
    targetSize: 150_000_000,
    gp: "Strlex Capital Group Inc.",
    manager: "Strlex Capital Group Inc.",
    managementFee: "Pending LPA review",
    carry: "Pending LPA review",
    hurdle: "Pending LPA review",
    term: "Pending LPA review",
    firstClose: "2026-06-30",
    finalClose: null,
    auditor: "Pending LPA review",
    bank: "City National Bank",
    hurdleRate: 0,
    carryRate: 0,
  },
];

export type InvestorType =
  | "Individual"
  | "Joint"
  | "Trust"
  | "Corporation"
  | "LLC"
  | "Pension plan"
  | "Endowment"
  | "Foundation"
  | "Insurance company"
  | "Fund of funds"
  | "Family office";

export type Investor = {
  id: string;
  name: string;
  type: InvestorType;
  jurisdiction: string;
  taxForm: "W-9" | "W-8BEN" | "W-8BEN-E" | "W-8IMY";
  kyc: "Clear" | "Under review" | "Expiring" | "Pending";
  contact: string;
  email: string;
  relationshipManager: string;
};

export const investors: Investor[] = [
  { id: "inv-calloway", name: "Calloway Family Trust", type: "Trust", jurisdiction: "Florida, US", taxForm: "W-9", kyc: "Clear", contact: "Margaret Calloway", email: "m.calloway@callowaytrust.com", relationshipManager: "L. Andrade" },
  { id: "inv-brightwater", name: "Brightwater Municipal Pension Plan", type: "Pension plan", jurisdiction: "Ohio, US", taxForm: "W-9", kyc: "Clear", contact: "Daniel Okafor", email: "dokafor@brightwaterpension.org", relationshipManager: "R. Mendes" },
  { id: "inv-ferreira", name: "Ferreira Holdings Ltd.", type: "Corporation", jurisdiction: "British Virgin Islands", taxForm: "W-8BEN-E", kyc: "Clear", contact: "Paulo Ferreira", email: "paulo@ferreiraholdings.com", relationshipManager: "L. Andrade" },
  { id: "inv-northgate", name: "Northgate University Endowment", type: "Endowment", jurisdiction: "Massachusetts, US", taxForm: "W-9", kyc: "Clear", contact: "Susan Whitfield", email: "swhitfield@northgate.edu", relationshipManager: "R. Mendes" },
  { id: "inv-prado", name: "Helena M. Prado", type: "Individual", jurisdiction: "São Paulo, Brazil", taxForm: "W-8BEN", kyc: "Expiring", contact: "Helena Prado", email: "helena.prado@uol.com.br", relationshipManager: "L. Andrade" },
  { id: "inv-lakeshore", name: "Lakeshore Capital Partners LLC", type: "LLC", jurisdiction: "Illinois, US", taxForm: "W-9", kyc: "Clear", contact: "Kevin Marsh", email: "kmarsh@lakeshorecp.com", relationshipManager: "J. Teixeira" },
  { id: "inv-vasconcelos", name: "Vasconcelos Family Office", type: "Family office", jurisdiction: "Cayman Islands", taxForm: "W-8BEN-E", kyc: "Clear", contact: "Ricardo Vasconcelos", email: "rv@vasconcelosfo.com", relationshipManager: "L. Andrade" },
  { id: "inv-ridgeway", name: "Ridgeway Mutual Insurance Co.", type: "Insurance company", jurisdiction: "Connecticut, US", taxForm: "W-9", kyc: "Clear", contact: "Amelia Grant", email: "agrant@ridgewaymutual.com", relationshipManager: "J. Teixeira" },
  { id: "inv-monteiro", name: "Ana & Rafael Monteiro", type: "Joint", jurisdiction: "Florida, US", taxForm: "W-9", kyc: "Under review", contact: "Rafael Monteiro", email: "rafael.monteiro@gmail.com", relationshipManager: "R. Mendes" },
  { id: "inv-corbel", name: "Corbel Fund of Funds IV, L.P.", type: "Fund of funds", jurisdiction: "Delaware, US", taxForm: "W-9", kyc: "Clear", contact: "Thomas Reyes", email: "treyes@corbelpartners.com", relationshipManager: "J. Teixeira" },
  { id: "inv-sterling", name: "Sterling Ridge Foundation", type: "Foundation", jurisdiction: "New York, US", taxForm: "W-9", kyc: "Clear", contact: "Clara Huang", email: "chuang@sterlingridge.org", relationshipManager: "R. Mendes" },
  { id: "inv-costa", name: "Mariano Costa", type: "Individual", jurisdiction: "Rio de Janeiro, Brazil", taxForm: "W-8BEN", kyc: "Clear", contact: "Mariano Costa", email: "mariano.costa@costaadv.com.br", relationshipManager: "L. Andrade" },
  { id: "inv-previ-sul", name: "Previsul Fundação de Previdência", type: "Pension plan", jurisdiction: "Porto Alegre, Brazil", taxForm: "W-8BEN-E", kyc: "Clear", contact: "Fernanda Lima", email: "fernanda.lima@previsul.org.br", relationshipManager: "L. Andrade" },
  { id: "inv-meridian", name: "Meridian Industrial Holdings, Inc.", type: "Corporation", jurisdiction: "Texas, US", taxForm: "W-9", kyc: "Clear", contact: "Gregory Lane", email: "glane@meridianindustrial.com", relationshipManager: "J. Teixeira" },
];

export type CapitalAccount = {
  fundId: string;
  investorId: string;
  closeDate: string;
  commitment: number;
  called: number;
  contributed: number;
  receivable: number;
  unfunded: number;
  distributed: number;
  nav: number;
  alloc: Alloc;
};

/** Partner capital accounts, derived from each vehicle's general ledger. */
export const capitalAccounts: CapitalAccount[] = funds.flatMap((f) =>
  buildBooks(f.id).partners.map((p) => ({
    fundId: f.id,
    investorId: p.investorId,
    closeDate: p.closeDate,
    commitment: p.commitment,
    called: p.called,
    contributed: p.called - p.receivable,
    receivable: p.receivable,
    unfunded: p.commitment - p.called,
    distributed: p.distributed,
    nav: partnerNav(p),
    alloc: p.alloc,
  })),
);

export function fundTotals(fundId: string) {
  const rows = capitalAccounts.filter((c) => c.fundId === fundId);
  const sum = (k: "commitment" | "called" | "contributed" | "receivable" | "unfunded" | "distributed" | "nav") =>
    rows.reduce((a, r) => a + r[k], 0);
  const contributed = sum("contributed");
  const navExReceivable = sum("nav") - sum("receivable");
  return {
    investors: rows.length,
    commitment: sum("commitment"),
    called: sum("called"),
    contributed,
    receivable: sum("receivable"),
    unfunded: sum("unfunded"),
    distributed: sum("distributed"),
    nav: sum("nav"),
    dpi: contributed ? sum("distributed") / contributed : 0,
    rvpi: contributed ? navExReceivable / contributed : 0,
    tvpi: contributed ? (sum("distributed") + navExReceivable) / contributed : 0,
  };
}

export function toUSD(amount: number, currency: Currency) {
  return currency === "BRL" ? amount / FX_BRL_USD : amount;
}

export type CapitalCall = CallRecord;
export type Distribution = DistributionRecord;

export const capitalCalls: CapitalCall[] = funds
  .flatMap((f) => buildBooks(f.id).calls)
  .sort((a, b) => b.noticeDate.localeCompare(a.noticeDate));

export const distributions: Distribution[] = funds
  .flatMap((f) => buildBooks(f.id).distributions)
  .sort((a, b) => b.date.localeCompare(a.date));

export type OnboardingStatus =
  | "Invited"
  | "In progress"
  | "Submitted"
  | "Changes requested"
  | "Approved"
  | "Countersigned";

export type OnboardingSubmission = {
  id: string;
  fundId: string;
  investorName: string;
  investorType: InvestorType;
  jurisdiction: string;
  commitment: number;
  status: OnboardingStatus;
  progress: number;
  kyc: "Not started" | "Pending" | "Clear" | "Potential match";
  accreditation: "Not provided" | "Accredited investor" | "Qualified purchaser" | "Non-US person (Reg S)";
  invitedOn: string;
  lastActivity: string;
  contactName: string;
  contactEmail: string;
  relationshipManager: string;
};

export const onboarding: OnboardingSubmission[] = [
  { id: "ob-1041", fundId: "atlantico-vp-ii", investorName: "Calloway Family Trust", investorType: "Trust", jurisdiction: "Florida, US", commitment: 7_500_000, status: "In progress", progress: 0.55, kyc: "Pending", accreditation: "Qualified purchaser", invitedOn: "2026-11-10", lastActivity: "2026-11-23", contactName: "Margaret Calloway", contactEmail: "m.calloway@callowaytrust.com", relationshipManager: "L. Andrade" },
  { id: "ob-1038", fundId: "atlantico-vp-ii", investorName: "Sterling Ridge Foundation", investorType: "Foundation", jurisdiction: "New York, US", commitment: 10_000_000, status: "Submitted", progress: 1, kyc: "Clear", accreditation: "Qualified purchaser", invitedOn: "2026-11-03", lastActivity: "2026-11-21", contactName: "Clara Huang", contactEmail: "chuang@sterlingridge.org", relationshipManager: "R. Mendes" },
  { id: "ob-1039", fundId: "atlantico-vp-ii", investorName: "Ana & Rafael Monteiro", investorType: "Joint", jurisdiction: "Florida, US", commitment: 1_000_000, status: "Changes requested", progress: 0.9, kyc: "Potential match", accreditation: "Accredited investor", invitedOn: "2026-11-03", lastActivity: "2026-11-19", contactName: "Rafael Monteiro", contactEmail: "rafael.monteiro@gmail.com", relationshipManager: "R. Mendes" },
  { id: "ob-1036", fundId: "atlantico-vp-ii", investorName: "Previsul Fundação de Previdência", investorType: "Pension plan", jurisdiction: "Porto Alegre, Brazil", commitment: 12_000_000, status: "Approved", progress: 1, kyc: "Clear", accreditation: "Non-US person (Reg S)", invitedOn: "2026-10-27", lastActivity: "2026-11-18", contactName: "Fernanda Lima", contactEmail: "fernanda.lima@previsul.org.br", relationshipManager: "L. Andrade" },
  { id: "ob-1033", fundId: "atlantico-vp-ii", investorName: "Ridgeway Mutual Insurance Co.", investorType: "Insurance company", jurisdiction: "Connecticut, US", commitment: 8_000_000, status: "Countersigned", progress: 1, kyc: "Clear", accreditation: "Qualified purchaser", invitedOn: "2026-10-20", lastActivity: "2026-11-14", contactName: "Amelia Grant", contactEmail: "agrant@ridgewaymutual.com", relationshipManager: "J. Teixeira" },
  { id: "ob-1044", fundId: "atlantico-vp-ii", investorName: "Bayview Partners Holdings LLC", investorType: "LLC", jurisdiction: "California, US", commitment: 3_000_000, status: "Invited", progress: 0, kyc: "Not started", accreditation: "Not provided", invitedOn: "2026-11-22", lastActivity: "2026-11-22", contactName: "Owen Shah", contactEmail: "owen@bayviewph.com", relationshipManager: "J. Teixeira" },
  { id: "ob-1045", fundId: "atlantico-vp-ii", investorName: "Duarte Participações S.A.", investorType: "Corporation", jurisdiction: "São Paulo, Brazil", commitment: 6_000_000, status: "In progress", progress: 0.3, kyc: "Pending", accreditation: "Non-US person (Reg S)", invitedOn: "2026-11-17", lastActivity: "2026-11-24", contactName: "Beatriz Duarte", contactEmail: "beatriz@duartepar.com.br", relationshipManager: "L. Andrade" },
  { id: "ob-1046", fundId: "atlantico-vp-ii", investorName: "Kessler Revocable Trust", investorType: "Trust", jurisdiction: "Texas, US", commitment: 2_000_000, status: "Invited", progress: 0, kyc: "Not started", accreditation: "Not provided", invitedOn: "2026-11-24", lastActivity: "2026-11-24", contactName: "Jonah Kessler", contactEmail: "jkessler@kesslerlaw.com", relationshipManager: "R. Mendes" },
  { id: "ob-1030", fundId: "meridian-cvc", investorName: "Northgate University Endowment", investorType: "Endowment", jurisdiction: "Massachusetts, US", commitment: 5_000_000, status: "Submitted", progress: 1, kyc: "Clear", accreditation: "Qualified purchaser", invitedOn: "2026-10-30", lastActivity: "2026-11-20", contactName: "Susan Whitfield", contactEmail: "swhitfield@northgate.edu", relationshipManager: "R. Mendes" },
];

export type DocumentRecord = {
  id: string;
  name: string;
  fundId: string;
  category:
    | "Fund formation"
    | "Subscription"
    | "Capital call notice"
    | "Distribution notice"
    | "Quarterly report"
    | "Tax"
    | "Financial statements"
    | "KYC";
  date: string;
  visibility: "All investors" | "Investor-specific" | "Internal";
  size: string;
  investorId?: string;
};

export const documents: DocumentRecord[] = [
  { id: "doc-01", name: "Capital Call Notice No. 7", fundId: "cordillera-infra-i", category: "Capital call notice", date: "2026-11-17", visibility: "Investor-specific", size: "184 KB" },
  { id: "doc-02", name: "Q3 2026 Quarterly Report", fundId: "cordillera-infra-i", category: "Quarterly report", date: "2026-11-14", visibility: "All investors", size: "2.4 MB" },
  { id: "doc-03", name: "Q3 2026 Capital Account Statement", fundId: "cordillera-infra-i", category: "Quarterly report", date: "2026-11-14", visibility: "Investor-specific", size: "212 KB" },
  { id: "doc-04", name: "Distribution Notice — Q3 2026", fundId: "serra-re-spv", category: "Distribution notice", date: "2026-10-31", visibility: "Investor-specific", size: "141 KB" },
  { id: "doc-05", name: "Amended & Restated LPA", fundId: "atlantico-vp-ii", category: "Fund formation", date: "2025-09-30", visibility: "All investors", size: "1.8 MB" },
  { id: "doc-06", name: "Private Placement Memorandum", fundId: "atlantico-vp-ii", category: "Fund formation", date: "2025-07-15", visibility: "All investors", size: "3.1 MB" },
  { id: "doc-07", name: "Subscription Agreement — Second Close", fundId: "atlantico-vp-ii", category: "Subscription", date: "2026-11-01", visibility: "All investors", size: "640 KB" },
  { id: "doc-08", name: "Schedule K-1 (2025)", fundId: "cordillera-infra-i", category: "Tax", date: "2026-03-13", visibility: "Investor-specific", size: "322 KB" },
  { id: "doc-09", name: "Audited Financial Statements FY2025", fundId: "meridian-cvc", category: "Financial statements", date: "2026-04-28", visibility: "All investors", size: "1.2 MB" },
  { id: "doc-10", name: "Informe Mensal — Outubro 2026", fundId: "fip-horizonte", category: "Quarterly report", date: "2026-11-10", visibility: "All investors", size: "880 KB" },
  { id: "doc-11", name: "Capital Call Notice No. 4", fundId: "meridian-cvc", category: "Capital call notice", date: "2026-11-03", visibility: "Investor-specific", size: "176 KB" },
  { id: "doc-13", name: "Capital Call Notice No. 2", fundId: "stx-achor", category: "Capital call notice", date: "2026-03-02", visibility: "Investor-specific", size: "168 KB" },
  { id: "doc-14", name: "Q3 2026 Investor Report", fundId: "stx-brazil-housing", category: "Quarterly report", date: "2026-11-12", visibility: "All investors", size: "1.6 MB" },
  { id: "doc-15", name: "Q3 2026 Capital Account Statement", fundId: "stx-achor", category: "Quarterly report", date: "2026-11-12", visibility: "Investor-specific", size: "204 KB" },
  { id: "doc-16", name: "Limited Partnership Agreement", fundId: "stx-global", category: "Fund formation", date: "2026-06-30", visibility: "All investors", size: "2.2 MB" },
  { id: "doc-12", name: "AML Risk Assessment — Second Close", fundId: "atlantico-vp-ii", category: "KYC", date: "2026-11-20", visibility: "Internal", size: "96 KB" },
];

export type Activity = { at: string; actor: string; text: string; fundId?: string };

export const activity: Activity[] = [
  { at: "2026-11-24T08:42:00", actor: "Beatriz Duarte", text: "uploaded ownership chart for Duarte Participações S.A.", fundId: "atlantico-vp-ii" },
  { at: "2026-11-24T08:15:00", actor: "System", text: "sent onboarding invitation to Kessler Revocable Trust", fundId: "atlantico-vp-ii" },
  { at: "2026-11-23T17:30:00", actor: "Margaret Calloway", text: "completed the tax information step", fundId: "atlantico-vp-ii" },
  { at: "2026-11-23T11:04:00", actor: "City National Bank", text: "receipt matched to Capital Call No. 7 — Ridgeway Mutual Insurance Co.", fundId: "cordillera-infra-i" },
  { at: "2026-11-21T15:52:00", actor: "Clara Huang", text: "submitted subscription documents for review", fundId: "atlantico-vp-ii" },
  { at: "2026-11-19T10:20:00", actor: "R. Mendes", text: "requested changes on Monteiro subscription — proof of address", fundId: "atlantico-vp-ii" },
  { at: "2026-11-17T09:00:00", actor: "L. Andrade", text: "issued Capital Call No. 7 to 9 limited partners", fundId: "cordillera-infra-i" },
];

export type BankAccount = {
  id: string;
  fundId: string;
  institution: string;
  accountName: string;
  mask: string;
  type: "Operating" | "Subscription escrow" | "Distribution";
  currency: Currency;
  connection: "Not connected" | "Manual statements";
  lastStatement: string;
};

export const bankAccounts: BankAccount[] = [
  { id: "ba-1", fundId: "cordillera-infra-i", institution: "City National Bank", accountName: "Cordillera Infrastructure Partners I — Operating", mask: "4471", type: "Operating", currency: "USD", connection: "Manual statements", lastStatement: "2026-10-31" },
  { id: "ba-2", fundId: "atlantico-vp-ii", institution: "Butterfield Bank (Cayman)", accountName: "Atlântico VP II — Subscription", mask: "0928", type: "Subscription escrow", currency: "USD", connection: "Not connected", lastStatement: "2026-10-31" },
  { id: "ba-3", fundId: "meridian-cvc", institution: "J.P. Morgan Chase", accountName: "Meridian CVC — Operating", mask: "7310", type: "Operating", currency: "USD", connection: "Manual statements", lastStatement: "2026-10-31" },
  { id: "ba-4", fundId: "serra-re-spv", institution: "Bank of Butterfield", accountName: "Serra SPV — Distribution", mask: "5582", type: "Distribution", currency: "USD", connection: "Not connected", lastStatement: "2026-09-30" },
  { id: "ba-6", fundId: "stx-achor", institution: "City National Bank", accountName: "STX-Achor Capital Formation Fund — Operating", mask: "8814", type: "Operating", currency: "USD", connection: "Not connected", lastStatement: "2026-10-31" },
  { id: "ba-5", fundId: "fip-horizonte", institution: "Itaú Unibanco", accountName: "FIP Horizonte — Conta Movimento", mask: "2209", type: "Operating", currency: "BRL", connection: "Manual statements", lastStatement: "2026-10-31" },
];

export const fundById = (id: string) => funds.find((f) => f.id === id);
export const investorById = (id: string) => investors.find((i) => i.id === id);

/** The investor signed in to the client portal in this preview. */
export const PORTAL_INVESTOR_ID = "inv-calloway";

/** Consolidated quarterly cash flows across all vehicles, USD millions (BRL at reporting rate), from the ledger. */
export const quarterlyFlows: { q: string; contributions: number; distributions: number }[] = (() => {
  const quarters = ["2024-4", "2025-1", "2025-2", "2025-3", "2025-4", "2026-1", "2026-2", "2026-3", "2026-4"];
  const acc = new Map(quarters.map((q) => [q, { contributions: 0, distributions: 0 }]));
  for (const f of funds) {
    for (const je of buildBooks(f.id).journal) {
      const [y, m] = je.date.split("-").map(Number);
      const q = acc.get(`${y}-${Math.ceil(m / 3)}`);
      if (!q) continue;
      for (const l of je.lines) {
        if (je.source === "Receipt" && l.account === "1000") q.contributions += toUSD(l.debit / 100, f.currency);
        if (je.source === "Distribution" && l.account === "3100") q.distributions += toUSD(l.debit / 100, f.currency);
      }
    }
  }
  return quarters.map((k) => {
    const [y, q] = k.split("-");
    const v = acc.get(k)!;
    return { q: `Q${q} ${y}`, contributions: +(v.contributions / 1e6).toFixed(1), distributions: +(v.distributions / 1e6).toFixed(1) };
  });
})();

export type ProfileChangeRequest = {
  id: string;
  investorId: string;
  submitted: string;
  submittedBy: string;
  field: string;
  from: string;
  to: string;
  control: string;
  status: "Pending review" | "Approved";
};

/** Investor-initiated changes. Sensitive fields (bank, signatories) require out-of-band verification. */
export const profileChangeRequests: ProfileChangeRequest[] = [
  { id: "pcr-311", investorId: "inv-ferreira", submitted: "2026-11-22", submittedBy: "Paulo Ferreira", field: "Distribution bank account", from: "Itaú BBA Nassau ••0917", to: "UBS Switzerland ••5530", control: "Callback to signatory on file + 5-day hold", status: "Pending review" },
  { id: "pcr-309", investorId: "inv-calloway", submitted: "2026-11-20", submittedBy: "Margaret Calloway", field: "Mailing address", from: "1200 Brickell Bay Dr, Miami, FL", to: "1450 Brickell Avenue, Suite 2100, Miami, FL", control: "Standard review", status: "Pending review" },
  { id: "pcr-307", investorId: "inv-prado", submitted: "2026-11-18", submittedBy: "Helena Prado", field: "Identity document (KYC refresh)", from: "Passport — expires Dec 31, 2026", to: "Passport — expires Oct 2, 2036", control: "Document verification", status: "Pending review" },
  { id: "pcr-301", investorId: "inv-brightwater", submitted: "2026-11-04", submittedBy: "Daniel Okafor", field: "Authorized contact added", from: "—", to: "Priya Raman, CFO (view + notices)", control: "Signatory confirmation", status: "Approved" },
];
