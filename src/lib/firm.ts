/**
 * Aurum's firm-wide workspaces — the coloured marks under the hub. Order matters: it is the dock order,
 * chosen so neighbouring colours stay distinguishable. Each ring is six modules with a live count (no amounts).
 */
import { FIRM, type FirmId } from "./firm-colors";
import { solutions } from "./solutions";
import { spaceUnreadCount, totalUnread } from "./comms";
import { billingCounts } from "./billing";
import { salesCounts } from "./sales";
import { pmoCounts } from "./pmo";
import { dataroomCounts } from "./dataroom";
import { complianceCounts } from "./compliance";

export type RingItem = { id: string; label: [string, string?]; sub: string; alert?: boolean; href: string };
export type FirmModule = { id: FirmId; name: string; color: string; href: string; badge: number; badgeLabel: string; ring: RingItem[] };

const s = salesCounts();
const p = pmoCounts();
const d = dataroomCounts();
const b = billingCounts();
const c = complianceCounts();
const unread = totalUnread();

const plural = (n: number, one: string, many = `${one}S`) => `${n} ${n === 1 ? one : many}`;

export const firmModules: FirmModule[] = [
  {
    id: "sales",
    name: "Sales",
    color: FIRM.sales,
    href: "/admin/sales",
    badge: s.leads,
    badgeLabel: "new leads",
    ring: [
      { id: "pipeline", label: ["Pipeline"], sub: `${s.open} OPEN`, alert: true, href: "/admin/sales?tab=pipeline" },
      { id: "new", label: ["New deal"], sub: "ADD A LEAD", href: "/admin/sales?tab=new" },
      { id: "leads", label: ["Leads"], sub: `${s.leads} NEW`, href: "/admin/sales?tab=leads" },
      { id: "proposals", label: ["Proposals"], sub: `${s.proposals} OUT`, href: "/admin/sales?tab=proposals" },
      { id: "forecast", label: ["Forecast"], sub: "WEIGHTED", href: "/admin/sales?tab=forecast" },
      { id: "activities", label: ["Activities"], sub: `${s.activities} THIS WEEK`, href: "/admin/sales?tab=activities" },
    ],
  },
  {
    id: "pmo",
    name: "Project management office",
    color: FIRM.pmo,
    href: "/admin/pmo",
    badge: p.atRisk,
    badgeLabel: "projects need attention",
    ring: [
      { id: "portfolio", label: ["Projects"], sub: `${p.active} ACTIVE`, href: "/admin/pmo?tab=portfolio" },
      { id: "new", label: ["New", "project"], sub: "START", href: "/admin/pmo?tab=new" },
      { id: "timeline", label: ["Timeline"], sub: `${p.milestones} MILESTONES`, href: "/admin/pmo?tab=timeline" },
      { id: "tasks", label: ["Tasks"], sub: `${p.dueWeek} THIS WEEK`, alert: p.dueWeek > 0, href: "/admin/pmo?tab=tasks" },
      { id: "risks", label: ["Risks"], sub: `${p.risks} OPEN`, alert: p.risks > 0, href: "/admin/pmo?tab=risks" },
      { id: "capacity", label: ["Capacity"], sub: p.over ? `${p.over} OVER 100%` : "BALANCED", alert: p.over > 0, href: "/admin/pmo?tab=capacity" },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    color: FIRM.communication,
    href: "/admin/communication",
    badge: unread,
    badgeLabel: "unread",
    ring: solutions.map((sol) => {
      const u = spaceUnreadCount(sol.id);
      return { id: sol.id, label: sol.lines, sub: u ? `${u} UNREAD` : "ALL READ", alert: u > 0, href: `/admin/communication?space=${sol.id}` };
    }),
  },
  {
    id: "dataroom",
    name: "Data rooms",
    color: FIRM.dataroom,
    href: "/admin/dataroom",
    badge: d.questions,
    badgeLabel: "open questions",
    ring: [
      { id: "rooms", label: ["Rooms"], sub: `${d.rooms} OPEN`, href: "/admin/dataroom?tab=rooms" },
      { id: "new", label: ["New room"], sub: "CREATE", href: "/admin/dataroom?tab=new" },
      { id: "qa", label: ["Q&A"], sub: `${d.questions} TO ANSWER`, alert: d.questions > 0, href: "/admin/dataroom?tab=qa" },
      { id: "activity", label: ["Activity"], sub: `${d.viewsToday} TODAY`, href: "/admin/dataroom?tab=activity" },
      { id: "ndas", label: ["NDAs"], sub: `${d.ndas} PENDING`, alert: d.ndas > 0, href: "/admin/dataroom?tab=access" },
      { id: "access", label: ["Access"], sub: plural(d.users, "PERSON", "PEOPLE"), href: "/admin/dataroom?tab=access" },
    ],
  },
  {
    id: "billing",
    name: "Billing",
    color: FIRM.billing,
    href: "/admin/billing",
    badge: b.overdue,
    badgeLabel: "overdue invoices",
    ring: [
      { id: "invoices", label: ["Invoices"], sub: `${b.open} OPEN`, alert: true, href: "/admin/billing?tab=invoices" },
      { id: "new", label: ["New", "invoice"], sub: `${b.drafts} IN DRAFT`, href: "/admin/billing?tab=new" },
      { id: "payments", label: ["Payments"], sub: `${b.payments} THIS MONTH`, href: "/admin/billing?tab=payments" },
      { id: "subscriptions", label: ["Subscriptions"], sub: `${b.subscriptions} ACTIVE`, href: "/admin/billing?tab=subscriptions" },
      { id: "fees", label: ["Administration", "fees"], sub: `${b.schedules} SCHEDULES`, href: "/admin/billing?tab=fees" },
      { id: "overdue", label: ["Overdue"], sub: b.overdue ? `${b.overdue} TO CHASE` : "NONE", alert: b.overdue > 0, href: "/admin/billing?tab=invoices&filter=overdue" },
    ],
  },
  {
    id: "compliance",
    name: "Compliance",
    color: FIRM.compliance,
    href: "/admin/compliance",
    badge: c.overdue + c.alerts,
    badgeLabel: "items need attention",
    ring: [
      { id: "calendar", label: ["Calendar"], sub: `${c.due30} DUE IN 30 DAYS`, alert: c.overdue > 0, href: "/admin/compliance?tab=calendar" },
      { id: "screening", label: ["Screening"], sub: `${c.alerts} TO REVIEW`, alert: c.alerts > 0, href: "/admin/compliance?tab=screening" },
      { id: "policies", label: ["Policies"], sub: c.policies ? `${c.policies} TO REVIEW` : "UP TO DATE", alert: c.policies > 0, href: "/admin/compliance?tab=policies" },
      { id: "training", label: ["Training"], sub: c.trainingOverdue ? `${c.trainingOverdue} OVERDUE` : "ON TRACK", alert: c.trainingOverdue > 0, href: "/admin/compliance?tab=training" },
      { id: "reviews", label: ["Access", "reviews"], sub: `${c.reviewsDone} OF ${c.reviews} DONE`, href: "/admin/compliance?tab=reviews" },
      { id: "audit", label: ["Audit log"], sub: "APPEND-ONLY", href: "/admin/compliance?tab=audit" },
    ],
  },
];

export const firmById = (id: string) => firmModules.find((m) => m.id === id);
