/**
 * Data room: document versions, per-room branding overrides and room templates.
 * Kept in this browser until the database is connected (same pattern as dataroom-local.ts); every call is guarded.
 */
import { docs, roomBrand, type RoomBrand } from "./dataroom";

/* ───────────────────────── versions ───────────────────────── */

export type DocVersion = { docId: string; version: number; at: string; by: string; note: string; fileName?: string };

const VER = "aurum-vdr-versions";
const BR = "aurum-vdr-brand";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable: the change lasts for this visit */
  }
}

/** Seeded history: every document starts at version 1 when its room opened; two have been replaced since. */
const firstIn = (roomId: string, i: number) => docs.filter((d) => d.roomId === roomId)[i];
const SEED_UPDATES: DocVersion[] = [
  { docId: firstIn("rm-cascade", 0)?.id ?? "", version: 2, at: "2026-11-23T20:00:00Z", by: "Luiza Andrade", note: "Revised terms summary and fee table" },
  { docId: firstIn("rm-stx", 2)?.id ?? "", version: 2, at: "2026-11-21T14:30:00Z", by: "Rafael Mendes", note: "Corrected fee table on page 5" },
].filter((v) => v.docId);

export function versionsOf(docId: string, opened: string): DocVersion[] {
  const local = read<DocVersion[]>(VER, []).filter((v) => v.docId === docId);
  const seeded = SEED_UPDATES.filter((v) => v.docId === docId);
  const first: DocVersion = { docId, version: 1, at: `${opened}T12:00:00Z`, by: "Room owner", note: "Original upload" };
  return [first, ...seeded, ...local].sort((a, b) => a.version - b.version);
}

export function addVersion(docId: string, opened: string, by: string, note: string, fileName?: string): DocVersion {
  const next = versionsOf(docId, opened).length + 1;
  const v: DocVersion = { docId, version: next, at: new Date().toISOString(), by, note, fileName };
  write(VER, [...read<DocVersion[]>(VER, []), v]);
  return v;
}

/** Which version a visit read: the latest one uploaded before the visit. */
export function versionAt(versions: DocVersion[], at: string) {
  let v = 1;
  for (const x of versions) if (x.at <= at) v = x.version;
  return v;
}

/* ───────────────────────── room branding ───────────────────────── */

export type EntryTone = "light" | "warm" | "slate" | "dark";
export type RoomBrandOverride = RoomBrand & { logo?: string; banner?: string; entry: EntryTone; welcome: string };

export const ENTRY_TONES: { id: EntryTone; label: string; bg: string; fg: string }[] = [
  { id: "light", label: "Paper", bg: "#FFFFFF", fg: "#14181D" },
  { id: "warm", label: "Ivory", bg: "#F4F1EA", fg: "#14181D" },
  { id: "slate", label: "Slate", bg: "#1F2630", fg: "#EEF1F4" },
  { id: "dark", label: "Night", bg: "#0B0F14", fg: "#EEF1F4" },
];

export function defaultRoomBrand(roomId: string, roomName: string): RoomBrandOverride {
  const b = roomBrand[roomId] ?? { primary: "#14181D", secondary: "#B8975A", wordmark: roomName, tagline: "" };
  return { ...b, entry: "warm", welcome: `Welcome to ${roomName}. Everything in this room is confidential.` };
}

export const loadRoomBrands = () => read<Record<string, RoomBrandOverride>>(BR, {});
export function saveRoomBrand(roomId: string, b: RoomBrandOverride | null) {
  const all = loadRoomBrands();
  if (b) all[roomId] = b;
  else delete all[roomId];
  write(BR, all);
}

/* ───────────────────────── templates ───────────────────────── */

export type RoomTemplate = {
  id: string;
  name: string;
  purpose: "Fundraising" | "Offering" | "Due diligence" | "Audit" | "M&A" | "Operational due diligence";
  about: string;
  cover: string;
  folders: { name: string; items: string[] }[];
};

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: "fund-raise",
    cover: "dawn-silk",
    name: "Fund raise",
    purpose: "Fundraising",
    about: "Limited partner due diligence for a new fund: offering documents, track record, team and terms.",
    folders: [
      { name: "Offering documents", items: ["Private placement memorandum", "Limited partnership agreement", "Subscription agreement"] },
      { name: "Track record", items: ["Prior fund performance", "Case studies", "Audited financial statements"] },
      { name: "Team and governance", items: ["Biographies", "Organisation chart", "Policies"] },
      { name: "Legal and tax", items: ["Tax structure memo", "Side letter template"] },
    ],
  },
  {
    id: "real-estate",
    cover: "skyline-dusk",
    name: "Real estate transaction",
    purpose: "Due diligence",
    about: "Acquisition or disposal of a property or portfolio, from rent roll to title.",
    folders: [
      { name: "Property", items: ["Rent roll", "Leases", "Site plans"] },
      { name: "Financial", items: ["Operating statements", "Budget", "Capital expenditure plan"] },
      { name: "Legal", items: ["Title report", "Zoning", "Environmental report"] },
      { name: "Transaction", items: ["Letter of intent", "Purchase and sale agreement"] },
    ],
  },
  {
    id: "ma-sell",
    cover: "glass-fold",
    name: "M&A sell-side",
    purpose: "M&A",
    about: "Buyer diligence on a company: corporate records, finance, commercial, people and legal.",
    folders: [
      { name: "Corporate", items: ["Formation documents", "Cap table", "Board minutes"] },
      { name: "Financial", items: ["Audited accounts", "Management accounts", "Quality of earnings"] },
      { name: "Commercial", items: ["Customer contracts", "Pipeline"] },
      { name: "People", items: ["Employment agreements", "Benefit plans"] },
      { name: "Legal", items: ["Litigation", "Intellectual property"] },
    ],
  },
  {
    id: "fund-of-funds",
    cover: "market-glow",
    name: "Fund of funds",
    purpose: "Fundraising",
    about: "A multi-manager vehicle: underlying managers, allocation policy and look-through reporting.",
    folders: [
      { name: "Offering documents", items: ["Memorandum", "Limited partnership agreement"] },
      { name: "Underlying managers", items: ["Manager profiles", "Commitment schedule"] },
      { name: "Portfolio", items: ["Look-through exposure", "Pacing model"] },
      { name: "Operations", items: ["Administrator letter", "Valuation policy"] },
    ],
  },
  {
    id: "formation-kyc",
    cover: "facade-grid",
    name: "Corporate formation and KYC",
    purpose: "Operational due diligence",
    about: "Collect identity, ownership and corporate documents for a new entity or client onboarding.",
    folders: [
      { name: "Entity", items: ["Certificate of formation", "Operating agreement", "Registered agent"] },
      { name: "Ownership", items: ["Ownership chart", "Beneficial owner declarations"] },
      { name: "Identity", items: ["Director identification", "Proof of address"] },
    ],
  },
  {
    id: "investor-reporting",
    cover: "light-streaks",
    name: "Annual investor reporting",
    purpose: "Audit",
    about: "Year-end package for investors and auditors: statements, valuations and tax documents.",
    folders: [
      { name: "Financial statements", items: ["Audited financial statements", "Capital account statements"] },
      { name: "Valuation", items: ["Valuation report", "Portfolio summary"] },
      { name: "Tax", items: ["Schedule K-1", "Tax information"] },
      { name: "Auditor", items: ["Provided-by-client list", "Confirmations"] },
    ],
  },
];
