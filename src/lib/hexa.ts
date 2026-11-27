/**
 * The Hexa Room: every hexagon of the ecosystem as a navigation entry, with its own pages.
 * Each person sees only the hexagons their role opens (preview roles today; Supabase claims later).
 */
import type { RoleId } from "./access";
import type { Member, PartyType } from "./parties";
import { FIRM, type FirmId } from "./firm-colors";
import { firmModules } from "./firm";
import { onboarding } from "./data";

export type HexaId = "fund" | "corporate" | "multi-family" | "offering" | "blockchain" | "banking" | FirmId;
export type HexaPage = { label: string; href: string; group?: string; badge?: number };
export type Hexa = {
  id: HexaId;
  /** FirmId hexagons take their name from the tenant's module names; solutions are fixed. */
  firm?: FirmId;
  name: string;
  color: string;
  href: string;
  /** which paths belong to this hexagon */
  base: string;
  badge?: number;
  pages: HexaPage[];
};

const openFiles = onboarding.filter((o) => o.status === "Submitted" || o.status === "Changes requested").length;

const FAMILY_PAGES: HexaPage[] = [
  { label: "Halvorsen Family", href: "/admin/multi-family/halvorsen", group: "Families" },
  { label: "Valença Family", href: "/admin/multi-family/valenca", group: "Families" },
];
const fromRing = (id: FirmId): HexaPage[] => {
  const m = firmModules.find((x) => x.id === id);
  if (!m) return [];
  const seen = new Set<string>();
  return m.ring
    .filter((r) => !/tab=new\b/.test(r.href))
    .map((r) => ({ label: r.label.filter(Boolean).join(" "), href: r.href }))
    .filter((p) => (seen.has(p.href) ? false : (seen.add(p.href), true)));
};
const badgeOf = (id: FirmId) => firmModules.find((x) => x.id === id)?.badge ?? 0;

export const HEXAS: Hexa[] = [
  {
    id: "fund",
    name: "Fund Solution",
    color: "var(--tenant-accent)",
    href: "/admin/fund",
    base: "/admin/fund",
    badge: openFiles,
    pages: [
      { label: "Overview", href: "/admin/fund" },
      { label: "Analytics", href: "/admin/fund/analytics" },
      { label: "GPs", href: "/admin/fund/gps", group: "Administration" },
      { label: "Funds", href: "/admin/fund/funds", group: "Administration" },
      { label: "Investors", href: "/admin/fund/investors", group: "Administration" },
      { label: "Onboarding", href: "/admin/fund/onboarding", group: "Administration", badge: openFiles },
      { label: "Capital calls", href: "/admin/fund/capital-calls", group: "Capital activity" },
      { label: "Distributions", href: "/admin/fund/distributions", group: "Capital activity" },
      { label: "General ledger", href: "/admin/fund/accounting", group: "Accounting" },
      { label: "Transfers", href: "/admin/fund/transfers", group: "Accounting" },
      { label: "Closes & equalization", href: "/admin/fund/closes", group: "Accounting" },
      { label: "Quarter close", href: "/admin/fund/quarter-close", group: "Reporting" },
      { label: "Reports", href: "/admin/fund/reports", group: "Reporting" },
      { label: "Documents", href: "/admin/fund/documents", group: "Records" },
      { label: "Banking", href: "/admin/fund/banking", group: "Records" },
    ],
  },
  { id: "corporate", name: "Corporate Solution", color: "var(--tenant-accent)", href: "/admin/corporate", base: "/admin/corporate", pages: [] },
  {
    id: "offering",
    name: "Offering Solution",
    color: "var(--tenant-accent)",
    href: "/admin/offering",
    base: "/admin/offering",
    pages: [
      { label: "Overview", href: "/admin/offering" },
      { label: "My work", href: "/admin/offering/my-work" },
      { label: "Offerings", href: "/admin/offering/offerings", group: "Capital formation" },
      { label: "Pipeline", href: "/admin/offering/pipeline", group: "Capital formation" },
      { label: "Investors", href: "/admin/offering/investors", group: "Relationships" },
      { label: "Agreements", href: "/admin/offering/agreements", group: "Relationships" },
    ],
  },
  {
    id: "blockchain",
    name: "Blockchain Solution",
    color: "var(--tenant-accent)",
    href: "/admin/blockchain",
    base: "/admin/blockchain",
    pages: [
      { label: "Tokenized companies", href: "/admin/blockchain" },
      { label: "Tokenize a company", href: "/admin/blockchain/tokenize" },
      { label: "Transfers", href: "/admin/blockchain/transfers" },
      { label: "Secondary sales", href: "/admin/blockchain/secondary" },
    ],
  },
  {
    id: "banking",
    name: "Banking Solution",
    color: "var(--tenant-accent)",
    href: "/admin/banking",
    base: "/admin/banking",
    pages: [
      { label: "Cash position", href: "/admin/banking" },
      { label: "Payments", href: "/admin/banking/payments", group: "Money movement" },
      { label: "Payees", href: "/admin/banking/payees", group: "Money movement" },
      { label: "Accounts", href: "/admin/banking/accounts", group: "Accounts" },
      { label: "Reconciliation", href: "/admin/banking/reconciliation", group: "Accounts" },
      { label: "Approval policies", href: "/admin/banking/policies", group: "Controls" },
    ],
  },
  {
    id: "multi-family",
    name: "Multi-Family Office",
    color: "var(--tenant-accent)",
    href: "/admin/multi-family",
    base: "/admin/multi-family",
    pages: [{ label: "Families", href: "/admin/multi-family" }, { label: "Onboarding", href: "/admin/multi-family/onboarding" }, ...FAMILY_PAGES],
  },
  {
    id: "communication",
    firm: "communication",
    name: "Corporate Chat",
    color: FIRM.communication,
    href: "/admin/communication",
    base: "/admin/communication",
    badge: badgeOf("communication"),
    pages: [],
  },
  {
    id: "dataroom",
    firm: "dataroom",
    name: "Data rooms",
    color: FIRM.dataroom,
    href: "/admin/dataroom",
    base: "/admin/dataroom",
    badge: badgeOf("dataroom"),
    pages: fromRing("dataroom"),
  },
  {
    id: "billing",
    firm: "billing",
    name: "Treasury",
    color: FIRM.billing,
    href: "/admin/treasury",
    base: "/admin/treasury",
    badge: badgeOf("billing"),
    pages: [{ label: "Overview", href: "/admin/treasury" }, ...fromRing("billing")],
  },
  {
    id: "compliance",
    firm: "compliance",
    name: "Compliance",
    color: FIRM.compliance,
    href: "/admin/compliance",
    base: "/admin/compliance",
    badge: badgeOf("compliance"),
    pages: fromRing("compliance"),
  },
  { id: "pmo", firm: "pmo", name: "PMO", color: FIRM.pmo, href: "/admin/pmo", base: "/admin/pmo", badge: badgeOf("pmo"), pages: fromRing("pmo") },
  { id: "sales", firm: "sales", name: "Sales", color: FIRM.sales, href: "/admin/sales", base: "/admin/sales", badge: badgeOf("sales"), pages: fromRing("sales") },
];

/* ───────────────────────── access (see lib/parties.ts for the definitions) ───────────────────────── */

/** Granted by default, by party type. */
export const DEFAULTS: Record<PartyType, HexaId[]> = {
  employee: ["communication", "pmo"],
  gp: ["communication", "pmo"],
  tenant: ["communication", "pmo", "corporate", "multi-family"],
  client: ["corporate"],
  lp: [],
  guest: [],
};
export const GRANTABLE: HexaId[] = ["fund", "corporate", "multi-family", "offering", "blockchain", "banking", "dataroom", "billing", "compliance", "sales", "communication", "pmo"];
export const MAIN_ADMIN: RoleId = "platform_admin";

export type Invitation = { email: string; hexa: HexaId; by: string; at: string; expires?: string };
const SEED_INVITES: Invitation[] = [
  ...(["fund", "corporate", "multi-family", "offering", "blockchain", "banking", "dataroom", "billing", "compliance", "sales"] as HexaId[]).map((h) => ({
    email: "luiza@aurumasset.us",
    hexa: h,
    by: "Thiago Brandão",
    at: "2024-08-01",
  })),
  ...(["fund", "billing", "dataroom"] as HexaId[]).map((h) => ({ email: "rafael@aurumasset.us", hexa: h, by: "Thiago Brandão", at: "2024-08-01" })),
  ...(["fund", "sales", "corporate", "offering", "dataroom"] as HexaId[]).map((h) => ({ email: "juliana@aurumasset.us", hexa: h, by: "Thiago Brandão", at: "2025-02-03" })),
  ...(["fund", "compliance", "corporate", "dataroom"] as HexaId[]).map((h) => ({ email: "carla@aurumasset.us", hexa: h, by: "Thiago Brandão", at: "2024-08-01" })),
  ...(["multi-family", "corporate", "banking"] as HexaId[]).map((h) => ({ email: "helena@aurumasset.us", hexa: h, by: "Thiago Brandão", at: "2025-01-10" })),
  ...(["banking", "fund"] as HexaId[]).map((h) => ({ email: "noah@aurumasset.us", hexa: h, by: "Thiago Brandão", at: "2026-11-24" })),
  ...(["corporate", "compliance"] as HexaId[]).map((h) => ({ email: "eduardo@aurumasset.us", hexa: h, by: "Thiago Brandão", at: "2025-01-10" })),
  { email: "bianca@aurumasset.us", hexa: "corporate", by: "Eduardo Sales", at: "2025-03-02" },
  { email: "mhale@cordillera-infra.com", hexa: "dataroom", by: "Thiago Brandão", at: "2026-11-21" },
  { email: "audit@gt.com", hexa: "dataroom", by: "Thiago Brandão", at: "2026-11-15", expires: "2026-12-31" },
];
export const GRANTS_KEY = "aurum-invitations-v1";
export const GRANTS_EVENT = "aurum-hexa-grants";

export function readInvites(): Invitation[] {
  if (typeof window === "undefined") return SEED_INVITES;
  try {
    const raw = window.localStorage.getItem(GRANTS_KEY);
    return raw ? (JSON.parse(raw) as Invitation[]) : SEED_INVITES;
  } catch {
    return SEED_INVITES;
  }
}
export function writeInvites(list: Invitation[]) {
  try {
    window.localStorage.setItem(GRANTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(GRANTS_EVENT));
  } catch {
    /* storage unavailable */
  }
}
export const TODAY_ISO = "2026-11-24";
const live = (i: Invitation) => !i.expires || i.expires >= TODAY_ISO;

/** The hexagons a person may open: their party's defaults plus live invitations. The main administrator sees all. */
export function allowedFor(m: Member | undefined, invites: Invitation[] = SEED_INVITES): HexaId[] | "all" {
  if (!m) return [];
  if (m.role === MAIN_ADMIN) return "all";
  return [...new Set([...DEFAULTS[m.party], ...invites.filter((i) => i.email === m.email && live(i)).map((i) => i.hexa)])];
}
export const isDefault = (m: Member, h: HexaId) => m.role === MAIN_ADMIN || DEFAULTS[m.party].includes(h);

/** Who may invite whom: the main administrator anyone outside a tenant; a tenant administrator their own people and clients, into the tenant's hexagons. */
export function canInvite(inviter: Member | undefined, invitee: Member, h: HexaId) {
  if (!inviter) return false;
  if (inviter.role === MAIN_ADMIN) return true;
  if (inviter.party === "tenant" && inviter.orgAdmin) {
    const mine = (invitee.party === "tenant" && invitee.org === inviter.org) || (invitee.party === "client" && invitee.tenantId === inviter.org);
    return mine && DEFAULTS.tenant.includes(h);
  }
  return false;
}

export function hexasFrom(allow: HexaId[] | "all") {
  return allow === "all" ? HEXAS : HEXAS.filter((h) => allow.includes(h.id));
}
export const canSettings = (role: RoleId) => role === MAIN_ADMIN || role === "fund_services_head";

/** Whether a hexagon may be shown: solutions still in development are for the main administrator only. */
export function allows(allow: HexaId[] | "all", id: string, live = true) {
  if (allow === "all") return true;
  return live && (allow as string[]).includes(id);
}

/** The hexagon a path belongs to (longest base wins). */
export function hexaOf(path: string) {
  if (path.startsWith("/admin/messages")) return HEXAS.find((h) => h.id === "communication");
  return [...HEXAS].sort((a, b) => b.base.length - a.base.length).find((h) => path === h.base || path.startsWith(`${h.base}/`) || path.startsWith(`${h.base}?`));
}

/** Where a hexagon opens for this person: outsiders' Corporate Chat shows only their own conversations. */
export function hexaHref(h: Hexa, m?: Member) {
  if (h.id === "communication" && m && m.party !== "employee") return "/admin/messages";
  return h.href;
}
