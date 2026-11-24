/**
 * Access model. Three populations use the platform:
 *  - Aurum staff (the administrator)
 *  - Client users: the fund managers / GPs Aurum administers for
 *  - Investors (LPs) and their delegates
 * Access = role (what you may do) × scope (which solutions, funds, investors).
 * Money movement and fund economics require two different people (four-eyes).
 */

export type Permission =
  | "platform.users.manage"
  | "platform.audit.view"
  | "fund.view"
  | "fund.setup.edit"
  | "economics.prepare"
  | "economics.approve"
  | "ledger.view"
  | "ledger.post"
  | "ledger.close_period"
  | "calls.prepare"
  | "calls.review"
  | "calls.approve_gp"
  | "distributions.prepare"
  | "distributions.approve_gp"
  | "onboarding.manage"
  | "kyc.decide"
  | "investors.view_all"
  | "investors.change_review"
  | "banking.view"
  | "banking.connect"
  | "portal.view_own"
  | "portal.sign"
  | "portal.change_bank";

export const permissionGroups: { label: string; items: { key: Permission; label: string }[] }[] = [
  {
    label: "Platform",
    items: [
      { key: "platform.users.manage", label: "Manage users and roles" },
      { key: "platform.audit.view", label: "View audit log" },
    ],
  },
  {
    label: "Fund setup & economics",
    items: [
      { key: "fund.view", label: "View funds" },
      { key: "fund.setup.edit", label: "Edit fund setup" },
      { key: "economics.prepare", label: "Run LPA review, prepare economics" },
      { key: "economics.approve", label: "Approve fund economics" },
    ],
  },
  {
    label: "Accounting",
    items: [
      { key: "ledger.view", label: "View general ledger" },
      { key: "ledger.post", label: "Post journal entries" },
      { key: "ledger.close_period", label: "Close accounting periods" },
    ],
  },
  {
    label: "Capital activity",
    items: [
      { key: "calls.prepare", label: "Prepare capital calls" },
      { key: "calls.review", label: "Review capital calls" },
      { key: "calls.approve_gp", label: "Approve calls as GP" },
      { key: "distributions.prepare", label: "Prepare distributions" },
      { key: "distributions.approve_gp", label: "Approve distributions as GP" },
    ],
  },
  {
    label: "Investors & compliance",
    items: [
      { key: "onboarding.manage", label: "Manage onboarding" },
      { key: "kyc.decide", label: "Decide KYC / AML matches" },
      { key: "investors.view_all", label: "View all investor records" },
      { key: "investors.change_review", label: "Approve investor profile changes" },
    ],
  },
  {
    label: "Banking",
    items: [
      { key: "banking.view", label: "View bank accounts and transactions" },
      { key: "banking.connect", label: "Connect bank accounts (Plaid)" },
    ],
  },
  {
    label: "Investor portal",
    items: [
      { key: "portal.view_own", label: "View own investments and documents" },
      { key: "portal.sign", label: "Sign subscription documents" },
      { key: "portal.change_bank", label: "Request bank account changes" },
    ],
  },
];

export type RoleId =
  | "platform_admin"
  | "fund_services_head"
  | "fund_accountant"
  | "compliance_officer"
  | "relationship_manager"
  | "auditor"
  | "gp_principal"
  | "gp_staff"
  | "investor_signatory"
  | "investor_viewer";

export type Role = {
  id: RoleId;
  name: string;
  audience: "Aurum staff" | "Client (GP)" | "Investor" | "External";
  scope: string;
  description: string;
  permissions: Permission[];
};

const all = permissionGroups.flatMap((g) => g.items.map((i) => i.key));

export const roles: Role[] = [
  {
    id: "platform_admin",
    name: "Platform administrator",
    audience: "Aurum staff",
    scope: "All solutions",
    description: "Manages users, roles and settings. Cannot approve money movement or economics — administration is kept separate from operations.",
    permissions: ["platform.users.manage", "platform.audit.view", "fund.view", "ledger.view", "investors.view_all", "banking.view"],
  },
  {
    id: "fund_services_head",
    name: "Head of Fund Services",
    audience: "Aurum staff",
    scope: "Fund Solution · all funds",
    description: "Senior approver. Reviews capital activity and approves fund economics prepared by others.",
    permissions: all.filter((p) => !p.startsWith("portal.") && p !== "platform.users.manage" && !p.endsWith("approve_gp")),
  },
  {
    id: "fund_accountant",
    name: "Fund accountant",
    audience: "Aurum staff",
    scope: "Assigned funds",
    description: "Runs the books: prepares calls, distributions and entries, runs LPA reviews. Cannot approve own work.",
    permissions: ["fund.view", "economics.prepare", "ledger.view", "ledger.post", "calls.prepare", "calls.review", "distributions.prepare", "investors.view_all", "banking.view"],
  },
  {
    id: "compliance_officer",
    name: "Compliance officer",
    audience: "Aurum staff",
    scope: "All funds · investor records",
    description: "Owns KYC/AML decisions, onboarding approval and investor profile changes, including bank account changes.",
    permissions: ["fund.view", "onboarding.manage", "kyc.decide", "investors.view_all", "investors.change_review", "platform.audit.view"],
  },
  {
    id: "relationship_manager",
    name: "Relationship manager",
    audience: "Aurum staff",
    scope: "Assigned clients and investors",
    description: "Client-facing. Invites investors and follows onboarding; no access to post or approve accounting.",
    permissions: ["fund.view", "onboarding.manage"],
  },
  {
    id: "auditor",
    name: "External auditor",
    audience: "External",
    scope: "Named funds · time-limited",
    description: "Read-only access to the ledger, documents and audit log for the audit period. Expires automatically.",
    permissions: ["fund.view", "ledger.view", "platform.audit.view", "banking.view"],
  },
  {
    id: "gp_principal",
    name: "GP principal",
    audience: "Client (GP)",
    scope: "Own funds",
    description: "Fund manager signatory. Final approval of capital calls, distributions and the fund economics Aurum prepares.",
    permissions: ["fund.view", "economics.approve", "ledger.view", "calls.approve_gp", "distributions.approve_gp", "investors.view_all", "banking.view"],
  },
  {
    id: "gp_staff",
    name: "GP team member",
    audience: "Client (GP)",
    scope: "Own funds",
    description: "Fund manager's team (CFO, IR). Views funds, investors and reports; no approvals.",
    permissions: ["fund.view", "ledger.view", "investors.view_all"],
  },
  {
    id: "investor_signatory",
    name: "Investor — authorized signatory",
    audience: "Investor",
    scope: "Own investing entities",
    description: "Signs subscriptions and requests changes to banking and contacts.",
    permissions: ["portal.view_own", "portal.sign", "portal.change_bank"],
  },
  {
    id: "investor_viewer",
    name: "Investor — viewer",
    audience: "Investor",
    scope: "Own investing entities",
    description: "Accountants, advisors and family members with read-only access to statements and documents.",
    permissions: ["portal.view_own"],
  },
];

export const roleById = (id: RoleId) => roles.find((r) => r.id === id)!;
export const can = (role: RoleId, p: Permission) => roleById(role).permissions.includes(p);

/** Rules no role can override. */
export const controls = [
  ["Four-eyes on money and economics", "The person who prepares a capital call, distribution or fund economics can never approve it."],
  ["Separation of duties", "Platform administrators manage access but cannot move money or approve economics."],
  ["Multi-factor authentication", "Required for every user; staff sign in through company SSO."],
  ["Bank detail changes", "Verified by phone with an authorized signatory and held five business days before any payment."],
  ["Least privilege by scope", "Staff and GP users see only the funds they are assigned; investors see only their own entities."],
  ["Time-limited access", "Auditor and temporary access expires automatically."],
  ["Immutable audit log", "Every view of sensitive data, change and approval is recorded with user, time and IP."],
  ["Quarterly access review", "Each role holder is re-certified by the Head of Fund Services every quarter."],
] as const;

export type UserRecord = {
  name: string;
  email: string;
  role: RoleId;
  scope: string;
  mfa: "Authenticator" | "Security key" | "SSO + MFA";
  lastActive: string;
  status: "Active" | "Invited" | "Expires Dec 31, 2026";
};

export const users: UserRecord[] = [
  { name: "Luiza Andrade", email: "luiza@aurumasset.us", role: "fund_services_head", scope: "All funds", mfa: "SSO + MFA", lastActive: "2026-11-24", status: "Active" },
  { name: "Rafael Mendes", email: "rafael@aurumasset.us", role: "fund_accountant", scope: "Infrastructure I, Atlântico II, Meridian", mfa: "SSO + MFA", lastActive: "2026-11-24", status: "Active" },
  { name: "Juliana Teixeira", email: "juliana@aurumasset.us", role: "relationship_manager", scope: "8 investors", mfa: "SSO + MFA", lastActive: "2026-11-23", status: "Active" },
  { name: "Carla Nogueira", email: "carla@aurumasset.us", role: "compliance_officer", scope: "All funds", mfa: "SSO + MFA", lastActive: "2026-11-24", status: "Active" },
  { name: "Thiago Brandão", email: "thiago@aurumasset.us", role: "platform_admin", scope: "Platform", mfa: "Security key", lastActive: "2026-11-22", status: "Active" },
  { name: "Grant Thornton audit team", email: "audit@gt.com", role: "auditor", scope: "Infrastructure I · FY2026", mfa: "Authenticator", lastActive: "2026-11-18", status: "Expires Dec 31, 2026" },
  { name: "Marcus Hale", email: "mhale@cordillera-infra.com", role: "gp_principal", scope: "Cordillera Infrastructure I", mfa: "Authenticator", lastActive: "2026-11-21", status: "Active" },
  { name: "Ana Ribeiro", email: "ana@atlanticocapital.com.br", role: "gp_principal", scope: "Atlântico Venture II", mfa: "Authenticator", lastActive: "2026-11-20", status: "Active" },
  { name: "Sofia Klein", email: "sklein@cordillera-infra.com", role: "gp_staff", scope: "Cordillera Infrastructure I", mfa: "Authenticator", lastActive: "2026-11-19", status: "Active" },
  { name: "Margaret Calloway", email: "m.calloway@callowaytrust.com", role: "investor_signatory", scope: "Calloway Family Trust", mfa: "Authenticator", lastActive: "2026-11-23", status: "Active" },
  { name: "Daniel Moreau, CPA", email: "dmoreau@moreaucpa.com", role: "investor_viewer", scope: "Calloway Family Trust", mfa: "Authenticator", lastActive: "2026-11-02", status: "Active" },
  { name: "Owen Shah", email: "owen@bayviewph.com", role: "investor_signatory", scope: "Bayview Partners Holdings", mfa: "Authenticator", lastActive: "—", status: "Invited" },
];

export type AuditEvent = { at: string; user: string; action: string; object: string; ip: string };

export const auditLog: AuditEvent[] = [
  { at: "2026-11-24T09:58:12", user: "Rafael Mendes", action: "Ran LPA review", object: "Infrastructure Partners I · A&R LPA (v2)", ip: "201.17.44.10" },
  { at: "2026-11-24T09:41:03", user: "Carla Nogueira", action: "Viewed screening match", object: "Ana & Rafael Monteiro · OB-1039", ip: "201.17.44.12" },
  { at: "2026-11-24T08:42:55", user: "Beatriz Duarte", action: "Uploaded document", object: "Duarte Participações · ownership chart", ip: "177.92.10.4" },
  { at: "2026-11-23T17:30:41", user: "Margaret Calloway", action: "Completed step", object: "Atlântico II subscription · Tax information", ip: "73.140.8.21" },
  { at: "2026-11-23T11:04:19", user: "Rafael Mendes", action: "Posted receipt", object: "Capital Call No. 7 · Ridgeway Mutual", ip: "201.17.44.10" },
  { at: "2026-11-22T14:12:08", user: "Paulo Ferreira", action: "Requested bank change", object: "Ferreira Holdings · distribution account", ip: "190.4.2.88" },
  { at: "2026-11-22T10:01:47", user: "Thiago Brandão", action: "Granted role", object: "Grant Thornton audit team → External auditor (expires Dec 31)", ip: "201.17.44.15" },
  { at: "2026-11-17T09:00:30", user: "Marcus Hale", action: "Approved as GP", object: "Capital Call No. 7 · Infrastructure Partners I", ip: "98.21.4.200" },
  { at: "2026-11-17T08:47:02", user: "Luiza Andrade", action: "Reviewed", object: "Capital Call No. 7 · Infrastructure Partners I", ip: "201.17.44.11" },
];
