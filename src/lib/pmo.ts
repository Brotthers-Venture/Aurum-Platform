/** PMO — Aurum's project management office: onboardings, launches, closes, audits and internal projects. */

export type Health = "On track" | "At risk" | "Off track";
export type TaskStatus = "To do" | "In progress" | "Done";

export type Milestone = { name: string; date: string; done?: boolean };
export type Task = { id: string; projectId: string; title: string; assignee: string; due: string; status: TaskStatus; priority?: "High" };
export type Risk = { id: string; projectId: string; title: string; impact: "High" | "Medium" | "Low"; likelihood: "High" | "Medium" | "Low"; owner: string; mitigation: string; status: "Open" | "Mitigating" | "Closed" };

export type Project = {
  id: string;
  name: string;
  kind: "Client onboarding" | "Fund launch" | "Quarter close" | "Audit" | "Regulatory" | "Go-live" | "Closing" | "Restructuring" | "Internal";
  solution: string;
  owner: string;
  start: string;
  due: string;
  progress: number;
  health: Health;
  phase: string;
  note?: string;
  milestones: Milestone[];
};

export const projects: Project[] = [
  { id: "pj-anchor", name: "Anchor Bay Holdings — client onboarding", kind: "Client onboarding", solution: "corporate", owner: "Eduardo Sales", start: "2026-11-18", due: "2026-12-20", progress: 20, health: "On track", phase: "Entity intake", milestones: [{ name: "Engagement signed", date: "2026-11-18", done: true }, { name: "12 entities on register", date: "2026-12-05" }, { name: "First invoice", date: "2026-12-20" }] },
  { id: "pj-stxbr", name: "STX-Brazil Affordable Housing Fund I — launch", kind: "Fund launch", solution: "fund", owner: "Luiza Andrade", start: "2026-09-15", due: "2026-12-31", progress: 62, health: "At risk", phase: "LPA review", note: "Economics still pending LPA approval", milestones: [{ name: "LEI issued", date: "2026-09-30", done: true }, { name: "LPA economics approved", date: "2026-11-28" }, { name: "First close", date: "2026-12-31" }] },
  { id: "pj-q4", name: "Q4 2026 quarter close — all vehicles", kind: "Quarter close", solution: "fund", owner: "Luiza Andrade", start: "2026-12-01", due: "2027-01-31", progress: 5, health: "On track", phase: "Planning", milestones: [{ name: "Bank recs", date: "2026-12-03" }, { name: "NAV sign-off", date: "2027-01-20" }, { name: "Investor statements", date: "2027-01-31" }] },
  { id: "pj-ledger", name: "Ledgerline Notes — transfer agent go-live", kind: "Go-live", solution: "blockchain", owner: "Priya Raman", start: "2026-09-01", due: "2026-12-15", progress: 70, health: "At risk", phase: "Register reconciliation", note: "Wallet screening vendor contract not signed", milestones: [{ name: "Smart-contract audit", date: "2026-11-22", done: true }, { name: "Register reconciled", date: "2026-12-05" }, { name: "Go-live", date: "2026-12-15" }] },
  { id: "pj-cascade", name: "Cascade Real Estate Fund I — first closing", kind: "Closing", solution: "offering", owner: "Olivia Brandt", start: "2026-08-15", due: "2027-01-15", progress: 55, health: "On track", phase: "Investor diligence", milestones: [{ name: "PPM v3 in data room", date: "2026-11-23", done: true }, { name: "Escrow opened", date: "2026-12-10" }, { name: "First closing", date: "2027-01-15" }] },
  { id: "pj-soc1", name: "SOC 1 Type II — 2026 examination", kind: "Audit", solution: "aurum", owner: "Carla Nogueira", start: "2026-10-01", due: "2027-02-28", progress: 40, health: "On track", phase: "Control testing", milestones: [{ name: "Walkthroughs", date: "2026-10-31", done: true }, { name: "Fieldwork", date: "2027-01-15" }, { name: "Report issued", date: "2027-02-28" }] },
  { id: "pj-cayman", name: "Cayman annual returns — 14 entities", kind: "Regulatory", solution: "corporate", owner: "Bianca Freitas", start: "2026-11-15", due: "2027-01-31", progress: 15, health: "On track", phase: "Data collection", milestones: [{ name: "Director confirmations", date: "2026-12-15" }, { name: "Filed", date: "2027-01-31" }] },
  { id: "pj-halv", name: "Halvorsen trust restructuring", kind: "Restructuring", solution: "multi-family", owner: "Helena Costa", start: "2026-10-01", due: "2027-03-31", progress: 30, health: "Off track", phase: "Legal drafting", note: "Counsel draft three weeks late", milestones: [{ name: "Structure agreed", date: "2026-10-20", done: true }, { name: "Restated deed signed", date: "2026-12-12" }, { name: "Assets re-titled", date: "2027-03-31" }] },
  { id: "pj-platform", name: "Aurum Platform — production launch", kind: "Internal", solution: "aurum", owner: "Managing Partner", start: "2026-11-01", due: "2027-01-31", progress: 45, health: "On track", phase: "Build", milestones: [{ name: "Supabase connected", date: "2026-12-12" }, { name: "First GP live", date: "2027-01-15" }, { name: "All GPs migrated", date: "2027-01-31" }] },
];

export const tasks: Task[] = [
  { id: "t1", projectId: "pj-stxbr", title: "Approve LPA economics (second reviewer)", assignee: "Managing Partner", due: "2026-11-25", status: "To do", priority: "High" },
  { id: "t2", projectId: "pj-stxbr", title: "Confirm subscription documents with counsel", assignee: "Luiza Andrade", due: "2026-11-27", status: "In progress" },
  { id: "t3", projectId: "pj-q4", title: "Send Q4 close calendar to GPs", assignee: "Luiza Andrade", due: "2026-11-28", status: "To do" },
  { id: "t4", projectId: "pj-q4", title: "Bank reconciliations — STX-Anchor, Cordillera", assignee: "Rafael Mendes", due: "2026-12-03", status: "To do" },
  { id: "t5", projectId: "pj-ledger", title: "Sign wallet screening vendor contract", assignee: "Managing Partner", due: "2026-11-21", status: "To do", priority: "High" },
  { id: "t6", projectId: "pj-ledger", title: "Reconcile on-chain register to cap table", assignee: "Priya Raman", due: "2026-12-05", status: "In progress" },
  { id: "t7", projectId: "pj-cascade", title: "Open escrow account", assignee: "Olivia Brandt", due: "2026-12-10", status: "In progress" },
  { id: "t8", projectId: "pj-soc1", title: "Evidence for access review control", assignee: "Carla Nogueira", due: "2026-11-30", status: "In progress" },
  { id: "t9", projectId: "pj-anchor", title: "Collect formation documents for 12 entities", assignee: "Bianca Freitas", due: "2026-12-02", status: "In progress" },
  { id: "t10", projectId: "pj-halv", title: "Chase counsel for restated deed draft", assignee: "Helena Costa", due: "2026-11-20", status: "To do", priority: "High" },
  { id: "t11", projectId: "pj-platform", title: "Send Supabase project URL and keys", assignee: "Managing Partner", due: "2026-12-05", status: "To do" },
  { id: "t12", projectId: "pj-platform", title: "Approve Communication design", assignee: "Managing Partner", due: "2026-11-24", status: "Done" },
  { id: "t13", projectId: "pj-cayman", title: "Request director confirmations", assignee: "Bianca Freitas", due: "2026-11-26", status: "To do" },
  { id: "t14", projectId: "pj-anchor", title: "Kick-off call with Grace Liu", assignee: "Eduardo Sales", due: "2026-11-19", status: "Done" },
];

export const risks: Risk[] = [
  { id: "r1", projectId: "pj-stxbr", title: "First close slips if LPA economics are not approved by Nov 28", impact: "High", likelihood: "Medium", owner: "Luiza Andrade", mitigation: "Second reviewer booked; GP aware", status: "Mitigating" },
  { id: "r2", projectId: "pj-ledger", title: "No wallet screening at go-live", impact: "High", likelihood: "Medium", owner: "Priya Raman", mitigation: "Manual screening fallback for first 30 days", status: "Open" },
  { id: "r3", projectId: "pj-halv", title: "Counsel delay pushes asset re-titling into Q2", impact: "Medium", likelihood: "High", owner: "Helena Costa", mitigation: "Escalated to counsel's partner", status: "Open" },
  { id: "r4", projectId: "pj-q4", title: "Holiday staffing during close", impact: "Medium", likelihood: "Medium", owner: "Luiza Andrade", mitigation: "Rota agreed; bank recs before Dec 20", status: "Mitigating" },
  { id: "r5", projectId: "pj-soc1", title: "Access review evidence incomplete for Q3", impact: "Medium", likelihood: "Low", owner: "Carla Nogueira", mitigation: "Re-run review with sign-offs", status: "Open" },
];

export const WEEKS = ["2026-11-30", "2026-12-07", "2026-12-14", "2026-12-21", "2026-12-28", "2027-01-04"];
export const capacity: { person: string; role: string; load: number[] }[] = [
  { person: "Luiza Andrade", role: "Head of Fund Services", load: [95, 110, 120, 85, 60, 115] },
  { person: "Rafael Mendes", role: "Fund Accountant", load: [100, 115, 105, 70, 40, 120] },
  { person: "Juliana Teixeira", role: "Relationship Manager", load: [70, 75, 80, 50, 30, 70] },
  { person: "Carla Nogueira", role: "Compliance Officer", load: [85, 90, 80, 60, 40, 95] },
  { person: "Helena Costa", role: "Head of Family Office", load: [90, 95, 90, 60, 30, 80] },
  { person: "Priya Raman", role: "Head of Digital Assets", load: [110, 105, 70, 50, 30, 60] },
  { person: "Olivia Brandt", role: "Head of Capital Markets", load: [80, 90, 95, 55, 35, 100] },
  { person: "Bianca Freitas", role: "Corporate Paralegal", load: [75, 85, 90, 70, 50, 105] },
];

export const PMO_TODAY = "2026-11-24";
export const dueWithin = (iso: string, days: number) => {
  const d = (Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${PMO_TODAY}T12:00:00Z`)) / 86_400_000;
  return d >= 0 && d <= days;
};

export function pmoCounts() {
  return {
    active: projects.filter((p) => p.progress < 100).length,
    atRisk: projects.filter((p) => p.health !== "On track").length,
    dueWeek: tasks.filter((t) => t.status !== "Done" && t.due <= "2026-12-01").length,
    risks: risks.filter((r) => r.status !== "Closed").length,
    over: capacity.filter((c) => c.load.some((l) => l > 100)).length,
    milestones: projects.flatMap((p) => p.milestones).filter((m) => !m.done && dueWithin(m.date, 30)).length,
  };
}
