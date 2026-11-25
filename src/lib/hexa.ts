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

/** Which hexagons each role opens. Settings (brand, access) are for administrators only. */
export const ROLE_HEXAS: Record<RoleId, HexaId[] | "all"> = {
  platform_admin: "all",
  fund_services_head: "all",
  fund_accountant: ["fund", "billing", "communication", "dataroom"],
  compliance_officer: ["compliance", "fund", "corporate", "communication", "dataroom"],
  relationship_manager: ["sales", "fund", "corporate", "communication", "dataroom", "pmo"],
  auditor: ["fund", "dataroom"],
  gp_principal: ["communication", "dataroom"],
  gp_staff: ["communication", "dataroom"],
  investor_signatory: [],
  investor_viewer: [],
};

export function hexasFor(role: RoleId) {
  const allow = ROLE_HEXAS[role];
  return allow === "all" ? HEXAS : HEXAS.filter((h) => allow.includes(h.id));
}
export const canSettings = (role: RoleId) => role === "platform_admin" || role === "fund_services_head";

/** The hexagon a path belongs to (longest base wins). */
export function hexaOf(path: string) {
  return [...HEXAS].sort((a, b) => b.base.length - a.base.length).find((h) => path === h.base || path.startsWith(`${h.base}/`) || path.startsWith(`${h.base}?`));
}

/** Whether a role may open a hexagon on the ecosystem page. Solutions still in development are shown to administrators only. */
export function canOpen(role: RoleId, id: string, live = true) {
  const allow = ROLE_HEXAS[role];
  if (allow === "all") return true;
  return live && (allow as string[]).includes(id);
}
