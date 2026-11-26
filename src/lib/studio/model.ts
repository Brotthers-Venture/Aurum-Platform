/**
 * Report Studio — document model. Templates, document content, data bindings, frozen snapshots and published
 * versions are kept apart: a report is pages of typed blocks; blocks refer to data by key; a snapshot freezes the
 * data a report was approved on; a version records each approved or published state.
 */
import { fundById } from "@/lib/data";
import { quarterWords, type Period } from "@/lib/reporting/figures";
import type { ReportData } from "./data";

export type ChartKind = "nav" | "deployment" | "flows" | "utilization" | "allocation";
export type TableKind = "terms" | "performance" | "calls" | "distributions" | "holdings" | "sources";

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
  | { id: string; type: "toc" };

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

export type Locale = "en" | "pt";
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

export type Template = { id: TemplateId; name: string; description: string; pages: number; ready: boolean; audience: string };

export const TEMPLATES: Template[] = [
  {
    id: "quarterly-fund",
    name: "Quarterly Fund Report",
    description: "Cover, executive summary, overview, performance, capital activity, portfolio, investment updates and disclosures.",
    pages: 8,
    ready: true,
    audience: "Limited partners",
  },
  {
    id: "annual-fund",
    name: "Annual Fund Report",
    description: "The year in review with audited financial statements and the manager’s letter.",
    pages: 16,
    ready: false,
    audience: "Limited partners",
  },
  {
    id: "capital-account",
    name: "Investor Capital Account Statement",
    description: "One partner’s capital roll-forward, commitment and share of the fund.",
    pages: 2,
    ready: false,
    audience: "Each partner",
  },
  {
    id: "portfolio-performance",
    name: "Portfolio Performance Report",
    description: "Investment-level returns, valuation history and attribution.",
    pages: 6,
    ready: false,
    audience: "Investment committee",
  },
  {
    id: "family-wealth",
    name: "Family Office Consolidated Wealth Report",
    description: "Every entity and asset of a family, consolidated in one currency.",
    pages: 10,
    ready: false,
    audience: "Family principals",
  },
  { id: "factsheet", name: "Investment Factsheet", description: "One page: strategy, terms, key figures and contacts.", pages: 1, ready: false, audience: "Prospective investors" },
  {
    id: "capital-activity",
    name: "Capital Activity Report",
    description: "Calls, distributions and commitment utilization for the period.",
    pages: 3,
    ready: false,
    audience: "Limited partners",
  },
  {
    id: "gp-management",
    name: "GP Management Report",
    description: "Fees, expenses, carried interest and fund operations for the manager.",
    pages: 5,
    ready: false,
    audience: "General partner",
  },
  { id: "investor-letter", name: "Investor Letter", description: "The quarter in the manager’s words, with linked figures.", pages: 2, ready: false, audience: "Limited partners" },
];

let seq = 0;
export const newId = (p = "b") => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Manager-supplied narrative for the demo funds; elsewhere the commentary is neutral and updates are left for the manager. */
const NARRATIVE: Record<string, { commentary: string; updates: string[] }> = {
  "stx-brazil-housing": {
    commentary:
      "The quarter was defined by steady execution across the portfolio. Phase I unit sales completed ahead of schedule, allowing the fund’s first distribution to partners, while construction of phase II remained on budget. We continue to see strong demand for affordable housing in our target metropolitan regions.",
    // in the order of the holdings (largest cost first): phase I, land and permits, phase II
    updates: [
      "All units were delivered and the final sales closed in September, generating the fund’s first distribution.",
      "Permits for the remaining plots were confirmed during the quarter; site preparation begins in the first quarter of next year.",
      "Structural works reached the fourth floor; the project remains on schedule and within budget.",
    ],
  },
};

/** The Quarterly Fund Report: eight pages, built from the fund's records and the period's data. */
export function quarterlyFundReport(fundId: string, period: Period, data: ReportData, signer: string): Page[] {
  const f = fundById(fundId)!;
  const id = (s: string) => `${s}`;
  const hasDist = data.distributions.length > 0;
  const story = NARRATIVE[fundId];
  return [
    {
      id: id("p-cover"),
      title: "Cover",
      blocks: [{ id: id("cover"), type: "cover", title: "Quarterly Report", subtitle: `${quarterWords(period).replace(/^./, (c) => c.toUpperCase())}` }],
    },
    {
      id: id("p-summary"),
      title: "Executive summary",
      blocks: [
        { id: id("summary-h"), type: "heading", kicker: "01", text: "Executive summary" },
        {
          id: id("summary-p"),
          type: "paragraph",
          text: "At the end of {{period_name}}, {{fund}} reported a net asset value of {{nav}}. Partners have contributed {{called}} of {{commitments}} committed, and the fund has returned {{distributed}} to date.",
        },
        { id: id("summary-k"), type: "kpis", keys: ["nav", "net_irr", "tvpi", "dpi"] },
        {
          id: id("summary-c"),
          type: "commentary",
          supplied: "manager",
          author: signer,
          role: `On behalf of ${f.manager}`,
          text: story?.commentary ?? "",
        },
        { id: id("toc"), type: "toc" },
      ],
    },
    {
      id: id("p-overview"),
      title: "Fund overview",
      blocks: [
        { id: id("ov-h"), type: "heading", kicker: "02", text: "Fund overview" },
        { id: id("ov-p"), type: "paragraph", text: overview(f) },
        { id: id("ov-t"), type: "table", table: "terms", title: "Key terms" },
        { id: id("ov-k"), type: "kpis", keys: ["commitments", "called", "unfunded", "lps"] },
        { id: id("ov-c"), type: "chart", chart: "utilization", title: "Commitment utilization", caption: "Paid-in capital as a share of commitments at each quarter end." },
      ],
    },
    {
      id: id("p-performance"),
      title: "Fund performance",
      blocks: [
        { id: id("pf-h"), type: "heading", kicker: "03", text: "Fund performance" },
        { id: id("pf-c"), type: "chart", chart: "nav", title: "Net asset value and paid-in capital", caption: "Quarter-end net asset value against cumulative contributions." },
        { id: id("pf-t"), type: "table", table: "performance", title: "Performance summary" },
        {
          id: id("pf-p"),
          type: "paragraph",
          text: "Net performance is calculated from partner cash flows after fees and expenses. The net result for the quarter was {{q_pnl}}, including a change in unrealized value of {{q_unrealized}}.",
        },
      ],
    },
    {
      id: id("p-activity"),
      title: "Capital activity",
      blocks: [
        { id: id("ca-h"), type: "heading", kicker: "04", text: "Capital activity" },
        { id: id("ca-k"), type: "kpis", keys: ["q_called", "q_distributed", "called", "distributed"] },
        {
          id: id("ca-c"),
          type: "chart",
          chart: "flows",
          title: "Contributions and distributions by quarter",
          caption: "Capital called (above the line) and distributed (below) in each quarter.",
        },
        { id: id("ca-t"), type: "table", table: "calls", title: "Capital calls" },
        ...(hasDist ? [{ id: id("ca-d"), type: "table" as const, table: "distributions" as const, title: "Distributions" }] : []),
      ],
    },
    {
      id: id("p-portfolio"),
      title: "Portfolio allocation",
      blocks: [
        { id: id("po-h"), type: "heading", kicker: "05", text: "Portfolio allocation" },
        { id: id("po-k"), type: "kpis", keys: ["investments_cost", "unrealized", "cash", "nav"] },
        { id: id("po-c"), type: "chart", chart: "allocation", title: "Investments at cost", caption: "Share of capital invested, by investment, at cost." },
        { id: id("po-t"), type: "table", table: "holdings" },
        { id: id("po-x"), type: "exposure", dimension: "geography" },
      ],
    },
    {
      id: id("p-updates"),
      title: "Investment updates",
      blocks: [
        { id: id("iu-h"), type: "heading", kicker: "06", text: "Investment updates" },
        {
          id: id("iu-u"),
          type: "holdings",
          updates: Object.fromEntries(data.holdings.map((h, i) => [h.name, story?.updates[i] ?? ""])),
        },
      ],
    },
    {
      id: id("p-notes"),
      title: "Notes and disclosures",
      blocks: [
        { id: id("nd-h"), type: "heading", kicker: "07", text: "Financial notes and disclosures" },
        {
          id: id("nd-basis"),
          type: "notes",
          title: "Basis of preparation",
          text: `Figures are prepared by the fund administrator from the fund’s books as of the period end, in ${data.currency}. Net asset value is the sum of the partners’ capital accounts. Performance measures are net of management fees, fund expenses and carried interest where applicable.`,
        },
        { id: id("nd-src"), type: "table", table: "sources", title: "Data sources" },
        {
          id: id("nd-disc"),
          type: "disclosures",
          text: "This report is confidential and intended solely for the limited partners of the fund. It does not constitute an offer to sell or a solicitation of an offer to buy any security. Past performance is not indicative of future results. Valuations of unrealized investments are estimates and may differ from the values ultimately realized.",
        },
        {
          id: id("nd-sig"),
          type: "signature",
          signers: [
            { name: signer, role: `${f.manager}, general partner` },
            { name: "Luiza Andrade", role: "Head of Fund Services, Aurum Asset Management" },
          ],
        },
      ],
    },
  ];
}

/** One plain sentence about the fund, from its record: strategy, region, form, domicile, vintage and manager. */
function overview(f: NonNullable<ReturnType<typeof fundById>>) {
  const [what, where] = f.strategy.split(" — ");
  const focus = `${what.charAt(0).toLowerCase()}${what.slice(1)}${where ? ` in ${where}` : ""}`;
  return `{{fund}} invests in ${focus}. It is a ${f.legalForm.toLowerCase()} domiciled in ${f.domicile}, of vintage ${f.vintage}, managed by {{gp}} and administered by Aurum Asset Management.`;
}

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
};

export const CHART_NAME: Record<ChartKind, string> = {
  nav: "NAV evolution",
  deployment: "Capital deployment",
  flows: "Contributions and distributions",
  utilization: "Commitment utilization",
  allocation: "Allocation by investment",
};
export const TABLE_NAME: Record<TableKind, string> = {
  terms: "Key terms",
  performance: "Performance summary",
  calls: "Capital calls",
  distributions: "Distributions",
  holdings: "Investments",
  sources: "Data sources",
};
