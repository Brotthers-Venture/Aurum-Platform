/** Sales — Aurum's own business development: prospects, pipeline, proposals and forecast (USD, annual fees). */

export const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
export type Stage = (typeof STAGES)[number];
export const PROBABILITY: Record<Stage, number> = { Lead: 0.1, Qualified: 0.25, Proposal: 0.5, Negotiation: 0.75, Won: 1, Lost: 0 };

export type Deal = {
  id: string;
  account: string;
  contact: string;
  title: string;
  solution: string;
  stage: Stage;
  /** expected annual fees to Aurum */
  arr: number;
  owner: string;
  source: "Referral" | "Conference" | "Inbound" | "Existing client" | "Outbound";
  created: string;
  close: string;
  nextStep?: string;
  nextDate?: string;
  /** proposal terms, once sent */
  terms?: string;
  proposalSent?: string;
  lostReason?: string;
};

export type Activity = { id: string; dealId: string; kind: "Call" | "Meeting" | "Email" | "Proposal" | "Note"; at: string; by: string; note: string };

export const deals: Deal[] = [
  { id: "d1", account: "Ridgeline Capital Partners", contact: "Michael Torres", title: "Managing Partner", solution: "fund", stage: "Proposal", arr: 96_000, owner: "Managing Partner", source: "Referral", created: "2026-09-12", close: "2026-12-18", nextStep: "Walk through fee proposal", nextDate: "2026-11-26", terms: "5 bps on NAV · $80k minimum · Professional plan", proposalSent: "2026-11-14" },
  { id: "d2", account: "Bluestone Credit Opportunities", contact: "Rachel Kim", title: "COO", solution: "fund", stage: "Qualified", arr: 72_000, owner: "Juliana Teixeira", source: "Conference", created: "2026-10-03", close: "2027-01-29", nextStep: "Send ODD questionnaire answers", nextDate: "2026-11-27" },
  { id: "d3", account: "Mariposa Family Office", contact: "Elena Mariposa", title: "Family Principal", solution: "multi-family", stage: "Negotiation", arr: 180_000, owner: "Helena Costa", source: "Referral", created: "2026-08-20", close: "2026-12-12", nextStep: "Redline on engagement letter", nextDate: "2026-11-25", terms: "$15,000 / month retainer · Essential plan", proposalSent: "2026-10-28" },
  { id: "d4", account: "Tidewater Ventures", contact: "Sam Reyes", title: "General Partner", solution: "fund", stage: "Lead", arr: 48_000, owner: "Juliana Teixeira", source: "Inbound", created: "2026-11-19", close: "2027-03-31", nextStep: "Intro call", nextDate: "2026-12-02" },
  { id: "d5", account: "Harbor Point Real Estate", contact: "Linda Osei", title: "CFO", solution: "offering", stage: "Proposal", arr: 60_000, owner: "Olivia Brandt", source: "Existing client", created: "2026-10-15", close: "2027-01-15", nextStep: "Broker-dealer intro", nextDate: "2026-12-01", terms: "$20,000 per milestone · 3 milestones", proposalSent: "2026-11-10" },
  { id: "d6", account: "Kestrel Digital Assets", contact: "Ari Feldman", title: "CEO", solution: "blockchain", stage: "Qualified", arr: 84_000, owner: "Priya Raman", source: "Conference", created: "2026-10-22", close: "2027-02-26", nextStep: "Technical scoping session", nextDate: "2026-12-03" },
  { id: "d7", account: "Anchor Bay Holdings", contact: "Grace Liu", title: "Director", solution: "corporate", stage: "Won", arr: 28_800, owner: "Eduardo Sales", source: "Referral", created: "2026-09-30", close: "2026-11-18", terms: "$2,400 per entity · 12 entities", proposalSent: "2026-10-20" },
  { id: "d8", account: "Solaris Infra Brasil", contact: "Rodrigo Almeida", title: "Sócio-diretor", solution: "fund", stage: "Negotiation", arr: 132_000, owner: "Managing Partner", source: "Outbound", created: "2026-07-14", close: "2026-12-20", nextStep: "Final fee call", nextDate: "2026-11-30", terms: "6 bps on NAV · $100k minimum · Institutional plan", proposalSent: "2026-10-05" },
  { id: "d9", account: "Northwind Treasury Group", contact: "Hannah Brooks", title: "Treasurer", solution: "banking", stage: "Lead", arr: 50_400, owner: "Noah Whitaker", source: "Inbound", created: "2026-11-21", close: "2027-03-15", nextStep: "Discovery call", nextDate: "2026-12-04" },
  { id: "d10", account: "Greystone Search Fund", contact: "Peter Vance", title: "Principal", solution: "fund", stage: "Lost", arr: 36_000, owner: "Juliana Teixeira", source: "Inbound", created: "2026-08-02", close: "2026-10-30", lostReason: "Stayed with incumbent administrator" },
  { id: "d11", account: "Pinecrest Family", contact: "Laura Pinecrest", title: "Family CFO", solution: "multi-family", stage: "Lead", arr: 120_000, owner: "Helena Costa", source: "Referral", created: "2026-11-12", close: "2027-04-30", nextStep: "Meeting in Miami", nextDate: "2026-12-08" },
  { id: "d12", account: "Atlas Growth Partners", contact: "Daniel Shapiro", title: "Partner", solution: "fund", stage: "Qualified", arr: 110_000, owner: "Managing Partner", source: "Referral", created: "2026-10-28", close: "2027-02-12", nextStep: "Demo of investor portal", nextDate: "2026-11-25" },
  { id: "d13", account: "Coastal Ridge Holdings", contact: "Mark Ellison", title: "CFO", solution: "corporate", stage: "Won", arr: 19_200, owner: "Eduardo Sales", source: "Existing client", created: "2026-09-02", close: "2026-10-14", terms: "$2,400 per entity · 8 entities", proposalSent: "2026-09-20" },
];

export const activities: Activity[] = [
  { id: "a1", dealId: "d1", kind: "Proposal", at: "2026-11-14T15:00:00Z", by: "Managing Partner", note: "Fee proposal sent: 5 bps on NAV, $80k minimum, Professional plan." },
  { id: "a2", dealId: "d1", kind: "Call", at: "2026-11-20T18:30:00Z", by: "Managing Partner", note: "Michael asked for a reporting sample and our SOC 1 report. Shared the ODD data room." },
  { id: "a3", dealId: "d3", kind: "Meeting", at: "2026-11-18T14:00:00Z", by: "Helena Costa", note: "Met Elena and family counsel in Coral Gables. Retainer agreed in principle." },
  { id: "a4", dealId: "d8", kind: "Email", at: "2026-11-22T12:10:00Z", by: "Managing Partner", note: "Sent BRL reporting example with PTAX translation." },
  { id: "a5", dealId: "d12", kind: "Call", at: "2026-11-23T16:00:00Z", by: "Managing Partner", note: "Daniel wants to see the white-labeled investor portal before the partners meeting." },
  { id: "a6", dealId: "d5", kind: "Proposal", at: "2026-11-10T13:00:00Z", by: "Olivia Brandt", note: "Milestone proposal sent." },
  { id: "a7", dealId: "d2", kind: "Email", at: "2026-11-21T19:40:00Z", by: "Juliana Teixeira", note: "Received their ODD questionnaire — 62 questions." },
  { id: "a8", dealId: "d7", kind: "Note", at: "2026-11-18T17:00:00Z", by: "Eduardo Sales", note: "Engagement letter signed. Handed over to onboarding." },
  { id: "a9", dealId: "d9", kind: "Email", at: "2026-11-21T13:00:00Z", by: "Noah Whitaker", note: "Inbound from website — six operating accounts across two banks." },
];

export const isOpenDeal = (d: Deal) => d.stage !== "Won" && d.stage !== "Lost";
export const weighted = (d: Deal) => d.arr * PROBABILITY[d.stage];

export function salesCounts() {
  return {
    open: deals.filter(isOpenDeal).length,
    leads: deals.filter((d) => d.stage === "Lead").length,
    proposals: deals.filter((d) => d.stage === "Proposal" || d.stage === "Negotiation").length,
    activities: activities.filter((a) => a.at >= "2026-11-18").length,
    wonQuarter: deals.filter((d) => d.stage === "Won" && d.close >= "2026-10-01").length,
  };
}
