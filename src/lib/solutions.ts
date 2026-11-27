export type Solution = {
  id: string;
  name: string;
  lines: [string, string];
  href: string;
  live: boolean;
  /** shown as a prototype on the hub: simulated, not connected to real providers */
  prototype?: boolean;
  /** position in the ring around Client Portal, clockwise from upper-right */
  slot: "ne" | "e" | "se" | "sw" | "w" | "nw";
  summary: string;
  modules: string[];
};

export const solutions: Solution[] = [
  {
    id: "fund",
    name: "Fund Solution",
    lines: ["Fund", "Solution"],
    href: "/admin/fund",
    live: true,
    slot: "ne",
    summary: "Administration and fiduciary oversight for private funds, offshore vehicles and SPVs — from investor onboarding to capital activity and reporting.",
    modules: ["Fund administration", "Investor onboarding", "Capital calls", "Distributions", "Investor reporting", "Banking"],
  },
  {
    id: "multi-family",
    name: "Multi-Family Office",
    lines: ["Multi-Family", "Solution"],
    href: "/admin/multi-family",
    live: true,
    slot: "e",
    summary: "Consolidated management of a family’s entities, assets and documents in one governed view.",
    modules: ["Family structures", "Consolidated holdings", "Governance", "Document vault", "Succession planning", "Reporting"],
  },
  {
    id: "banking",
    name: "Banking Solution",
    lines: ["Banking", "Solution"],
    href: "/admin/banking",
    live: true,
    prototype: true,
    slot: "se",
    summary: "Accounts opened in each client entity’s name at a partner bank, cash across every entity, and payments with client approval and callback-verified payees.",
    modules: ["Cash position", "Accounts", "Payments and approvals", "Payee verification", "Reconciliation", "Approval policies"],
  },
  {
    id: "blockchain",
    name: "Blockchain Solution",
    lines: ["Blockchain", "Solution"],
    href: "/admin/blockchain",
    live: true,
    prototype: true,
    slot: "sw",
    summary:
      "Tokenized share registers for the companies we form and administer: owners hold their shares in their own wallets, every transfer checked against the company’s rules.",
    modules: ["Tokenized companies", "Token rules", "Transfers", "Owner wallets", "Register reconciliation", "Secondary sales"],
  },
  {
    id: "offering",
    name: "Offering Solution",
    lines: ["Offering", "Solution"],
    href: "/admin/offering",
    live: true,
    slot: "w",
    summary: "Capital formation for the funds and offerings we administer: offerings, investor pipeline, relationships and agreements, from introduction to closing.",
    modules: ["Offerings", "Investor pipeline", "Investors", "Agreements", "Closings", "Placement agents"],
  },
  {
    id: "corporate",
    name: "Corporate Solution",
    lines: ["Corporate", "Solution"],
    href: "/admin/corporate",
    live: true,
    slot: "nw",
    summary: "Formation, compliance and administration for companies and holding structures across 25 jurisdictions.",
    modules: ["Entity formation", "Registered agent", "Annual compliance", "Corporate records", "Beneficial ownership", "Board support"],
  },
];

export const solutionById = (id: string) => solutions.find((s) => s.id === id);
