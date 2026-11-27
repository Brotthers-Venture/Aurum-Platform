"use client";

import { TenantName } from "@/components/brand/TenantName";
import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, FileText, LayoutList, ListChecks, Plus, Search } from "lucide-react";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import { solutionById, solutions } from "@/lib/solutions";
import { fmtShort, useTab } from "./kit";
import { PlanSheet } from "./PlanSheet";
import { PlanTree } from "./PlanTree";
import {
  PLAN_TODAY,
  blankPlan,
  folderPath,
  loadPlans,
  nextDeadline,
  openTasks,
  planFolders,
  plans as seedPlans,
  savePlans,
  summary,
  type Plan,
  type PlanFolder,
  type PlanStatus,
} from "@/lib/plans";
import { usePreviewRole } from "@/components/admin/PreviewRole";

/* The PMO runs on one thing: project plans. Overview, Open tasks and Reports are views computed
   from the plans, so there is nothing to keep in sync and nothing to enter twice. */

const C = FIRM.pmo;
export type PmoTab = "overview" | "tasks" | "reports" | "plan";

const STATUS_TEXT: Record<PlanStatus, string> = { Completed: "#1F7A45", "In progress": "#2A64A0", "Not started": "#5B7592", Blocked: "#B3261E", "On hold": "#A86A0B" };
const report = (q: string) => `/pmo-report?${q}`;

export function PmoWorkspace({ tab: initial }: { tab: PmoTab }) {
  const [tab, setTab] = useTab<PmoTab>(initial);
  const [planData, setPlanData] = useState<{ plans: Plan[]; folders: PlanFolder[] }>({ plans: seedPlans, folders: planFolders });
  const [planId, setPlanId] = useState<string | null>(initial === "plan" ? seedPlans[0].id : null);
  const [rowId, setRowId] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const saved = loadPlans();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser copy of the plans replaces the seed after hydration
    if (saved) setPlanData(saved);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) savePlans(planData);
  }, [planData, loaded]);

  // General partners and tenants see only the plans they are a party to.
  const { member } = usePreviewRole();
  const external = member.party !== "employee";
  const orgKey = member.orgName.split(" ")[0].toLowerCase();
  const visiblePlans = external ? planData.plans.filter((p) => p.parties.some((x) => x.name.toLowerCase().includes(orgKey))) : planData.plans;
  const plan = tab === "plan" || external ? (visiblePlans.find((p) => p.id === planId) ?? (external ? visiblePlans[0] : undefined)) : undefined;
  const crumbs = plan ? [solutionById(plan.solution)?.name ?? plan.solution, ...folderPath(planData.folders, plan.folder).map((f) => f.name)] : [];

  const open = openTasks(planData.plans);
  const overdue = open.filter((t) => t.days !== null && t.days < 0).length;
  const openPlan = (id: string, row?: string) => {
    setPlanId(id);
    setRowId(row);
    setTab("plan");
  };
  const go = (t: PmoTab) => {
    setPlanId(null);
    setTab(t);
  };

  return (
    <div className="-mx-8 -mt-4 flex min-h-[calc(100vh-64px)]">
      <aside className="w-[260px] shrink-0 border-r border-stone-200 px-3 py-5">
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[12px] font-bold text-white" style={{ background: C }}>
            P
          </span>
          <div>
            <div className="text-[13px] font-semibold text-ink-900">PMO workspace</div>
            <div className="text-[11px] text-stone-500">
              <TenantName />
            </div>
          </div>
        </div>
        {external ? (
          <>
            <Heading>Your plans</Heading>
            {visiblePlans.map((p) => (
              <RailItem key={p.id} icon={<LayoutList size={14} />} label={p.name} on={plan?.id === p.id} onClick={() => setPlanId(p.id)} />
            ))}
            {!visiblePlans.length && <p className="px-2 py-3 text-[12px] leading-relaxed text-stone-500">No plans include {member.orgName} yet.</p>}
          </>
        ) : (
          <>
            <div className="mt-6 space-y-0.5">
              <RailItem icon={<LayoutList size={14} />} label="Overview" count={planData.plans.length} on={tab === "overview"} onClick={() => go("overview")} />
              <RailItem icon={<ListChecks size={14} />} label="Open tasks" count={open.length} alert={overdue > 0} on={tab === "tasks"} onClick={() => go("tasks")} />
              <RailItem icon={<FileText size={14} />} label="Reports" on={tab === "reports"} onClick={() => go("reports")} />
            </div>
            <Heading>Project plans</Heading>
            <PlanTree
              data={planData}
              selected={plan?.id ?? null}
              color={C}
              onChange={(d) => {
                setPlanData(d);
                if (planId && !d.plans.some((p) => p.id === planId)) go("overview");
              }}
              onSelect={(id) => openPlan(id)}
            />
          </>
        )}
      </aside>

      <div className="min-w-0 flex-1 px-7 py-5">
        {plan ? (
          <PlanSheet
            key={plan.id}
            plan={plan}
            crumbs={crumbs}
            openRowId={rowId}
            onChange={(rows) => setPlanData((d) => ({ ...d, plans: d.plans.map((p) => (p.id === plan.id ? { ...p, rows } : p)) }))}
          />
        ) : external ? (
          <div className="py-16 text-center text-[13px] text-stone-500">Plans you are part of will appear here.</div>
        ) : tab === "tasks" ? (
          <OpenTasks plans={planData.plans} onOpen={openPlan} />
        ) : tab === "reports" ? (
          <Reports plans={planData.plans} folders={planData.folders} />
        ) : (
          <Overview
            plans={planData.plans}
            folders={planData.folders}
            onOpen={openPlan}
            onNew={() => {
              const p = blankPlan("fund", null);
              setPlanData((d) => ({ ...d, plans: [...d.plans, p] }));
              openPlan(p.id);
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── rail ───────────────────────── */

function Heading({ children }: { children: ReactNode }) {
  return <div className="mb-1 mt-6 px-2 text-[11px] font-semibold text-stone-500">{children}</div>;
}

function RailItem({ icon, label, count, alert, on, onClick }: { icon: ReactNode; label: string; count?: number; alert?: boolean; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={on ? "page" : undefined}
      className={cx(
        "flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left text-[13px]",
        on ? "bg-champagne font-semibold text-ink-900" : "text-stone-600 hover:bg-white",
      )}
    >
      <span className="shrink-0" style={{ color: on ? C : undefined }}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className={cx("num text-[11px]", alert ? "font-semibold text-[#B3261E]" : "text-stone-400")}>{count}</span>}
    </button>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function PageTitle({ title, about, action }: { title: string; about: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-[24px] font-semibold tracking-[-0.01em] text-ink-900">{title}</h1>
        <p className="mt-0.5 text-[12.5px] text-stone-500">{about}</p>
      </div>
      {action}
    </div>
  );
}

function Figures({ items }: { items: [string, ReactNode, string?][] }) {
  return (
    <div className="mt-4 grid overflow-hidden rounded-[12px] border border-stone-200 bg-white" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map(([k, v, c]) => (
        <div key={k} className="border-r border-stone-100 px-4 py-3 last:border-0">
          <div className="text-[11px] font-medium text-stone-500">{k}</div>
          <div className="num mt-0.5 text-[22px] font-semibold" style={{ color: c ?? "var(--tenant-ink)" }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}

function Progress({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-stone-100">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: C }} />
      </div>
      <span className="num w-9 text-right text-[12px] font-semibold text-ink-900">{pct}%</span>
    </div>
  );
}

const btn = "flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[12.5px] font-semibold";

/* ───────────────────────── overview ───────────────────────── */

function Overview({ plans, folders, onOpen, onNew }: { plans: Plan[]; folders: PlanFolder[]; onOpen: (id: string) => void; onNew: () => void }) {
  const all = plans.flatMap((p) => p.rows);
  const s = summary(all);
  const open = openTasks(plans);
  const week = open.filter((t) => t.days !== null && t.days >= 0 && t.days <= 7).length;
  const bySolution = solutions.map((sol) => ({ sol, list: plans.filter((p) => p.solution === sol.id) })).filter((g) => g.list.length);
  return (
    <div>
      <PageTitle
        title="Overview"
        about={`Every project plan in the firm, as of ${fmtShort(PLAN_TODAY)}. Open a plan to work on it.`}
        action={
          <div className="flex gap-2">
            <a href={report("plan=all")} target="_blank" rel="noreferrer" className={cx(btn, "border border-stone-300 bg-white text-ink-900 hover:border-ink-900")}>
              <FileText size={14} /> Board report
            </a>
            <button onClick={onNew} className={cx(btn, "bg-brand text-brand-ink hover:opacity-90")}>
              <Plus size={14} /> New plan
            </button>
          </div>
        }
      />
      <Figures
        items={[
          ["Plans", plans.length],
          ["Open tasks", s.tasks - s.completed],
          ["Overdue", s.overdue, s.overdue ? "#B3261E" : undefined],
          ["Due in 7 days", week],
          ["Complete", `${Math.round(s.pct * 100)}%`],
        ]}
      />
      <div className="mt-5 overflow-x-auto rounded-[12px] border border-stone-200 bg-white">
        <table className="w-full min-w-[860px] text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-200 text-left text-[11px] font-semibold text-stone-500">
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-3">Owner</th>
              <th className="px-3">Parties</th>
              <th className="px-3">Progress</th>
              <th className="px-3 text-right">Overdue</th>
              <th className="px-3 text-right">Blocked</th>
              <th className="px-3">Next deadline</th>
              <th className="px-3" />
            </tr>
          </thead>
          {bySolution.map(({ sol, list }) => (
            <tbody key={sol.id}>
              <tr className="border-b border-stone-200 bg-stone-50">
                <td colSpan={8} className="px-4 py-1.5 text-[11.5px] font-semibold text-ink-900">
                  {sol.name} <span className="font-normal text-stone-500">· {list.length}</span>
                </td>
              </tr>
              {list.map((p) => {
                const ps = summary(p.rows);
                const nd = nextDeadline(p.rows);
                const path = folderPath(folders, p.folder).map((f) => f.name);
                return (
                  <tr key={p.id} onClick={() => onOpen(p.id)} className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-d-raise">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-ink-900">{p.name}</div>
                      <div className="text-[11.5px] text-stone-500">{path.length ? path.join(" / ") : (p.vehicle ?? "")}</div>
                    </td>
                    <td className="px-3 text-stone-600">{p.owner}</td>
                    <td className="px-3">
                      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11.5px] text-stone-600">
                        {p.parties.map((x) => (
                          <span key={x.id} className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full ring-1 ring-stone-300" style={{ background: x.color }} />
                            {x.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3">
                      <Progress pct={Math.round(ps.pct * 100)} />
                      <div className="text-[11px] text-stone-500">
                        {ps.completed} of {ps.tasks} tasks
                      </div>
                    </td>
                    <td className={cx("num px-3 text-right", ps.overdue ? "font-semibold text-[#B3261E]" : "text-stone-400")}>{ps.overdue}</td>
                    <td className={cx("num px-3 text-right", ps.blocked ? "font-semibold text-[#B3261E]" : "text-stone-400")}>{ps.blocked}</td>
                    <td className="num px-3 text-stone-600">{nd ? fmtShort(nd) : "—"}</td>
                    <td className="px-3 text-right">
                      <a
                        href={report(`plan=${p.id}`)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[12px] font-semibold text-stone-500 hover:text-ink-900 hover:underline"
                      >
                        Report
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── open tasks ───────────────────────── */

function OpenTasks({ plans, onOpen }: { plans: Plan[]; onOpen: (plan: string, row?: string) => void }) {
  const [q, setQ] = useState("");
  const [who, setWho] = useState("all");
  const all = openTasks(plans);
  const owners = [...new Set(all.map((t) => t.row.owner).filter(Boolean) as string[])].sort();
  const list = all.filter((t) => (who === "all" || t.row.owner === who) && (!q || `${t.row.title} ${t.plan.name}`.toLowerCase().includes(q.toLowerCase())));
  const buckets: [string, typeof list][] = [
    ["Overdue", list.filter((t) => t.days !== null && t.days < 0)],
    ["Due in the next 7 days", list.filter((t) => t.days !== null && t.days >= 0 && t.days <= 7)],
    ["Later", list.filter((t) => t.days !== null && t.days > 7)],
    ["No deadline", list.filter((t) => t.days === null)],
  ];
  return (
    <div>
      <PageTitle title="Open tasks" about="Every task not yet completed, across all plans, soonest deadline first. Click a task to open it in its plan." />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks or plans"
            className="h-9 w-[240px] rounded-[8px] border border-stone-200 bg-white pl-8 pr-2 text-[12.5px] focus:border-ink-900 focus:outline-none"
          />
        </div>
        <select value={who} onChange={(e) => setWho(e.target.value)} className="h-9 rounded-[8px] border border-stone-200 bg-white px-2 text-[12.5px] text-ink-900">
          <option value="all">Everyone</option>
          {owners.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <span className="text-[12px] text-stone-500">{list.length} tasks</span>
      </div>
      <div className="mt-4 overflow-x-auto rounded-[12px] border border-stone-200 bg-white">
        <table className="w-full min-w-[860px] text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-200 text-left text-[11px] font-semibold text-stone-500">
              <th className="px-4 py-2.5">Deadline</th>
              <th className="px-3">Task</th>
              <th className="px-3">Plan</th>
              <th className="px-3">Owner</th>
              <th className="px-3">Status</th>
              <th className="px-3">Waiting on</th>
            </tr>
          </thead>
          {buckets
            .filter(([, rows]) => rows.length)
            .map(([name, rows]) => (
              <tbody key={name}>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <td colSpan={6} className={cx("px-4 py-1.5 text-[11.5px] font-semibold", name === "Overdue" ? "text-[#B3261E]" : "text-ink-900")}>
                    {name} <span className="font-normal text-stone-500">· {rows.length}</span>
                  </td>
                </tr>
                {rows.map(({ plan, row, days }) => {
                  const wait = row.dependsOn.filter((d) => plan.rows.find((x) => x.id === d)?.status !== "Completed");
                  const Icon = row.status === "Blocked" ? AlertCircle : row.status === "In progress" ? Clock3 : CheckCircle2;
                  return (
                    <tr key={`${plan.id}-${row.id}`} onClick={() => onOpen(plan.id, row.id)} className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-d-raise">
                      <td className="num whitespace-nowrap px-4 py-2.5">
                        <span className="text-ink-900">{row.deadline ? fmtShort(row.deadline) : "—"}</span>
                        {days !== null && (
                          <span className={cx("ml-2 text-[11px]", days < 0 ? "font-semibold text-[#B3261E]" : "text-stone-500")}>{days < 0 ? `${-days}d late` : `${days}d`}</span>
                        )}
                      </td>
                      <td className="px-3">
                        <span className="num mr-1.5 text-stone-400">{row.id}</span>
                        <span className="font-medium text-ink-900">{row.title}</span>
                      </td>
                      <td className="px-3 text-stone-600">{plan.name}</td>
                      <td className="px-3 text-stone-600">
                        {row.owner}
                        <span className="text-stone-400"> · {plan.parties.find((x) => x.id === row.party)?.name}</span>
                      </td>
                      <td className="px-3">
                        {row.status && (
                          <span className="flex items-center gap-1 whitespace-nowrap font-medium" style={{ color: STATUS_TEXT[row.status] }}>
                            <Icon size={13} /> {row.status}
                          </span>
                        )}
                      </td>
                      <td className="num px-3 text-stone-500">{wait.length ? wait.join(", ") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          {!list.length && (
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone-500">
                  No open tasks match.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── reports ───────────────────────── */

function Reports({ plans, folders }: { plans: Plan[]; folders: PlanFolder[] }) {
  const link = "font-semibold text-ink-900 underline-offset-2 hover:underline";
  return (
    <div>
      <PageTitle
        title="Reports"
        about="Print-ready PDFs built from the plans: US Letter landscape, with your letterhead. Each opens in a new tab; choose Save as PDF in the print window."
        action={
          <a href={report("plan=all")} target="_blank" rel="noreferrer" className={cx(btn, "bg-brand text-brand-ink hover:opacity-90")}>
            <FileText size={14} /> Board report, all plans
          </a>
        }
      />
      <div className="mt-5 overflow-x-auto rounded-[12px] border border-stone-200 bg-white">
        <table className="w-full min-w-[760px] text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-200 text-left text-[11px] font-semibold text-stone-500">
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-3">Whole plan</th>
              <th className="px-3">Open items</th>
              <th className="px-3">Deliverables requested from</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-stone-100 align-top last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink-900">{p.name}</div>
                  <div className="text-[11.5px] text-stone-500">
                    {[solutionById(p.solution)?.name, ...folderPath(folders, p.folder).map((f) => f.name)].filter(Boolean).join(" / ")}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <a href={report(`plan=${p.id}`)} target="_blank" rel="noreferrer" className={link}>
                    Status report
                  </a>
                </td>
                <td className="px-3 py-3">
                  <a href={report(`plan=${p.id}&scope=open`)} target="_blank" rel="noreferrer" className={link}>
                    Outstanding items
                  </a>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {p.parties.map((x) => (
                      <a key={x.id} href={report(`plan=${p.id}&party=${x.id}`)} target="_blank" rel="noreferrer" className={cx(link, "flex items-center gap-1.5")}>
                        <span className="h-2 w-2 rounded-full ring-1 ring-stone-300" style={{ background: x.color }} />
                        {x.contact}
                        <span className="font-normal text-stone-500">({x.name})</span>
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
