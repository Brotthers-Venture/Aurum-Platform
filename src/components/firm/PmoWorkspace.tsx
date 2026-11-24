"use client";

import { TenantName } from "@/components/brand/TenantName";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarRange, ChevronDown, ChevronRight, Columns3, Filter, KanbanSquare, LayoutList, Maximize2, Plus, Search, SendHorizontal, Users, X } from "lucide-react";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import { solutions } from "@/lib/solutions";
import { PMO_TODAY, WEEKS, capacity, projects, risks, tasks, type Project } from "@/lib/pmo";
import { Initials, fmtShort, useTab } from "./kit";
import { PlanSheet } from "./PlanSheet";
import { folderPath, loadPlans, planFolders, plans as seedPlans, savePlans, type Plan, type PlanFolder } from "@/lib/plans";
import { PlanTree } from "./PlanTree";
import { solutionById } from "@/lib/solutions";

/* A board-based PMO: every list is a board of groups and items, every column has a type, status
   columns are coloured labels you click to change, and each board can be seen as a table,
   a kanban, a timeline or a workload view. */

const C = FIRM.pmo;
export type PmoTab = "portfolio" | "timeline" | "tasks" | "risks" | "capacity" | "new" | "plan";

type Opt = { label: string; color: string; ink?: string };
type Col = { id: string; title: string; kind: "person" | "status" | "date" | "timeline" | "progress" | "text" | "tag"; width: number; options?: Opt[] };
type Item = { id: string; name: string; group: string; v: Record<string, string | number | undefined>; updates: { by: string; at: string; text: string }[] };
type Group = { id: string; title: string; color: string };
type Board = { id: string; name: string; about: string; cols: Col[]; groups: Group[]; items: Item[] };

const STATUS: Opt[] = [
  { label: "In progress", color: "#E39B2E" },
  { label: "Blocked", color: "#C93C4B" },
  { label: "Complete", color: "#2E9B5F" },
  { label: "Not started", color: "#B9B2A4" },
];
const HEALTH: Opt[] = [
  { label: "On track", color: "#2E9B5F" },
  { label: "At risk", color: "#E39B2E" },
  { label: "Off track", color: "#C93C4B" },
];
const PRIORITY: Opt[] = [
  { label: "High", color: "#5E2E73" },
  { label: "Medium", color: "#8A4A9E" },
  { label: "Low", color: "#C3A6D0", ink: "#3B2346" },
];
const LEVEL: Opt[] = [
  { label: "High", color: "#C93C4B" },
  { label: "Medium", color: "#E39B2E" },
  { label: "Low", color: "#B9B2A4" },
];
const RISK_STATUS: Opt[] = [
  { label: "Open", color: "#C93C4B" },
  { label: "Mitigating", color: "#E39B2E" },
  { label: "Closed", color: "#2E9B5F" },
];
const GROUP_COLORS = ["#8A4A9E", "#1F8A84", "#C46A1E", "#3558C0", "#4F8A2B", "#9B2F3F", "#6F6A61"];
const area = (id: string) => (id === "aurum" ? "Aurum (internal)" : (solutions.find((s) => s.id === id)?.name ?? id));

/* ───────────────────────── boards from PMO data ───────────────────────── */

function seedBoards(): Board[] {
  const areas = [...new Set(projects.map((p) => p.solution))];
  const projectStatus = (p: Project) =>
    p.progress >= 100 ? "Complete" : p.health === "Off track" ? "Blocked" : p.progress === 0 || p.start > PMO_TODAY ? "Not started" : "In progress";
  const portfolio: Board = {
    id: "portfolio",
    name: "Projects portfolio",
    about: "Every client onboarding, launch, close, audit and internal project",
    cols: [
      { id: "owner", title: "Owner", kind: "person", width: 84 },
      { id: "status", title: "Status", kind: "status", width: 140, options: STATUS },
      { id: "health", title: "Health", kind: "status", width: 120, options: HEALTH },
      { id: "priority", title: "Priority", kind: "status", width: 108, options: PRIORITY },
      { id: "timeline", title: "Timeline", kind: "timeline", width: 170 },
      { id: "progress", title: "Progress", kind: "progress", width: 130 },
      { id: "phase", title: "Phase", kind: "text", width: 150 },
    ],
    groups: areas.map((a, i) => ({ id: a, title: area(a), color: GROUP_COLORS[i % GROUP_COLORS.length] })),
    items: projects.map((p) => ({
      id: p.id,
      name: p.name,
      group: p.solution,
      v: {
        owner: p.owner,
        status: projectStatus(p),
        health: p.health,
        priority: p.health === "On track" ? (p.kind === "Internal" ? "Medium" : "Medium") : "High",
        timeline: `${p.start}|${p.due}`,
        progress: p.progress,
        phase: p.phase,
      },
      updates: p.note ? [{ by: p.owner, at: "2026-11-23T15:00:00Z", text: p.note }] : [],
    })),
  };
  const bucket = (due: string, done: boolean) => (done ? "done" : due < PMO_TODAY ? "overdue" : due <= "2026-11-30" ? "week" : due <= "2026-12-07" ? "next" : "later");
  const taskBoard: Board = {
    id: "tasks",
    name: "Tasks",
    about: "What everyone is doing, by when",
    cols: [
      { id: "owner", title: "Owner", kind: "person", width: 84 },
      { id: "status", title: "Status", kind: "status", width: 140, options: STATUS },
      { id: "priority", title: "Priority", kind: "status", width: 108, options: PRIORITY },
      { id: "due", title: "Due date", kind: "date", width: 110 },
      { id: "project", title: "Project", kind: "tag", width: 250 },
    ],
    groups: [
      { id: "overdue", title: "Overdue", color: "#C93C4B" },
      { id: "week", title: "This week", color: "#8A4A9E" },
      { id: "next", title: "Next week", color: "#3558C0" },
      { id: "later", title: "Later", color: "#1F8A84" },
      { id: "done", title: "Done", color: "#2E9B5F" },
    ],
    items: tasks.map((t) => ({
      id: t.id,
      name: t.title,
      group: bucket(t.due, t.status === "Done"),
      v: {
        owner: t.assignee,
        status: t.status === "Done" ? "Complete" : t.status === "In progress" ? "In progress" : "Not started",
        priority: t.priority ?? "Medium",
        due: t.due,
        project: projects.find((p) => p.id === t.projectId)?.name.split(" — ")[0],
      },
      updates: [],
    })),
  };
  const riskBoard: Board = {
    id: "risks",
    name: "Risks & issues",
    about: "What could derail a project, and what we’re doing about it",
    cols: [
      { id: "owner", title: "Owner", kind: "person", width: 84 },
      { id: "impact", title: "Impact", kind: "status", width: 108, options: LEVEL },
      { id: "likelihood", title: "Likelihood", kind: "status", width: 108, options: LEVEL },
      { id: "status", title: "Status", kind: "status", width: 120, options: RISK_STATUS },
      { id: "project", title: "Project", kind: "tag", width: 200 },
      { id: "mitigation", title: "Mitigation", kind: "text", width: 280 },
    ],
    groups: [
      { id: "Open", title: "Open", color: "#C93C4B" },
      { id: "Mitigating", title: "Mitigating", color: "#E39B2E" },
      { id: "Closed", title: "Closed", color: "#2E9B5F" },
    ],
    items: risks.map((r) => ({
      id: r.id,
      name: r.title,
      group: r.status,
      v: {
        owner: r.owner,
        impact: r.impact,
        likelihood: r.likelihood,
        status: r.status,
        project: projects.find((p) => p.id === r.projectId)?.name.split(" — ")[0],
        mitigation: r.mitigation,
      },
      updates: [],
    })),
  };
  return [portfolio, taskBoard, riskBoard];
}

const optOf = (col: Col | undefined, label: unknown) => col?.options?.find((o) => o.label === label);

/* ───────────────────────── workspace ───────────────────────── */

type View = "table" | "kanban" | "timeline" | "workload";

export function PmoWorkspace({ tab: initial }: { tab: PmoTab }) {
  const initialBoard = initial === "tasks" ? "tasks" : initial === "risks" ? "risks" : "portfolio";
  const initialView: View = initial === "timeline" ? "timeline" : initial === "capacity" ? "workload" : "table";
  const [, setTab] = useTab<PmoTab>(initial);
  const [boards, setBoards] = useState<Board[]>(seedBoards);
  const [boardId, setBoardId] = useState(initialBoard);
  const [view, setView] = useState<View>(initialView);
  const [q, setQ] = useState("");
  const [person, setPerson] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<string>("group");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [adding, setAdding] = useState(initial === "new");
  const [planId, setPlanId] = useState<string | null>(initial === "plan" ? seedPlans[0].id : null);
  const [planData, setPlanData] = useState<{ plans: Plan[]; folders: PlanFolder[] }>({ plans: seedPlans, folders: planFolders });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const saved = loadPlans();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setPlanData(saved);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) savePlans(planData);
  }, [planData, loaded]);
  const plan = planData.plans.find((p) => p.id === planId);
  const planCrumbs = plan ? [solutionById(plan.solution)?.name ?? plan.solution, ...folderPath(planData.folders, plan.folder).map((f) => f.name)] : [];
  const board = boards.find((b) => b.id === boardId)!;

  const update = (fn: (b: Board) => Board) => setBoards((all) => all.map((b) => (b.id === boardId ? fn(b) : b)));
  const setValue = (itemId: string, col: string, value: string | number) =>
    update((b) => ({ ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, v: { ...i.v, [col]: value } } : i)) }));
  const rename = (itemId: string, name: string) => update((b) => ({ ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, name } : i)) }));
  const addItem = (group: string, name: string) =>
    update((b) => ({
      ...b,
      items: [
        ...b.items,
        {
          id: `it${Date.now()}`,
          name,
          group,
          v: Object.fromEntries(
            b.cols.map((c) => [
              c.id,
              c.kind === "status"
                ? (c.options?.[c.options.length - 1]?.label ?? "")
                : c.kind === "person"
                  ? "Managing Partner"
                  : c.kind === "progress"
                    ? 0
                    : c.kind === "timeline"
                      ? `${PMO_TODAY}|2027-01-31`
                      : c.kind === "date"
                        ? "2026-12-15"
                        : "",
            ]),
          ),
          updates: [],
        },
      ],
    }));
  const addUpdate = (itemId: string, text: string) =>
    update((b) => ({ ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, updates: [{ by: "Managing Partner", at: new Date().toISOString(), text }, ...i.updates] } : i)) }));

  const people = useMemo(() => [...new Set(boards.flatMap((b) => b.items.map((i) => String(i.v.owner ?? ""))).filter(Boolean))].sort(), [boards]);
  const items = board.items.filter((i) => (!q || i.name.toLowerCase().includes(q.toLowerCase())) && (!person || i.v.owner === person));
  const statusCol = board.cols.find((c) => c.kind === "status");
  const groupCol = board.cols.find((c) => c.id === groupBy);
  const groups: Group[] =
    groupBy === "group"
      ? board.groups
      : groupCol?.kind === "status"
        ? groupCol.options!.map((o) => ({ id: o.label, title: o.label, color: o.color }))
        : people.map((p, i) => ({ id: p, title: p, color: GROUP_COLORS[i % GROUP_COLORS.length] }));
  const inGroup = (g: Group) => items.filter((i) => (groupBy === "group" ? i.group === g.id : i.v[groupBy] === g.id));
  const item = board.items.find((i) => i.id === openItem);
  const hasTimeline = board.cols.some((c) => c.kind === "timeline");

  return (
    <div className="-mx-8 -mt-4 flex min-h-[calc(100vh-64px)]">
      {/* workspace rail */}
      <aside className="w-[260px] shrink-0 border-r border-stone-200 px-3 py-5">
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[12px] font-bold text-white" style={{ background: C }}>
            P
          </span>
          <div>
            <div className="text-[13px] font-semibold text-ink-900">PMO workspace</div>
            <div className="text-[11px] text-stone-500"><TenantName /></div>
          </div>
        </div>
        <div className="mb-1 mt-6 px-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Boards</div>
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              setPlanId(null);
              setBoardId(b.id);
              setGroupBy("group");
              setTab(b.id === "portfolio" ? "portfolio" : (b.id as PmoTab));
              if (view === "timeline" && !b.cols.some((c) => c.kind === "timeline")) setView("table");
            }}
            className={cx(
              "flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left text-[13px]",
              b.id === boardId && !plan ? "bg-champagne font-semibold text-ink-900" : "text-stone-600 hover:bg-white",
            )}
          >
            <LayoutList size={14} className="shrink-0" style={{ color: b.id === boardId && !plan ? C : undefined }} />
            <span className="flex-1 truncate">{b.name}</span>
            <span className="text-[11px] text-stone-400">{b.items.length}</span>
          </button>
        ))}
        <div className="mb-1 mt-6 px-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Project plans</div>
        <PlanTree
          data={planData}
          selected={planId}
          color={C}
          onChange={(d) => {
            setPlanData(d);
            if (planId && !d.plans.some((p) => p.id === planId)) setPlanId(null);
          }}
          onSelect={(id) => {
            setPlanId(id);
            setTab("plan");
          }}
        />
      </aside>

      {plan ? (
        <div className="min-w-0 flex-1 px-7 py-5">
          <PlanSheet
            key={plan.id}
            plan={plan}
            crumbs={planCrumbs}
            onChange={(rows) => setPlanData((d) => ({ ...d, plans: d.plans.map((p) => (p.id === plan.id ? { ...p, rows } : p)) }))}
          />
        </div>
      ) : (
        <div className="min-w-0 flex-1 px-7 py-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.015em] text-ink-900">{board.name}</h1>
              <p className="text-[12.5px] text-stone-500">{board.about}</p>
            </div>
            <div className="flex items-center -space-x-1.5">
              {people.slice(0, 6).map((p) => (
                <span key={p} className="rounded-[9px] ring-2 ring-stone-50">
                  <Initials name={p} size={28} />
                </span>
              ))}
            </div>
          </div>

          {/* views */}
          <div className="mt-4 flex gap-5 border-b border-stone-200">
            {(
              [
                ["table", "Table", LayoutList],
                ["kanban", "Kanban", KanbanSquare],
                ...(hasTimeline ? ([["timeline", "Timeline", CalendarRange]] as const) : []),
                ["workload", "Workload", Users],
              ] as const
            ).map(([v, l, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cx(
                  "-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-semibold",
                  view === v ? "text-ink-900" : "border-transparent text-stone-500 hover:text-ink-900",
                )}
                style={view === v ? { borderColor: C } : undefined}
              >
                <Icon size={14} /> {l}
              </button>
            ))}
          </div>

          {/* toolbar */}
          {view !== "workload" && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => setAdding(true)} className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-semibold text-white" style={{ background: C }}>
                <Plus size={14} /> New {board.id === "portfolio" ? "project" : board.id === "tasks" ? "task" : "risk"}
              </button>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  className="h-8 w-[170px] rounded-[8px] border border-transparent bg-transparent pl-7 pr-2 text-[12.5px] hover:border-stone-200 focus:border-ink-900 focus:bg-white focus:outline-none"
                />
              </div>
              <Menu
                icon={<Users size={13} />}
                label={person ? person.split(" ")[0] : "Person"}
                active={!!person}
                items={[{ label: "Everyone", on: !person, pick: () => setPerson(null) }, ...people.map((p) => ({ label: p, on: person === p, pick: () => setPerson(p) }))]}
              />
              <Menu
                icon={<Filter size={13} />}
                label={`Group by: ${groupBy === "group" ? "Group" : board.cols.find((c) => c.id === groupBy)?.title}`}
                active={groupBy !== "group"}
                items={[
                  { label: "Group", on: groupBy === "group", pick: () => setGroupBy("group") },
                  ...board.cols.filter((c) => c.kind === "status" || c.kind === "person").map((c) => ({ label: c.title, on: groupBy === c.id, pick: () => setGroupBy(c.id) })),
                ]}
              />
              {(q || person) && (
                <button
                  onClick={() => {
                    setQ("");
                    setPerson(null);
                  }}
                  className="text-[12px] font-semibold text-stone-500 hover:text-ink-900"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="mt-4">
            {view === "table" && (
              <div className="space-y-7">
                {groups.map((g) => (
                  <GroupTable
                    key={g.id}
                    board={board}
                    group={g}
                    items={inGroup(g)}
                    canAdd={groupBy === "group"}
                    onValue={setValue}
                    onRename={rename}
                    onAdd={(name) => addItem(g.id, name)}
                    onOpen={setOpenItem}
                  />
                ))}
              </div>
            )}
            {view === "kanban" && statusCol && (
              <Kanban
                col={statusCol}
                items={items}
                onMove={(id, label) => setValue(id, statusCol.id, label)}
                onOpen={setOpenItem}
                groupColor={(i) => board.groups.find((g) => g.id === i.group)?.color ?? C}
              />
            )}
            {view === "timeline" && <Timeline board={board} items={items} onOpen={setOpenItem} />}
            {view === "workload" && <Workload />}
          </div>
        </div>
      )}

      {item && <ItemPanel board={board} item={item} onClose={() => setOpenItem(null)} onValue={setValue} onUpdate={addUpdate} />}
      {adding && (
        <NewItem
          board={board}
          onClose={() => setAdding(false)}
          onSave={(name, group) => {
            addItem(group, name);
            setAdding(false);
            setView("table");
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── table ───────────────────────── */

function Menu({ icon, label, items, active }: { icon: ReactNode; label: string; active?: boolean; items: { label: string; on: boolean; pick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cx("flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[12.5px] font-medium", active ? "bg-champagne text-ink-900" : "text-stone-600 hover:bg-white")}
      >
        {icon} {label}
      </button>
      {open && (
        <div
          className="absolute left-0 top-9 z-30 max-h-[300px] w-[220px] overflow-y-auto rounded-[12px] border border-stone-200 bg-white p-1.5 shadow-lift"
          onMouseLeave={() => setOpen(false)}
        >
          {items.map((i) => (
            <button
              key={i.label}
              onClick={() => {
                i.pick();
                setOpen(false);
              }}
              className={cx(
                "block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[12.5px]",
                i.on ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-600 hover:bg-stone-50",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusCell({ col, value, onPick }: { col: Col; value: unknown; onPick: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const o = optOf(col, value);
  return (
    <div className="relative h-full">
      <button
        onClick={() => setOpen((x) => !x)}
        className="flex h-full w-full items-center justify-center px-1 text-[12px] font-semibold transition-[filter] hover:brightness-95"
        style={{ background: o?.color ?? "#E3DCCD", color: o ? (o.ink ?? "#FFFFFF") : "#6F6A61" }}
      >
        {o?.label ?? ""}
      </button>
      {open && (
        <div
          className="absolute left-1/2 top-[calc(100%+4px)] z-30 w-[170px] -translate-x-1/2 space-y-1 rounded-[12px] border border-stone-200 bg-white p-2 shadow-lift"
          onMouseLeave={() => setOpen(false)}
        >
          {col.options!.map((x) => (
            <button
              key={x.label}
              onClick={() => {
                onPick(x.label);
                setOpen(false);
              }}
              className="flex h-8 w-full items-center justify-center rounded-[6px] text-[12px] font-semibold hover:brightness-95"
              style={{ background: x.color, color: x.ink ?? "#FFFFFF" }}
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Cell({ col, item, groupColor, onValue }: { col: Col; item: Item; groupColor: string; onValue: (v: string | number) => void }) {
  const v = item.v[col.id];
  switch (col.kind) {
    case "person":
      return (
        <div className="flex h-full items-center justify-center">
          {v ? <Initials name={String(v)} size={26} /> : <span className="h-6 w-6 rounded-full border border-dashed border-stone-300" />}
        </div>
      );
    case "status":
      return <StatusCell col={col} value={v} onPick={onValue} />;
    case "date": {
      const late = v && String(v) < PMO_TODAY && item.v.status !== "Complete";
      return (
        <div className={cx("flex h-full items-center justify-center text-[12px]", late ? "font-semibold text-[#C93C4B]" : "text-stone-700")}>{v ? fmtShort(String(v)) : ""}</div>
      );
    }
    case "timeline": {
      const [s, e] = String(v ?? "|").split("|");
      if (!s) return null;
      const total = Date.parse(e) - Date.parse(s);
      const done = Math.min(1, Math.max(0, (Date.parse(PMO_TODAY) - Date.parse(s)) / (total || 1)));
      return (
        <div className="flex h-full items-center px-2">
          <div className="relative h-6 w-full overflow-hidden rounded-full bg-stone-300">
            <div className="absolute inset-y-0 left-0" style={{ width: `${done * 100}%`, background: groupColor }} />
            <span className="relative flex h-full items-center justify-center text-[11px] font-semibold text-white">
              {fmtShort(s)} – {fmtShort(e)}
            </span>
          </div>
        </div>
      );
    }
    case "progress": {
      const n = Number(v ?? 0);
      return (
        <div className="flex h-full items-center gap-2 px-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
            <div className="h-2 rounded-full" style={{ width: `${n}%`, background: n >= 100 ? "#2E9B5F" : C }} />
          </div>
          <span className="num w-8 text-right text-[11px] text-stone-600">{n}%</span>
        </div>
      );
    }
    case "tag":
      return (
        <div className="flex h-full items-center px-3">
          {v ? <span className="truncate rounded-[6px] bg-stone-100 px-2 py-0.5 text-[12px] text-stone-700">{String(v)}</span> : null}
        </div>
      );
    default:
      return <div className="flex h-full items-center truncate px-3 text-[12.5px] text-stone-700">{String(v ?? "")}</div>;
  }
}

function Summary({ col, items }: { col: Col; items: Item[] }) {
  if (!items.length) return null;
  if (col.kind === "status") {
    const counts = col.options!.map((o) => ({ o, n: items.filter((i) => i.v[col.id] === o.label).length })).filter((x) => x.n);
    return (
      <div className="flex h-full items-center px-1.5">
        <div className="flex h-5 w-full overflow-hidden rounded-[3px]" title={counts.map((c) => `${c.o.label}: ${c.n}`).join(" · ")}>
          {counts.map(({ o, n }) => (
            <span key={o.label} style={{ width: `${(n / items.length) * 100}%`, background: o.color }} />
          ))}
        </div>
      </div>
    );
  }
  if (col.kind === "progress") {
    const avg = Math.round(items.reduce((s, i) => s + Number(i.v[col.id] ?? 0), 0) / items.length);
    return <div className="num flex h-full items-center justify-center text-[11.5px] font-semibold text-stone-600">{avg}% avg</div>;
  }
  if (col.kind === "timeline" || col.kind === "date") {
    const dates = items
      .flatMap((i) => String(i.v[col.id] ?? "").split("|"))
      .filter(Boolean)
      .sort();
    if (!dates.length) return null;
    return (
      <div className="flex h-full items-center justify-center text-[11.5px] text-stone-600">
        {fmtShort(dates[0])} – {fmtShort(dates[dates.length - 1])}
      </div>
    );
  }
  return null;
}

function GroupTable({
  board,
  group,
  items,
  canAdd,
  onValue,
  onRename,
  onAdd,
  onOpen,
}: {
  board: Board;
  group: Group;
  items: Item[];
  canAdd: boolean;
  onValue: (id: string, col: string, v: string | number) => void;
  onRename: (id: string, name: string) => void;
  onAdd: (name: string) => void;
  onOpen: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const grid = `6px 36px minmax(280px,1fr) ${board.cols.map((c) => `${c.width}px`).join(" ")}`;
  const row = "grid border-b border-stone-200 bg-white";
  return (
    <section>
      <button onClick={() => setCollapsed((c) => !c)} className="mb-2 flex items-center gap-1.5 text-[15px] font-semibold" style={{ color: group.color }}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        {group.title}
        <span className="ml-1 text-[12px] font-normal text-stone-400">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </button>
      {!collapsed && (
        <div className="overflow-x-auto rounded-[10px] border border-stone-200 shadow-card">
          <div className="min-w-max">
            <div className={cx(row, "h-9 text-[12px] text-stone-500")} style={{ gridTemplateColumns: grid }}>
              <span style={{ background: group.color }} className="rounded-tl-[10px]" />
              <span className="flex items-center justify-center border-r border-stone-200">
                <span className="h-3.5 w-3.5 rounded-[4px] border border-stone-300" />
              </span>
              <span className="flex items-center border-r border-stone-200 px-3 font-medium">Item</span>
              {board.cols.map((c) => (
                <span key={c.id} className="flex items-center justify-center border-r border-stone-200 px-2 font-medium last:border-r-0">
                  {c.title}
                </span>
              ))}
            </div>
            {items.map((i) => (
              <div key={i.id} className={cx(row, "group h-10 hover:bg-stone-50")} style={{ gridTemplateColumns: grid }}>
                <span style={{ background: group.color }} />
                <span className="flex items-center justify-center border-r border-stone-200">
                  <span className="h-3.5 w-3.5 rounded-[4px] border border-stone-300" />
                </span>
                <div className="flex min-w-0 items-center gap-2 border-r border-stone-200 px-3">
                  {editing === i.id ? (
                    <input
                      autoFocus
                      defaultValue={i.name}
                      onBlur={(e) => {
                        if (e.target.value.trim()) onRename(i.id, e.target.value.trim());
                        setEditing(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      className="h-7 w-full rounded-[6px] border border-ink-900 px-2 text-[13px] focus:outline-none"
                    />
                  ) : (
                    <button
                      onDoubleClick={() => setEditing(i.id)}
                      onClick={() => onOpen(i.id)}
                      className="min-w-0 flex-1 truncate text-left text-[13px] text-ink-900"
                      title="Click to open · double-click to rename"
                    >
                      {i.name}
                    </button>
                  )}
                  <button
                    onClick={() => onOpen(i.id)}
                    className="hidden shrink-0 items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[11px] text-stone-500 hover:bg-stone-200 group-hover:flex"
                    aria-label={`Open ${i.name}`}
                  >
                    <Maximize2 size={11} /> Open
                  </button>
                  {i.updates.length > 0 && (
                    <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-stone-400" title="Updates">
                      <SendHorizontal size={11} /> {i.updates.length}
                    </span>
                  )}
                </div>
                {board.cols.map((c) => (
                  <div key={c.id} className="h-full border-r border-stone-200 last:border-r-0">
                    <Cell col={c} item={i} groupColor={group.color} onValue={(v) => onValue(i.id, c.id, v)} />
                  </div>
                ))}
              </div>
            ))}
            {canAdd && (
              <div className={cx(row, "h-10")} style={{ gridTemplateColumns: grid }}>
                <span style={{ background: `color-mix(in srgb, ${group.color} 40%, transparent)` }} />
                <span className="border-r border-stone-200" />
                <form
                  className="flex items-center px-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (draft.trim()) onAdd(draft.trim());
                    setDraft("");
                  }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="+ New row"
                    className="h-7 w-full rounded-[6px] border border-transparent px-2 text-[13px] placeholder:text-stone-400 hover:border-stone-200 focus:border-ink-900 focus:outline-none"
                  />
                </form>
              </div>
            )}
            <div className="grid h-9 bg-stone-50" style={{ gridTemplateColumns: grid }}>
              <span />
              <span />
              <span />
              {board.cols.map((c) => (
                <div key={c.id} className="h-full">
                  <Summary col={c} items={items} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ───────────────────────── other views ───────────────────────── */

function Kanban({
  col,
  items,
  onMove,
  onOpen,
  groupColor,
}: {
  col: Col;
  items: Item[];
  onMove: (id: string, label: string) => void;
  onOpen: (id: string) => void;
  groupColor: (i: Item) => string;
}) {
  const [drag, setDrag] = useState<string | null>(null);
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${col.options!.length}, minmax(220px, 1fr))` }}>
      {col.options!.map((o) => {
        const list = items.filter((i) => i.v[col.id] === o.label);
        return (
          <div
            key={o.label}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drag && onMove(drag, o.label)}
            className="flex min-h-[400px] flex-col overflow-hidden rounded-[12px] bg-white shadow-card"
          >
            <div className="flex h-10 items-center justify-between px-3 text-[13px] font-semibold" style={{ background: o.color, color: o.ink ?? "#FFFFFF" }}>
              {o.label}
              <span className="text-[12px] opacity-80">{list.length}</span>
            </div>
            <div className="flex-1 space-y-2 bg-stone-50 p-2">
              {list.map((i) => (
                <button
                  key={i.id}
                  draggable
                  onDragStart={() => setDrag(i.id)}
                  onDragEnd={() => setDrag(null)}
                  onClick={() => onOpen(i.id)}
                  className="block w-full rounded-[10px] border border-stone-200 bg-white p-3 text-left shadow-card hover:shadow-lift"
                >
                  <span className="mb-2 block h-1 w-8 rounded-full" style={{ background: groupColor(i) }} />
                  <span className="block text-[13px] font-medium leading-snug text-ink-900">{i.name}</span>
                  <span className="mt-2 flex items-center justify-between text-[11.5px] text-stone-500">
                    {i.v.owner ? <Initials name={String(i.v.owner)} size={22} /> : <span />}
                    {i.v.due ? fmtShort(String(i.v.due)) : i.v.timeline ? `due ${fmtShort(String(i.v.timeline).split("|")[1])}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Timeline({ board, items, onOpen }: { board: Board; items: Item[]; onOpen: (id: string) => void }) {
  const start = Date.parse("2026-08-01T00:00:00Z");
  const end = Date.parse("2027-04-01T00:00:00Z");
  const pos = (iso: string) => ((Date.parse(`${iso}T12:00:00Z`) - start) / (end - start)) * 100;
  const months = Array.from({ length: 8 }, (_, i) => new Date(Date.UTC(2026, 7 + i, 1)));
  return (
    <div className="overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-card">
      <div className="grid grid-cols-[280px_1fr] border-b border-stone-200">
        <div className="px-4 py-2.5 text-[12px] font-medium text-stone-500">Item</div>
        <div className="grid grid-cols-8">
          {months.map((m) => (
            <div key={m.toISOString()} className="border-l border-stone-100 px-2 py-2.5 text-[12px] font-medium text-stone-500">
              {m.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })}
            </div>
          ))}
        </div>
      </div>
      {board.groups.map((g) => {
        const list = items.filter((i) => i.group === g.id);
        if (!list.length) return null;
        return (
          <div key={g.id}>
            <div className="border-b border-stone-100 bg-stone-50 px-4 py-1.5 text-[12.5px] font-semibold" style={{ color: g.color }}>
              {g.title}
            </div>
            {list.map((i) => {
              const [s, e] = String(i.v.timeline ?? "|").split("|");
              return (
                <div key={i.id} className="grid grid-cols-[280px_1fr] border-b border-stone-100">
                  <button onClick={() => onOpen(i.id)} className="truncate px-4 py-2.5 text-left text-[12.5px] text-ink-900 hover:underline">
                    {i.name}
                  </button>
                  <div className="relative h-10">
                    <div className="absolute inset-0 grid grid-cols-8">
                      {months.map((m) => (
                        <div key={m.toISOString()} className="border-l border-stone-100" />
                      ))}
                    </div>
                    {s && (
                      <button
                        onClick={() => onOpen(i.id)}
                        className="absolute top-1/2 flex h-6 -translate-y-1/2 items-center overflow-hidden rounded-full px-2.5 text-[11px] font-semibold text-white"
                        style={{ left: `${pos(s)}%`, width: `${Math.max(2, pos(e) - pos(s))}%`, background: g.color }}
                      >
                        <span className="truncate">{i.name.split(" — ")[0]}</span>
                      </button>
                    )}
                    <span className="absolute inset-y-0 w-px bg-[#C93C4B]" style={{ left: `${pos(PMO_TODAY)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Workload() {
  const shade = (v: number) => (v > 100 ? "#C93C4B" : v >= 85 ? "#E39B2E" : v >= 60 ? "#2E9B5F" : "#9BCDB0");
  return (
    <div className="overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-card">
      <div className="grid border-b border-stone-200 text-[12px] font-medium text-stone-500" style={{ gridTemplateColumns: `240px repeat(${WEEKS.length}, 1fr)` }}>
        <div className="px-4 py-2.5">Person</div>
        {WEEKS.map((w) => (
          <div key={w} className="border-l border-stone-100 px-2 py-2.5 text-center">
            Week of {fmtShort(w)}
          </div>
        ))}
      </div>
      {capacity.map((c) => (
        <div key={c.person} className="grid border-b border-stone-100" style={{ gridTemplateColumns: `240px repeat(${WEEKS.length}, 1fr)` }}>
          <div className="flex items-center gap-2.5 px-4 py-2">
            <Initials name={c.person} size={26} />
            <div>
              <div className="text-[12.5px] font-medium text-ink-900">{c.person}</div>
              <div className="text-[11px] text-stone-500">{c.role}</div>
            </div>
          </div>
          {c.load.map((v, i) => (
            <div key={i} className="flex items-center justify-center border-l border-stone-100 p-1.5">
              <span className="num flex h-8 w-full items-center justify-center rounded-[6px] text-[12px] font-semibold text-white" style={{ background: shade(v) }}>
                {v}%
              </span>
            </div>
          ))}
        </div>
      ))}
      <div className="flex gap-4 px-4 py-2.5 text-[11.5px] text-stone-500">
        {[
          ["#9BCDB0", "Under 60%"],
          ["#2E9B5F", "60–85%"],
          ["#E39B2E", "85–100%"],
          ["#C93C4B", "Over capacity"],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} /> {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── item panel & new item ───────────────────────── */

function ItemPanel({
  board,
  item,
  onClose,
  onValue,
  onUpdate,
}: {
  board: Board;
  item: Item;
  onClose: () => void;
  onValue: (id: string, col: string, v: string | number) => void;
  onUpdate: (id: string, text: string) => void;
}) {
  const [text, setText] = useState("");
  const [tab, setTab] = useState<"updates" | "details">("updates");
  const project = projects.find((p) => p.id === item.id);
  const related = tasks.filter((t) => t.projectId === item.id);
  const group = board.groups.find((g) => g.id === item.group);
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/20" onClick={onClose}>
      <aside className="flex h-full w-[600px] flex-col bg-white shadow-lift" onClick={(e) => e.stopPropagation()} aria-label={item.name}>
        <div className="border-b border-stone-100 px-6 pb-0 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11.5px] font-semibold" style={{ color: group?.color }}>
                {group?.title}
              </div>
              <h2 className="mt-0.5 text-[19px] font-semibold text-ink-900">{item.name}</h2>
            </div>
            <button onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 flex gap-5">
            {(["updates", "details"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cx("-mb-px border-b-2 pb-2.5 text-[13px] font-semibold capitalize", tab === t ? "text-ink-900" : "border-transparent text-stone-500")}
                style={tab === t ? { borderColor: C } : undefined}
              >
                {t}
                {t === "updates" && item.updates.length ? <span className="ml-1 text-stone-400">{item.updates.length}</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "updates" ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) onUpdate(item.id, text.trim());
                  setText("");
                }}
                className="rounded-[12px] border border-stone-300 focus-within:border-ink-900"
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  placeholder="Write an update…"
                  className="block w-full resize-none rounded-[12px] px-3 py-2.5 text-[13.5px] focus:outline-none"
                />
                <div className="flex justify-end px-2 pb-2">
                  <button disabled={!text.trim()} className="h-8 rounded-[8px] px-3 text-[12.5px] font-semibold text-white disabled:opacity-40" style={{ background: C }}>
                    Update
                  </button>
                </div>
              </form>
              <ul className="mt-5 space-y-3">
                {item.updates.map((u, i) => (
                  <li key={i} className="rounded-[12px] border border-stone-200 p-4">
                    <div className="flex items-center gap-2 text-[12px] text-stone-500">
                      <Initials name={u.by} size={24} />
                      <span className="font-semibold text-ink-900">{u.by}</span> · {fmtShort(u.at)}
                    </div>
                    <p className="mt-2 text-[13.5px] text-stone-700">{u.text}</p>
                  </li>
                ))}
                {!item.updates.length && <li className="text-[12.5px] text-stone-400">No updates yet. Share progress, blockers or decisions here.</li>}
              </ul>
            </>
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[10px] border border-stone-200">
                {board.cols.map((c) => (
                  <div key={c.id} className="grid h-10 grid-cols-[140px_1fr] border-b border-stone-100 last:border-b-0">
                    <span className="flex items-center px-3 text-[12px] text-stone-500">{c.title}</span>
                    <Cell col={c} item={item} groupColor={group?.color ?? C} onValue={(v) => onValue(item.id, c.id, v)} />
                  </div>
                ))}
              </div>
              {project && (
                <div>
                  <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Milestones</div>
                  <ul className="space-y-2">
                    {project.milestones.map((m) => (
                      <li key={m.name} className="flex items-center gap-3 text-[13px]">
                        <span className={cx("h-2.5 w-2.5 rotate-45", !m.done && "border-2")} style={m.done ? { background: C } : { borderColor: C }} />
                        <span className={cx("flex-1", m.done ? "text-stone-500 line-through" : "text-ink-900")}>{m.name}</span>
                        <span className="text-[12px] text-stone-500">{fmtShort(m.date)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {related.length > 0 && (
                <div>
                  <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Tasks</div>
                  <ul className="divide-y divide-stone-100 rounded-[10px] border border-stone-200">
                    {related.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-[12.5px]">
                        <span className="flex-1 text-ink-900">{t.title}</span>
                        <Initials name={t.assignee} size={22} />
                        <span className="w-14 text-right text-stone-500">{fmtShort(t.due)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function NewItem({ board, onClose, onSave }: { board: Board; onClose: () => void; onSave: (name: string, group: string) => void }) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState(board.groups[0]?.id ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 p-6" role="dialog" aria-modal aria-label="New item">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave(name.trim(), group);
        }}
        className="w-full max-w-[460px] space-y-4 rounded-[18px] bg-white p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-[17px] font-semibold text-ink-900">New item on {board.name}</h2>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-10 w-full rounded-[10px] border border-stone-300 px-3 text-[14px] focus:border-ink-900 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {board.groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              className={cx(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold",
                group === g.id ? "border-transparent text-white" : "border-stone-200 text-stone-600",
              )}
              style={group === g.id ? { background: g.color } : undefined}
            >
              {g.title}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-[10px] px-4 text-[13px] font-semibold text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-[10px] px-4 text-[13px] font-semibold text-white" style={{ background: C }}>
            <Columns3 size={14} /> Create item
          </button>
        </div>
      </form>
    </div>
  );
}
