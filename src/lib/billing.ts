/**
 * Billing — Aurum's own revenue: administration fees, platform subscriptions,
 * service fees, invoices and payments received. Amounts are USD.
 */
import { clients } from "./comms";
import { funds, fundTotals, toUSD } from "./data";
import { solutions } from "./solutions";

export const BILLING = "#4F8A2B";
export const BILL_TODAY = "2026-11-24";

export type FeeSchedule = {
  id: string;
  clientId: string;
  solution: string;
  service: string;
  /** how the fee is calculated */
  basis: "nav" | "commitments" | "fixed" | "per_entity" | "milestone";
  /** basis points per year for nav / commitments */
  bps?: number;
  annualMinimum?: number;
  /** fixed amount per period, entity or milestone */
  amount?: number;
  frequency: "Monthly" | "Quarterly in arrears" | "Annually" | "On milestone";
  effective: string;
};

export type Plan = { id: string; name: string; monthly: number; includes: string };

export type Subscription = {
  id: string;
  clientId: string;
  planId: string;
  seats: number;
  start: string;
  renews: string;
  status: "Active" | "Trial" | "Cancelling";
};

export type InvoiceLine = { id: string; description: string; detail?: string; qty: number; unit: number };

export type InvoiceStatus = "Draft" | "Awaiting approval" | "Sent" | "Partially paid" | "Paid" | "Void";

export type Invoice = {
  id: string;
  number: string;
  clientId: string;
  solution: string;
  period: string;
  issued: string;
  due: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  preparedBy: string;
  approvedBy?: string;
  notes?: string;
};

export type Payment = {
  id: string;
  invoiceId: string;
  clientId: string;
  date: string;
  amount: number;
  method: "Wire" | "ACH" | "Check";
  reference: string;
};

export const plans: Plan[] = [
  { id: "essential", name: "Essential", monthly: 1_200, includes: "Up to 2 vehicles · 50 investors · branded portal" },
  { id: "professional", name: "Professional", monthly: 2_800, includes: "Up to 6 vehicles · 300 investors · custom domain · analytics" },
  { id: "institutional", name: "Institutional", monthly: 6_500, includes: "Unlimited vehicles · SSO · dedicated team · API access" },
];
export const planById = (id: string) => plans.find((p) => p.id === id)!;

export const feeSchedules: FeeSchedule[] = [
  { id: "fs-strlex", clientId: "strlex", solution: "fund", service: "Fund administration", basis: "nav", bps: 6, annualMinimum: 60_000, frequency: "Quarterly in arrears", effective: "2024-09-01" },
  { id: "fs-arbor", clientId: "arbor", solution: "fund", service: "Fund administration", basis: "commitments", bps: 4, annualMinimum: 45_000, frequency: "Quarterly in arrears", effective: "2025-01-01" },
  { id: "fs-cord", clientId: "cordillera", solution: "fund", service: "Fund administration", basis: "nav", bps: 5, annualMinimum: 75_000, frequency: "Quarterly in arrears", effective: "2023-06-01" },
  { id: "fs-atl", clientId: "atlantico", solution: "fund", service: "Fund administration", basis: "nav", bps: 7, annualMinimum: 50_000, frequency: "Quarterly in arrears", effective: "2024-03-01" },
  { id: "fs-strlex-bank", clientId: "strlex", solution: "banking", service: "Treasury & payments", basis: "fixed", amount: 1_500, frequency: "Monthly", effective: "2025-07-01" },
  { id: "fs-halv", clientId: "halvorsen", solution: "multi-family", service: "Family office services", basis: "fixed", amount: 18_000, frequency: "Monthly", effective: "2024-01-01" },
  { id: "fs-val", clientId: "valenca", solution: "multi-family", service: "Family office services", basis: "fixed", amount: 12_500, frequency: "Monthly", effective: "2025-04-01" },
  { id: "fs-porto", clientId: "portoreal", solution: "banking", service: "Treasury & payments", basis: "fixed", amount: 4_200, frequency: "Monthly", effective: "2025-02-01" },
  { id: "fs-ledger", clientId: "ledgerline", solution: "blockchain", service: "Transfer agent & on-chain registry", basis: "milestone", amount: 35_000, frequency: "On milestone", effective: "2026-09-01" },
  { id: "fs-cascade", clientId: "cascade", solution: "offering", service: "Offering coordination", basis: "milestone", amount: 40_000, frequency: "On milestone", effective: "2026-08-15" },
  { id: "fs-alta", clientId: "altamira", solution: "corporate", service: "Registered agent & annual compliance", basis: "per_entity", amount: 2_400, frequency: "Annually", effective: "2025-01-01" },
];

export const subscriptions: Subscription[] = [
  { id: "sub-strlex", clientId: "strlex", planId: "professional", seats: 8, start: "2024-09-01", renews: "2027-09-01", status: "Active" },
  { id: "sub-arbor", clientId: "arbor", planId: "essential", seats: 4, start: "2025-01-01", renews: "2027-01-01", status: "Active" },
  { id: "sub-cord", clientId: "cordillera", planId: "institutional", seats: 14, start: "2023-06-01", renews: "2027-06-01", status: "Active" },
  { id: "sub-atl", clientId: "atlantico", planId: "professional", seats: 6, start: "2024-03-01", renews: "2027-03-01", status: "Active" },
  { id: "sub-halv", clientId: "halvorsen", planId: "essential", seats: 3, start: "2024-01-01", renews: "2027-01-01", status: "Active" },
  { id: "sub-cascade", clientId: "cascade", planId: "essential", seats: 2, start: "2026-10-01", renews: "2026-12-31", status: "Trial" },
];

const L = (id: string, description: string, unit: number, qty = 1, detail?: string): InvoiceLine => ({ id, description, unit, qty, detail });

export const invoices: Invoice[] = [
  {
    id: "inv-118", number: "AUR-2026-0118", clientId: "strlex", solution: "fund", period: "Q3 2026", issued: "2026-10-08", due: "2026-11-07", status: "Paid", preparedBy: "Rafael Mendes", approvedBy: "Luiza Andrade",
    lines: [L("a", "Fund administration — Strlex vehicles", 15_000, 1, "Q3 2026 · 6 bps p.a. on NAV · quarterly minimum applied"), L("b", "Platform subscription — Professional", 2_800, 3, "Jul–Sep 2026 · 8 seats")],
  },
  {
    id: "inv-119", number: "AUR-2026-0119", clientId: "arbor", solution: "fund", period: "Q3 2026", issued: "2026-10-08", due: "2026-11-07", status: "Sent", preparedBy: "Rafael Mendes", approvedBy: "Luiza Andrade",
    lines: [L("a", "Fund administration — Sagewood Seed Fund I LP", 11_250, 1, "Q3 2026 · 4 bps p.a. on commitments · quarterly minimum applied"), L("b", "Platform subscription — Essential", 1_200, 3, "Jul–Sep 2026 · 4 seats"), L("c", "Investor onboarding", 150, 12, "12 investors · KYC/AML and subscription review")],
  },
  {
    id: "inv-120", number: "AUR-2026-0120", clientId: "cordillera", solution: "fund", period: "Q3 2026", issued: "2026-10-08", due: "2026-11-07", status: "Paid", preparedBy: "Rafael Mendes", approvedBy: "Luiza Andrade",
    lines: [L("a", "Fund administration — Cordillera Infrastructure Partners I, LP", 18_750, 1, "Q3 2026 · 5 bps p.a. on NAV · quarterly minimum applied"), L("b", "Platform subscription — Institutional", 6_500, 3, "Jul–Sep 2026 · 14 seats")],
  },
  {
    id: "inv-121", number: "AUR-2026-0121", clientId: "atlantico", solution: "fund", period: "Q3 2026", issued: "2026-10-08", due: "2026-11-07", status: "Partially paid", preparedBy: "Rafael Mendes", approvedBy: "Luiza Andrade",
    lines: [L("a", "Fund administration — Atlântico Venture Partners II, L.P.", 12_500, 1, "Q3 2026 · 7 bps p.a. on NAV · quarterly minimum applied"), L("b", "Platform subscription — Professional", 2_800, 3, "Jul–Sep 2026 · 6 seats")],
  },
  {
    id: "inv-126", number: "AUR-2026-0126", clientId: "halvorsen", solution: "multi-family", period: "November 2026", issued: "2026-11-01", due: "2026-12-01", status: "Sent", preparedBy: "Helena Costa", approvedBy: "Luiza Andrade",
    lines: [L("a", "Family office services — monthly retainer", 18_000, 1, "November 2026"), L("b", "Platform subscription — Essential", 1_200, 1, "November 2026 · 3 seats")],
  },
  {
    id: "inv-127", number: "AUR-2026-0127", clientId: "portoreal", solution: "banking", period: "November 2026", issued: "2026-11-01", due: "2026-11-16", status: "Sent", preparedBy: "Noah Whitaker", approvedBy: "Luiza Andrade",
    lines: [L("a", "Treasury & payments — monthly", 4_200, 1, "November 2026 · 6 accounts")],
  },
  {
    id: "inv-128", number: "AUR-2026-0128", clientId: "valenca", solution: "multi-family", period: "November 2026", issued: "2026-11-01", due: "2026-12-01", status: "Paid", preparedBy: "Helena Costa", approvedBy: "Luiza Andrade",
    lines: [L("a", "Family office services — monthly retainer", 12_500, 1, "November 2026")],
  },
  {
    id: "inv-129", number: "AUR-2026-0129", clientId: "ledgerline", solution: "blockchain", period: "Milestone 1", issued: "2026-11-15", due: "2026-12-15", status: "Sent", preparedBy: "Priya Raman", approvedBy: "Luiza Andrade",
    lines: [L("a", "Transfer agent setup — Ledgerline Notes", 35_000, 1, "Milestone 1 · register and smart-contract review complete")],
  },
  {
    id: "inv-130", number: "AUR-2026-0130", clientId: "altamira", solution: "corporate", period: "2027", issued: "2026-11-24", due: "2026-12-24", status: "Awaiting approval", preparedBy: "Bianca Freitas",
    lines: [L("a", "Registered agent & annual compliance", 2_400, 9, "9 entities · calendar year 2027"), L("b", "Board support — new subsidiary resolution", 1_800, 1)],
  },
  {
    id: "inv-131", number: "AUR-2026-0131", clientId: "cascade", solution: "offering", period: "Milestone 2", issued: "2026-11-24", due: "2026-12-24", status: "Draft", preparedBy: "Olivia Brandt",
    lines: [L("a", "Offering coordination — Cascade Real Estate Fund I", 40_000, 1, "Milestone 2 · data room and broker-dealer review")],
  },
];

export const payments: Payment[] = [
  { id: "p1", invoiceId: "inv-118", clientId: "strlex", date: "2026-11-03", amount: 23_400, method: "Wire", reference: "FED REF 20261103-STRX-4471" },
  { id: "p2", invoiceId: "inv-120", clientId: "cordillera", date: "2026-10-29", amount: 38_250, method: "Wire", reference: "FED REF 20261029-CORD-1182" },
  { id: "p3", invoiceId: "inv-121", clientId: "atlantico", date: "2026-11-12", amount: 12_000, method: "Wire", reference: "SWIFT ITAUBRSP 112611" },
  { id: "p4", invoiceId: "inv-128", clientId: "valenca", date: "2026-11-18", amount: 12_500, method: "ACH", reference: "ACH 0918-VALFO" },
];

/* ───────────────────────── helpers ───────────────────────── */

export const lineTotal = (l: InvoiceLine) => Math.round(l.qty * l.unit * 100) / 100;
export const invoiceTotal = (i: Invoice) => i.lines.reduce((s, l) => s + lineTotal(l), 0);
export const paidOn = (i: Invoice, ps: Payment[]) => ps.filter((p) => p.invoiceId === i.id).reduce((s, p) => s + p.amount, 0);
export const balance = (i: Invoice, ps: Payment[]) => Math.max(0, invoiceTotal(i) - paidOn(i, ps));

export const isOpen = (i: Invoice) => i.status === "Sent" || i.status === "Partially paid";
export const isOverdue = (i: Invoice, today = BILL_TODAY) => isOpen(i) && i.due < today;
export const daysPast = (i: Invoice, today = BILL_TODAY) => Math.round((Date.parse(today) - Date.parse(i.due)) / 86_400_000);

export const billingClient = (id: string) => clients.find((c) => c.id === id);
export const solutionName = (id: string) => solutions.find((s) => s.id === id)?.name ?? id;

export function nextNumber(list: Invoice[]) {
  const n = Math.max(...list.map((i) => Number(i.number.split("-")[2])));
  return `AUR-2026-${String(n + 1).padStart(4, "0")}`;
}

/** Monthly recurring revenue from subscriptions and monthly retainers. */
export function mrr() {
  const subs = subscriptions.filter((s) => s.status === "Active").reduce((a, s) => a + planById(s.planId).monthly, 0);
  const retainers = feeSchedules.filter((f) => f.frequency === "Monthly").reduce((a, f) => a + (f.amount ?? 0), 0);
  return subs + retainers;
}

/**
 * Administration fee for one quarter, per vehicle, from the client's fee schedule.
 * NAV and commitments are converted to USD at the rate passed in.
 */
export function quarterlyAdminLines(clientId: string, brlPerUsd: number, period: string): InvoiceLine[] {
  const fs = feeSchedules.find((f) => f.clientId === clientId && f.solution === "fund");
  const c = billingClient(clientId);
  if (!fs || !c?.gpId) return [];
  const vehicles = funds
    .filter((f) => f.gpId === c.gpId)
    .map((f) => {
      const t = fundTotals(f.id);
      return { f, base: toUSD(fs.basis === "nav" ? t.nav : t.commitment, f.currency, brlPerUsd) };
    })
    .filter((v) => v.base > 0);
  const lines: InvoiceLine[] = vehicles.map(({ f, base }, i) => {
    const fee = Math.round((base * (fs.bps ?? 0)) / 10_000 / 4);
    const baseLabel = fs.basis === "nav" ? "NAV" : "commitments";
    return {
      id: `adm-${i}`,
      description: `Fund administration — ${f.name}`,
      detail: `${period} · ${fs.bps} bps p.a. on ${baseLabel} of $${Math.round(base).toLocaleString("en-US")}`,
      qty: 1,
      unit: fee,
    };
  });
  const quarterMin = (fs.annualMinimum ?? 0) / 4;
  const sum = lines.reduce((s, l) => s + lineTotal(l), 0);
  if (quarterMin > sum)
    lines.push({ id: "adm-min", description: "Quarterly minimum true-up", detail: `Annual minimum $${fs.annualMinimum!.toLocaleString("en-US")} ÷ 4`, qty: 1, unit: Math.round(quarterMin - sum) });
  return lines;
}

export function subscriptionLine(clientId: string, months: number, period: string): InvoiceLine | null {
  const s = subscriptions.find((x) => x.clientId === clientId && x.status === "Active");
  if (!s) return null;
  const p = planById(s.planId);
  return { id: "sub", description: `Platform subscription — ${p.name}`, detail: `${period} · ${s.seats} seats`, qty: months, unit: p.monthly };
}

/** Counts for the hub (no amounts). */
export function billingCounts() {
  return {
    open: invoices.filter(isOpen).length,
    overdue: invoices.filter((i) => isOverdue(i)).length,
    drafts: invoices.filter((i) => i.status === "Draft" || i.status === "Awaiting approval").length,
    payments: payments.filter((p) => p.date >= "2026-11-01").length,
    subscriptions: subscriptions.filter((s) => s.status !== "Cancelling").length,
    schedules: feeSchedules.length,
  };
}
