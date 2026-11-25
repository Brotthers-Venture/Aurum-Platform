/**
 * The Hexa Room: every hexagon of the ecosystem as a navigation entry, with its own pages.
 * Each person sees only the hexagons their role opens (preview roles today; Supabase claims later).
 */
import type { RoleId } from "./access";
import { FIRM, type FirmId } from "./firm-colors";
import { firmModules } from "./firm";
import { onboarding } from "./data";

export type HexaId = "fund" | "corporate" | FirmId;
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
      { label: "Documents", href: "/admin/fund/documents", group: "Records" },
      { label: "Reports", href: "/admin/fund/reports", group: "Records" },
      { label: "Banking", href: "/admin/fund/banking", group: "Records" },
    ],
  },
  { id: "corporate", name: "Corporate Solution", color: "var(--tenant-accent)", href: "/admin/corporate", base: "/admin/corporate", pages: [] },
  { id: "communication", firm: "communication", name: "Corporate Chat", color: FIRM.communication, href: "/admin/communication", base: "/admin/communication", badge: badgeOf("communication"), pages: [] },
  { id: "dataroom", firm: "dataroom", name: "Data rooms", color: FIRM.dataroom, href: "/admin/dataroom", base: "/admin/dataroom", badge: badgeOf("dataroom"), pages: fromRing("dataroom") },
  { id: "billing", firm: "billing", name: "Treasury", color: FIRM.billing, href: "/admin/treasury", base: "/admin/treasury", badge: badgeOf("billing"), pages: [{ label: "Overview", href: "/admin/treasury" }, ...fromRing("billing")] },
  { id: "compliance", firm: "compliance", name: "Compliance", color: FIRM.compliance, href: "/admin/compliance", base: "/admin/compliance", badge: badgeOf("compliance"), pages: fromRing("compliance") },
  { id: "pmo", firm: "pmo", name: "PMO", color: FIRM.pmo, href: "/admin/pmo", base: "/admin/pmo", badge: badgeOf("pmo"), pages: fromRing("pmo") },
  { id: "sales", firm: "sales", name: "Sales", color: FIRM.sales, href: "/admin/sales", base: "/admin/sales", badge: badgeOf("sales"), pages: fromRing("sales") },
];

/* ───────────────────────── access ─────────────────────────
   Everyone (except investors, who use their portal) always has Corporate Chat, the PMO and one solution.
   Every other hexagon is granted person by person by the main administrator (the platform administrator),
   who sees everything. Grants live in this browser until P4 moves them to the database. */

export const ALWAYS: HexaId[] = ["fund", "communication", "pmo"];
export const GRANTABLE: HexaId[] = ["corporate", "dataroom", "billing", "compliance", "sales"];
export const MAIN_ADMIN: RoleId = "platform_admin";

/** Grants already approved (sample). Keyed by the person's email. */
const SEED_GRANTS: Record<string, HexaId[]> = {
  "luiza@aurumasset.us": ["corporate", "dataroom", "billing", "compliance", "sales"],
  "rafael@aurumasset.us": ["billing", "dataroom"],
  "juliana@aurumasset.us": ["sales", "corporate", "dataroom"],
  "carla@aurumasset.us": ["compliance", "corporate", "dataroom"],
  "audit@gt.com": ["dataroom"],
  "mhale@cordillera-infra.com": ["dataroom"],
  "ana@atlanticocapital.com.br": ["dataroom"],
  "sklein@cordillera-infra.com": [],
};
export const GRANTS_KEY = "aurum-hexa-grants-v1";
export const GRANTS_EVENT = "aurum-hexa-grants";

export function readGrants(): Record<string, HexaId[]> {
  if (typeof window === "undefined") return SEED_GRANTS;
  try {
    const raw = window.localStorage.getItem(GRANTS_KEY);
    return raw ? { ...SEED_GRANTS, ...(JSON.parse(raw) as Record<string, HexaId[]>) } : SEED_GRANTS;
  } catch {
    return SEED_GRANTS;
  }
}
export function writeGrant(email: string, list: HexaId[]) {
  try {
    const cur = JSON.parse(window.localStorage.getItem(GRANTS_KEY) ?? "{}") as Record<string, HexaId[]>;
    cur[email] = list;
    window.localStorage.setItem(GRANTS_KEY, JSON.stringify(cur));
    window.dispatchEvent(new Event(GRANTS_EVENT));
  } catch {
    /* storage unavailable */
  }
}

/** The hexagons a person may open: always Chat, PMO and their solution, plus what the administrator granted. */
export function allowedFor(role: RoleId, email: string | undefined, grants: Record<string, HexaId[]> = SEED_GRANTS): HexaId[] | "all" {
  if (role === MAIN_ADMIN) return "all";
  if (role === "investor_signatory" || role === "investor_viewer") return [];
  return [...ALWAYS, ...((email && grants[email]) || [])];
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
  return [...HEXAS].sort((a, b) => b.base.length - a.base.length).find((h) => path === h.base || path.startsWith(`${h.base}/`) || path.startsWith(`${h.base}?`));
}
