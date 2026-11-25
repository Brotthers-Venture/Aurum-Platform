/**
 * Corporate Chat — correspondence organised around matters.
 *
 * In fund administration a conversation is nearly always about a record: a capital call, a subscription, a
 * formation, a bank-detail change, a data-room question. A Matter is a thread tied to that record, with a status,
 * an owner, a priority and a due date. Channels and direct conversations hold everything else.
 *
 * Shapes mirror the planned Supabase tables (chat_matters, chat_channels, chat_messages, chat_inbox_state).
 * People come from lib/comms; figures come from lib/data and the ledger — never typed here.
 */
import { messages as commsMessages, people as commsPeople, requests as accessRequests, type Person } from "./comms";
import { capitalCalls, fundById, investorById, onboarding, profileChangeRequests, documents } from "./data";
import { formations } from "./formation";
import { caseFor, kycOf, statusOf } from "./screening";
import { plans } from "./plans";
import { docs as roomDocs, questions as roomQuestions, rooms } from "./dataroom";

/* ───────────────────────── types ───────────────────────── */

export type MatterStatus = "Open" | "Awaiting client" | "Awaiting approval" | "Resolved";
export const MATTER_STATUSES: MatterStatus[] = ["Open", "Awaiting client", "Awaiting approval", "Resolved"];
export type Priority = "None" | "Low" | "Normal" | "High" | "Urgent";
export const PRIORITIES: Priority[] = ["Urgent", "High", "Normal", "Low", "None"];

export type LinkKind = "call" | "formation" | "investor" | "room" | "plan" | "vehicle" | "bank" | "subscription" | "access";
export type Linked = { kind: LinkKind; id: string; label: string };

export type Matter = {
  id: string;
  ref: string; // CC-7, FOR-16, KYC-3 … prefix from the record type
  title: string;
  status: MatterStatus;
  priority: Priority;
  owner: string;
  participants: string[];
  dueDate?: string;
  linked: Linked;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  /** who asked for the approval — four-eyes: they cannot approve it themselves */
  requestedBy?: string;
  approvals?: { by: string; at: string; decision: "approved" | "rejected"; note?: string }[];
  /** the message this matter was converted from */
  source?: { where: string; messageId: string };
};

export type Channel = { id: string; name: string; topic: string; external: boolean; members: string[] };
export type Direct = { id: string; members: string[] };

export type ChatAttachment = { name: string; size: number; type: "pdf" | "xlsx" | "docx" | "csv" | "img" | "zip"; source?: string };
export type ReactionKey = "ack" | "agree" | "seen";
export const REACTIONS: { key: ReactionKey; label: string }[] = [
  { key: "ack", label: "Acknowledged" },
  { key: "agree", label: "Agreed" },
  { key: "seen", label: "Seen" },
];

export type ChatMessage = {
  id: string;
  where: string; // matter, channel or direct id
  author: string; // person id, or "system"
  at: string;
  body: string;
  kind: "message" | "event";
  mentions?: string[];
  refs?: string[];
  attachments?: ChatAttachment[];
  replyTo?: string;
  reactions?: { key: ReactionKey; by: string[] }[];
  edits?: { at: string; body: string }[];
  editedAt?: string;
};

export type InboxState = { read?: boolean; done?: boolean; snoozedUntil?: string };
export type SavedView = { id: string; name: string; filters: Filters; group: "status" | "linked"; sort: "updated" | "due" | "priority" };
export type Filters = { owner?: string; status?: MatterStatus | "open"; label?: string; linked?: LinkKind; external?: boolean };

/* ───────────────────────── people ───────────────────────── */

/** The person viewing the console in this preview: Luiza Andrade, Head of Fund Services. */
export const VIEWER = "luiza";
export const SYSTEM = "system";

const extra: Person[] = [
  { id: "beatriz", name: "Beatriz Duarte", title: "Director, Duarte Participações S.A.", org: "duarte", clientRole: "admin", email: "beatriz@duartepar.com.br" },
  { id: "paulo", name: "Paulo Ferreira", title: "Director, Ferreira Holdings Ltd.", org: "ferreira", clientRole: "admin", email: "paulo@ferreiraholdings.com" },
  { id: "darci", name: "Darci Welter", title: "Operations, Strlex Capital", org: "strlex", clientRole: "member", email: "darci@strlexcapital.com" },
  { id: "anamazal", name: "Ana Mazal", title: "Mazal Group", org: "mazal", clientRole: "admin", email: "ana@mazalgroup.com.br" },
  { id: "rafaelm", name: "Rafael Monteiro", title: "Investor", org: "monteiro", clientRole: "admin", email: "rafael.monteiro@gmail.com" },
];
export const chatPeople: Person[] = [...commsPeople.filter((p) => p.id !== "me"), ...extra];
export const person = (id: string) => chatPeople.find((p) => p.id === id);
export const isExternal = (id: string) => (person(id)?.org ?? "aurum") !== "aurum";
export const personName = (id: string) => (id === SYSTEM ? "System" : (person(id)?.name ?? id));
export const firstName = (id: string) => personName(id).split(" ")[0];
export const initials = (id: string) =>
  personName(id)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/* ───────────────────────── seed: matters ───────────────────────── */

const call = (fund: string, n: number) => capitalCalls.find((c) => c.fundId === fund && c.number === n)!;
const money = (v: number, cur = "USD") => (cur === "BRL" ? "R$ " : "$") + Math.round(v).toLocaleString("en-US");
const longDay = (iso: string) => {
  const d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso);
  return `${d.getUTCDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const c7 = call("cordillera-infra-i", 7);
const c2 = call("atlantico-vp-ii", 2);
const c3 = call("stx-anchor", 3);
const c4 = call("meridian-cvc", 4);
const ferreira = profileChangeRequests.find((p) => p.id === "pcr-311")!;
const prado = profileChangeRequests.find((p) => p.id === "pcr-307")!;
const duarte = onboarding.find((o) => o.id === "ob-1045")!;
const monteiro = onboarding.find((o) => o.id === "ob-1039")!;
const sterling = onboarding.find((o) => o.id === "ob-1038")!;
const mazal = formations.find((f) => f.ref === "AF-2611-016")!;
const cascadeQ = roomQuestions.find((q) => q.id === "q1")!;
const plan = plans.find((p) => p.id === "stx-bahf-pp")!;
const r1 = accessRequests.find((r) => r.id === "r1")!;

export const seedMatters: Matter[] = [
  {
    id: "mt-cc7",
    ref: "CC-7",
    title: "Capital Call No. 7 — receipts",
    status: "Awaiting client",
    priority: "High",
    owner: "rafael",
    participants: ["rafael", "luiza", "marcus", "sofia"],
    dueDate: c7.dueDate,
    linked: { kind: "call", id: c7.id, label: "Cordillera Infrastructure I" },
    labels: ["Receivable"],
    createdAt: "2026-11-17T09:00:00Z",
    updatedAt: "2026-11-24T11:02:00Z",
  },
  {
    id: "mt-cc2",
    ref: "CC-2",
    title: "Capital Call No. 2 — approval",
    status: "Awaiting approval",
    priority: "High",
    owner: "rafael",
    participants: ["rafael", "luiza", "ana"],
    dueDate: c2.dueDate,
    linked: { kind: "call", id: c2.id, label: "Atlântico Venture II" },
    labels: ["Four-eyes"],
    createdAt: "2026-11-24T09:30:00Z",
    updatedAt: "2026-11-24T12:20:00Z",
    requestedBy: "rafael",
  },
  {
    id: "mt-cc3",
    ref: "CC-3",
    title: "Capital Call No. 3 — approval",
    status: "Awaiting approval",
    priority: "Normal",
    owner: "luiza",
    participants: ["luiza", "rafael", "lucas", "emma"],
    dueDate: c3.dueDate,
    linked: { kind: "call", id: c3.id, label: "STX-Anchor Capital Formation" },
    labels: ["Four-eyes"],
    createdAt: "2026-11-24T10:00:00Z",
    updatedAt: "2026-11-24T14:10:00Z",
    requestedBy: "luiza",
  },
  {
    id: "mt-bnk4",
    ref: "BNK-4",
    title: "Ferreira Holdings — distribution bank account change",
    status: "Awaiting approval",
    priority: "Urgent",
    owner: "noah",
    participants: ["noah", "luiza", "carla", "paulo"],
    dueDate: "2026-11-27",
    linked: { kind: "bank", id: ferreira.id, label: "Ferreira Holdings Ltd." },
    labels: ["Four-eyes", "Bank details"],
    createdAt: ferreira.submitted + "T10:00:00Z",
    updatedAt: "2026-11-24T09:15:00Z",
    requestedBy: "noah",
  },
  {
    id: "mt-bnk5",
    ref: "BNK-5",
    title: "Updated wire instructions — Cordillera investors",
    status: "Awaiting approval",
    priority: "High",
    owner: "noah",
    participants: ["noah", "luiza", "carla", "sofia"],
    linked: { kind: "bank", id: "cr-bnk5", label: "Cordillera Infrastructure I" },
    labels: ["Four-eyes", "Bank details"],
    createdAt: "2026-11-24T11:20:00Z",
    updatedAt: "2026-11-24T11:40:00Z",
    requestedBy: "luiza",
    source: { where: "ch-client-cordillera", messageId: "c-" + (commsMessages.find((m) => /wire instructions/.test(m.body))?.id ?? "") },
  },
  {
    id: "mt-sub1045",
    ref: "SUB-1045",
    title: "Duarte Participações — subscription documents",
    status: "Awaiting client",
    priority: "Normal",
    owner: "luiza",
    participants: ["luiza", "carla", "beatriz"],
    linked: { kind: "subscription", id: duarte.id, label: "Atlântico Venture II" },
    labels: ["Onboarding"],
    createdAt: duarte.invitedOn + "T09:00:00Z",
    updatedAt: "2026-11-24T08:42:00Z",
  },
  {
    id: "mt-kyc3",
    ref: "KYC-3",
    title: "Ana & Rafael Monteiro — potential match",
    status: "Awaiting client",
    priority: "High",
    owner: "carla",
    participants: ["carla", "rafael", "luiza", "rafaelm"],
    linked: { kind: "investor", id: monteiro.id, label: "Atlântico Venture II" },
    labels: ["KYC"],
    createdAt: "2026-11-19T10:20:00Z",
    updatedAt: "2026-11-19T10:20:00Z",
  },
  {
    id: "mt-kyc7",
    ref: "KYC-7",
    title: "Helena M. Prado — identity document refresh",
    status: "Open",
    priority: "Normal",
    owner: "carla",
    participants: ["carla", "luiza"],
    dueDate: "2026-12-31",
    linked: { kind: "investor", id: "inv-prado", label: "Helena M. Prado" },
    labels: ["KYC"],
    createdAt: prado.submitted + "T09:00:00Z",
    updatedAt: prado.submitted + "T09:00:00Z",
  },
  {
    id: "mt-sub1038",
    ref: "SUB-1038",
    title: "Sterling Ridge Foundation — subscription review",
    status: "Awaiting approval",
    priority: "Normal",
    owner: "rafael",
    participants: ["rafael", "luiza"],
    linked: { kind: "subscription", id: sterling.id, label: "Atlântico Venture II" },
    labels: ["Onboarding", "Four-eyes"],
    createdAt: "2026-11-21T15:52:00Z",
    updatedAt: "2026-11-21T15:52:00Z",
    requestedBy: "rafael",
  },
  {
    id: "mt-dr1",
    ref: "DR-1",
    title: "Cascade data room — cap rate question",
    status: "Open",
    priority: "Normal",
    owner: "olivia",
    participants: ["olivia", "luiza", "tom"],
    linked: { kind: "room", id: cascadeQ.roomId, label: rooms.find((r) => r.id === cascadeQ.roomId)?.name ?? "Cascade" },
    labels: ["Q&A"],
    createdAt: cascadeQ.at,
    updatedAt: "2026-11-23T17:40:00Z",
  },
  {
    id: "mt-for16",
    ref: "FOR-16",
    title: `${mazal.company} — formation`,
    status: "Awaiting client",
    priority: "Normal",
    owner: "bianca",
    participants: ["bianca", "eduardo", "anamazal"],
    linked: { kind: "formation", id: mazal.ref, label: mazal.company },
    labels: ["Formation"],
    createdAt: mazal.submitted + "T13:00:00Z",
    updatedAt: "2026-11-21T09:30:00Z",
  },
  {
    id: "mt-pln1",
    ref: "PLN-1",
    title: "STX-BAHF I — outstanding deliverables",
    status: "Open",
    priority: "High",
    owner: "luiza",
    participants: ["luiza", "lucas", "darci"],
    linked: { kind: "plan", id: plan.id, label: plan.name },
    labels: ["Private placement"],
    createdAt: "2026-11-10T13:00:00Z",
    updatedAt: "2026-11-22T16:00:00Z",
  },
  {
    id: "mt-acc1",
    ref: "ACC-1",
    title: `Channel request — #${r1.subject}`,
    status: "Awaiting approval",
    priority: "Low",
    owner: "luiza",
    participants: ["luiza", "lucas"],
    linked: { kind: "access", id: r1.id, label: "Strlex Capital" },
    labels: ["Access"],
    createdAt: r1.at,
    updatedAt: r1.at,
    requestedBy: "lucas",
  },
  {
    id: "mt-cc4",
    ref: "CC-4",
    title: "Capital Call No. 4 — receipts",
    status: "Resolved",
    priority: "Normal",
    owner: "rafael",
    participants: ["rafael", "luiza"],
    dueDate: c4.dueDate,
    linked: { kind: "call", id: c4.id, label: "Meridian CVC" },
    labels: ["Receivable"],
    createdAt: c4.noticeDate + "T09:00:00Z",
    updatedAt: c4.dueDate + "T17:00:00Z",
  },
];

/* ───────────────────────── seed: channels & directs ───────────────────────── */

export const seedChannels: Channel[] = [
  { id: "ch-fund-ops", name: "fund-ops", topic: "Fund Solution team — close, NAV and capital activity", external: false, members: ["luiza", "rafael", "juliana", "carla"] },
  { id: "ch-corporate", name: "corporate", topic: "Corporate services — formations and annual filings", external: false, members: ["eduardo", "bianca", "carla", "luiza"] },
  { id: "ch-compliance", name: "compliance", topic: "Screening, policy updates and training", external: false, members: ["carla", "luiza", "rafael"] },
  { id: "ch-client-cordillera", name: "client-cordillera", topic: "Cordillera Infrastructure Advisors × fund administration", external: true, members: ["luiza", "rafael", "marcus", "sofia", "owen"] },
  { id: "ch-client-strlex", name: "client-strlex", topic: "Strlex Capital × fund administration", external: true, members: ["luiza", "rafael", "lucas", "emma", "laura"] },
];
export const seedDirects: Direct[] = [
  { id: "dm-carla", members: ["luiza", "carla"] },
  { id: "dm-rafael", members: ["luiza", "rafael"] },
  { id: "dm-marcus", members: ["luiza", "marcus"] },
];

/** Earlier conversations from the communication workspace, carried into the matching channels. */
const CARRY: Record<string, string> = {
  "f-general": "ch-fund-ops",
  "f-close": "ch-fund-ops",
  "k-general": "ch-corporate",
  "k-filings": "ch-corporate",
  "a-compliance": "ch-compliance",
  "f-cord-general": "ch-client-cordillera",
  "f-cord-infra": "ch-client-cordillera",
  "f-strlex-general": "ch-client-strlex",
  "f-strlex-fees": "ch-client-strlex",
};
const carried: ChatMessage[] = commsMessages
  .filter((m) => CARRY[m.where] && m.body && m.authorId !== "me")
  .map((m) => ({
    id: "c-" + m.id,
    where: CARRY[m.where],
    author: m.authorId,
    at: m.at,
    body: m.body,
    kind: "message",
    replyTo: m.parentId ? "c-" + m.parentId : undefined,
    attachments: m.attachments?.flatMap((a) => (a.kind === "file" ? [{ name: a.name, size: a.size, type: a.type }] : [])),
  }));

/* ───────────────────────── seed: timelines ───────────────────────── */

let n = 0;
const msg = (where: string, author: string, at: string, body: string, p: Partial<ChatMessage> = {}): ChatMessage => ({ id: `s${++n}`, where, author, at, body, kind: "message", ...p });
const ev = (where: string, author: string, at: string, body: string): ChatMessage => ({ id: `e${++n}`, where, author, at, body, kind: "event" });
const pdf = (name: string, size: number, source?: string): ChatAttachment => ({ name, size, type: "pdf", source });

const wireAsk = commsMessages.find((m) => /wire instructions/.test(m.body));
const WIRE_AT = wireAsk?.at ?? "2026-11-24T10:45:00Z";
const WIRE_BODY = wireAsk?.body ?? "Two investors asked for updated wire instructions. Can {tenant} send them through the portal?";
const paid = c7.allocations.filter((a) => a.paidDate).sort((a, b) => a.paidDate!.localeCompare(b.paidDate!));
const outstanding = c7.allocations.filter((a) => !a.paidDate);
const cc7Remind = "s-cc7-remind";

export const seedMessages: ChatMessage[] = [
  // CC-7
  ev("mt-cc7", "luiza", "2026-11-17T09:00:00Z", `issued Capital Call No. 7 to ${c7.allocations.length} limited partners — ${money(c7.amount)}, due ${longDay(c7.dueDate)}`),
  msg("mt-cc7", "luiza", "2026-11-17T09:05:00Z", `Notice is out. ${money(c7.investments[0].amount)} for ${c7.investments[0].name} and ${money(c7.fees)} management fee. @rafael owns receipts.`, {
    mentions: ["rafael"],
    attachments: [pdf("Capital Call Notice No. 7.pdf", 184_000, "Documents")],
  }),
  ev("mt-cc7", "luiza", "2026-11-17T09:06:00Z", "set the owner to Rafael Mendes"),
  ...paid.map((a) => ev("mt-cc7", SYSTEM, `${a.paidDate}T11:04:00Z`, `City National Bank receipt matched — ${investorById(a.investorId)?.name} ${money(a.paid)}`)),
  msg(
    "mt-cc7",
    "rafael",
    "2026-11-24T09:10:00Z",
    `${paid.length} of ${c7.allocations.length} partners have paid — ${money(c7.received)} of ${money(c7.amount)}. Still open: ${outstanding.map((a) => investorById(a.investorId)?.name).join(", ")}.`,
  ),
  msg("mt-cc7", "marcus", "2026-11-24T10:05:00Z", "Corbel's treasury team told us their wire goes out on Friday."),
  msg("mt-cc7", "luiza", "2026-11-24T10:48:00Z", "@rafael please send reminders to the remaining five today.", { id: cc7Remind, mentions: ["rafael"] } as Partial<ChatMessage>),
  msg("mt-cc7", "rafael", "2026-11-24T11:00:00Z", "Sent through the investor portal at 11:00.", { replyTo: cc7Remind }),
  msg("mt-cc7", "marcus", "2026-11-24T11:02:00Z", "Thank you — we'll nudge Vasconcelos directly as well.", { replyTo: cc7Remind }),

  // CC-2
  ev("mt-cc2", "rafael", "2026-11-24T09:30:00Z", `drafted Capital Call No. 2 — ${money(c2.amount)}, due ${longDay(c2.dueDate)}`),
  msg(
    "mt-cc2",
    "rafael",
    "2026-11-24T09:34:00Z",
    `Draft notice is ready: ${money(c2.investments[0].amount)} for ${c2.investments[0].name} and ${money(c2.fees)} management fee, across ${c2.allocations.length} partners. Needs a second approver before it goes out.`,
    { attachments: [pdf("Atlântico VP II — Capital Call No. 2 — draft notice.pdf", 352_000), { name: "Capital Call No. 2 — allocation.xlsx", size: 61_000, type: "xlsx" }] },
  ),
  ev("mt-cc2", "rafael", "2026-11-24T09:35:00Z", "requested approval"),
  msg("mt-cc2", "ana", "2026-11-24T12:20:00Z", "The Kora and Trama amounts match our investment committee minutes."),

  // CC-3
  ev("mt-cc3", "luiza", "2026-11-24T10:00:00Z", `drafted Capital Call No. 3 — ${money(c3.amount)}, due ${longDay(c3.dueDate)}`),
  msg("mt-cc3", "luiza", "2026-11-24T10:04:00Z", `Draft for ${c3.investments[0].name}: ${money(c3.amount)} across ${c3.allocations.length} partners. Allocation attached. @rafael can you be second approver?`, {
    mentions: ["rafael"],
    attachments: [{ name: "Capital Call No. 3 — allocation.xlsx", size: 84_000, type: "xlsx" }],
  }),
  ev("mt-cc3", "luiza", "2026-11-24T10:05:00Z", "requested approval"),
  msg("mt-cc3", "lucas", "2026-11-24T14:10:00Z", "Looks right. Can we walk through the allocation for the two late closers before you approve?"),

  // BNK-4
  ev("mt-bnk4", "paulo", ferreira.submitted + "T10:00:00Z", `requested a change of ${ferreira.field.toLowerCase()}`),
  msg("mt-bnk4", "noah", ferreira.submitted + "T10:40:00Z", `From ${ferreira.from} to ${ferreira.to}. Control: ${ferreira.control.toLowerCase()}. Callback booked with the signatory on file.`),
  ev("mt-bnk4", "noah", "2026-11-24T09:10:00Z", "recorded the signatory callback — confirmed"),
  msg("mt-bnk4", "noah", "2026-11-24T09:15:00Z", "Callback done and confirmed. Requesting second approval; the 5-day hold runs to 27 Nov.", { mentions: [] }),
  ev("mt-bnk4", "noah", "2026-11-24T09:16:00Z", "requested approval"),

  // SUB-1045
  ev("mt-sub1045", SYSTEM, duarte.invitedOn + "T09:00:00Z", `sent the onboarding invitation to ${duarte.investorName} — commitment ${money(duarte.commitment)}`),
  ev("mt-sub1045", "beatriz", "2026-11-24T08:42:00Z", "uploaded Duarte Participações — ownership chart.pdf"),
  msg("mt-sub1045", "beatriz", "2026-11-24T08:43:00Z", "Ownership chart attached. The two directors' IDs follow this week.", { attachments: [pdf("Duarte Participações — ownership chart.pdf", 260_000)] }),
  msg("mt-sub1045", "carla", "2026-11-24T09:30:00Z", "Thanks Beatriz. KYC stays pending until we have certified IDs for both directors."),

  // KYC-3
  ev("mt-kyc3", "rafael", "2026-11-19T10:20:00Z", "requested changes on the Monteiro subscription — proof of address"),
  msg("mt-kyc3", "carla", "2026-11-19T10:40:00Z", "Screening returned a potential match on Rafael Monteiro. Date of birth differs from the list entry; I'd still like a second document before clearing."),

  // KYC-7
  ev("mt-kyc7", "carla", prado.submitted + "T09:00:00Z", `opened a KYC refresh — ${prado.from} → ${prado.to}`),

  // SUB-1038
  ev("mt-sub1038", SYSTEM, "2026-11-21T15:52:00Z", "Clara Huang submitted subscription documents for review"),
  msg("mt-sub1038", "rafael", "2026-11-21T16:30:00Z", `KYC clear, qualified purchaser. Commitment ${money(sterling.commitment)}. Ready for second approval.`),
  ev("mt-sub1038", "rafael", "2026-11-21T16:31:00Z", "requested approval"),

  // DR-1
  ev("mt-dr1", SYSTEM, cascadeQ.at, `question in the data room from ${cascadeQ.from} (${cascadeQ.firm}) on document ${cascadeQ.docIndex}: “${cascadeQ.text}”`),
  msg("mt-dr1", "olivia", "2026-11-23T16:00:00Z", "@tom can you confirm the Tampa cap rate used in the pro forma (3.1)? I'll post the answer to the Q&A queue.", { mentions: ["tom"] }),
  msg("mt-dr1", "tom", "2026-11-23T17:40:00Z", "The pro forma uses the in-place cap rate from the October appraisal. Page 4 of 3.1 has the reconciliation."),

  // FOR-16
  ev("mt-for16", SYSTEM, mazal.submitted + "T13:00:00Z", `received the formation order ${mazal.ref} — Brazil, sociedade limitada`),
  msg("mt-for16", "bianca", "2026-11-21T09:30:00Z", `${mazal.note} Could you send a recent utility bill or bank statement for that quota holder?`),

  // PLN-1
  msg("mt-pln1", "luiza", "2026-11-22T16:00:00Z", "Lucas, Darci — three items are holding up the bank account: the LPA (1.3), the LEI (1.4) and the CIK (1.5). The LEI and CIK are ours once the LPA is signed."),

  // ACC-1
  ev("mt-acc1", "lucas", r1.at, `requested a new channel #${r1.subject}`),
  msg("mt-acc1", "lucas", r1.at, r1.detail),

  // CC-4 (resolved)
  ev("mt-cc4", "rafael", c4.noticeDate + "T09:00:00Z", `issued Capital Call No. 4 — ${money(c4.amount)}`),
  ev("mt-cc4", SYSTEM, c4.dueDate + "T15:00:00Z", `all ${c4.allocations.length} partners paid — ${money(c4.received)} received`),
  ev("mt-cc4", "rafael", c4.dueDate + "T17:00:00Z", "changed status to Resolved"),

  // directs
  msg("dm-carla", "carla", "2026-11-22T18:30:00Z", "Second reviewer needed on the Cordillera PEP match when you have a minute."),
  msg("dm-rafael", "rafael", "2026-11-23T13:40:00Z", "STX-Anchor and Cordillera bank recs are mine. You'll have them by Dec 3."),
  msg("dm-marcus", "marcus", "2026-11-24T10:10:00Z", "Owen will need the FY2026 capital account statements by January 10 for the audit."),

  ...carried,

  // A client asks for wire instructions in chat: converted to a four-eyes change request, never answered in chat.
  ev("ch-client-cordillera", "luiza", "2026-11-24T11:20:00Z", "converted a message to change request BNK-5 — bank details go through the four-eyes change request"),
  msg(
    "ch-client-cordillera",
    "luiza",
    "2026-11-24T11:21:00Z",
    "Sofia — we've opened #BNK-5. Updated wire instructions reach investors only through the investor portal, after a second approver has verified them. We never send bank details in chat.",
  ),
  ev("mt-bnk5", "luiza", "2026-11-24T11:20:00Z", "opened this change request from a message by Sofia Klein in #client-cordillera"),
  msg("mt-bnk5", "sofia", WIRE_AT, WIRE_BODY),
  ev("mt-bnk5", "luiza", "2026-11-24T11:22:00Z", "requested approval — instructions are verified by a second approver and published only in the investor portal"),
  msg("mt-bnk5", "noah", "2026-11-24T11:40:00Z", "I'll check the instructions against the fund's signed bank letter before I approve."),
];

/** Inbox items already handled in this demo (read or done) before the preview starts. */
export const seedInboxState: Record<string, InboxState> = {};

export const defaultViews: SavedView[] = [
  { id: "v-open", name: "All open", filters: { status: "open" }, group: "status", sort: "updated" },
  { id: "v-client", name: "Awaiting client", filters: { status: "Awaiting client" }, group: "linked", sort: "due" },
  { id: "v-approval", name: "Awaiting approval", filters: { status: "Awaiting approval" }, group: "status", sort: "priority" },
];

/* ───────────────────────── records (context rail) ───────────────────────── */

export type RecordFact = { label: string; value: string; tone?: "warn" | "pos" };
export type RecordSummary = { kind: string; title: string; sub: string; facts: RecordFact[]; progress?: { pct: number; label: string }; href: string; files: ChatAttachment[] };

export function recordSummary(l: Linked): RecordSummary | null {
  if (l.kind === "call") {
    const c = capitalCalls.find((x) => x.id === l.id);
    if (!c) return null;
    const f = fundById(c.fundId)!;
    const out = c.allocations.filter((a) => a.paid < a.amount);
    const docsFor = documents.filter((d) => d.fundId === c.fundId && d.name.includes(`No. ${c.number}`));
    return {
      kind: "Capital call",
      title: `Capital Call No. ${c.number}`,
      sub: f.name,
      facts: [
        { label: "Amount", value: money(c.amount, f.currency) },
        { label: "Received", value: money(c.received, f.currency) },
        { label: "Outstanding", value: money(c.amount - c.received, f.currency), tone: c.amount > c.received ? "warn" : undefined },
        { label: "Partners outstanding", value: `${out.length} of ${c.allocations.length}` },
        { label: "Notice", value: longDay(c.noticeDate) },
        { label: "Due", value: longDay(c.dueDate) },
        { label: "Status", value: c.status },
      ],
      progress: c.status === "Draft" ? undefined : { pct: c.received / c.amount, label: `${((c.received / c.amount) * 100).toFixed(1)}% received` },
      href: `/admin/fund/capital-calls`,
      files: docsFor.map((d) => ({ name: d.name + ".pdf", size: parseFloat(d.size) * (d.size.includes("MB") ? 1_000_000 : 1000), type: "pdf" as const, source: "Documents" })),
    };
  }
  if (l.kind === "subscription" || (l.kind === "investor" && l.id.startsWith("ob-"))) {
    const o = onboarding.find((x) => x.id === l.id);
    if (!o) return null;
    return {
      kind: "Subscription",
      title: o.investorName,
      sub: fundById(o.fundId)?.name ?? "",
      facts: [
        { label: "Commitment", value: money(o.commitment) },
        { label: "Status", value: statusOf(o) },
        { label: "KYC", value: kycOf(o, caseFor(o.id)), tone: kycOf(o, caseFor(o.id)) === "Clear" ? "pos" : "warn" },
        { label: "Accreditation", value: o.accreditation },
        { label: "Progress", value: `${Math.round(o.progress * 100)}%` },
        { label: "Relationship manager", value: o.relationshipManager },
      ],
      progress: { pct: o.progress, label: `${Math.round(o.progress * 100)}% complete` },
      href: `/admin/fund/onboarding/${o.id}`,
      files: [],
    };
  }
  if (l.kind === "investor") {
    const i = investorById(l.id);
    const r = profileChangeRequests.find((p) => p.investorId === l.id && p.status === "Pending review");
    if (!i) return null;
    return {
      kind: "Investor",
      title: i.name,
      sub: `${i.type} · ${i.jurisdiction}`,
      facts: [{ label: "KYC", value: i.kyc, tone: i.kyc === "Clear" ? "pos" : "warn" }, { label: "Tax form", value: i.taxForm }, ...(r ? [{ label: r.field, value: r.to }, { label: "Control", value: r.control }] : [])],
      href: `/admin/fund/investors`,
      files: [],
    };
  }
  if (l.kind === "bank" && l.id.startsWith("cr-"))
    return {
      kind: "Change request",
      title: "Bank details",
      sub: l.label,
      facts: [
        { label: "Control", value: "Second approver required (four-eyes)" },
        { label: "Delivery", value: "Investor portal only — never in chat or email" },
        { label: "Status", value: "Pending review", tone: "warn" },
      ],
      href: `/admin/fund/banking`,
      files: [],
    };
  if (l.kind === "bank") {
    const r = profileChangeRequests.find((p) => p.id === l.id);
    if (!r) return null;
    return {
      kind: "Bank-detail change",
      title: investorById(r.investorId)?.name ?? "",
      sub: r.field,
      facts: [
        { label: "From", value: r.from },
        { label: "To", value: r.to },
        { label: "Submitted", value: `${longDay(r.submitted)} by ${r.submittedBy}` },
        { label: "Control", value: r.control },
        { label: "Status", value: r.status, tone: "warn" },
      ],
      href: `/admin/fund/investors`,
      files: [],
    };
  }
  if (l.kind === "room") {
    const r = rooms.find((x) => x.id === l.id);
    if (!r) return null;
    const qs = roomQuestions.filter((q) => q.roomId === r.id);
    return {
      kind: "Data room",
      title: r.name,
      sub: r.purpose,
      facts: [
        { label: "Documents", value: String(roomDocs.filter((d) => d.roomId === r.id).length) },
        { label: "Open questions", value: String(qs.filter((q) => q.status !== "Answered").length), tone: "warn" },
        { label: "Answered", value: String(qs.filter((q) => q.status === "Answered").length) },
      ],
      href: `/admin/dataroom`,
      files: roomDocs.filter((d) => d.roomId === r.id).slice(0, 3).map((d) => ({ name: d.name, size: d.size, type: "pdf" as const, source: r.name })),
    };
  }
  if (l.kind === "formation") {
    const f = formations.find((x) => x.ref === l.id);
    if (!f) return null;
    return {
      kind: "Formation",
      title: f.company,
      sub: `${f.ref} · ${f.client}`,
      facts: [
        { label: "Stage", value: f.stage },
        { label: "KYC", value: f.kyc, tone: f.kyc === "Clear" ? "pos" : "warn" },
        { label: "Owners", value: String(f.owners) },
        { label: "Submitted", value: longDay(f.submitted) },
        ...(f.note ? [{ label: "Note", value: f.note }] : []),
      ],
      href: `/admin/corporate`,
      files: [],
    };
  }
  if (l.kind === "plan") {
    const p = plans.find((x) => x.id === l.id);
    if (!p) return null;
    const tasks = p.rows.filter((r) => r.id.includes("."));
    const open = tasks.filter((t) => t.status !== "Completed");
    return {
      kind: "Project plan",
      title: p.name,
      sub: p.vehicle,
      facts: [
        { label: "Tasks", value: String(tasks.length) },
        { label: "Open", value: String(open.length), tone: "warn" },
        { label: "Completed", value: String(tasks.length - open.length) },
        { label: "Parties", value: p.parties.map((x) => x.name).join(", ") },
      ],
      progress: { pct: (tasks.length - open.length) / tasks.length, label: `${tasks.length - open.length} of ${tasks.length} complete` },
      href: `/admin/pmo?tab=plan`,
      files: [],
    };
  }
  if (l.kind === "access") {
    const r = accessRequests.find((x) => x.id === l.id);
    if (!r) return null;
    return { kind: "Access request", title: `#${r.subject}`, sub: r.detail, facts: [{ label: "Requested by", value: personName(r.requestedBy) }, { label: "Kind", value: r.kind }], href: `/admin/access`, files: [] };
  }
  return null;
}

/** Everything that can be attached from a data room or the document register. */
export const attachables: (ChatAttachment & { id: string })[] = [
  ...roomDocs.map((d) => ({ id: "rd-" + d.id, name: d.name, size: d.size, type: "pdf" as const, source: rooms.find((r) => r.id === d.roomId)?.name ?? "Data room" })),
  ...documents.map((d) => ({ id: "doc-" + d.id, name: d.name + ".pdf", size: parseFloat(d.size) * (d.size.includes("MB") ? 1_000_000 : 1000), type: "pdf" as const, source: fundById(d.fundId)?.shortName ?? "Documents" })),
];

/** Records a "#" reference can point to, besides matters. */
export const referenceables = capitalCalls.map((c) => ({ token: `${fundById(c.fundId)?.shortName} · Call No. ${c.number}`, label: `Capital Call No. ${c.number} — ${fundById(c.fundId)?.shortName}` }));

/* ───────────────────────── helpers ───────────────────────── */

export const PREFIX: Record<LinkKind, string> = { call: "CC", formation: "FOR", investor: "KYC", room: "DR", plan: "PLN", vehicle: "VEH", bank: "BNK", subscription: "SUB", access: "ACC" };

export const priorityRank: Record<Priority, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3, None: 4 };

export function matchesFilters(m: Matter, f: Filters, messages: ChatMessage[]) {
  if (f.status === "open" && m.status === "Resolved") return false;
  if (f.status && f.status !== "open" && m.status !== f.status) return false;
  if (f.owner && m.owner !== f.owner) return false;
  if (f.label && !m.labels.includes(f.label)) return false;
  if (f.linked && m.linked.kind !== f.linked) return false;
  if (f.external !== undefined && m.participants.some(isExternal) !== f.external) return false;
  void messages;
  return true;
}

/** Parse "@name" mentions against people the composer knows. */
export function parseMentions(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(/@([A-Za-zÀ-ÿ]+)/g)) {
    const w = m[1].toLowerCase();
    const p = chatPeople.find((x) => x.id === w || x.name.split(" ")[0].toLowerCase() === w);
    if (p) out.add(p.id);
  }
  return [...out];
}
export const parseRefs = (body: string) => [...body.matchAll(/#([A-Z]{2,4}-\d+)/g)].map((m) => m[1]);
