/**
 * Who is who on the platform (owner definitions, 25 Nov 2026).
 *
 *  Employee         Aurum staff.
 *  General Partner  a manager or sponsor that onboards to Fund Solution so we administer its funds.
 *  Limited Partner  an investor that subscribes into a GP's fund through Fund Solution.
 *  Tenant           a firm that runs the platform under its own brand — for now Corporate and Multi-Family.
 *  Client           a tenant's end customer (B2B2C) or Aurum's own direct customer (B2C).
 *  External guest   auditors, counsel, banks, prospects — nothing by default, invitation only, with an end date.
 *
 * Defaults (no invitation needed):
 *  Corporate Chat   everyone — employees and tenants in the console; GPs, clients and LPs in their portal, scoped to
 *                   their own conversations.
 *  PMO              employees, GPs and tenants — outsiders see only their own plans.
 *  Tenants          also Corporate Solution and Multi-Family Office.
 *  Clients          Corporate Solution (their own company formation); once a company is formed, the client portal,
 *                   which is the Multi-Family Office platform seen from the client's side.
 * Everything else is by invitation: Aurum's main administrator invites employees, GPs and guests; a tenant's
 * administrator invites its own people and clients, into hexagons the tenant itself has.
 */
import { users, type RoleId } from "./access";
import { people as commsPeople, clients as commsClients } from "./comms";
import { formations } from "./formation";

export type PartyType = "employee" | "gp" | "lp" | "tenant" | "client" | "guest";
export const PARTY_LABEL: Record<PartyType, string> = {
  employee: "Employee",
  gp: "General Partner",
  lp: "Limited Partner",
  tenant: "Tenant",
  client: "Client",
  guest: "External guest",
};

export type Tenant = { id: string; name: string; brandPreset: string };
export const TENANTS: Tenant[] = [
  { id: "northbridge", name: "Northbridge Fiduciary Partners", brandPreset: "northbridge" },
  { id: "halcyon", name: "Halcyon Corporate Services", brandPreset: "halcyon" },
];

export type Member = {
  id: string; // chat / comms person id where one exists
  name: string;
  email: string;
  title: string;
  party: PartyType;
  org: string;
  orgName: string;
  /** can invite others inside their own organisation (tenant administrators) */
  orgAdmin?: boolean;
  /** clients: the tenant that serves them; none = Aurum's own direct client */
  tenantId?: string;
  /** for employees: their platform role */
  role?: RoleId;
};

const GP_ORGS = ["strlex", "arbor", "cordillera", "atlantico"];
const LP_ORGS = ["calloway"];
/** Clients and who serves them: Valença is a Northbridge client (B2B2C); the rest are Aurum's direct clients. */
const CLIENT_ORGS: Record<string, string | undefined> = { halvorsen: undefined, valenca: "northbridge", cascade: undefined, altamira: undefined, mazal: undefined, portoreal: undefined, ledgerline: undefined };

const orgName = (org: string) => commsClients.find((c) => c.id === org)?.name ?? org;

export const MEMBERS: Member[] = [
  ...commsPeople
    .filter((p) => p.org === "aurum" && p.id !== "me")
    .map((p) => ({ id: p.id, name: p.name, email: p.email ?? "", title: p.title, party: "employee" as const, org: "aurum", orgName: "Aurum", role: users.find((u) => u.email === p.email)?.role })),
  { id: "thiago", name: "Thiago Brandão", email: "thiago@aurumasset.us", title: "Platform administrator", party: "employee", org: "aurum", orgName: "Aurum", role: "platform_admin" },
  ...commsPeople.filter((p) => GP_ORGS.includes(p.org)).map((p) => ({ id: p.id, name: p.name, email: p.email ?? "", title: p.title, party: "gp" as const, org: p.org, orgName: orgName(p.org), orgAdmin: p.clientRole === "admin" })),
  ...commsPeople.filter((p) => LP_ORGS.includes(p.org)).map((p) => ({ id: p.id, name: p.name, email: p.email ?? "", title: p.title, party: "lp" as const, org: p.org, orgName: orgName(p.org) })),
  ...commsPeople
    .filter((p) => p.org in CLIENT_ORGS)
    .map((p) => ({ id: p.id, name: p.name, email: p.email ?? "", title: p.title, party: "client" as const, org: p.org, orgName: orgName(p.org), orgAdmin: p.clientRole === "admin", tenantId: CLIENT_ORGS[p.org] })),
  ...commsPeople
    .filter((p) => TENANTS.some((t) => t.id === p.org))
    .map((p) => ({ id: p.id, name: p.name, email: p.email ?? "", title: p.title, party: "tenant" as const, org: p.org, orgName: orgName(p.org), orgAdmin: p.clientRole === "admin" })),
  { id: "gt-audit", name: "Grant Thornton audit team", email: "audit@gt.com", title: "External auditor", party: "guest", org: "grant-thornton", orgName: "Grant Thornton" },
];
export const memberById = (id: string) => MEMBERS.find((m) => m.id === id);
export const memberByEmail = (email: string) => MEMBERS.find((m) => m.email === email);

/** A client is onboarded once one of its companies has been formed; before that it sees its formation in progress. */
export function clientFormations(org: string) {
  const name = orgName(org).toLowerCase();
  return formations.filter((f) => f.client.toLowerCase() === name || name.startsWith(f.client.toLowerCase()) || f.client.toLowerCase().startsWith(name.split(" ")[0]));
}
const EXISTING_FAMILY_CLIENTS = ["halvorsen", "valenca"];
export function isOnboardedClient(org: string) {
  return EXISTING_FAMILY_CLIENTS.includes(org) || clientFormations(org).some((f) => f.stage === "Incorporated" || f.stage === "Post-formation");
}

/** Where a person starts when they sign in. */
export function homeOf(m: Member) {
  if (m.party === "lp") return "/portal";
  if (m.party === "client") return "/client";
  if (m.party === "guest") return "/admin/dataroom";
  return "/admin";
}

/** The platform role used by role-based rules (screening four eyes, fund permissions). */
export function roleOf(m: Member): RoleId {
  if (m.role) return m.role;
  if (m.party === "employee") return "relationship_manager";
  if (m.party === "gp") return m.orgAdmin ? "gp_principal" : "gp_staff";
  if (m.party === "lp") return "investor_signatory";
  if (m.party === "guest") return "auditor";
  return "gp_staff";
}
