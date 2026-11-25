/**
 * Data rooms — secure rooms Aurum runs for fundraising, offerings, diligence, audits and M&A.
 * External people sign an NDA before they see anything; every view and download is logged.
 */

export type RoomPurpose = "Fundraising" | "Offering" | "Due diligence" | "Audit" | "M&A" | "Operational due diligence";
export type Permission = "View" | "Download" | "Print" | "Manage";

export type Room = {
  id: string;
  name: string;
  purpose: RoomPurpose;
  client: string;
  solution: string;
  status: "Open" | "Preparing" | "Closed";
  owner: string;
  nda: boolean;
  watermark: boolean;
  expires: string;
  created: string;
};

export type RoomDoc = { id: string; roomId: string; index: string; folder: string; name: string; size: number; views: number; lastViewed?: string; lastViewer?: string };
export type RoomUser = { id: string; roomId: string; name: string; firm: string; group: string; permission: Permission; nda: "Signed" | "Pending" | "Not required"; lastSeen?: string };
/** Q&A: a drafted answer is reviewed before it is released to the viewer (status "Draft"). */
export type Question = { id: string; roomId: string; from: string; firm: string; at: string; text: string; docIndex?: string; page?: number; draft?: string; answer?: string; answeredBy?: string; status: "Open" | "Draft" | "Answered" };
export type View = { id: string; roomId: string; who: string; firm: string; doc: string; at: string; seconds: number; action: "Viewed" | "Downloaded" | "Printed" };

export const rooms: Room[] = [
  { id: "rm-cascade", name: "Cascade Real Estate Fund I", purpose: "Offering", client: "Cascade Ridge Partners", solution: "offering", status: "Open", owner: "Olivia Brandt", nda: true, watermark: true, expires: "2027-02-28", created: "2026-09-01" },
  { id: "rm-stx", name: "STX-Brazil Affordable Housing Fund I", purpose: "Fundraising", client: "Strlex Capital", solution: "fund", status: "Open", owner: "Luiza Andrade", nda: true, watermark: true, expires: "2027-03-31", created: "2026-10-05" },
  { id: "rm-odd", name: "Aurum — operational due diligence", purpose: "Operational due diligence", client: "Aurum (prospects)", solution: "aurum", status: "Open", owner: "Managing Partner", nda: true, watermark: true, expires: "2027-12-31", created: "2026-06-01" },
  { id: "rm-ledger", name: "Ledgerline Notes — transfer agent diligence", purpose: "Due diligence", client: "Ledgerline Digital", solution: "blockchain", status: "Open", owner: "Priya Raman", nda: true, watermark: false, expires: "2026-12-31", created: "2026-09-10" },
  { id: "rm-altamira", name: "Altamira — subsidiary acquisition", purpose: "M&A", client: "Altamira Holdings", solution: "corporate", status: "Open", owner: "Eduardo Sales", nda: true, watermark: true, expires: "2027-01-31", created: "2026-11-02" },
  { id: "rm-cord-audit", name: "Cordillera Infrastructure I — FY2026 audit", purpose: "Audit", client: "Cordillera", solution: "fund", status: "Preparing", owner: "Rafael Mendes", nda: false, watermark: false, expires: "2027-04-30", created: "2026-11-21" },
];

const FOLDERS: Record<RoomPurpose, [string, string[]][]> = {
  Offering: [
    ["1 Offering documents", ["Private Placement Memorandum v3.pdf", "Limited Partnership Agreement.pdf", "Subscription Agreement.pdf", "Investor questionnaire.pdf"]],
    ["2 Properties", ["Portfolio summary.xlsx", "Appraisals — 4 properties.pdf", "Rent roll Q3 2026.xlsx"]],
    ["3 Financials", ["Pro forma model.xlsx", "Audited financials 2025.pdf"]],
    ["4 Legal & compliance", ["Broker-dealer agreement.pdf", "Form D (draft).pdf"]],
  ],
  Fundraising: [
    ["1 Fund overview", ["Pitch deck — Nov 2026.pdf", "Track record.xlsx"]],
    ["2 Legal", ["LPA (draft).pdf", "Subscription documents.pdf", "Side letter template.pdf"]],
    ["3 Operations", ["Aurum administration agreement.pdf", "Valuation policy.pdf", "AML policy.pdf"]],
  ],
  "Operational due diligence": [
    ["1 Firm", ["Aurum — firm overview.pdf", "Organisation chart.pdf", "Insurance certificates.pdf"]],
    ["2 Controls", ["SOC 1 Type II — 2025.pdf", "Information security policy.pdf", "Business continuity plan.pdf"]],
    ["3 Compliance", ["AML/KYC program.pdf", "Code of ethics.pdf"]],
    ["4 Samples", ["Sample investor statement.pdf", "Sample capital call notice.pdf", "Sample NAV pack.xlsx"]],
  ],
  "Due diligence": [
    ["1 Corporate", ["Certificate of incorporation.pdf", "Board minutes 2026.pdf"]],
    ["2 Technology", ["Smart-contract audit.pdf", "Token terms.pdf"]],
    ["3 Register", ["Holder register — Nov 2026.xlsx"]],
  ],
  "M&A": [
    ["1 Target", ["Information memorandum.pdf", "Cap table.xlsx", "Financial statements 2023–2025.pdf"]],
    ["2 Legal", ["Material contracts index.xlsx", "Litigation schedule.pdf"]],
    ["3 Transaction", ["LOI — signed.pdf", "SPA draft v2.docx"]],
  ],
  Audit: [
    ["1 PBC", ["PBC list.pdf", "Trial balance FY2026.xlsx"]],
    ["2 Confirmations", ["Bank confirmations.pdf"]],
  ],
};

let d = 0;
const viewsSeed = [41, 28, 19, 12, 9, 7, 5, 22, 14, 3, 8, 11, 6, 2, 17, 4];
export const docs: RoomDoc[] = rooms.flatMap((r) =>
  FOLDERS[r.purpose].flatMap(([folder, files], fi) =>
    files.map((name, i) => {
      const v = r.status === "Preparing" ? 0 : viewsSeed[(d + i) % viewsSeed.length];
      d++;
      return {
        id: `doc${d}`,
        roomId: r.id,
        index: `${fi + 1}.${i + 1}`,
        folder,
        name,
        size: 120_000 + ((d * 389_123) % 4_800_000),
        views: v,
        lastViewed: v ? `2026-11-${String(10 + ((d * 7) % 14)).padStart(2, "0")}` : undefined,
        lastViewer: v ? ["Calloway Family Trust", "Brightwater Pension", "Northgate Endowment", "Corbel Partners", "Hartwell & Pryce LLP"][d % 5] : undefined,
      };
    }),
  ),
);

export const roomUsers: RoomUser[] = [
  { id: "u1", roomId: "rm-cascade", name: "Margaret Calloway", firm: "Calloway Family Trust", group: "Investors", permission: "View", nda: "Signed", lastSeen: "2026-11-24" },
  { id: "u2", roomId: "rm-cascade", name: "Daniel Okafor", firm: "Brightwater Pension", group: "Investors", permission: "Download", nda: "Signed", lastSeen: "2026-11-23" },
  { id: "u3", roomId: "rm-cascade", name: "Kevin Marsh", firm: "Lakeshore Capital", group: "Investors", permission: "View", nda: "Pending" },
  { id: "u4", roomId: "rm-cascade", name: "Rita Gomez", firm: "Summit Securities (broker-dealer)", group: "Broker-dealer", permission: "Manage", nda: "Signed", lastSeen: "2026-11-22" },
  { id: "u5", roomId: "rm-cascade", name: "Tom Ashford", firm: "Cascade Ridge Partners", group: "Sponsor", permission: "Manage", nda: "Not required", lastSeen: "2026-11-24" },
  { id: "u6", roomId: "rm-stx", name: "Susan Whitfield", firm: "Northgate Endowment", group: "Investors", permission: "View", nda: "Signed", lastSeen: "2026-11-20" },
  { id: "u7", roomId: "rm-stx", name: "Thomas Reyes", firm: "Corbel Partners", group: "Investors", permission: "Download", nda: "Signed", lastSeen: "2026-11-21" },
  { id: "u8", roomId: "rm-stx", name: "Clara Huang", firm: "Sterling Ridge Foundation", group: "Investors", permission: "View", nda: "Pending" },
  { id: "u9", roomId: "rm-odd", name: "Michael Torres", firm: "Ridgeline Capital", group: "Prospects", permission: "View", nda: "Signed", lastSeen: "2026-11-21" },
  { id: "u10", roomId: "rm-odd", name: "Rachel Kim", firm: "Bluestone Credit", group: "Prospects", permission: "View", nda: "Signed", lastSeen: "2026-11-22" },
  { id: "u11", roomId: "rm-odd", name: "Daniel Shapiro", firm: "Atlas Growth Partners", group: "Prospects", permission: "View", nda: "Pending" },
  { id: "u12", roomId: "rm-ledger", name: "Laura Chen", firm: "Hartwell & Pryce LLP", group: "Counsel", permission: "Download", nda: "Signed", lastSeen: "2026-11-19" },
  { id: "u13", roomId: "rm-altamira", name: "James Whitmore", firm: "Whitmore Advisory", group: "Buyer advisers", permission: "View", nda: "Signed", lastSeen: "2026-11-24" },
  { id: "u14", roomId: "rm-altamira", name: "Priscila Nunes", firm: "Altamira Holdings", group: "Seller", permission: "Manage", nda: "Not required", lastSeen: "2026-11-23" },
];

export const questions: Question[] = [
  { id: "q1", roomId: "rm-cascade", from: "Daniel Okafor", firm: "Brightwater Pension", at: "2026-11-23T15:20:00Z", text: "Can you confirm the cap rate assumption used for the Tampa property in the pro forma?", docIndex: "3.1", status: "Open" },
  { id: "q2", roomId: "rm-cascade", from: "Margaret Calloway", firm: "Calloway Family Trust", at: "2026-11-24T13:05:00Z", text: "Is the minimum commitment negotiable for existing investors in Cascade’s prior vehicles?", docIndex: "1.1", status: "Open" },
  { id: "q3", roomId: "rm-cascade", from: "Rita Gomez", firm: "Summit Securities", at: "2026-11-20T17:00:00Z", text: "Please upload the executed broker-dealer agreement.", docIndex: "4.1", answer: "Uploaded as 4.1 — executed version.", answeredBy: "Olivia Brandt", status: "Answered" },
  { id: "q4", roomId: "rm-stx", from: "Thomas Reyes", firm: "Corbel Partners", at: "2026-11-21T14:30:00Z", text: "Who is the fund’s auditor and when is the first audited statement expected?", draft: "Blake Morrow CPAs; first audited statements for the year ending December 31, 2027.", status: "Draft" },
  { id: "q5", roomId: "rm-odd", from: "Rachel Kim", firm: "Bluestone Credit", at: "2026-11-22T19:10:00Z", text: "Does Aurum carry cyber insurance? Please share limits.", docIndex: "1.3", status: "Open" },
  { id: "q6", roomId: "rm-odd", from: "Michael Torres", firm: "Ridgeline Capital", at: "2026-11-21T16:00:00Z", text: "Is the SOC 1 report Type II, and what period does it cover?", docIndex: "2.1", answer: "Type II, covering October 1, 2024 to September 30, 2025.", answeredBy: "Carla Nogueira", status: "Answered" },
];

export const views: View[] = [
  { id: "v1", roomId: "rm-cascade", who: "Margaret Calloway", firm: "Calloway Family Trust", doc: "Private Placement Memorandum v3.pdf", at: "2026-11-24T14:40:00Z", seconds: 1260, action: "Viewed" },
  { id: "v2", roomId: "rm-altamira", who: "James Whitmore", firm: "Whitmore Advisory", doc: "Cap table.xlsx", at: "2026-11-24T14:12:00Z", seconds: 340, action: "Viewed" },
  { id: "v3", roomId: "rm-cascade", who: "Daniel Okafor", firm: "Brightwater Pension", doc: "Pro forma model.xlsx", at: "2026-11-23T15:02:00Z", seconds: 0, action: "Downloaded" },
  { id: "v4", roomId: "rm-odd", who: "Rachel Kim", firm: "Bluestone Credit", doc: "SOC 1 Type II — 2025.pdf", at: "2026-11-22T18:44:00Z", seconds: 2110, action: "Viewed" },
  { id: "v5", roomId: "rm-stx", who: "Thomas Reyes", firm: "Corbel Partners", doc: "LPA (draft).pdf", at: "2026-11-21T14:01:00Z", seconds: 1880, action: "Viewed" },
  { id: "v6", roomId: "rm-odd", who: "Michael Torres", firm: "Ridgeline Capital", doc: "Sample NAV pack.xlsx", at: "2026-11-21T15:30:00Z", seconds: 0, action: "Downloaded" },
  { id: "v7", roomId: "rm-cascade", who: "Rita Gomez", firm: "Summit Securities", doc: "Form D (draft).pdf", at: "2026-11-22T11:20:00Z", seconds: 420, action: "Printed" },
  { id: "v8", roomId: "rm-ledger", who: "Laura Chen", firm: "Hartwell & Pryce LLP", doc: "Smart-contract audit.pdf", at: "2026-11-19T20:15:00Z", seconds: 2600, action: "Viewed" },
];

export function dataroomCounts() {
  return {
    rooms: rooms.filter((r) => r.status !== "Closed").length,
    questions: questions.filter((q) => q.status === "Open").length,
    viewsToday: views.filter((v) => v.at.startsWith("2026-11-24")).length,
    ndas: roomUsers.filter((u) => u.nda === "Pending").length,
    users: roomUsers.length,
  };
}

/* ───────────────────────── sharing: links, layers, page analytics ───────────────────────── */

export type FolderAccess = "none" | "view" | "download" | "upload";
export type NdaMode = "off" | "acknowledge" | "esign";

/**
 * A share link = one audience. Every security control is independent and can be combined:
 * email verification, password, NDA, access questions, dynamic watermark, screenshot protection,
 * download / print, expiry, domain allow & block lists, and per-folder access.
 */
export type ShareLink = {
  id: string;
  roomId: string;
  name: string;
  mode: "invite" | "link";
  invited: string[];
  verifyEmail: boolean;
  password?: string;
  nda: NdaMode;
  questions: string[];
  watermark: boolean;
  screenshot: boolean;
  download: boolean;
  print: boolean;
  expires?: string;
  allowDomains: string[];
  blockDomains: string[];
  folders: Record<string, FolderAccess>;
  welcome: string;
  created: string;
  revoked?: boolean;
};

export type RoomBrand = {
  gpId?: string;
  primary: string;
  secondary: string;
  wordmark: string;
  tagline: string;
  /** per-room overrides set in the console's Branding tab */
  logo?: string;
  banner?: string;
  entry?: "light" | "warm" | "slate" | "dark";
  welcome?: string;
};
export const roomBrand: Record<string, RoomBrand> = {
  "rm-cascade": { primary: "#2F4A3A", secondary: "#C9B37E", wordmark: "Cascade Ridge", tagline: "Real Estate Partners" },
  "rm-stx": { gpId: "strlex", primary: "#191E31", secondary: "#8A93AD", wordmark: "Strlex Capital", tagline: "Capital Group" },
  "rm-odd": { primary: "#0F2340", secondary: "#F8C618", wordmark: "Aurum", tagline: "Asset Management" },
  "rm-ledger": { primary: "#2C3E50", secondary: "#7FA7C9", wordmark: "Ledgerline", tagline: "Digital" },
  "rm-altamira": { primary: "#3F3350", secondary: "#B9A5D3", wordmark: "Altamira", tagline: "Holdings" },
  "rm-cord-audit": { gpId: "cordillera", primary: "#3A4A5C", secondary: "#B8975A", wordmark: "Cordillera", tagline: "Infrastructure Advisors" },
};

const foldersOf = (roomId: string) => [...new Set(docs.filter((x) => x.roomId === roomId).map((x) => x.folder))];
const allFolders = (roomId: string, access: FolderAccess, except: Record<string, FolderAccess> = {}) =>
  Object.fromEntries(foldersOf(roomId).map((f) => [f, except[f] ?? access]));

export const shareLinks: ShareLink[] = [
  {
    id: "cascade-lps",
    roomId: "rm-cascade",
    name: "Prospective investors",
    mode: "link",
    invited: [],
    verifyEmail: true,
    nda: "esign",
    questions: ["Are you an accredited investor?", "Which entity would invest?"],
    watermark: true,
    screenshot: true,
    download: false,
    print: false,
    expires: "2027-02-28",
    allowDomains: [],
    blockDomains: ["mailinator.com", "tempmail.com"],
    folders: allFolders("rm-cascade", "view", { "4 Legal & compliance": "none" }),
    welcome: "Welcome to the Cascade Real Estate Fund I data room. Everything you need for your diligence is here — reach out through Q&A with any question.",
    created: "2026-09-01",
  },
  {
    id: "cascade-bd",
    roomId: "rm-cascade",
    name: "Summit Securities (broker-dealer)",
    mode: "invite",
    invited: ["rgomez@summitsecurities.com"],
    verifyEmail: true,
    nda: "acknowledge",
    questions: [],
    watermark: true,
    screenshot: false,
    download: true,
    print: true,
    expires: "2027-02-28",
    allowDomains: ["summitsecurities.com"],
    blockDomains: [],
    folders: allFolders("rm-cascade", "download"),
    welcome: "Full room access for the placement agent.",
    created: "2026-09-03",
  },
  {
    id: "stx-lps",
    roomId: "rm-stx",
    name: "Prospective LPs",
    mode: "link",
    invited: [],
    verifyEmail: true,
    nda: "acknowledge",
    questions: [],
    watermark: true,
    screenshot: true,
    download: false,
    print: false,
    expires: "2027-03-31",
    allowDomains: [],
    blockDomains: [],
    folders: allFolders("rm-stx", "view"),
    welcome: "Thank you for your interest in STX-Brazil Affordable Housing Fund I.",
    created: "2026-10-05",
  },
  {
    id: "aurum-odd",
    roomId: "rm-odd",
    name: "Prospective clients — ODD",
    mode: "link",
    invited: [],
    verifyEmail: true,
    password: "endure2026",
    nda: "esign",
    questions: ["Firm name"],
    watermark: true,
    screenshot: true,
    download: false,
    print: false,
    expires: "2027-12-31",
    allowDomains: [],
    blockDomains: ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"],
    folders: allFolders("rm-odd", "view", { "4 Samples": "download" }),
    welcome: "Everything for your operational due diligence on Aurum: controls, policies and sample reporting.",
    created: "2026-06-01",
  },
  {
    id: "ledger-counsel",
    roomId: "rm-ledger",
    name: "Counsel",
    mode: "invite",
    invited: ["lchen@hartwellpryce.com"],
    verifyEmail: true,
    nda: "off",
    questions: [],
    watermark: false,
    screenshot: false,
    download: true,
    print: true,
    expires: "2026-12-31",
    allowDomains: [],
    blockDomains: [],
    folders: allFolders("rm-ledger", "download"),
    welcome: "Transfer agent diligence materials.",
    created: "2026-09-10",
  },
  {
    id: "altamira-buyer",
    roomId: "rm-altamira",
    name: "Buyer: Whitmore Advisory",
    mode: "invite",
    invited: ["jwhitmore@whitmoreadvisory.com"],
    verifyEmail: true,
    nda: "esign",
    questions: [],
    watermark: true,
    screenshot: true,
    download: false,
    print: false,
    expires: "2027-01-31",
    allowDomains: ["whitmoreadvisory.com"],
    blockDomains: [],
    folders: allFolders("rm-altamira", "view", { "3 Transaction": "none" }),
    welcome: "Confidential — subsidiary acquisition.",
    created: "2026-11-02",
  },
];

/** Pages in a document (deterministic from its name — real files report their own page count). */
export function pageCount(name: string) {
  if (/\.(xlsx|csv)$/i.test(name)) return 2;
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 4 + (h % 7);
}

/** Seconds spent per page by viewer — the page-by-page engagement record. */
export type PageView = { docId: string; viewer: string; firm: string; page: number; seconds: number; at: string };
export const pageViews: PageView[] = (() => {
  const out: PageView[] = [];
  const pick = (roomId: string, i: number) => docs.filter((x) => x.roomId === roomId)[i];
  const add = (doc: RoomDoc | undefined, viewer: string, firm: string, at: string, curve: number[]) => {
    if (!doc) return;
    const n = pageCount(doc.name);
    for (let p = 1; p <= n; p++) {
      const s = curve[Math.min(p - 1, curve.length - 1)];
      if (s > 0) out.push({ docId: doc.id, viewer, firm, page: p, seconds: s, at });
    }
  };
  add(pick("rm-cascade", 0), "Margaret Calloway", "Calloway Family Trust", "2026-11-24T14:40:00Z", [95, 240, 310, 180, 60, 45, 20, 0]);
  add(pick("rm-cascade", 0), "Daniel Okafor", "Brightwater Pension", "2026-11-23T15:00:00Z", [40, 120, 420, 380, 260, 150, 90, 70]);
  add(pick("rm-cascade", 7), "Daniel Okafor", "Brightwater Pension", "2026-11-23T15:20:00Z", [300, 520]);
  add(pick("rm-cascade", 1), "Kevin Marsh", "Lakeshore Capital", "2026-11-22T13:00:00Z", [60, 30, 10, 0]);
  add(pick("rm-odd", 3), "Rachel Kim", "Bluestone Credit", "2026-11-22T18:44:00Z", [120, 300, 410, 380, 290, 220, 160]);
  add(pick("rm-odd", 9), "Michael Torres", "Ridgeline Capital", "2026-11-21T15:30:00Z", [200, 180]);
  add(pick("rm-stx", 2), "Thomas Reyes", "Corbel Partners", "2026-11-21T14:01:00Z", [80, 260, 340, 400, 120, 90]);
  return out;
})();

/** Generic, deterministic page text for the in-browser viewer (stands in until real files are stored). */
export function pageText(docName: string, page: number): { heading: string; body: string[] } {
  const title = docName.replace(/\.[a-z]+$/i, "");
  if (page === 1) return { heading: title, body: ["Confidential", "Prepared for authorised recipients only. Do not forward."] };
  const sections = ["Overview", "Terms and structure", "Investment strategy", "Risk factors", "Fees and expenses", "Governance", "Reporting", "Valuation", "Legal matters", "Appendix"];
  const lines = [
    "This section summarises the principal terms. Recipients should read it together with the governing documents, which prevail in case of any inconsistency.",
    "Capital contributions are drawn down on not less than ten business days’ notice, pro rata to commitments, in the currency of the vehicle.",
    "The administrator maintains the register, calculates net asset value each quarter and delivers investor statements within forty-five days of quarter end.",
    "Distributions follow the waterfall set out in the partnership agreement: return of capital, preferred return, catch-up, then carried interest.",
    "Figures in this document are unaudited unless stated otherwise and may change. Past performance does not indicate future results.",
    "Questions about this document should be submitted through the data room Q&A so that answers are recorded for all eligible recipients.",
  ];
  let h = page * 7 + docName.length;
  const body = Array.from({ length: 4 }, () => lines[(h = (h * 13 + 5) % lines.length)]);
  return { heading: `${page - 1}. ${sections[(page - 2 + docName.length) % sections.length]}`, body };
}


/** Room-level defaults that shape how the room looks and behaves for every visitor. */
export type RoomSettings = {
  indexNumbers: boolean;
  visitorQa: boolean;
  showCover: boolean;
  showLogo: boolean;
  newFileDigest: boolean;
  hideNewContent: boolean;
  domain: string;
  /** Q&A: basic = submitter → coordinator; advanced adds an expert draft and/or a final approver */
  qaFlow: "basic" | "advanced";
  qaExpert: boolean;
  qaApprover: boolean;
};
export const defaultSettings: RoomSettings = {
  indexNumbers: true,
  visitorQa: true,
  showCover: true,
  showLogo: true,
  newFileDigest: false,
  hideNewContent: false,
  domain: "aurum-platform-6sal.vercel.app",
  qaFlow: "advanced",
  qaExpert: false,
  qaApprover: true,
};
export const roomSettings: Record<string, RoomSettings> = Object.fromEntries(rooms.map((r) => [r.id, { ...defaultSettings, visitorQa: r.purpose !== "Audit" }]));
