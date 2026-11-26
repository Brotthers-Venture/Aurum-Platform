/**
 * Report Studio — document model. Templates, document content, data bindings, frozen snapshots and published
 * versions are kept apart: a report is pages of typed blocks; blocks refer to data by key; a snapshot freezes the
 * data a report was approved on; a version records each approved or published state.
 */
import type { Period } from "@/lib/reporting/figures";
import type { ReportData } from "./data";
import type { Locale } from "./i18n";

export type ChartKind = "nav" | "deployment" | "flows" | "utilization" | "allocation" | "bridge" | "jcurve";
export type TableKind =
  "terms" | "performance" | "calls" | "distributions" | "holdings" | "sources" | "balance" | "operations" | "partners" | "fees" | "classes" | "entities" | "liabilities";

export type Block =
  | { id: string; type: "cover"; title: string; subtitle: string }
  | { id: string; type: "heading"; text: string; kicker?: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "commentary"; text: string; author: string; role: string; supplied: "manager" | "administrator" }
  | { id: string; type: "kpis"; keys: string[]; note?: string }
  | { id: string; type: "chart"; chart: ChartKind; title: string; caption?: string }
  | { id: string; type: "table"; table: TableKind; title?: string }
  | { id: string; type: "holdings"; updates: Record<string, string> }
  | { id: string; type: "exposure"; dimension: "sector" | "geography" | "currency" }
  | { id: string; type: "notes"; title: string; text: string }
  | { id: string; type: "disclosures"; text: string }
  | { id: string; type: "signature"; signers: { name: string; role: string }[] }
  | { id: string; type: "toc" }
  /** one partner's capital account roll-forward (the report's investorId) */
  | { id: string; type: "statement" };

export type BlockType = Block["type"];
export type Page = { id: string; title: string; blocks: Block[] };

export type ReportStatus = "draft" | "in_review" | "approved" | "published" | "archived";
export const REPORT_STATUS: Record<ReportStatus, string> = { draft: "Draft", in_review: "In review", approved: "Approved", published: "Published", archived: "Archived" };

export type Version = { n: number; at: string; by: string; note: string; status: ReportStatus };
export type Snapshot = { at: string; by: string; data: ReportData };
export type Design = {
  /** whose identity the report carries: the fund manager's (white label) or the administrator's */
  brand: "manager" | "administrator";
  typography: "editorial" | "modern";
  cover: "field" | "light" | "minimal";
};

export type { Locale };
export type PageReview = { state: "ok" | "changes"; by: string; at: string; note?: string };
export type ReportComment = {
  id: string;
  pageId: string;
  blockId: string;
  author: string;
  text: string;
  at: string;
  resolved?: boolean;
  replies: { author: string; text: string; at: string }[];
};

export type Report = {
  id: string;
  template: TemplateId;
  /** what the report is about: a fund (fundId) or a family (fundId holds the family id) */
  subject?: "fund" | "family";
  /** the partner a capital account statement is for */
  investorId?: string;
  locale?: Locale;
  /** section-level review while in review, by page */
  review?: Record<string, PageReview>;
  /** internal comments; never published */
  comments?: ReportComment[];
  name: string;
  fundId: string;
  period: Period;
  status: ReportStatus;
  /** status before archiving, to restore */
  archivedFrom?: ReportStatus;
  design: Design;
  pages: Page[];
  snapshot?: Snapshot;
  versions: Version[];
  created: string;
  modified: string;
  modifiedBy: string;
};

/* ───────── templates ───────── */

export type TemplateId =
  "quarterly-fund" | "annual-fund" | "capital-account" | "portfolio-performance" | "family-wealth" | "factsheet" | "capital-activity" | "gp-management" | "investor-letter";

export type Template = {
  id: TemplateId;
  name: string;
  description: string;
  pages: number;
  ready: boolean;
  audience: string;
  /** what the report is built on */
  subject: "fund" | "family";
  /** addressed to one partner */
  perInvestor?: boolean;
  /** starts with a cover page */
  cover: boolean;
};

export const TEMPLATES: Template[] = [
  {
    id: "quarterly-fund",
    name: "Quarterly Fund Report",
    description: "Cover, executive summary, overview, performance, capital activity, portfolio, investment updates and disclosures.",
    pages: 8,
    ready: true,
    audience: "Limited partners",
    subject: "fund",
    cover: true,
  },
  {
    id: "annual-fund",
    name: "Annual Fund Report",
    description: "The year in the manager’s words, the year at a glance, ledger statements, partners’ capital, activity and portfolio.",
    pages: 9,
    ready: true,
    audience: "Limited partners",
    subject: "fund",
    cover: true,
  },
  {
    id: "capital-account",
    name: "Investor Capital Account Statement",
    description: "One partner’s capital roll-forward for the quarter, commitment and share of the fund.",
    pages: 2,
    ready: true,
    audience: "Each partner",
    subject: "fund",
    perInvestor: true,
    cover: false,
  },
  {
    id: "portfolio-performance",
    name: "Portfolio Performance Report",
    description: "Returns, the quarter’s NAV bridge, valuation history, cash-flow curve and investments.",
    pages: 6,
    ready: true,
    audience: "Investment committee",
    subject: "fund",
    cover: true,
  },
  {
    id: "family-wealth",
    name: "Family Office Consolidated Wealth Report",
    description: "A family’s net worth, allocation, currency and regional exposure, structure and borrowing in one currency.",
    pages: 6,
    ready: true,
    audience: "Family principals",
    subject: "family",
    cover: true,
  },
  {
    id: "factsheet",
    name: "Investment Factsheet",
    description: "One page: strategy, key figures, terms and net asset value.",
    pages: 1,
    ready: true,
    audience: "Prospective investors",
    subject: "fund",
    cover: false,
  },
  {
    id: "capital-activity",
    name: "Capital Activity Report",
    description: "Calls, distributions and commitment utilization, by quarter and by partner.",
    pages: 3,
    ready: true,
    audience: "Limited partners",
    subject: "fund",
    cover: false,
  },
  {
    id: "gp-management",
    name: "GP Management Report",
    description: "Assets under administration, fees and expenses by quarter, results and the investor base, for the manager.",
    pages: 5,
    ready: true,
    audience: "General partner",
    subject: "fund",
    cover: true,
  },
  {
    id: "investor-letter",
    name: "Investor Letter",
    description: "The quarter in the manager’s words, with linked figures and signatures.",
    pages: 2,
    ready: true,
    audience: "Limited partners",
    subject: "fund",
    cover: false,
  },
];
export const templateById = (id: TemplateId) => TEMPLATES.find((t) => t.id === id)!;

let seq = 0;
export const newId = (p = "b") => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Blocks a person can add, with what they are for. */
export const PALETTE: { type: BlockType; label: string; hint: string }[] = [
  { type: "heading", label: "Heading", hint: "A section title" },
  { type: "paragraph", label: "Paragraph", hint: "Text with linked figures" },
  { type: "commentary", label: "Commentary", hint: "The manager’s words, attributed" },
  { type: "kpis", label: "Key figures", hint: "Up to four linked figures" },
  { type: "chart", label: "Chart", hint: "From the fund’s data" },
  { type: "table", label: "Table", hint: "Terms, performance, activity" },
  { type: "holdings", label: "Investment updates", hint: "One entry per investment" },
  { type: "notes", label: "Note", hint: "A titled note" },
  { type: "disclosures", label: "Disclosures", hint: "Legal text" },
  { type: "signature", label: "Signatures", hint: "Who signs the report" },
  { type: "toc", label: "Contents", hint: "Generated from the pages" },
  { type: "statement", label: "Capital account", hint: "The partner’s roll-forward" },
];

export function blankBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case "heading":
      return { id, type, text: "New section" };
    case "paragraph":
      return { id, type, text: "Write here. Insert linked figures from the panel on the right." };
    case "commentary":
      return { id, type, text: "", author: "", role: "", supplied: "manager" };
    case "kpis":
      return { id, type, keys: ["nav", "tvpi"] };
    case "chart":
      return { id, type, chart: "nav", title: "Net asset value" };
    case "table":
      return { id, type, table: "performance", title: "Performance summary" };
    case "holdings":
      return { id, type, updates: {} };
    case "notes":
      return { id, type, title: "Note", text: "" };
    case "disclosures":
      return { id, type, text: "" };
    case "signature":
      return { id, type, signers: [{ name: "", role: "" }] };
    case "toc":
      return { id, type };
    case "exposure":
      return { id, type, dimension: "sector" };
    case "cover":
      return { id, type, title: "Report", subtitle: "" };
    case "statement":
      return { id, type };
  }
}

export const BLOCK_NAME: Record<BlockType, string> = {
  cover: "Cover",
  heading: "Heading",
  paragraph: "Paragraph",
  commentary: "Commentary",
  kpis: "Key figures",
  chart: "Chart",
  table: "Table",
  holdings: "Investment updates",
  exposure: "Exposure",
  notes: "Note",
  disclosures: "Disclosures",
  signature: "Signatures",
  toc: "Contents",
  statement: "Capital account",
};

export const CHART_NAME: Record<ChartKind, string> = {
  nav: "NAV evolution",
  deployment: "Capital deployment",
  flows: "Contributions and distributions",
  utilization: "Commitment utilization",
  allocation: "Allocation by investment",
  bridge: "NAV bridge for the quarter",
  jcurve: "Cumulative net cash flow",
};
export const TABLE_NAME: Record<TableKind, string> = {
  terms: "Key terms",
  performance: "Performance summary",
  calls: "Capital calls",
  distributions: "Distributions",
  holdings: "Investments",
  sources: "Data sources",
  balance: "Assets, liabilities and partners’ capital",
  operations: "Statement of operations",
  partners: "Partners’ capital",
  fees: "Fees and expenses by quarter",
  classes: "Allocation by asset class",
  entities: "Holding structure",
  liabilities: "Borrowing",
};
