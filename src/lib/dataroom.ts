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
export type Question = { id: string; roomId: string; from: string; firm: string; at: string; text: string; docIndex?: string; answer?: string; answeredBy?: string; status: "Open" | "Answered" };
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
  { id: "q4", roomId: "rm-stx", from: "Thomas Reyes", firm: "Corbel Partners", at: "2026-11-21T14:30:00Z", text: "Who is the fund’s auditor and when is the first audited statement expected?", status: "Open" },
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
