/**
 * Aurum's firm-wide workspaces — the coloured marks under the hub. Order matters: it is the dock order,
 * chosen so neighbouring colours stay distinguishable. Each ring is six modules with a live count (no amounts).
 */
import { FIRM, type FirmId } from "./firm-colors";
import { totalUnread } from "./comms";
import { billingCounts } from "./billing";
import { salesCounts } from "./sales";
import { pmoCounts } from "./plans";
import { dataroomCounts } from "./dataroom";
import { complianceCounts } from "./compliance";
import { concourseCounts } from "./concourse";

export type RingItem = { id: string; label: [string, string?]; sub: string; alert?: boolean; href: string };
export type FirmModule = { id: FirmId; name: string; color: string; href: string; badge: number; badgeLabel: string; ring: RingItem[] };

const s = salesCounts();
const p = pmoCounts();
const d = dataroomCounts();
const b = billingCounts();
const c = complianceCounts();
const unread = totalUnread();
const cc = concourseCounts();

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
      { id: "pipeline", label: ["Pipeline"], sub: `${s.open} open`, alert: true, href: "/admin/sales?tab=pipeline" },
      { id: "new", label: ["New deal"], sub: "Add a lead", href: "/admin/sales?tab=new" },
      { id: "leads", label: ["Leads"], sub: `${s.leads} new`, href: "/admin/sales?tab=leads" },
      { id: "proposals", label: ["Proposals"], sub: `${s.proposals} out`, href: "/admin/sales?tab=proposals" },
      { id: "forecast", label: ["Forecast"], sub: "Weighted", href: "/admin/sales?tab=forecast" },
      { id: "activities", label: ["Activities"], sub: `${s.activities} this week`, href: "/admin/sales?tab=activities" },
    ],
  },
  {
    id: "pmo",
    name: "Project management office",
    color: FIRM.pmo,
    href: "/admin/pmo",
    badge: p.attention,
    badgeLabel: p.attention === 1 ? "plan needs attention" : "plans need attention",
    ring: [
      { id: "overview", label: ["Overview"], sub: plural(p.plans, "plan", "plans"), href: "/admin/pmo" },
      { id: "tasks", label: ["Open", "tasks"], sub: p.overdue ? `${p.overdue} overdue` : `${p.dueWeek} this week`, alert: p.overdue > 0, href: "/admin/pmo?tab=tasks" },
      { id: "week", label: ["Due this", "week"], sub: plural(p.dueWeek, "task", "tasks"), href: "/admin/pmo?tab=tasks&show=week" },
      { id: "waiting", label: ["Waiting on", "others"], sub: plural(p.waiting, "task", "tasks"), alert: p.waiting > 0, href: "/admin/pmo?tab=tasks&show=waiting" },
      { id: "new", label: ["New plan"], sub: "Start a plan", href: "/admin/pmo?tab=new" },
      { id: "reports", label: ["Reports"], sub: "PDF for the board", href: "/admin/pmo?tab=reports" },
    ],
  },
  {
    id: "communication",
    name: "Concourse",
    color: FIRM.communication,
    href: "/admin/communication",
    badge: unread,
    badgeLabel: "unread",
    ring: [
      { id: "messages", label: ["Messages"], sub: unread ? `${unread} unread` : "All read", alert: unread > 0, href: "/admin/communication" },
      { id: "calendar", label: ["Calendar"], sub: plural(cc.week, "date", "dates") + " this week", href: "/admin/communication/calendar" },
      { id: "agenda", label: ["Agenda"], sub: "Day by day", href: "/admin/communication/calendar?view=agenda" },
      {
        id: "overdue",
        label: ["Overdue"],
        sub: cc.overdue ? `${cc.overdue} past due` : "None",
        alert: cc.overdue > 0,
        href: "/admin/communication/calendar?view=agenda&show=overdue",
      },
      { id: "meetings", label: ["Meetings"], sub: "Scheduled here", href: "/admin/communication/calendar?view=agenda&filter=meeting" },
      { id: "new", label: ["New", "meeting"], sub: "Schedule", href: "/admin/communication/calendar?new=1" },
    ],
  },
  {
    id: "dataroom",
    name: "Data rooms",
    color: FIRM.dataroom,
    href: "/admin/dataroom",
    badge: d.questions,
    badgeLabel: "open questions",
    ring: [
      { id: "rooms", label: ["Rooms"], sub: `${d.rooms} open`, href: "/admin/dataroom?tab=rooms" },
      { id: "new", label: ["New room"], sub: "Create", href: "/admin/dataroom?tab=new" },
      { id: "qa", label: ["Q&A"], sub: `${d.questions} to answer`, alert: d.questions > 0, href: "/admin/dataroom?tab=qa" },
      { id: "activity", label: ["Activity"], sub: `${d.viewsToday} today`, href: "/admin/dataroom?tab=activity" },
      { id: "ndas", label: ["NDAs"], sub: `${d.ndas} pending`, alert: d.ndas > 0, href: "/admin/dataroom?tab=access" },
      { id: "access", label: ["Access"], sub: plural(d.users, "person", "people"), href: "/admin/dataroom?tab=access" },
    ],
  },
  {
    id: "billing",
    name: "Treasury",
    color: FIRM.billing,
    href: "/admin/treasury",
    badge: b.overdue,
    badgeLabel: "overdue invoices",
    ring: [
      { id: "invoices", label: ["Invoices"], sub: `${b.open} open`, alert: true, href: "/admin/treasury?tab=invoices" },
      { id: "new", label: ["New", "invoice"], sub: `${b.drafts} in draft`, href: "/admin/treasury?tab=new" },
      { id: "payments", label: ["Payments"], sub: `${b.payments} this month`, href: "/admin/treasury?tab=payments" },
      { id: "subscriptions", label: ["Subscriptions"], sub: `${b.subscriptions} active`, href: "/admin/treasury?tab=subscriptions" },
      { id: "fees", label: ["Administration", "fees"], sub: `${b.schedules} schedules`, href: "/admin/treasury?tab=fees" },
      { id: "overdue", label: ["Overdue"], sub: b.overdue ? `${b.overdue} to chase` : "None", alert: b.overdue > 0, href: "/admin/treasury?tab=invoices&filter=overdue" },
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
      { id: "calendar", label: ["Calendar"], sub: `${c.due30} due in 30 days`, alert: c.overdue > 0, href: "/admin/compliance?tab=calendar" },
      { id: "screening", label: ["Screening"], sub: `${c.alerts} to review`, alert: c.alerts > 0, href: "/admin/compliance?tab=screening" },
      { id: "policies", label: ["Policies"], sub: c.policies ? `${c.policies} to review` : "Up to date", alert: c.policies > 0, href: "/admin/compliance?tab=policies" },
      {
        id: "training",
        label: ["Training"],
        sub: c.trainingOverdue ? `${c.trainingOverdue} overdue` : "On track",
        alert: c.trainingOverdue > 0,
        href: "/admin/compliance?tab=training",
      },
      { id: "reviews", label: ["Access", "reviews"], sub: `${c.reviewsDone} of ${c.reviews} done`, href: "/admin/compliance?tab=reviews" },
      { id: "audit", label: ["Audit log"], sub: "Append-only", href: "/admin/compliance?tab=audit" },
    ],
  },
];

export const firmById = (id: string) => firmModules.find((m) => m.id === id);
