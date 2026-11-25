/**
 * Communication — Aurum's secure messaging.
 *
 * Organisation (Discord-style servers, Slack-style shared channels, Teams-style files):
 *   Space    one per solution, plus the firm-wide "Aurum" space. Each has an owner.
 *   Section  inside a space: the Aurum-internal section, then one section per client.
 *   Channel  inside a section; public to the section or private (named members only).
 *   Thread   replies to a message.
 *   DMs      one-to-one and small groups, outside spaces.
 *
 * Clients never see that other spaces or other clients exist. Anything that grants access
 * (new channel, guest, new colleague) is requested by the client admin and approved by Aurum.
 */
import { solutions } from "./solutions";

export type Org = "aurum" | string; // "aurum" or a client id

export type Person = {
  id: string;
  name: string;
  title: string;
  org: Org;
  /** client role; Aurum staff use space roles instead */
  clientRole?: "admin" | "member" | "guest";
  /** guests only */
  guestOf?: string;
  expires?: string;
  email: string;
};

export type Space = {
  id: string;
  name: string;
  short: string;
  ownerId: string;
  /** Aurum staff working in this space */
  staffIds: string[];
  firmWide?: boolean;
};

export type Client = {
  id: string;
  name: string;
  short: string;
  /** links to the GP record for branding on the GP portal */
  gpId?: string;
  color: string;
  spaceIds: string[];
};

export type Channel = {
  id: string;
  spaceId: string;
  /** null = Aurum internal section */
  clientId: string | null;
  name: string;
  topic: string;
  private?: boolean;
  /** private channels: who is in it (Aurum admin always sees everything) */
  memberIds?: string[];
  /** guests added to this channel */
  guestIds?: string[];
  /** read-only for everyone except owners (firm announcements) */
  announce?: boolean;
};

export type DirectThread = { id: string; memberIds: string[] };

export type FileRef = { name: string; size: number; type: "pdf" | "xlsx" | "docx" | "csv" | "img" | "zip" };

export type Attachment =
  | ({ id: string; kind: "file" } & FileRef & { filedTo?: string })
  | { id: string; kind: "folder"; name: string; files: (FileRef & { path: string })[]; filedTo?: string };

export type Message = {
  id: string;
  /** channel id or direct thread id */
  where: string;
  authorId: string;
  at: string;
  body: string;
  attachments?: Attachment[];
  parentId?: string;
  reactions?: { emoji: string; by: string[] }[];
  meet?: { code: string; title: string; when?: string };
  pinned?: boolean;
  system?: boolean;
};

export type AccessRequest = {
  id: string;
  kind: "channel" | "guest" | "colleague";
  spaceId: string;
  clientId: string;
  requestedBy: string;
  at: string;
  /** channel name, or the person to add */
  subject: string;
  detail: string;
  status: "pending" | "approved" | "declined";
  decidedBy?: string;
};

/* ───────────────────────── people ───────────────────────── */

export const ME = "me";

export const people: Person[] = [
  { id: ME, name: "Managing Partner", title: "Managing Partner", org: "aurum", email: "admin@aurumasset.us" },
  { id: "luiza", name: "Luiza Andrade", title: "Head of Fund Services", org: "aurum", email: "luiza@aurumasset.us" },
  { id: "rafael", name: "Rafael Mendes", title: "Fund Accountant", org: "aurum", email: "rafael@aurumasset.us" },
  { id: "juliana", name: "Juliana Teixeira", title: "Relationship Manager", org: "aurum", email: "juliana@aurumasset.us" },
  { id: "carla", name: "Carla Nogueira", title: "Compliance Officer", org: "aurum", email: "carla@aurumasset.us" },
  { id: "helena", name: "Helena Costa", title: "Head of Family Office", org: "aurum", email: "helena@aurumasset.us" },
  { id: "noah", name: "Noah Whitaker", title: "Head of Banking Operations", org: "aurum", email: "noah@aurumasset.us" },
  { id: "priya", name: "Priya Raman", title: "Head of Digital Assets", org: "aurum", email: "priya@aurumasset.us" },
  { id: "olivia", name: "Olivia Brandt", title: "Head of Capital Markets", org: "aurum", email: "olivia@aurumasset.us" },
  { id: "eduardo", name: "Eduardo Sales", title: "Head of Corporate Services", org: "aurum", email: "eduardo@aurumasset.us" },
  { id: "bianca", name: "Bianca Freitas", title: "Corporate Paralegal", org: "aurum", email: "bianca@aurumasset.us" },

  { id: "lucas", name: "Lucas Prado", title: "Managing Partner", org: "strlex", clientRole: "admin", email: "lucas@strlex.com" },
  { id: "emma", name: "Emma Wright", title: "CFO", org: "strlex", clientRole: "member", email: "emma@strlex.com" },
  { id: "james", name: "James Okafor", title: "Partner", org: "arbor", clientRole: "admin", email: "jokafor@arborpartners.com" },
  { id: "marcus", name: "Marcus Hale", title: "Managing Director", org: "cordillera", clientRole: "admin", email: "mhale@cordillera-infra.com" },
  { id: "sofia", name: "Sofia Klein", title: "Investor Relations", org: "cordillera", clientRole: "member", email: "sklein@cordillera-infra.com" },
  { id: "ana", name: "Ana Ribeiro", title: "Founding Partner", org: "atlantico", clientRole: "admin", email: "ana@atlanticocapital.com.br" },
  { id: "victoria", name: "Victoria Halvorsen", title: "Family Principal", org: "halvorsen", clientRole: "admin", email: "victoria@halvorsen.family" },
  { id: "pedro", name: "Pedro Valença", title: "Family CFO", org: "valenca", clientRole: "admin", email: "pedro@valencafo.com" },
  { id: "kenji", name: "Kenji Moriyama", title: "Treasurer", org: "portoreal", clientRole: "admin", email: "kenji@portorealholdings.com" },
  { id: "aisha", name: "Aisha Bello", title: "COO", org: "ledgerline", clientRole: "admin", email: "aisha@ledgerline.io" },
  { id: "tom", name: "Tom Ashford", title: "Managing Partner", org: "cascade", clientRole: "admin", email: "tom@cascaderidge.com" },
  { id: "isabel", name: "Isabel Duarte", title: "Director", org: "altamira", clientRole: "admin", email: "isabel@altamiraholdings.com" },
  { id: "eleanor", name: "Eleanor Reyes", title: "Managing Director", org: "northbridge", clientRole: "admin", email: "eleanor@northbridgefp.com" },
  { id: "samito", name: "Sam Ito", title: "Client Services", org: "northbridge", clientRole: "member", email: "sam@northbridgefp.com" },
  { id: "maraq", name: "Mara Quinn", title: "Director", org: "halcyon", clientRole: "admin", email: "mara@halcyoncs.com" },
  { id: "margaret", name: "Margaret Calloway", title: "Trustee, Calloway Family Trust", org: "calloway", clientRole: "admin", email: "m.calloway@callowaytrust.com" },
  { id: "anamazal", name: "Ana Mazal", title: "Mazal Group", org: "mazal", clientRole: "admin", email: "ana@mazalgroup.com.br" },

  {
    id: "laura",
    name: "Laura Chen",
    title: "Counsel, Hartwell & Pryce LLP",
    org: "strlex",
    clientRole: "guest",
    guestOf: "strlex",
    expires: "2027-01-31",
    email: "lchen@hartwellpryce.com",
  },
  {
    id: "owen",
    name: "Owen Mercer",
    title: "Audit Senior, Blake Morrow CPAs",
    org: "cordillera",
    clientRole: "guest",
    guestOf: "cordillera",
    expires: "2026-12-31",
    email: "omercer@blakemorrow.com",
  },
];

export const personById = (id: string) => people.find((p) => p.id === id);

/* ───────────────────────── spaces & clients ───────────────────────── */

const owners: Record<string, string> = {
  fund: "luiza",
  "multi-family": "helena",
  banking: "noah",
  blockchain: "priya",
  offering: "olivia",
  corporate: "eduardo",
};
const staff: Record<string, string[]> = {
  fund: ["luiza", "rafael", "juliana", "carla"],
  "multi-family": ["helena", "juliana", "carla"],
  banking: ["noah", "rafael", "carla"],
  blockchain: ["priya", "carla"],
  offering: ["olivia", "juliana", "carla"],
  corporate: ["eduardo", "bianca", "carla"],
};
const shorts: Record<string, string> = { fund: "FS", "multi-family": "MF", banking: "BK", blockchain: "BC", offering: "OF", corporate: "CS" };

export const spaces: Space[] = [
  {
    id: "aurum",
    name: "Aurum",
    short: "A",
    ownerId: ME,
    staffIds: people.filter((p) => p.org === "aurum").map((p) => p.id),
    firmWide: true,
  },
  ...solutions.map((s) => ({
    id: s.id,
    name: s.name,
    short: shorts[s.id],
    ownerId: owners[s.id],
    staffIds: [ME, ...staff[s.id]],
  })),
];

export const spaceById = (id: string) => spaces.find((s) => s.id === id);

export const clients: Client[] = [
  { id: "strlex", name: "Strlex Capital Group Inc.", short: "Strlex Capital", gpId: "strlex", color: "#191E31", spaceIds: ["fund", "banking"] },
  { id: "arbor", name: "Arbor Partners Inc.", short: "Arbor Partners", gpId: "arbor", color: "#2F5D46", spaceIds: ["fund"] },
  { id: "cordillera", name: "Cordillera Infrastructure", short: "Cordillera", gpId: "cordillera", color: "#3A4A5C", spaceIds: ["fund"] },
  { id: "atlantico", name: "Atlântico Capital", short: "Atlântico Capital", gpId: "atlantico", color: "#0E4C6B", spaceIds: ["fund"] },
  { id: "halvorsen", name: "Halvorsen Family Office", short: "Halvorsen Family", color: "#5B4636", spaceIds: ["multi-family"] },
  { id: "valenca", name: "Valença Family Office", short: "Valença Family", color: "#6B4E2E", spaceIds: ["multi-family"] },
  { id: "portoreal", name: "Porto Real Holdings", short: "Porto Real", color: "#24476B", spaceIds: ["banking"] },
  { id: "ledgerline", name: "Ledgerline Digital Ltd.", short: "Ledgerline", color: "#2C3E50", spaceIds: ["blockchain"] },
  { id: "cascade", name: "Cascade Ridge Partners", short: "Cascade Ridge", color: "#3E5641", spaceIds: ["offering"] },
  { id: "altamira", name: "Altamira Holdings LLC", short: "Altamira Holdings", color: "#4A3B5C", spaceIds: ["corporate"] },
  { id: "northbridge", name: "Northbridge Fiduciary Partners", short: "Northbridge", color: "#173A2E", spaceIds: ["multi-family", "corporate"] },
  { id: "halcyon", name: "Halcyon Corporate Services", short: "Halcyon", color: "#2B2F36", spaceIds: ["corporate", "multi-family"] },
  { id: "mazal", name: "Mazal Group", short: "Mazal Group", color: "#6B3B2E", spaceIds: ["corporate"] },
  { id: "calloway", name: "Calloway Family Trust", short: "Calloway Family Trust", color: "#2F4A5C", spaceIds: ["fund"] },
];

export const clientById = (id: string) => clients.find((c) => c.id === id);

/* ───────────────────────── channels ───────────────────────── */

export const channels: Channel[] = [
  // firm-wide
  { id: "a-announcements", spaceId: "aurum", clientId: null, name: "announcements", topic: "Firm-wide notices from the partners", announce: true },
  { id: "a-general", spaceId: "aurum", clientId: null, name: "general", topic: "Everyone at {tenant}" },
  { id: "a-compliance", spaceId: "aurum", clientId: null, name: "compliance-bulletins", topic: "Policy updates, training and regulatory changes" },

  // Fund Solution — internal
  { id: "f-general", spaceId: "fund", clientId: null, name: "general", topic: "Fund Solution team" },
  { id: "f-close", spaceId: "fund", clientId: null, name: "quarter-close", topic: "Q4 2026 close — checklist and sign-offs" },
  { id: "f-kyc", spaceId: "fund", clientId: null, name: "kyc-reviews", topic: "Screening matches and onboarding decisions", private: true, memberIds: [ME, "luiza", "carla"] },
  // Fund Solution — Strlex
  { id: "f-strlex-general", spaceId: "fund", clientId: "strlex", name: "general", topic: "Strlex Capital × {tenant}", guestIds: [] },
  { id: "f-strlex-stx", spaceId: "fund", clientId: "strlex", name: "stx-anchor-fund", topic: "STX-Anchor Capital Formation Fund — administration", guestIds: ["laura"] },
  { id: "f-strlex-fees", spaceId: "fund", clientId: "strlex", name: "fees", topic: "Management fee and expense allocation", private: true, memberIds: [ME, "luiza", "lucas", "emma"] },
  // Fund Solution — other GPs
  { id: "f-arbor-general", spaceId: "fund", clientId: "arbor", name: "general", topic: "Arbor Partners × {tenant}" },
  { id: "f-cord-general", spaceId: "fund", clientId: "cordillera", name: "general", topic: "Cordillera × {tenant}" },
  { id: "f-cord-infra", spaceId: "fund", clientId: "cordillera", name: "infrastructure-i", topic: "Cordillera Infrastructure I — capital activity", guestIds: ["owen"] },
  { id: "f-atl-general", spaceId: "fund", clientId: "atlantico", name: "general", topic: "Atlântico Capital × {tenant}" },

  // Multi-Family
  { id: "m-general", spaceId: "multi-family", clientId: null, name: "general", topic: "Family Office team" },
  { id: "m-halv-general", spaceId: "multi-family", clientId: "halvorsen", name: "general", topic: "Halvorsen Family × {tenant}" },
  { id: "t-northbridge-general", spaceId: "multi-family", clientId: "northbridge", name: "general", topic: "Northbridge × {tenant} — platform and operations" },
  { id: "t-halcyon-general", spaceId: "corporate", clientId: "halcyon", name: "general", topic: "Halcyon × {tenant} — platform and operations" },
  { id: "c-mazal-general", spaceId: "corporate", clientId: "mazal", name: "general", topic: "Mazal Group × {tenant} — company formation" },
  { id: "f-calloway-general", spaceId: "fund", clientId: "calloway", name: "general", topic: "Calloway Family Trust × {tenant} — investor services" },
  { id: "m-halv-succession", spaceId: "multi-family", clientId: "halvorsen", name: "succession", topic: "Trust restructuring", private: true, memberIds: [ME, "helena", "victoria"] },
  { id: "m-val-general", spaceId: "multi-family", clientId: "valenca", name: "general", topic: "Valença Family × {tenant}" },

  // Banking
  { id: "b-general", spaceId: "banking", clientId: null, name: "general", topic: "Banking operations" },
  { id: "b-payments", spaceId: "banking", clientId: null, name: "payment-approvals", topic: "Outgoing wires awaiting second approval" },
  { id: "b-strlex", spaceId: "banking", clientId: "strlex", name: "treasury", topic: "Strlex operating and fund accounts" },
  { id: "b-porto", spaceId: "banking", clientId: "portoreal", name: "general", topic: "Porto Real Holdings × {tenant}" },

  // Blockchain
  { id: "c-general", spaceId: "blockchain", clientId: null, name: "general", topic: "Digital assets team" },
  { id: "c-ledger", spaceId: "blockchain", clientId: "ledgerline", name: "token-launch", topic: "Ledgerline tokenized notes — transfer agent setup" },

  // Offering
  { id: "o-general", spaceId: "offering", clientId: null, name: "general", topic: "Capital markets team" },
  { id: "o-cascade", spaceId: "offering", clientId: "cascade", name: "cascade-fund-i", topic: "Cascade Real Estate Fund I — data room and closing" },

  // Corporate
  { id: "k-general", spaceId: "corporate", clientId: null, name: "general", topic: "Corporate services team" },
  { id: "k-filings", spaceId: "corporate", clientId: null, name: "annual-filings", topic: "Deadlines across jurisdictions" },
  { id: "k-altamira", spaceId: "corporate", clientId: "altamira", name: "general", topic: "Altamira Holdings × {tenant}" },
];

export const channelById = (id: string) => channels.find((c) => c.id === id);

export const directThreads: DirectThread[] = [
  { id: "dm-luiza", memberIds: [ME, "luiza"] },
  { id: "dm-lucas", memberIds: [ME, "lucas"] },
  { id: "dm-carla-luiza", memberIds: [ME, "carla", "luiza"] },
];

/* ───────────────────────── access rules ───────────────────────── */

export type Viewer = { personId: string; clientId?: string };

/** Space role of an Aurum person; client people have none. */
export function spaceRole(spaceId: string, personId: string): "admin" | "owner" | "member" | null {
  const p = personById(personId);
  if (!p || p.org !== "aurum") return null;
  if (personId === ME) return "admin";
  const s = spaceById(spaceId);
  if (!s) return null;
  if (s.ownerId === personId) return "owner";
  return s.staffIds.includes(personId) ? "member" : null;
}

export function canSeeChannel(ch: Channel, personId: string): boolean {
  const p = personById(personId);
  if (!p) return false;
  if (p.org === "aurum") {
    const role = spaceRole(ch.spaceId, personId);
    if (role === "admin") return true;
    if (!role) return false;
    return !ch.private || !!ch.memberIds?.includes(personId);
  }
  // client side: only their own client's section
  if (ch.clientId !== p.org) return false;
  if (p.clientRole === "guest") return !!ch.guestIds?.includes(personId);
  return !ch.private || !!ch.memberIds?.includes(personId);
}

/** Everyone who can read a channel (for the member list). */
export function channelMembers(ch: Channel): Person[] {
  return people.filter((p) => canSeeChannel(ch, p.id));
}

/* ───────────────────────── sample conversation ───────────────────────── */

const pdf = (name: string, size: number): FileRef => ({ name, size, type: "pdf" });
let n = 0;
const id = () => `m${++n}`;

export const messages: Message[] = [
  // firm-wide
  {
    id: id(),
    where: "a-announcements",
    authorId: ME,
    at: "2026-11-17T13:05:00Z",
    body: "Welcome to {tenant} Communication. All client conversations move here from email starting December 1. Everything is encrypted and kept under our records policy — please don’t use personal messaging apps for client matters.",
    pinned: true,
  },
  {
    id: id(),
    where: "a-announcements",
    authorId: ME,
    at: "2026-11-24T12:30:00Z",
    body: "Office closed Thursday and Friday for Thanksgiving. Wires cut-off Wednesday 2pm ET.",
  },
  { id: id(), where: "a-general", authorId: "juliana", at: "2026-11-24T14:02:00Z", body: "Lunch is here for the Q4 kick-off — 3rd floor." },
  {
    id: id(),
    where: "a-compliance",
    authorId: "carla",
    at: "2026-11-20T15:40:00Z",
    body: "Annual compliance training is due December 15. Takes about 40 minutes.",
    attachments: [{ id: "x1", kind: "file", ...pdf("Compliance Manual 2027 — draft.pdf", 1_840_000) }],
  },

  // Fund internal
  {
    id: id(),
    where: "f-close",
    authorId: "luiza",
    at: "2026-11-23T13:15:00Z",
    body: "Q4 close kicks off December 1. Owners per fund are in the checklist. Bank recs first, then accruals, then NAV.",
    pinned: true,
    attachments: [{ id: "x2", kind: "file", name: "Q4 2026 close checklist.xlsx", size: 96_000, type: "xlsx" }],
  },
  { id: "m-close-2", where: "f-close", authorId: "rafael", at: "2026-11-23T13:40:00Z", body: "STX-Anchor and Cordillera are mine. I’ll have bank recs by Dec 3." },
  { id: id(), where: "f-close", authorId: "luiza", at: "2026-11-23T13:44:00Z", body: "Perfect.", parentId: "m-close-2" },
  { id: id(), where: "f-kyc", authorId: "carla", at: "2026-11-22T18:20:00Z", body: "Possible PEP match on a Cordillera subscriber — false positive in my view, date of birth differs. Need a second reviewer." },
  { id: id(), where: "f-general", authorId: "juliana", at: "2026-11-24T11:10:00Z", body: "Arbor asked for a call on their second close timing. Setting it for next week." },

  // Strlex general
  {
    id: id(),
    where: "f-strlex-general",
    authorId: "luiza",
    at: "2026-11-10T14:00:00Z",
    body: "Welcome to your {tenant} workspace, Lucas and Emma. This is where we’ll share notices, drafts and anything that needs your sign-off.",
  },
  { id: id(), where: "f-strlex-general", authorId: "lucas", at: "2026-11-10T14:22:00Z", body: "Thanks Luiza — much better than our email chains.", reactions: [{ emoji: "👍", by: ["luiza", ME] }] },
  {
    id: id(),
    where: "f-strlex-general",
    authorId: "emma",
    at: "2026-11-21T16:05:00Z",
    body: "Uploading our updated authorized signatory list and the W-9.",
    attachments: [
      { id: "x3", kind: "file", ...pdf("Authorized Signatories — Nov 2026.pdf", 412_000), filedTo: "Corporate documents" },
      { id: "x4", kind: "file", ...pdf("Form W-9 — Strlex Capital Group.pdf", 188_000) },
    ],
  },

  // Strlex STX-Anchor
  {
    id: id(),
    where: "f-strlex-stx",
    authorId: "luiza",
    at: "2026-11-18T13:30:00Z",
    body: "Formation documents for STX-Anchor are complete on our side. Laura, could you confirm the side letter list matches your records?",
  },
  {
    id: "m-stx-2",
    where: "f-strlex-stx",
    authorId: "laura",
    at: "2026-11-18T15:12:00Z",
    body: "Confirmed with one addition — the side letter for Bayview was signed last Friday. Sending the full set.",
    attachments: [
      {
        id: "x5",
        kind: "folder",
        name: "STX-Anchor — Side letters",
        files: [
          { path: "STX-Anchor — Side letters/Bayview Partners — Side letter.pdf", ...pdf("Bayview Partners — Side letter.pdf", 640_000) },
          { path: "STX-Anchor — Side letters/Calloway Family Trust — Side letter.pdf", ...pdf("Calloway Family Trust — Side letter.pdf", 702_000) },
          { path: "STX-Anchor — Side letters/MFN election form.pdf", ...pdf("MFN election form.pdf", 210_000) },
          { path: "STX-Anchor — Side letters/Executed/Schedule of side letters.pdf", ...pdf("Schedule of side letters.pdf", 98_000) },
        ],
        filedTo: "Corporate documents",
      },
    ],
  },
  { id: id(), where: "f-strlex-stx", authorId: "luiza", at: "2026-11-18T15:30:00Z", body: "Received, filed to STX-Anchor’s corporate documents.", parentId: "m-stx-2" },
  { id: id(), where: "f-strlex-stx", authorId: "lucas", at: "2026-11-18T15:41:00Z", body: "Thanks both.", parentId: "m-stx-2" },
  {
    id: id(),
    where: "f-strlex-stx",
    authorId: "luiza",
    at: "2026-11-24T13:00:00Z",
    body: "Draft capital call #3 is ready for your review — $4.2M at 8% of commitments, due December 15.",
    attachments: [
      { id: "x6", kind: "file", ...pdf("STX-Anchor — Capital call #3 — draft notice.pdf", 356_000) },
      { id: "x7", kind: "file", name: "Capital call #3 — allocation.xlsx", size: 84_000, type: "xlsx" },
    ],
  },
  {
    id: id(),
    where: "f-strlex-stx",
    authorId: "lucas",
    at: "2026-11-24T14:10:00Z",
    body: "Looks right. Can we walk through the allocation for the two late closers before I approve?",
  },
  {
    id: id(),
    where: "f-strlex-stx",
    authorId: "luiza",
    at: "2026-11-24T14:14:00Z",
    body: "",
    meet: { code: "kpr-vxdm-qwe", title: "Capital call #3 — allocation review", when: "2026-11-25T15:00:00Z" },
  },

  { id: id(), where: "f-strlex-fees", authorId: "emma", at: "2026-11-19T17:00:00Z", body: "Can you confirm the Q4 management fee offset for transaction fees received in October?" },
  { id: id(), where: "f-strlex-fees", authorId: "rafael", at: "2026-11-19T18:30:00Z", body: "Yes — 80% offset per section 8.3, $42,500 against the Q4 fee. Detail in the attached." , attachments: [{ id: "x8", kind: "file", name: "Q4 fee offset.xlsx", size: 41_000, type: "xlsx" }] },

  // Cordillera
  { id: id(), where: "f-cord-infra", authorId: "marcus", at: "2026-11-21T13:20:00Z", body: "Owen from Blake Morrow will need the FY2026 capital account statements by January 10." },
  { id: id(), where: "f-cord-infra", authorId: "owen", at: "2026-11-21T14:00:00Z", body: "Thank you. A PBC list is attached.", attachments: [{ id: "x9", kind: "file", ...pdf("FY2026 PBC list — Cordillera Infrastructure I.pdf", 220_000) }] },
  { id: id(), where: "f-cord-infra", authorId: "rafael", at: "2026-11-21T15:05:00Z", body: "Noted. We’ll deliver the statements by January 8." },
  { id: id(), where: "f-cord-general", authorId: "sofia", at: "2026-11-24T10:45:00Z", body: "Two investors asked for updated wire instructions. Can {tenant} send them through the portal?" },

  { id: id(), where: "f-arbor-general", authorId: "james", at: "2026-11-20T12:00:00Z", body: "Second close is moving to January 15. Updated timeline attached.", attachments: [{ id: "x10", kind: "file", ...pdf("Arbor Fund II — closing timeline.pdf", 150_000) }] },
  { id: id(), where: "f-atl-general", authorId: "ana", at: "2026-11-19T19:30:00Z", body: "Obrigada pelo relatório do Q3 — all clear from our side." },

  // other spaces
  { id: id(), where: "m-halv-general", authorId: "victoria", at: "2026-11-22T16:00:00Z", body: "Please add the new Delaware holding company to the consolidated report." },
  { id: id(), where: "t-northbridge-general", authorId: "helena", at: "2026-11-19T15:00:00Z", body: "Eleanor — the Valença family portal is live under your brand. Pedro has access to the consolidated view." },
  { id: id(), where: "t-northbridge-general", authorId: "eleanor", at: "2026-11-19T16:20:00Z", body: "Perfect. We will onboard two more families in December." },
  { id: id(), where: "c-mazal-general", authorId: "eduardo", at: "2026-11-21T14:00:00Z", body: "Welcome, Ana. Your application for Mazal Empreendimentos SPE Ltda. is in identity review — we will message you here if we need anything." },
  { id: id(), where: "c-mazal-general", authorId: "anamazal", at: "2026-11-21T15:10:00Z", body: "Thank you. The second director's passport copy is uploaded." },
  { id: id(), where: "f-calloway-general", authorId: "juliana", at: "2026-11-20T13:00:00Z", body: "Good afternoon, Mrs. Calloway. Your Q3 capital account statement for Atlântico Venture II is now in Documents." },
  { id: id(), where: "f-calloway-general", authorId: "margaret", at: "2026-11-20T16:40:00Z", body: "Thank you, Juliana. Could you confirm the wire date for the next capital call?" },
  { id: id(), where: "m-halv-succession", authorId: "helena", at: "2026-11-23T15:00:00Z", body: "Draft trust deed from counsel is attached for your review.", attachments: [{ id: "x11", kind: "file", ...pdf("Halvorsen Trust — restated deed — draft.pdf", 920_000) }] },
  { id: id(), where: "m-val-general", authorId: "pedro", at: "2026-11-18T13:00:00Z", body: "Quarterly family meeting confirmed for December 9." },
  { id: id(), where: "b-payments", authorId: "noah", at: "2026-11-24T13:50:00Z", body: "Two wires over $250k awaiting second approval: Strlex distribution and Porto Real intercompany transfer." },
  { id: id(), where: "b-strlex", authorId: "emma", at: "2026-11-20T14:00:00Z", body: "Please move $1.5M from operating into the fund subscription account on Monday." },
  { id: id(), where: "b-porto", authorId: "kenji", at: "2026-11-21T09:30:00Z", body: "Daily cash report looks good. Can we add the EUR account?" },
  { id: id(), where: "c-ledger", authorId: "aisha", at: "2026-11-22T12:00:00Z", body: "Smart contract audit report is in. Ready for the transfer agent review.", attachments: [{ id: "x12", kind: "file", ...pdf("Ledgerline Notes — smart contract audit.pdf", 2_400_000) }] },
  { id: id(), where: "o-cascade", authorId: "tom", at: "2026-11-23T17:30:00Z", body: "PPM v3 uploaded to the data room. Broker-dealer comments addressed." },
  { id: id(), where: "k-filings", authorId: "bianca", at: "2026-11-24T12:00:00Z", body: "Cayman annual returns due January 31 for 14 entities. Delaware franchise tax March 1." },
  { id: id(), where: "k-altamira", authorId: "isabel", at: "2026-11-20T15:00:00Z", body: "Board resolution for the new subsidiary signed. Uploading now.", attachments: [{ id: "x13", kind: "file", ...pdf("Altamira — Board resolution — new subsidiary.pdf", 310_000), filedTo: "Corporate documents" }] },

  // DMs
  { id: id(), where: "dm-luiza", authorId: "luiza", at: "2026-11-24T13:20:00Z", body: "Strlex call #3 is with Lucas. I set up a Meet for tomorrow at 10." },
  { id: id(), where: "dm-lucas", authorId: "lucas", at: "2026-11-23T20:10:00Z", body: "Good speaking today. We’re very happy with the onboarding so far." },
  { id: id(), where: "dm-carla-luiza", authorId: "carla", at: "2026-11-22T18:30:00Z", body: "Second reviewer needed on the Cordillera PEP match when you have a minute." },
];

/** Read up to the start of today everywhere unless noted. */
export const DEFAULT_READ = "2026-11-24T00:00:00Z";
export const lastRead: Record<string, string> = {
  "a-announcements": "2026-11-24T12:30:00Z",
  "a-general": "2026-11-24T00:00:00Z",
  "f-close": "2026-11-23T14:00:00Z",
  "f-strlex-stx": "2026-11-24T13:30:00Z",
  "f-cord-general": "2026-11-23T00:00:00Z",
  "b-payments": "2026-11-24T00:00:00Z",
  "dm-luiza": "2026-11-24T00:00:00Z",
};

export const requests: AccessRequest[] = [
  {
    id: "r1",
    kind: "channel",
    spaceId: "fund",
    clientId: "strlex",
    requestedBy: "lucas",
    at: "2026-11-24T15:00:00Z",
    subject: "stx-anchor-investor-relations",
    detail: "Separate channel for our IR team to coordinate investor questions.",
    status: "pending",
  },
  {
    id: "r2",
    kind: "guest",
    spaceId: "fund",
    clientId: "cordillera",
    requestedBy: "marcus",
    at: "2026-11-24T11:30:00Z",
    subject: "Daniel Moreau, CPA — Moreau CPA",
    detail: "Tax adviser · #infrastructure-i · until March 31, 2027",
    status: "pending",
  },
  {
    id: "r3",
    kind: "colleague",
    spaceId: "multi-family",
    clientId: "halvorsen",
    requestedBy: "victoria",
    at: "2026-11-23T19:00:00Z",
    subject: "Erik Halvorsen — erik@halvorsen.family",
    detail: "Family member · all Halvorsen channels",
    status: "pending",
  },
];

/* ───────────────────────── helpers ───────────────────────── */

export const initials = (name: string) =>
  name
    .replace(/,.*$/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export function fileSize(b: number) {
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(b / 1000))} KB`;
}

export function typeOf(name: string): FileRef["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "xlsm"].includes(ext)) return "xlsx";
  if (["doc", "docx"].includes(ext)) return "docx";
  if (ext === "csv") return "csv";
  if (["png", "jpg", "jpeg", "gif", "webp", "heic"].includes(ext)) return "img";
  return "zip";
}

/** Unread messages in a conversation for the admin viewer. */
export function unreadCount(where: string, msgs: Message[], viewerId: string, read: Record<string, string>) {
  const since = read[where] ?? DEFAULT_READ;
  return msgs.filter((m) => m.where === where && !m.parentId && m.authorId !== viewerId && (!since || m.at > since)).length;
}

/** Total unread for Aurum's admin — shown on the hub hexagon. */
export function totalUnread() {
  const seen = new Set([...channels.map((c) => c.id), ...directThreads.map((d) => d.id)]);
  let t = 0;
  for (const w of seen) t += unreadCount(w, messages, ME, lastRead);
  return t;
}

/** Unread for Aurum's admin within one space (hub ring). */
export function spaceUnreadCount(spaceId: string) {
  return channels.filter((c) => c.spaceId === spaceId).reduce((t, c) => t + unreadCount(c.id, messages, ME, lastRead), 0);
}
