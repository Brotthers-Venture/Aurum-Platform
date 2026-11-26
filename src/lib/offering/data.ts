/**
 * Offering Solution — capital formation records (prototype).
 *
 * Built on existing records, never copies of them:
 *  • investors and accepted commitments, called and received capital: Fund Solution (`investors`, capital accounts from
 *    the books). "Funded" comes only from the ledger.
 *  • subscriptions in progress: Fund Solution onboarding.
 *  • NDAs, document engagement and questions: Data Rooms.
 * What exists nowhere yet — early prospects, their potential tickets, meetings, notes and target closing dates — is
 * marked `illustrative` and labelled wherever it shows.
 */
import { capitalAccounts, fundById, funds, investors, onboarding, type Investor } from "@/lib/data";
import { questions, roomUsers, rooms, views } from "@/lib/dataroom";

export const O_TODAY = "2026-11-24";
const fmtUsd = (v: number) => `$${(v / 1e6).toFixed(v % 1e6 ? 1 : 0)}M`;

/* ───────── stages ───────── */

export type PhaseId = "prospecting" | "diligence" | "subscription" | "closed";
export type StageId =
  | "identified"
  | "contacted"
  | "interested"
  | "nda_sent"
  | "nda_executed"
  | "due_diligence"
  | "ioi"
  | "soft"
  | "subscription"
  | "pending_approval"
  | "accepted"
  | "funded"
  | "on_hold"
  | "declined"
  | "withdrawn"
  | "not_eligible";

export const PHASES: { id: PhaseId; label: string }[] = [
  { id: "prospecting", label: "Prospecting" },
  { id: "diligence", label: "Diligence" },
  { id: "subscription", label: "Subscription" },
  { id: "closed", label: "Closed" },
];

/** `gate`: the evidence a stage needs; such stages are never set by dragging. */
export const STAGES: { id: StageId; label: string; phase: PhaseId | null; gate?: string }[] = [
  { id: "identified", label: "Identified", phase: "prospecting" },
  { id: "contacted", label: "Contacted", phase: "prospecting" },
  { id: "interested", label: "Interested", phase: "prospecting" },
  { id: "nda_sent", label: "NDA sent", phase: "diligence" },
  { id: "nda_executed", label: "NDA executed", phase: "diligence", gate: "An executed NDA on file, with the signed document or the data room’s acceptance record." },
  { id: "due_diligence", label: "Due diligence", phase: "diligence" },
  { id: "ioi", label: "Indication of interest", phase: "diligence" },
  { id: "soft", label: "Soft commitment", phase: "subscription" },
  { id: "subscription", label: "Subscription in progress", phase: "subscription" },
  { id: "pending_approval", label: "Pending approval", phase: "subscription" },
  { id: "accepted", label: "Commitment accepted", phase: "closed", gate: "The manager’s countersignature on the subscription and a cleared compliance file." },
  { id: "funded", label: "Funded", phase: "closed", gate: "Every amount called from the investor received, as recorded in the fund’s books." },
  { id: "on_hold", label: "On hold", phase: null },
  { id: "declined", label: "Declined", phase: null },
  { id: "withdrawn", label: "Withdrawn", phase: null },
  { id: "not_eligible", label: "Not eligible", phase: null },
];
export const stageOf = (id: StageId) => STAGES.find((s) => s.id === id)!;
export const stageIndex = (id: StageId) => STAGES.findIndex((s) => s.id === id);
export const OPEN = (s: StageId) => stageOf(s).phase !== null && s !== "funded";

/* ───────── offerings ───────── */

export type OfferingType =
  "Private equity" | "Venture capital" | "Private credit" | "Real estate" | "Infrastructure" | "Special purpose vehicle" | "Co-investment" | "Direct placement";
export type Distributor = { name: string; kind: "Fund manager representative" | "Registered broker-dealer" | "Placement agent" | "Introducer" };

export type Offering = {
  id: string;
  name: string;
  short: string;
  /** the fund record when the vehicle exists; otherwise only the data room */
  fundId?: string;
  roomId?: string;
  sponsor: string;
  gpId?: string;
  manager: string;
  type: OfferingType;
  strategy: string;
  jurisdiction: string;
  currency: "USD";
  target: number | null;
  minimum: string | null;
  opened: string | null;
  /** next or final closing date; illustrative unless set on the fund */
  nextClose: { date: string; label: string } | null;
  status: "Preparing" | "Open" | "Subsequent close" | "Closed";
  exemption: string | null;
  eligibility: string | null;
  distributors: Distributor[];
  lead: string;
  /** fields that are illustrative, by name */
  illustrative: string[];
};

const fundOffering = (
  fundId: string,
  o: Omit<Offering, "name" | "short" | "fundId" | "sponsor" | "gpId" | "manager" | "strategy" | "jurisdiction" | "currency" | "target">,
): Offering => {
  const f = fundById(fundId)!;
  return {
    ...o,
    fundId,
    name: f.name,
    short: f.shortName,
    sponsor: f.gp,
    gpId: f.gpId,
    manager: f.manager,
    strategy: f.strategy,
    jurisdiction: f.domicile,
    currency: "USD",
    target: f.targetSize || null,
  };
};

export const OFFERINGS: Offering[] = [
  fundOffering("atlantico-vp-ii", {
    id: "of-atlantico",
    type: "Venture capital",
    minimum: "$1M",
    opened: "2025-09-30",
    nextClose: { date: "2026-12-15", label: "Second close" },
    status: "Open",
    exemption: null,
    eligibility: "Qualified purchasers (US) and non-US persons (Regulation S), per the subscriptions received",
    distributors: [{ name: "Atlântico Capital Gestão", kind: "Fund manager representative" }],
    lead: "Luiza Andrade",
    illustrative: ["nextClose"],
  }),
  fundOffering("stx-global", {
    id: "of-stx-global",
    type: "Private equity",
    minimum: null,
    opened: "2026-06-30",
    nextClose: { date: "2027-01-29", label: "Second close" },
    status: "Open",
    exemption: null,
    eligibility: null,
    distributors: [{ name: "Strlex Capital Group", kind: "Fund manager representative" }],
    lead: "Juliana Teixeira",
    illustrative: ["nextClose"],
  }),
  fundOffering("stx-brazil-housing", {
    id: "of-stx-brazil",
    roomId: "rm-stx",
    type: "Real estate",
    minimum: null,
    opened: "2024-09-30",
    nextClose: { date: "2027-02-26", label: "Subsequent close" },
    status: "Subsequent close",
    exemption: null,
    eligibility: null,
    distributors: [{ name: "Strlex Capital Group", kind: "Fund manager representative" }],
    lead: "Luiza Andrade",
    illustrative: ["nextClose"],
  }),
  {
    id: "of-cascade",
    name: "Cascade Real Estate Fund I",
    short: "Cascade RE I",
    roomId: "rm-cascade",
    sponsor: "Cascade Ridge Partners",
    manager: "Cascade Ridge Partners",
    type: "Real estate",
    strategy: "Real estate",
    jurisdiction: "Delaware, US",
    currency: "USD",
    target: 120_000_000,
    minimum: null,
    opened: "2026-09-01",
    nextClose: { date: "2027-01-15", label: "First close" },
    status: "Open",
    exemption: "Regulation D (Form D in preparation in the data room)",
    eligibility: null,
    distributors: [{ name: "Summit Securities", kind: "Registered broker-dealer" }],
    lead: "Olivia Brandt",
    illustrative: ["target", "nextClose"],
  },
  fundOffering("sagewood-seed-i", {
    id: "of-sagewood",
    type: "Venture capital",
    minimum: null,
    opened: null,
    nextClose: null,
    status: "Preparing",
    exemption: null,
    eligibility: null,
    distributors: [{ name: "Arbor Partners", kind: "Fund manager representative" }],
    lead: "Juliana Teixeira",
    illustrative: [],
  }),
];
export const offeringById = (id: string) => OFFERINGS.find((o) => o.id === id);

/* ───────── parties: investors on record, and prospects ───────── */

export type Party = {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  contact: string;
  email?: string;
  owner: string;
  source: string;
  /** an investor on record in Fund Solution (the same id); otherwise a prospect */
  investor?: Investor;
  kyc?: Investor["kyc"] | "Not started" | "Pending" | "Potential match";
  preferences?: { assetClasses: string[]; regions: string[]; ticket: string; horizon: string; restrictions: string };
  illustrative?: boolean;
};

const RM: Record<string, string> = { "L. Andrade": "Luiza Andrade", "R. Mendes": "Rafael Mendes", "J. Teixeira": "Juliana Teixeira" };
const fromInvestor = (i: Investor): Party => ({
  id: i.id,
  name: i.name,
  type: i.type,
  jurisdiction: i.jurisdiction,
  contact: i.contact,
  email: i.email,
  owner: RM[i.relationshipManager] ?? i.relationshipManager,
  source: "Investor on record",
  investor: i,
  kyc: i.kyc,
});

/** Prospects from subscriptions already in progress (not yet investors on record). */
const fromOnboarding = onboarding
  .filter((o) => !investors.some((i) => i.name === o.investorName))
  .map((o): Party => ({
    id: `pr-${o.id}`,
    name: o.investorName,
    type: o.investorType,
    jurisdiction: o.jurisdiction,
    contact: o.contactName,
    email: o.contactEmail,
    owner: RM[o.relationshipManager] ?? o.relationshipManager,
    source: "Subscription invitation",
    kyc: o.kyc === "Clear" ? "Clear" : o.kyc,
  }));

/** Early prospects: no record exists for them anywhere yet. */
const ILLUSTRATIVE: Party[] = [
  {
    id: "pr-westmere",
    name: "Westmere University Endowment",
    type: "Endowment",
    jurisdiction: "Connecticut, US",
    contact: "Hannah Price",
    owner: "Juliana Teixeira",
    source: "Introduced by Corbel Partners",
    illustrative: true,
  },
  {
    id: "pr-kilbride",
    name: "Kilbride Family Office",
    type: "Family office",
    jurisdiction: "London, UK",
    contact: "Edward Kilbride",
    owner: "Luiza Andrade",
    source: "Conference",
    illustrative: true,
  },
  {
    id: "pr-aldine",
    name: "Aldine State Teachers’ Retirement System",
    type: "Pension plan",
    jurisdiction: "Texas, US",
    contact: "Marcus Bell",
    owner: "Juliana Teixeira",
    source: "Consultant search",
    illustrative: true,
  },
  {
    id: "pr-pinecrest",
    name: "Pinecrest Insurance Group",
    type: "Insurance company",
    jurisdiction: "Bermuda",
    contact: "Laura Simmons",
    owner: "Rafael Mendes",
    source: "Existing relationship",
    illustrative: true,
  },
  {
    id: "pr-maraba",
    name: "Marabá Investimentos",
    type: "Family office",
    jurisdiction: "São Paulo, Brazil",
    contact: "Joana Lacerda",
    owner: "Luiza Andrade",
    source: "Introduced by Ferreira Holdings",
    illustrative: true,
  },
  {
    id: "pr-hartley",
    name: "Hartley Fund of Funds III",
    type: "Fund of funds",
    jurisdiction: "Delaware, US",
    contact: "Owen Hartley",
    owner: "Juliana Teixeira",
    source: "Inbound",
    illustrative: true,
  },
];

export const PARTIES: Party[] = [...investors.map(fromInvestor), ...fromOnboarding, ...ILLUSTRATIVE];
// stated preferences are illustrative until investors record them
const corbel = PARTIES.find((p) => p.id === "inv-corbel")!;
corbel.preferences = {
  assetClasses: ["Venture capital", "Private equity", "Real estate"],
  regions: ["Americas"],
  ticket: "$10M–$20M",
  horizon: "10–12 years",
  restrictions: "No single fund above 10% of the program",
};
export const partyById = (id: string) => PARTIES.find((p) => p.id === id);

/* ───────── opportunities: one investor × one offering ───────── */

export type Amounts = { potential?: number; indicative?: number; soft?: number; subscribed?: number; accepted?: number; called?: number; received?: number };
export type Opportunity = {
  id: string;
  offeringId: string;
  partyId: string;
  stage: StageId;
  amounts: Amounts;
  owner: string;
  distributor?: string;
  lastInteraction?: string;
  next?: { action: string; date?: string; illustrative?: boolean };
  /** where the stage comes from */
  source: "Fund ledger" | "Subscription" | "Data room" | "Recorded by hand";
  note?: string;
  illustrative?: boolean;
  /** the stage is on record but the amounts are estimates */
  amountsIllustrative?: boolean;
};

const ofFund = (fundId: string) => OFFERINGS.find((o) => o.fundId === fundId);
const roomParty: Record<string, string> = {
  "Calloway Family Trust": "inv-calloway",
  "Brightwater Pension": "inv-brightwater",
  "Lakeshore Capital": "inv-lakeshore",
  "Northgate Endowment": "inv-northgate",
  "Corbel Partners": "inv-corbel",
  "Sterling Ridge Foundation": "inv-sterling",
};

function build(): Opportunity[] {
  const out: Opportunity[] = [];
  // accepted commitments in the books
  for (const ca of capitalAccounts) {
    const o = ofFund(ca.fundId);
    if (!o) continue;
    const p = partyById(ca.investorId)!;
    const funded = ca.called > 0 && ca.receivable === 0;
    out.push({
      id: `op-${o.id}-${ca.investorId}`,
      offeringId: o.id,
      partyId: ca.investorId,
      stage: funded ? "funded" : "accepted",
      amounts: { accepted: ca.commitment, called: ca.called, received: ca.contributed },
      owner: p.owner,
      source: "Fund ledger",
      lastInteraction: ca.closeDate,
      note: `Admitted at the close of ${ca.closeDate}.`,
    });
  }
  // subscriptions in progress
  for (const ob of onboarding) {
    const o = ofFund(ob.fundId);
    if (!o) continue;
    const party = PARTIES.find((p) => p.name === ob.investorName)!;
    if (out.some((x) => x.offeringId === o.id && x.partyId === party.id)) continue;
    const stage: StageId = ob.status === "Countersigned" ? "accepted" : ob.status === "Submitted" || ob.status === "Approved" ? "pending_approval" : "subscription";
    const next =
      ob.status === "Changes requested"
        ? { action: ob.kyc === "Potential match" ? "Screening match to clear in Compliance" : "Investor to resubmit the corrected documents" }
        : ob.status === "Submitted"
          ? { action: "Compliance review of the subscription" }
          : ob.status === "Approved"
            ? { action: "Countersignature by the general partner" }
            : ob.status === "Countersigned"
              ? { action: "Admit at the next closing" }
              : { action: ob.status === "Invited" ? "Investor to open the subscription" : `Investor completing the subscription (${Math.round(ob.progress * 100)}%)` };
    out.push({
      id: `op-${o.id}-${party.id}`,
      offeringId: o.id,
      partyId: party.id,
      stage,
      amounts: stage === "accepted" ? { subscribed: ob.commitment, accepted: ob.commitment } : { subscribed: ob.commitment },
      owner: party.owner,
      source: "Subscription",
      lastInteraction: ob.lastActivity,
      next,
      note: `Subscription ${ob.id} · ${ob.status}${ob.status === "Countersigned" ? " — accepted, not yet in the books" : ""}.`,
    });
  }
  // data room diligence
  for (const u of roomUsers.filter((x) => x.group === "Investors")) {
    const o = OFFERINGS.find((x) => x.roomId === u.roomId);
    const pid = roomParty[u.firm];
    if (!o || !pid) continue;
    const q = questions.find((x) => x.roomId === u.roomId && x.firm.startsWith(u.firm.split(" ")[0]) && x.status !== "Answered");
    out.push({
      id: `op-${o.id}-${pid}`,
      offeringId: o.id,
      partyId: pid,
      stage: u.nda === "Signed" ? "due_diligence" : "nda_sent",
      amounts: { potential: POTENTIAL[`${o.id}/${pid}`] },
      amountsIllustrative: true,
      owner: o.lead,
      distributor: o.distributors.find((d) => d.kind !== "Fund manager representative")?.name,
      source: "Data room",
      lastInteraction: u.lastSeen,
      next:
        u.nda !== "Signed"
          ? { action: "Follow up on the unsigned NDA", date: "2026-11-27", illustrative: true }
          : q
            ? { action: q.status === "Draft" ? "Approve the drafted answer to their question" : "Answer their question in the data room" }
            : { action: "Schedule a call on the diligence findings", date: "2026-12-02", illustrative: true },
    });
  }
  out.push(...ILLUSTRATIVE_OPPS);
  return out;
}

/** Potential tickets for diligence-stage investors: not recorded anywhere, illustrative. */
const POTENTIAL: Record<string, number> = {
  "of-stx-brazil/inv-northgate": 8_000_000,
  "of-stx-brazil/inv-corbel": 10_000_000,
  "of-stx-brazil/inv-sterling": 5_000_000,
  "of-cascade/inv-calloway": 5_000_000,
  "of-cascade/inv-brightwater": 15_000_000,
  "of-cascade/inv-lakeshore": 5_000_000,
};

const io = (offeringId: string, partyId: string, stage: StageId, amounts: Amounts, owner: string, last: string, next: Opportunity["next"], note?: string): Opportunity => ({
  id: `op-${offeringId}-${partyId}`,
  offeringId,
  partyId,
  stage,
  amounts,
  owner,
  source: "Recorded by hand",
  lastInteraction: last,
  next: next && { ...next, illustrative: true },
  note,
  illustrative: true,
});
const ILLUSTRATIVE_OPPS: Opportunity[] = [
  io("of-atlantico", "pr-westmere", "ioi", { potential: 15_000_000, indicative: 10_000_000 }, "Juliana Teixeira", "2026-11-18", {
    action: "Send the draft side letter terms",
    date: "2026-11-26",
  }),
  io("of-atlantico", "pr-kilbride", "soft", { potential: 5_000_000, indicative: 5_000_000, soft: 5_000_000 }, "Luiza Andrade", "2026-11-21", {
    action: "Invite to subscribe for the second close",
    date: "2026-11-28",
  }),
  io("of-atlantico", "pr-hartley", "contacted", { potential: 10_000_000 }, "Juliana Teixeira", "2026-11-12", { action: "Introductory call", date: "2026-12-01" }),
  io("of-atlantico", "pr-pinecrest", "declined", { potential: 8_000_000 }, "Rafael Mendes", "2026-10-30", undefined, "Declined: allocation to venture capital full for 2026."),
  io("of-stx-global", "pr-aldine", "interested", { potential: 25_000_000 }, "Juliana Teixeira", "2026-11-19", {
    action: "Consultant meeting and fund presentation",
    date: "2026-12-03",
  }),
  io("of-stx-global", "pr-westmere", "identified", { potential: 10_000_000 }, "Juliana Teixeira", "2026-11-10", {
    action: "First outreach after the Atlântico decision",
    date: "2026-12-08",
  }),
  io("of-stx-global", "inv-brightwater", "nda_sent", { potential: 12_000_000 }, "Rafael Mendes", "2026-11-20", { action: "NDA reminder", date: "2026-11-25" }),
  io("of-stx-global", "pr-maraba", "on_hold", { potential: 4_000_000 }, "Luiza Andrade", "2026-11-05", { action: "Revisit after their year-end", date: "2027-01-20" }),
  io("of-cascade", "pr-kilbride", "identified", { potential: 3_000_000 }, "Olivia Brandt", "2026-11-14", { action: "Introduce through Summit Securities", date: "2026-12-04" }),
];

export const OPPORTUNITIES: Opportunity[] = build();

/** The amount that best describes where an opportunity stands, and its kind. */
export function headline(o: Opportunity): { kind: keyof Amounts; label: string; value?: number } {
  const a = o.amounts;
  if (a.accepted !== undefined) return { kind: "accepted", label: "Accepted", value: a.accepted };
  if (a.subscribed !== undefined) return { kind: "subscribed", label: "Subscribed", value: a.subscribed };
  if (a.soft !== undefined) return { kind: "soft", label: "Soft", value: a.soft };
  if (a.indicative !== undefined) return { kind: "indicative", label: "Indicated", value: a.indicative };
  return { kind: "potential", label: "Potential", value: a.potential };
}

/* ───────── agreements ───────── */

export type AgreementStatus = "Not required" | "Required" | "Draft" | "Sent" | "Viewed" | "Partially signed" | "Fully executed" | "Declined" | "Expired" | "Superseded";
export type Agreement = {
  id: string;
  kind: "NDA" | "Subscription agreement" | "Side letter";
  offeringId: string;
  partyId: string;
  status: AgreementStatus;
  version: string;
  signatories: { name: string; side: "Investor" | "Sponsor" | "Administrator"; signed?: string }[];
  sent?: string;
  executed?: string;
  expires?: string;
  owner: string;
  /** what proves the status; "executed" is never shown without it */
  evidence?: string;
  certificate?: string;
  source: "Data room" | "Subscription" | "Recorded by hand";
  illustrative?: boolean;
};

function agreements(): Agreement[] {
  const out: Agreement[] = [];
  for (const u of roomUsers.filter((x) => x.group === "Investors")) {
    const o = OFFERINGS.find((x) => x.roomId === u.roomId);
    const pid = roomParty[u.firm];
    if (!o || !pid) continue;
    const room = rooms.find((r) => r.id === u.roomId)!;
    const signed = u.nda === "Signed";
    out.push({
      id: `ag-nda-${o.id}-${pid}`,
      kind: "NDA",
      offeringId: o.id,
      partyId: pid,
      status: signed ? "Fully executed" : "Sent",
      version: "Data room NDA",
      signatories: [{ name: u.name, side: "Investor", signed: signed ? (u.lastSeen ?? undefined) : undefined }],
      sent: room.created,
      executed: signed ? u.lastSeen : undefined,
      expires: room.expires,
      owner: room.owner,
      evidence: signed ? "Acceptance recorded by the data room before first access" : undefined,
      certificate: undefined,
      source: "Data room",
    });
  }
  for (const ob of onboarding) {
    const o = ofFund(ob.fundId);
    if (!o) continue;
    const party = PARTIES.find((p) => p.name === ob.investorName)!;
    const status: AgreementStatus =
      ob.status === "Countersigned" ? "Fully executed" : ob.status === "Submitted" || ob.status === "Approved" ? "Partially signed" : ob.status === "Invited" ? "Sent" : "Draft";
    out.push({
      id: `ag-sub-${ob.id}`,
      kind: "Subscription agreement",
      offeringId: o.id,
      partyId: party.id,
      status,
      version: "Subscription booklet",
      signatories: [
        { name: ob.contactName, side: "Investor", signed: status === "Partially signed" || status === "Fully executed" ? ob.lastActivity : undefined },
        { name: fundById(ob.fundId)!.gp, side: "Sponsor", signed: status === "Fully executed" ? ob.lastActivity : undefined },
      ],
      sent: ob.invitedOn,
      executed: status === "Fully executed" ? ob.lastActivity : undefined,
      owner: party.owner,
      evidence: status === "Fully executed" ? `Countersigned subscription ${ob.id} in Fund Solution` : undefined,
      source: "Subscription",
    });
  }
  const ill = (a: Omit<Agreement, "source" | "illustrative">): Agreement => ({ ...a, source: "Recorded by hand", illustrative: true });
  out.push(
    ill({
      id: "ag-nda-westmere",
      kind: "NDA",
      offeringId: "of-atlantico",
      partyId: "pr-westmere",
      status: "Fully executed",
      version: "Atlântico mutual NDA v2",
      signatories: [
        { name: "Hannah Price", side: "Investor", signed: "2026-10-28" },
        { name: "Atlântico GP II Ltd.", side: "Sponsor", signed: "2026-10-29" },
      ],
      sent: "2026-10-24",
      executed: "2026-10-29",
      expires: "2028-10-29",
      owner: "Juliana Teixeira",
      evidence: "Executed PDF uploaded",
      certificate: "Signature certificate uploaded",
    }),
    ill({
      id: "ag-side-westmere",
      kind: "Side letter",
      offeringId: "of-atlantico",
      partyId: "pr-westmere",
      status: "Draft",
      version: "Draft 1",
      signatories: [
        { name: "Hannah Price", side: "Investor" },
        { name: "Atlântico GP II Ltd.", side: "Sponsor" },
      ],
      owner: "Juliana Teixeira",
    }),
    ill({
      id: "ag-nda-kilbride",
      kind: "NDA",
      offeringId: "of-atlantico",
      partyId: "pr-kilbride",
      status: "Fully executed",
      version: "Atlântico mutual NDA v2",
      signatories: [
        { name: "Edward Kilbride", side: "Investor", signed: "2026-11-03" },
        { name: "Atlântico GP II Ltd.", side: "Sponsor", signed: "2026-11-04" },
      ],
      sent: "2026-11-01",
      executed: "2026-11-04",
      expires: "2028-11-04",
      owner: "Luiza Andrade",
      evidence: "Executed PDF uploaded",
    }),
    ill({
      id: "ag-nda-brightwater-stx",
      kind: "NDA",
      offeringId: "of-stx-global",
      partyId: "inv-brightwater",
      status: "Viewed",
      version: "Strlex NDA 2026",
      signatories: [
        { name: "Daniel Okafor", side: "Investor" },
        { name: "Strlex Capital Group Inc.", side: "Sponsor" },
      ],
      sent: "2026-11-18",
      owner: "Rafael Mendes",
    }),
    ill({
      id: "ag-nda-pinecrest",
      kind: "NDA",
      offeringId: "of-atlantico",
      partyId: "pr-pinecrest",
      status: "Declined",
      version: "Atlântico mutual NDA v1",
      signatories: [{ name: "Laura Simmons", side: "Investor" }],
      sent: "2026-10-12",
      owner: "Rafael Mendes",
    }),
    ill({
      id: "ag-nda-hartley-old",
      kind: "NDA",
      offeringId: "of-atlantico",
      partyId: "pr-hartley",
      status: "Superseded",
      version: "Atlântico mutual NDA v1",
      signatories: [{ name: "Owen Hartley", side: "Investor" }],
      sent: "2026-09-02",
      owner: "Juliana Teixeira",
    }),
    ill({
      id: "ag-nda-hartley",
      kind: "NDA",
      offeringId: "of-atlantico",
      partyId: "pr-hartley",
      status: "Required",
      version: "Atlântico mutual NDA v2",
      signatories: [{ name: "Owen Hartley", side: "Investor" }],
      owner: "Juliana Teixeira",
    }),
  );
  return out;
}
export const AGREEMENTS: Agreement[] = agreements();

/* ───────── interactions ───────── */

export type Interaction = {
  id: string;
  partyId: string;
  offeringId?: string;
  kind: "Meeting" | "Call" | "Email" | "Note" | "Document viewed" | "Document downloaded" | "Question" | "Subscription" | "Admitted" | "Introduction";
  at: string;
  by: string;
  text: string;
  source: string;
  illustrative?: boolean;
  upcoming?: boolean;
};

function interactions(): Interaction[] {
  const out: Interaction[] = [];
  for (const v of views) {
    const pid = roomParty[v.firm];
    const o = OFFERINGS.find((x) => x.roomId === v.roomId);
    if (!pid || !o) continue;
    out.push({
      id: `ix-${v.id}`,
      partyId: pid,
      offeringId: o.id,
      kind: v.action === "Downloaded" ? "Document downloaded" : "Document viewed",
      at: v.at,
      by: v.who,
      text: `${v.action} “${v.doc}”${v.seconds ? ` for ${Math.round(v.seconds / 60)} min` : ""}`,
      source: "Data room",
    });
  }
  for (const q of questions) {
    const pid = Object.entries(roomParty).find(([firm]) => q.firm.startsWith(firm.split(" ")[0]))?.[1];
    const o = OFFERINGS.find((x) => x.roomId === q.roomId);
    if (!pid || !o) continue;
    out.push({ id: `ix-${q.id}`, partyId: pid, offeringId: o.id, kind: "Question", at: q.at, by: q.from, text: q.text, source: `Data room Q&A · ${q.status}` });
  }
  for (const ob of onboarding) {
    const o = ofFund(ob.fundId);
    const party = PARTIES.find((p) => p.name === ob.investorName);
    if (!o || !party) continue;
    out.push({
      id: `ix-inv-${ob.id}`,
      partyId: party.id,
      offeringId: o.id,
      kind: "Subscription",
      at: ob.invitedOn,
      by: RM[ob.relationshipManager] ?? ob.relationshipManager,
      text: `Invited to subscribe ${fmtUsd(ob.commitment)}`,
      source: "Fund Solution onboarding",
    });
    if (ob.lastActivity !== ob.invitedOn)
      out.push({
        id: `ix-last-${ob.id}`,
        partyId: party.id,
        offeringId: o.id,
        kind: "Subscription",
        at: ob.lastActivity,
        by: ob.contactName,
        text: `Subscription ${ob.status.toLowerCase()}`,
        source: "Fund Solution onboarding",
      });
  }
  for (const ca of capitalAccounts) {
    const o = ofFund(ca.fundId);
    if (!o) continue;
    out.push({
      id: `ix-adm-${o.id}-${ca.investorId}`,
      partyId: ca.investorId,
      offeringId: o.id,
      kind: "Admitted",
      at: ca.closeDate,
      by: "Fund administration",
      text: `Admitted with a commitment of ${fmtUsd(ca.commitment)}`,
      source: "Fund ledger",
    });
  }
  const ill = (x: Omit<Interaction, "illustrative">) => out.push({ ...x, illustrative: true });
  ill({
    id: "ix-i1",
    partyId: "pr-westmere",
    offeringId: "of-atlantico",
    kind: "Meeting",
    at: "2026-11-18T15:00:00Z",
    by: "Juliana Teixeira",
    text: "Investment committee follow-up: portfolio construction and reserves policy.",
    source: "Meeting note",
  });
  ill({
    id: "ix-i2",
    partyId: "pr-westmere",
    kind: "Introduction",
    at: "2026-10-20T13:00:00Z",
    by: "Thomas Reyes",
    text: "Introduced by Corbel Partners.",
    source: "Introduction record",
  });
  ill({
    id: "ix-i3",
    partyId: "pr-westmere",
    offeringId: "of-atlantico",
    kind: "Call",
    at: "2026-12-01T16:00:00Z",
    by: "Juliana Teixeira",
    text: "Side letter terms with their counsel.",
    source: "Calendar",
    upcoming: true,
  });
  ill({
    id: "ix-i4",
    partyId: "pr-kilbride",
    offeringId: "of-atlantico",
    kind: "Meeting",
    at: "2026-11-21T10:00:00Z",
    by: "Luiza Andrade",
    text: "Confirmed a $5M soft commitment subject to final documents.",
    source: "Meeting note",
  });
  ill({
    id: "ix-i5",
    partyId: "inv-corbel",
    offeringId: "of-stx-brazil",
    kind: "Meeting",
    at: "2026-11-26T14:00:00Z",
    by: "Luiza Andrade",
    text: "Diligence call with the Strlex team on the audit timetable.",
    source: "Calendar",
    upcoming: true,
  });
  ill({
    id: "ix-i6",
    partyId: "pr-aldine",
    offeringId: "of-stx-global",
    kind: "Meeting",
    at: "2026-12-03T15:30:00Z",
    by: "Juliana Teixeira",
    text: "Consultant meeting and fund presentation.",
    source: "Calendar",
    upcoming: true,
  });
  ill({
    id: "ix-i7",
    partyId: "inv-brightwater",
    offeringId: "of-cascade",
    kind: "Call",
    at: "2026-11-30T17:00:00Z",
    by: "Olivia Brandt",
    text: "Cap rate assumptions with Summit Securities on the line.",
    source: "Calendar",
    upcoming: true,
  });
  ill({
    id: "ix-i8",
    partyId: "inv-corbel",
    kind: "Note",
    at: "2026-11-15T12:00:00Z",
    by: "Juliana Teixeira",
    text: "Program pacing: two new commitments in 2027, Americas focus.",
    source: "Note",
  });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
export const INTERACTIONS: Interaction[] = interactions();

/* ───────── figures ───────── */

/**
 * Capital formation figures for a set of offerings. Kinds are never added together: accepted commitments come from
 * the books or a countersignature; indicative and soft amounts from the investor; potential from the relationship owner.
 */
export function figures(offeringIds: string[], opps: Opportunity[] = OPPORTUNITIES, offerings: Offering[] = OFFERINGS) {
  const os = offerings.filter((o) => offeringIds.includes(o.id));
  const set = opps.filter((x) => offeringIds.includes(x.offeringId));
  const open = set.filter((x) => OPEN(x.stage));
  const sum = (list: Opportunity[], k: keyof Amounts) => list.reduce((s, x) => s + (x.amounts[k] ?? 0), 0);
  const illus = (list: Opportunity[], k: keyof Amounts) => list.filter((x) => x.illustrative || x.amountsIllustrative).reduce((s, x) => s + (x.amounts[k] ?? 0), 0);
  const potentialList = open.filter((x) => x.amounts.potential !== undefined && x.amounts.accepted === undefined && x.amounts.subscribed === undefined);
  const target = os.reduce((s, o) => s + (o.target ?? 0), 0);
  const accepted = sum(set, "accepted");
  return {
    target,
    targetMissing: os.filter((o) => !o.target).map((o) => o.short),
    targetIllustrative: os.filter((o) => o.illustrative.includes("target")).map((o) => o.short),
    potential: sum(potentialList, "potential"),
    potentialIllustrative: illus(potentialList, "potential"),
    indicative: sum(
      open.filter((x) => x.stage === "ioi"),
      "indicative",
    ),
    soft: sum(
      open.filter((x) => x.stage === "soft"),
      "soft",
    ),
    subscribed: sum(
      open.filter((x) => x.stage === "subscription" || x.stage === "pending_approval"),
      "subscribed",
    ),
    accepted,
    acceptedNotInBooks: set.filter((x) => x.stage === "accepted" && x.source === "Subscription").reduce((s, x) => s + (x.amounts.accepted ?? 0), 0),
    called: sum(set, "called"),
    received: sum(set, "received"),
    remaining: Math.max(0, target - accepted),
  };
}

/** Accepted commitments in the books over time, per offering (cumulative by close date). */
export function commitmentSeries(offeringId: string) {
  const o = offeringById(offeringId);
  if (!o?.fundId) return [];
  const rows = capitalAccounts.filter((c) => c.fundId === o.fundId).sort((a, b) => a.closeDate.localeCompare(b.closeDate));
  const out: { date: string; total: number }[] = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.date === r.closeDate) last.total += r.commitment;
    else out.push({ date: r.closeDate, total: (last?.total ?? 0) + r.commitment });
  }
  return out;
}

export const fundraisingFunds = funds.filter((f) => OFFERINGS.some((o) => o.fundId === f.id));
