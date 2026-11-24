/**
 * Mock data for the skeleton. Every shape here mirrors a future Supabase table
 * so the UI can be switched to live queries without restructuring pages.
 */

export type Currency = "USD" | "BRL";

export type Fund = {
  id: string;
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
  calledPct: number;
  dpi: number;
  rvpi: number;
};

export const FX_BRL_USD = 5.4; // reporting rate for consolidated USD figures

export const funds: Fund[] = [
  {
    id: "aurum-infra-i",
    name: "Aurum Infrastructure Partners I, LP",
    shortName: "Infrastructure Partners I",
    legalForm: "Delaware limited partnership",
    domicile: "Delaware, US",
    currency: "USD",
    vintage: 2023,
    strategy: "Infrastructure",
    status: "Investing",
    targetSize: 250_000_000,
    gp: "Aurum Infrastructure GP I, LLC",
    manager: "Cordillera Infrastructure Advisors",
    managementFee: "1.75% on commitments",
    carry: "20%",
    hurdle: "8% preferred return",
    term: "10 years + 2 × 1-year extensions",
    firstClose: "2023-03-15",
    finalClose: "2024-03-15",
    auditor: "Grant Thornton LLP",
    bank: "City National Bank",
    calledPct: 0.46,
    dpi: 0.08,
    rvpi: 1.12,
  },
  {
    id: "atlantico-vp-ii",
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
    calledPct: 0.1,
    dpi: 0,
    rvpi: 0.98,
  },
  {
    id: "serra-re-spv",
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
    calledPct: 1,
    dpi: 0.22,
    rvpi: 1.09,
  },
  {
    id: "fip-horizonte",
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
    calledPct: 0.72,
    dpi: 0.31,
    rvpi: 1.18,
  },
  {
    id: "meridian-cvc",
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
    calledPct: 0.28,
    dpi: 0,
    rvpi: 1.04,
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

type CommitmentSeed = { fundId: string; investorId: string; commitment: number; closeDate: string };

const commitmentSeeds: CommitmentSeed[] = [
  // Infrastructure Partners I (USD)
  { fundId: "aurum-infra-i", investorId: "inv-brightwater", commitment: 50_000_000, closeDate: "2023-03-15" },
  { fundId: "aurum-infra-i", investorId: "inv-northgate", commitment: 35_000_000, closeDate: "2023-03-15" },
  { fundId: "aurum-infra-i", investorId: "inv-ridgeway", commitment: 30_000_000, closeDate: "2023-03-15" },
  { fundId: "aurum-infra-i", investorId: "inv-corbel", commitment: 25_000_000, closeDate: "2023-09-29" },
  { fundId: "aurum-infra-i", investorId: "inv-vasconcelos", commitment: 20_000_000, closeDate: "2023-09-29" },
  { fundId: "aurum-infra-i", investorId: "inv-calloway", commitment: 15_000_000, closeDate: "2023-09-29" },
  { fundId: "aurum-infra-i", investorId: "inv-sterling", commitment: 15_000_000, closeDate: "2024-03-15" },
  { fundId: "aurum-infra-i", investorId: "inv-ferreira", commitment: 12_500_000, closeDate: "2024-03-15" },
  { fundId: "aurum-infra-i", investorId: "inv-lakeshore", commitment: 10_000_000, closeDate: "2024-03-15" },
  // Atlântico Venture II (USD) — first close done, second close onboarding
  { fundId: "atlantico-vp-ii", investorId: "inv-vasconcelos", commitment: 20_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-ferreira", commitment: 15_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-corbel", commitment: 15_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-costa", commitment: 5_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-prado", commitment: 4_000_000, closeDate: "2025-09-30" },
  { fundId: "atlantico-vp-ii", investorId: "inv-lakeshore", commitment: 5_000_000, closeDate: "2025-09-30" },
  // Serra SPV (USD)
  { fundId: "serra-re-spv", investorId: "inv-calloway", commitment: 8_000_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-vasconcelos", commitment: 10_000_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-monteiro", commitment: 2_400_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-ferreira", commitment: 9_000_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-costa", commitment: 4_000_000, closeDate: "2024-06-01" },
  { fundId: "serra-re-spv", investorId: "inv-prado", commitment: 5_000_000, closeDate: "2024-06-01" },
  // FIP Horizonte (BRL)
  { fundId: "fip-horizonte", investorId: "inv-previ-sul", commitment: 180_000_000, closeDate: "2022-05-10" },
  { fundId: "fip-horizonte", investorId: "inv-ferreira", commitment: 90_000_000, closeDate: "2022-05-10" },
  { fundId: "fip-horizonte", investorId: "inv-vasconcelos", commitment: 75_000_000, closeDate: "2022-11-18" },
  { fundId: "fip-horizonte", investorId: "inv-costa", commitment: 40_000_000, closeDate: "2023-05-10" },
  { fundId: "fip-horizonte", investorId: "inv-prado", commitment: 35_000_000, closeDate: "2023-05-10" },
  // Meridian CVC (USD)
  { fundId: "meridian-cvc", investorId: "inv-meridian", commitment: 60_000_000, closeDate: "2024-01-22" },
  { fundId: "meridian-cvc", investorId: "inv-calloway", commitment: 5_000_000, closeDate: "2024-11-30" },
  { fundId: "meridian-cvc", investorId: "inv-lakeshore", commitment: 7_500_000, closeDate: "2024-11-30" },
];

export type CapitalAccount = {
  fundId: string;
  investorId: string;
  commitment: number;
  contributed: number;
  unfunded: number;
  distributed: number;
  nav: number;
  closeDate: string;
};

export const capitalAccounts: CapitalAccount[] = commitmentSeeds.map((s) => {
  const f = funds.find((x) => x.id === s.fundId)!;
  const contributed = s.commitment * f.calledPct;
  return {
    ...s,
    contributed,
    unfunded: s.commitment - contributed,
    distributed: contributed * f.dpi,
    nav: contributed * f.rvpi,
  };
});

export function fundTotals(fundId: string) {
  const rows = capitalAccounts.filter((c) => c.fundId === fundId);
  const sum = (k: keyof Pick<CapitalAccount, "commitment" | "contributed" | "unfunded" | "distributed" | "nav">) =>
    rows.reduce((a, r) => a + r[k], 0);
  const contributed = sum("contributed");
  return {
    investors: rows.length,
    commitment: sum("commitment"),
    contributed,
    unfunded: sum("unfunded"),
    distributed: sum("distributed"),
    nav: sum("nav"),
    dpi: contributed ? sum("distributed") / contributed : 0,
    tvpi: contributed ? (sum("distributed") + sum("nav")) / contributed : 0,
  };
}

export function toUSD(amount: number, currency: Currency) {
  return currency === "BRL" ? amount / FX_BRL_USD : amount;
}

export type CapitalCall = {
  id: string;
  fundId: string;
  number: number;
  noticeDate: string;
  dueDate: string;
  amount: number;
  received: number;
  purpose: string;
  status: "Draft" | "Issued" | "Partially funded" | "Funded";
};

export const capitalCalls: CapitalCall[] = [
  { id: "cc-infra-07", fundId: "aurum-infra-i", number: 7, noticeDate: "2026-11-17", dueDate: "2026-12-01", amount: 12_750_000, received: 6_120_000, purpose: "Investment — Ribeira Solar Holdings; management fee Q1 2027", status: "Partially funded" },
  { id: "cc-atl-02", fundId: "atlantico-vp-ii", number: 2, noticeDate: "2026-11-24", dueDate: "2026-12-08", amount: 6_400_000, received: 0, purpose: "Investments — Series A follow-ons; fund expenses", status: "Draft" },
  { id: "cc-cvc-04", fundId: "meridian-cvc", number: 4, noticeDate: "2026-11-03", dueDate: "2026-11-17", amount: 4_350_000, received: 4_350_000, purpose: "Investment — Tessera Robotics Series B", status: "Funded" },
  { id: "cc-fip-11", fundId: "fip-horizonte", number: 11, noticeDate: "2026-10-20", dueDate: "2026-11-04", amount: 28_000_000, received: 28_000_000, purpose: "Chamada de capital — Linha de Transmissão Norte", status: "Funded" },
  { id: "cc-infra-06", fundId: "aurum-infra-i", number: 6, noticeDate: "2026-08-12", dueDate: "2026-08-26", amount: 18_200_000, received: 18_200_000, purpose: "Investment — Porto Verde Logistics; fees", status: "Funded" },
  { id: "cc-atl-01", fundId: "atlantico-vp-ii", number: 1, noticeDate: "2025-10-14", dueDate: "2025-10-28", amount: 6_400_000, received: 6_400_000, purpose: "Initial capital — organizational expenses and first investments", status: "Funded" },
  { id: "cc-cvc-03", fundId: "meridian-cvc", number: 3, noticeDate: "2026-06-02", dueDate: "2026-06-16", amount: 6_100_000, received: 6_100_000, purpose: "Investment — Lumen Grid Analytics Series A", status: "Funded" },
];

export type Distribution = {
  id: string;
  fundId: string;
  date: string;
  amount: number;
  type: "Return of capital" | "Income" | "Realized gain" | "Mixed";
  source: string;
  status: "Scheduled" | "Paid";
};

export const distributions: Distribution[] = [
  { id: "d-fip-06", fundId: "fip-horizonte", date: "2026-12-15", amount: 24_500_000, type: "Income", source: "Dividends — Linha de Transmissão Sul", status: "Scheduled" },
  { id: "d-serra-03", fundId: "serra-re-spv", date: "2026-10-31", amount: 2_150_000, type: "Income", source: "Net operating income Q3 2026", status: "Paid" },
  { id: "d-infra-02", fundId: "aurum-infra-i", date: "2026-09-30", amount: 4_700_000, type: "Mixed", source: "Partial exit — Atlas Fiber minority stake", status: "Paid" },
  { id: "d-fip-05", fundId: "fip-horizonte", date: "2026-06-15", amount: 31_000_000, type: "Realized gain", source: "Sale of 30% — Usina Eólica Serra Azul", status: "Paid" },
  { id: "d-serra-02", fundId: "serra-re-spv", date: "2026-07-31", amount: 2_050_000, type: "Income", source: "Net operating income Q2 2026", status: "Paid" },
  { id: "d-infra-01", fundId: "aurum-infra-i", date: "2025-12-19", amount: 3_120_000, type: "Income", source: "Portfolio yield — Porto Verde Logistics", status: "Paid" },
];

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
  { id: "doc-01", name: "Capital Call Notice No. 7", fundId: "aurum-infra-i", category: "Capital call notice", date: "2026-11-17", visibility: "Investor-specific", size: "184 KB" },
  { id: "doc-02", name: "Q3 2026 Quarterly Report", fundId: "aurum-infra-i", category: "Quarterly report", date: "2026-11-14", visibility: "All investors", size: "2.4 MB" },
  { id: "doc-03", name: "Q3 2026 Capital Account Statement", fundId: "aurum-infra-i", category: "Quarterly report", date: "2026-11-14", visibility: "Investor-specific", size: "212 KB" },
  { id: "doc-04", name: "Distribution Notice — Q3 2026", fundId: "serra-re-spv", category: "Distribution notice", date: "2026-10-31", visibility: "Investor-specific", size: "141 KB" },
  { id: "doc-05", name: "Amended & Restated LPA", fundId: "atlantico-vp-ii", category: "Fund formation", date: "2025-09-30", visibility: "All investors", size: "1.8 MB" },
  { id: "doc-06", name: "Private Placement Memorandum", fundId: "atlantico-vp-ii", category: "Fund formation", date: "2025-07-15", visibility: "All investors", size: "3.1 MB" },
  { id: "doc-07", name: "Subscription Agreement — Second Close", fundId: "atlantico-vp-ii", category: "Subscription", date: "2026-11-01", visibility: "All investors", size: "640 KB" },
  { id: "doc-08", name: "Schedule K-1 (2025)", fundId: "aurum-infra-i", category: "Tax", date: "2026-03-13", visibility: "Investor-specific", size: "322 KB" },
  { id: "doc-09", name: "Audited Financial Statements FY2025", fundId: "meridian-cvc", category: "Financial statements", date: "2026-04-28", visibility: "All investors", size: "1.2 MB" },
  { id: "doc-10", name: "Informe Mensal — Outubro 2026", fundId: "fip-horizonte", category: "Quarterly report", date: "2026-11-10", visibility: "All investors", size: "880 KB" },
  { id: "doc-11", name: "Capital Call Notice No. 4", fundId: "meridian-cvc", category: "Capital call notice", date: "2026-11-03", visibility: "Investor-specific", size: "176 KB" },
  { id: "doc-12", name: "AML Risk Assessment — Second Close", fundId: "atlantico-vp-ii", category: "KYC", date: "2026-11-20", visibility: "Internal", size: "96 KB" },
];

export type Activity = { at: string; actor: string; text: string; fundId?: string };

export const activity: Activity[] = [
  { at: "2026-11-24T08:42:00", actor: "Beatriz Duarte", text: "uploaded ownership chart for Duarte Participações S.A.", fundId: "atlantico-vp-ii" },
  { at: "2026-11-24T08:15:00", actor: "System", text: "sent onboarding invitation to Kessler Revocable Trust", fundId: "atlantico-vp-ii" },
  { at: "2026-11-23T17:30:00", actor: "Margaret Calloway", text: "completed the tax information step", fundId: "atlantico-vp-ii" },
  { at: "2026-11-23T11:04:00", actor: "City National Bank", text: "receipt of $2,040,000 matched to Capital Call No. 7 — Ridgeway Mutual", fundId: "aurum-infra-i" },
  { at: "2026-11-21T15:52:00", actor: "Clara Huang", text: "submitted subscription documents for review", fundId: "atlantico-vp-ii" },
  { at: "2026-11-19T10:20:00", actor: "R. Mendes", text: "requested changes on Monteiro subscription — proof of address", fundId: "atlantico-vp-ii" },
  { at: "2026-11-17T09:00:00", actor: "L. Andrade", text: "issued Capital Call No. 7 to 9 limited partners", fundId: "aurum-infra-i" },
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
  { id: "ba-1", fundId: "aurum-infra-i", institution: "City National Bank", accountName: "Aurum Infrastructure Partners I — Operating", mask: "4471", type: "Operating", currency: "USD", connection: "Manual statements", lastStatement: "2026-10-31" },
  { id: "ba-2", fundId: "atlantico-vp-ii", institution: "Butterfield Bank (Cayman)", accountName: "Atlântico VP II — Subscription", mask: "0928", type: "Subscription escrow", currency: "USD", connection: "Not connected", lastStatement: "2026-10-31" },
  { id: "ba-3", fundId: "meridian-cvc", institution: "J.P. Morgan Chase", accountName: "Meridian CVC — Operating", mask: "7310", type: "Operating", currency: "USD", connection: "Manual statements", lastStatement: "2026-10-31" },
  { id: "ba-4", fundId: "serra-re-spv", institution: "Bank of Butterfield", accountName: "Serra SPV — Distribution", mask: "5582", type: "Distribution", currency: "USD", connection: "Not connected", lastStatement: "2026-09-30" },
  { id: "ba-5", fundId: "fip-horizonte", institution: "Itaú Unibanco", accountName: "FIP Horizonte — Conta Movimento", mask: "2209", type: "Operating", currency: "BRL", connection: "Manual statements", lastStatement: "2026-10-31" },
];

export const fundById = (id: string) => funds.find((f) => f.id === id);
export const investorById = (id: string) => investors.find((i) => i.id === id);

/** The investor signed in to the client portal in this preview. */
export const PORTAL_INVESTOR_ID = "inv-calloway";

/** Consolidated quarterly cash flows across all vehicles, USD millions (BRL at reporting rate). */
export const quarterlyFlows: { q: string; contributions: number; distributions: number }[] = [
  { q: "Q4 2024", contributions: 21.4, distributions: 3.9 },
  { q: "Q1 2025", contributions: 14.8, distributions: 2.1 },
  { q: "Q2 2025", contributions: 18.2, distributions: 6.6 },
  { q: "Q3 2025", contributions: 9.6, distributions: 4.2 },
  { q: "Q4 2025", contributions: 24.1, distributions: 7.4 },
  { q: "Q1 2026", contributions: 12.3, distributions: 3.3 },
  { q: "Q2 2026", contributions: 16.9, distributions: 9.8 },
  { q: "Q3 2026", contributions: 23.7, distributions: 7.2 },
  { q: "Q4 2026", contributions: 22.3, distributions: 4.5 },
];
