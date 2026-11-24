"use client";

import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CalendarRange, ChevronDown, ChevronRight, Copy, Download, FileText, MessageSquare, Paperclip, Plus, Printer, Send, Table2, X } from "lucide-react";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import { PLAN_TODAY, PRIORITIES, STATUSES, daysLeft, holdsUp, isOverdue, isTopic, summary, topicOf, waitingOn, type Plan, type PlanRow, type PlanStatus } from "@/lib/plans";
import { fmtShort } from "./kit";

/* A detailed project plan: topics and tasks in an editable grid with owners, parties, dependencies,
   deliverables and notes; a Gantt view with dependency lines; and deliverable requests per party. */

const C = FIRM.pmo;
const STATUS_COLOR: Record<PlanStatus, string> = { Completed: "#1F8A4C", "In progress": "#2E6DA4", "Not started": "#5B7592", Blocked: "#C0392B", "On hold": "#C9820F" };
const PRIORITY_COLOR = { High: "#C0392B", Medium: "#C9820F", Low: "#1F8A4C" } as const;
const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

type View = "grid" | "gantt" | "requests";

export function PlanSheet({ plan: seed }: { plan: Plan }) {
  const [rows, setRows] = useState<PlanRow[]>(seed.rows);
  const [party, setParty] = useState<string>("all");
  const [view, setView] = useState<View>("grid");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2400);
  };
  const plan = { ...seed, rows };
  const partyOf = (id: string) => seed.parties.find((p) => p.id === id);

  // A topic shows when it, or any of its tasks, belongs to the selected party.
  const visible = rows.filter((r) => {
    if (party === "all") return true;
    if (!isTopic(r)) return r.party === party;
    return r.party === party || rows.some((t) => !isTopic(t) && topicOf(t.id) === r.id && t.party === party);
  });
  const s = summary(visible);
  const update = (id: string, patch: Partial<PlanRow>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addTask = (topic: string) => {
    const n = rows.filter((r) => topicOf(r.id) === topic && !isTopic(r)).length + 1;
    const id = `${topic}.${n}`;
    const t = rows.find((r) => r.id === topic)!;
    const at = rows.map((r) => topicOf(r.id)).lastIndexOf(topic);
    setRows((all) => [
      ...all.slice(0, at + 1),
      {
        id,
        title: "New task",
        party: party === "all" ? t.party : party,
        owner: partyOf(party === "all" ? t.party : party)?.contact,
        dependsOn: [],
        priority: "Medium",
        status: "Not started",
        start: PLAN_TODAY,
        deadline: PLAN_TODAY,
      },
      ...all.slice(at + 1),
    ]);
    setOpenRow(id);
  };
  const addTopic = () => {
    const n = Math.max(0, ...rows.filter(isTopic).map((r) => Number(r.id))) + 1;
    setRows((all) => [...all, { id: String(n), title: "New topic", party: party === "all" ? "aurum" : party, dependsOn: [] }]);
  };
  const exportCsv = () => {
    const head = [
      "ID",
      "Level",
      "Task / Subtask",
      "Owner",
      "Party",
      "Depends on",
      "Priority",
      "Status",
      "Start",
      "Deadline",
      "Days left",
      "Deliverable / Evidence",
      "Holds up",
      "Next step / Notes",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [head.map(esc).join(",")].concat(
      visible.map((r) =>
        [
          r.id,
          isTopic(r) ? "Topic" : "Task",
          r.title,
          r.owner,
          partyOf(r.party)?.name,
          r.dependsOn.join(", "),
          r.priority,
          r.status,
          r.start,
          r.deadline,
          daysLeft(r) ?? "",
          r.deliverable,
          holdsUp(rows, r.id).join(", "),
          r.notes,
        ]
          .map(esc)
          .join(","),
      ),
    );
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${seed.name.replace(/[^\w]+/g, "_")}${party === "all" ? "" : `_${partyOf(party)?.name.replace(/\s+/g, "_")}`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const row = rows.find((r) => r.id === openRow);

  return (
    <div className="min-w-0">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C }}>
            Project plan
          </div>
          <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.015em] text-ink-900">{seed.name}</h1>
          <div className="mt-0.5 text-[12.5px] text-stone-500">
            {seed.vehicle} · Owner {seed.owner} · Report date {longDate(PLAN_TODAY)}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex h-9 items-center gap-1.5 rounded-[10px] border border-stone-300 bg-white px-3 text-[12.5px] font-semibold text-ink-900 hover:border-ink-900"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => window.print()}
            className="flex h-9 items-center gap-1.5 rounded-[10px] border border-stone-300 bg-white px-3 text-[12.5px] font-semibold text-ink-900 hover:border-ink-900"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* party tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[{ id: "all", name: "All parties", color: C }, ...seed.parties].map((p) => {
          const n = p.id === "all" ? rows.filter((r) => !isTopic(r)).length : rows.filter((r) => !isTopic(r) && r.party === p.id).length;
          return (
            <button
              key={p.id}
              onClick={() => setParty(p.id)}
              className={cx(
                "flex h-8 items-center gap-2 rounded-full border px-3 text-[12.5px] font-semibold",
                party === p.id ? "border-transparent bg-champagne text-ink-900" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400",
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.name}
              <span className="num text-[11px] text-stone-400">{n}</span>
            </button>
          );
        })}
      </div>

      {/* status strip */}
      <div className="mt-4 grid grid-cols-[repeat(6,minmax(0,1fr))_minmax(0,1.6fr)] overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-card">
        {(
          [
            ["Tasks", s.tasks, "#0F2340"],
            ["Completed", s.completed, STATUS_COLOR.Completed],
            ["In progress", s.inProgress, STATUS_COLOR["In progress"]],
            ["Not started", s.notStarted, STATUS_COLOR["Not started"]],
            ["Blocked", s.blocked, STATUS_COLOR.Blocked],
            ["Overdue", s.overdue, STATUS_COLOR.Blocked],
          ] as const
        ).map(([l, v, c]) => (
          <div key={l} className="border-r border-stone-100 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">{l}</div>
            <div className="num mt-0.5 text-[22px] font-semibold" style={{ color: v && l !== "Tasks" ? c : "#0F2340" }}>
              {v}
            </div>
          </div>
        ))}
        <div className="px-5 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">% complete</span>
            <span className="num text-[22px] font-semibold text-ink-900">{Math.round(s.pct * 100)}%</span>
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-stone-100">
            {(["Completed", "In progress", "On hold", "Blocked"] as const).map((k) => {
              const n = { Completed: s.completed, "In progress": s.inProgress, "On hold": s.onHold, Blocked: s.blocked }[k];
              return <span key={k} style={{ width: `${s.tasks ? (n / s.tasks) * 100 : 0}%`, background: STATUS_COLOR[k] }} />;
            })}
          </div>
        </div>
      </div>

      {/* views */}
      <div className="mt-5 flex items-center gap-5 border-b border-stone-200">
        {(
          [
            ["grid", "Grid", Table2],
            ["gantt", "Gantt", CalendarRange],
            ["requests", "Requests", Send],
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

      <div className="mt-4">
        {view === "grid" && (
          <Grid plan={plan} rows={visible} collapsed={collapsed} setCollapsed={setCollapsed} onUpdate={update} onOpen={setOpenRow} onAddTask={addTask} onAddTopic={addTopic} />
        )}
        {view === "gantt" && <Gantt rows={visible} all={rows} collapsed={collapsed} setCollapsed={setCollapsed} onOpen={setOpenRow} />}
        {view === "requests" && <Requests plan={plan} only={party} flash={flash} />}
      </div>

      {row && <RowPanel plan={plan} row={row} onClose={() => setOpenRow(null)} onUpdate={(p) => update(row.id, p)} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[12px] bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lift">{toast}</div>}
    </div>
  );
}

/* ───────────────────────── grid ───────────────────────── */

function EditCell({
  value,
  kind,
  options,
  onSave,
  children,
  className,
}: {
  value: string;
  kind: "text" | "date" | "select" | "list";
  options?: readonly string[];
  onSave: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLSelectElement>(null);
  if (!editing)
    return (
      <div onClick={() => setEditing(true)} className={cx("h-full w-full cursor-text px-2.5 py-2 hover:bg-[#F6F1FA]", className)}>
        {children}
      </div>
    );
  const done = (v: string) => {
    onSave(v);
    setEditing(false);
  };
  return kind === "select" ? (
    <select
      ref={ref}
      autoFocus
      defaultValue={value}
      onChange={(e) => done(e.target.value)}
      onBlur={() => setEditing(false)}
      className="h-full w-full border-2 bg-white px-1.5 text-[12.5px] focus:outline-none"
      style={{ borderColor: C }}
    >
      {options!.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  ) : (
    <input
      ref={ref}
      autoFocus
      type={kind === "date" ? "date" : "text"}
      defaultValue={value}
      onBlur={(e) => done(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
      }}
      placeholder={kind === "list" ? "e.g. 1.3, 1.4" : undefined}
      className="h-full w-full border-2 bg-white px-2 text-[12.5px] focus:outline-none"
      style={{ borderColor: C }}
    />
  );
}

const COLS = "40px 48px minmax(340px,1fr) 120px 128px 92px 84px 122px 92px 98px 76px 220px 84px 240px 44px";
const STICKY = ["left-0", "left-[40px]", "left-[88px] shadow-[4px_0_6px_-4px_rgba(15,35,64,0.25)]"];
const STICKY_TASK = "sticky left-[88px] z-[5] shadow-[4px_0_6px_-4px_rgba(15,35,64,0.18)]";
const HEAD = [
  "",
  "ID",
  "Task / Subtask",
  "Owner",
  "Party",
  "Depends on",
  "Priority",
  "Status",
  "Start",
  "Deadline",
  "Days left",
  "Deliverable / Evidence",
  "Holds up",
  "Next step / Notes",
  "",
];

function Grid({
  plan,
  rows,
  collapsed,
  setCollapsed,
  onUpdate,
  onOpen,
  onAddTask,
  onAddTopic,
}: {
  plan: Plan;
  rows: PlanRow[];
  collapsed: Record<string, boolean>;
  setCollapsed: (f: (c: Record<string, boolean>) => Record<string, boolean>) => void;
  onUpdate: (id: string, p: Partial<PlanRow>) => void;
  onOpen: (id: string) => void;
  onAddTask: (topic: string) => void;
  onAddTopic: () => void;
}) {
  const all = plan.rows;
  const partyOf = (id: string) => plan.parties.find((p) => p.id === id);
  let n = 0;
  return (
    <div className="overflow-x-auto rounded-[12px] border border-stone-200 bg-white shadow-card">
      <div className="min-w-max text-[12.5px]">
        <div
          className="sticky top-0 z-10 grid border-b-2 border-ink-900 bg-ink-900 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
          style={{ gridTemplateColumns: COLS }}
        >
          {HEAD.map((h, i) => (
            <div key={i} className={cx("truncate border-r border-white/10 bg-ink-900 px-2.5 py-2.5 last:border-0", i < 3 && "sticky z-10", STICKY[i])}>
              {h}
            </div>
          ))}
        </div>
        {rows.map((r) => {
          if (isTopic(r)) {
            const tasks = all.filter((t) => !isTopic(t) && topicOf(t.id) === r.id);
            const done = tasks.filter((t) => t.status === "Completed").length;
            const pct = tasks.length ? done / tasks.length : 0;
            const isC = collapsed[r.id];
            n++;
            return (
              <Fragment key={r.id}>
                <div className="grid border-b border-stone-200 text-white" style={{ gridTemplateColumns: COLS, background: "#2B4366" }}>
                  <div className="num sticky left-0 z-[5] flex items-center justify-center bg-[#2B4366] text-[11px] text-white/60">{n}</div>
                  <div className="num sticky left-[40px] z-[5] flex items-center bg-[#2B4366] px-2.5 font-bold">{r.id}</div>
                  <div className={cx("flex min-w-0 items-center gap-2 bg-[#2B4366] px-2", STICKY_TASK)}>
                    <button onClick={() => setCollapsed((c) => ({ ...c, [r.id]: !c[r.id] }))} className="rounded p-0.5 hover:bg-white/10" aria-label={isC ? "Expand" : "Collapse"}>
                      {isC ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <EditCell
                      value={r.title}
                      kind="text"
                      onSave={(v) => v.trim() && onUpdate(r.id, { title: v.trim() })}
                      className="min-w-0 !px-1 font-bold uppercase tracking-[0.04em] hover:!bg-white/10"
                    >
                      {r.title}
                    </EditCell>
                  </div>
                  <div className="col-span-4 flex items-center px-2.5">
                    <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] font-semibold">{partyOf(r.party)?.name}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 px-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                      <div className="h-1.5 rounded-full bg-white" style={{ width: `${pct * 100}%` }} />
                    </div>
                    <span className="num text-[11.5px] font-semibold">{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="col-span-5 flex items-center px-2.5 text-[11.5px] text-white/70">
                    {done} of {tasks.length} complete
                  </div>
                </div>
                {!isC &&
                  rows
                    .filter((t) => !isTopic(t) && topicOf(t.id) === r.id)
                    .map((t) => {
                      n++;
                      const wait = t.status !== "Completed" ? waitingOn(all, t) : [];
                      const dl = daysLeft(t);
                      const over = isOverdue(t);
                      const holds = holdsUp(all, t.id);
                      return (
                        <div key={t.id} className="group grid border-b border-stone-100 hover:bg-[#FAF9F7]" style={{ gridTemplateColumns: COLS }}>
                          <div className="num sticky left-0 z-[5] flex items-center justify-center border-r border-stone-100 bg-white text-[11px] text-stone-400 group-hover:bg-[#FAF9F7]">
                            {n}
                          </div>
                          <div className="num sticky left-[40px] z-[5] flex items-center border-r border-stone-100 bg-white px-2.5 text-stone-600 group-hover:bg-[#FAF9F7]">
                            {t.id}
                          </div>
                          <div className={cx("flex min-w-0 items-center border-r border-stone-100 bg-white group-hover:bg-[#FAF9F7]", STICKY_TASK)}>
                            <EditCell value={t.title} kind="text" onSave={(v) => v.trim() && onUpdate(t.id, { title: v.trim() })} className="min-w-0 pl-6">
                              <span className="block whitespace-normal leading-snug text-ink-900">{t.title}</span>
                              {wait.length > 0 && (
                                <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#C9820F]">
                                  <AlertTriangle size={11} /> Waiting on {wait.join(", ")}
                                </span>
                              )}
                            </EditCell>
                          </div>
                          <Cell>
                            <EditCell value={t.owner ?? ""} kind="text" onSave={(v) => onUpdate(t.id, { owner: v })}>
                              {t.owner}
                            </EditCell>
                          </Cell>
                          <Cell>
                            <EditCell
                              value={partyOf(t.party)?.name ?? ""}
                              kind="select"
                              options={plan.parties.map((p) => p.name)}
                              onSave={(v) => onUpdate(t.id, { party: plan.parties.find((p) => p.name === v)!.id })}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: partyOf(t.party)?.color }} />
                                {partyOf(t.party)?.name}
                              </span>
                            </EditCell>
                          </Cell>
                          <Cell>
                            <EditCell
                              value={t.dependsOn.join(", ")}
                              kind="list"
                              onSave={(v) => onUpdate(t.id, { dependsOn: v.split(/[\s,;]+/).filter((x) => x && x !== t.id && all.some((a) => a.id === x)) })}
                            >
                              <span className="num text-stone-600">{t.dependsOn.join(", ") || "—"}</span>
                            </EditCell>
                          </Cell>
                          <Cell>
                            <EditCell value={t.priority ?? "Medium"} kind="select" options={PRIORITIES} onSave={(v) => onUpdate(t.id, { priority: v as PlanRow["priority"] })}>
                              <span className="font-semibold" style={{ color: t.priority ? PRIORITY_COLOR[t.priority] : undefined }}>
                                {t.priority}
                              </span>
                            </EditCell>
                          </Cell>
                          <Cell>
                            <EditCell value={t.status ?? "Not started"} kind="select" options={STATUSES} onSave={(v) => onUpdate(t.id, { status: v as PlanStatus })}>
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-white"
                                style={{ background: STATUS_COLOR[t.status ?? "Not started"] }}
                              >
                                {t.status}
                              </span>
                            </EditCell>
                          </Cell>
                          <Cell>
                            <EditCell value={t.start ?? ""} kind="date" onSave={(v) => onUpdate(t.id, { start: v || undefined })}>
                              <span className="text-stone-700">{t.start ? fmtShort(t.start) : "—"}</span>
                            </EditCell>
                          </Cell>
                          <Cell>
                            <EditCell value={t.deadline ?? ""} kind="date" onSave={(v) => onUpdate(t.id, { deadline: v || undefined })}>
                              <span className={cx(over ? "font-semibold text-[#C0392B]" : "text-stone-700")}>{t.deadline ? fmtShort(t.deadline) : "—"}</span>
                            </EditCell>
                          </Cell>
                          <Cell>
                            <div
                              className={cx(
                                "num px-2.5 py-2 text-right",
                                dl === null ? "text-stone-300" : dl < 0 ? "font-semibold text-[#C0392B]" : dl <= 3 ? "font-semibold text-[#C9820F]" : "text-stone-700",
                              )}
                            >
                              {dl === null ? "—" : dl}
                            </div>
                          </Cell>
                          <Cell>
                            <EditCell value={t.deliverable ?? ""} kind="text" onSave={(v) => onUpdate(t.id, { deliverable: v || undefined })}>
                              <span className="block whitespace-normal leading-snug text-stone-700">{t.deliverable || <span className="text-stone-300">—</span>}</span>
                            </EditCell>
                          </Cell>
                          <Cell>
                            <div className="num px-2.5 py-2 text-stone-600" title="Calculated from other tasks’ dependencies">
                              {holds.join(", ") || "—"}
                            </div>
                          </Cell>
                          <Cell>
                            <EditCell value={t.notes ?? ""} kind="text" onSave={(v) => onUpdate(t.id, { notes: v || undefined })}>
                              <span className="block whitespace-normal leading-snug text-stone-700">{t.notes || <span className="text-stone-300">—</span>}</span>
                            </EditCell>
                          </Cell>
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => onOpen(t.id)}
                              className={cx(
                                "flex items-center gap-0.5 rounded-[6px] p-1 text-[10.5px] hover:bg-stone-200",
                                t.comments?.length || t.files?.length ? "text-ink-900" : "text-stone-300 group-hover:text-stone-500",
                              )}
                              aria-label={`Open ${t.id}`}
                            >
                              <MessageSquare size={13} />
                              {t.comments?.length ? t.comments.length : ""}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                {!isC && (
                  <div className="border-b border-stone-200 px-2.5 py-1.5 pl-[110px]">
                    <button onClick={() => onAddTask(r.id)} className="flex items-center gap-1 text-[12px] font-semibold text-stone-500 hover:text-ink-900">
                      <Plus size={13} /> Add task to {r.id}
                    </button>
                  </div>
                )}
              </Fragment>
            );
          }
          return null;
        })}
        <div className="px-4 py-2.5">
          <button onClick={onAddTopic} className="flex items-center gap-1 text-[12.5px] font-semibold hover:underline" style={{ color: C }}>
            <Plus size={14} /> Add topic
          </button>
        </div>
      </div>
    </div>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 items-stretch border-r border-stone-100">{children}</div>;
}

/* ───────────────────────── gantt ───────────────────────── */

function Gantt({
  rows,
  all,
  collapsed,
  setCollapsed,
  onOpen,
}: {
  rows: PlanRow[];
  all: PlanRow[];
  collapsed: Record<string, boolean>;
  setCollapsed: (f: (c: Record<string, boolean>) => Record<string, boolean>) => void;
  onOpen: (id: string) => void;
}) {
  const dated = all.filter((r) => r.start || r.deadline);
  const min = Math.min(...dated.map((r) => Date.parse(`${r.start ?? r.deadline}T00:00:00Z`)), Date.parse(`${PLAN_TODAY}T00:00:00Z`));
  const max = Math.max(...dated.map((r) => Date.parse(`${r.deadline ?? r.start}T00:00:00Z`)), Date.parse(`${PLAN_TODAY}T00:00:00Z`));
  const start = min - ((new Date(min).getUTCDay() + 6) % 7) * 86_400_000 - 7 * 86_400_000; // Monday, a week early
  const weeks = Math.ceil((max - start) / (7 * 86_400_000)) + 2;
  const W = 46; // px per week
  const x = (iso: string, end = false) => ((Date.parse(`${iso}T00:00:00Z`) - start) / (7 * 86_400_000)) * W + (end ? W / 7 : 0);
  const shown = rows.filter((r) => isTopic(r) || !collapsed[topicOf(r.id)]);
  const H = 34;
  const yOf = new Map(shown.map((r, i) => [r.id, i * H + H / 2]));
  const span = (r: PlanRow) => {
    if (!isTopic(r)) return r.start || r.deadline ? [r.start ?? r.deadline!, r.deadline ?? r.start!] : null;
    const kids = all.filter((t) => !isTopic(t) && topicOf(t.id) === r.id && (t.start || t.deadline));
    if (!kids.length) return null;
    return [
      kids.map((k) => k.start ?? k.deadline!).sort()[0],
      kids
        .map((k) => k.deadline ?? k.start!)
        .sort()
        .reverse()[0],
    ];
  };
  const links = shown.flatMap((r) =>
    r.dependsOn
      .filter((d) => yOf.has(d))
      .map((d) => {
        const p = all.find((a) => a.id === d)!;
        const ps = span(p);
        const rs = span(r);
        if (!ps || !rs) return null;
        return { id: `${d}-${r.id}`, x1: x(ps[1], true), y1: yOf.get(d)!, x2: x(rs[0]), y2: yOf.get(r.id)!, late: p.status !== "Completed" };
      })
      .filter(Boolean),
  ) as { id: string; x1: number; y1: number; x2: number; y2: number; late: boolean }[];

  return (
    <div className="flex overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-card">
      <div className="w-[420px] shrink-0 border-r border-stone-200">
        <div className="flex h-10 items-center border-b border-stone-200 bg-ink-900 px-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white">
          <span className="w-12">ID</span>
          <span className="flex-1">Task</span>
          <span className="w-[96px]">Status</span>
        </div>
        {shown.map((r) => (
          <div key={r.id} className={cx("flex items-center border-b border-stone-100 px-3 text-[12.5px]", isTopic(r) && "bg-[#2B4366] text-white")} style={{ height: H }}>
            <span className={cx("num w-12", isTopic(r) ? "font-bold" : "text-stone-500")}>{r.id}</span>
            {isTopic(r) ? (
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [r.id]: !c[r.id] }))}
                className="flex min-w-0 flex-1 items-center gap-1 text-left font-bold uppercase tracking-[0.04em]"
              >
                {collapsed[r.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <span className="truncate">{r.title}</span>
              </button>
            ) : (
              <button onClick={() => onOpen(r.id)} className="min-w-0 flex-1 truncate pl-4 text-left text-ink-900 hover:underline">
                {r.title}
              </button>
            )}
            <span className="w-[96px]">
              {r.status && (
                <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-white" style={{ background: STATUS_COLOR[r.status] }}>
                  {r.status}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div style={{ width: weeks * W }}>
          <div className="flex h-10 border-b border-stone-200 bg-stone-50">
            {Array.from({ length: weeks }, (_, i) => {
              const d = new Date(start + i * 7 * 86_400_000);
              return (
                <div key={i} className="shrink-0 border-r border-stone-200 px-1 pt-1 text-[10px] leading-tight text-stone-500" style={{ width: W }}>
                  {d.getUTCDate() <= 7 && <span className="block font-bold text-ink-900">{d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}</span>}
                  {d.getUTCDate()}
                </div>
              );
            })}
          </div>
          <div className="relative" style={{ height: shown.length * H }}>
            {Array.from({ length: weeks }, (_, i) => (
              <div key={i} className="absolute inset-y-0 border-r border-stone-100" style={{ left: i * W, width: W }} />
            ))}
            {shown.map((r, i) => {
              const sp = span(r);
              return (
                <div key={r.id} className={cx("absolute inset-x-0 border-b border-stone-100", isTopic(r) && "bg-[#2B4366]/5")} style={{ top: i * H, height: H }}>
                  {sp &&
                    (isTopic(r) ? (
                      <div className="absolute top-1/2 h-2 -translate-y-1/2 rounded-sm bg-[#2B4366]" style={{ left: x(sp[0]), width: Math.max(6, x(sp[1], true) - x(sp[0])) }} />
                    ) : (
                      <button
                        onClick={() => onOpen(r.id)}
                        title={`${r.id} · ${r.title} · ${fmtShort(sp[0])} – ${fmtShort(sp[1])}`}
                        className="absolute top-1/2 h-[18px] -translate-y-1/2 rounded-[5px] shadow-sm"
                        style={{
                          left: x(sp[0]),
                          width: Math.max(8, x(sp[1], true) - x(sp[0])),
                          background: STATUS_COLOR[r.status ?? "Not started"],
                          outline: isOverdue(r) ? "2px solid #C0392B" : undefined,
                          outlineOffset: 1,
                        }}
                      />
                    ))}
                </div>
              );
            })}
            <svg className="pointer-events-none absolute inset-0" width={weeks * W} height={shown.length * H}>
              <defs>
                <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <path d="M0,0 L7,3.5 L0,7 Z" fill="#475B7A" />
                </marker>
              </defs>
              {links.map((l) => {
                const mid = Math.max(l.x1 + 8, Math.min(l.x2 - 8, l.x1 + 8));
                return (
                  <path
                    key={l.id}
                    d={`M${l.x1},${l.y1} H${mid} V${l.y2} H${l.x2 - 2}`}
                    fill="none"
                    stroke={l.late ? "#C0392B" : "#475B7A"}
                    strokeWidth={1.3}
                    strokeDasharray={l.late ? "4 3" : undefined}
                    markerEnd="url(#arr)"
                  />
                );
              })}
              <line x1={x(PLAN_TODAY)} x2={x(PLAN_TODAY)} y1={0} y2={shown.length * H} stroke="#C0392B" strokeWidth={1.5} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── requests ───────────────────────── */

function Requests({ plan, only, flash }: { plan: Plan; only: string; flash: (t: string) => void }) {
  const parties = plan.parties.filter((p) => p.id !== "aurum" && (only === "all" || only === p.id));
  return (
    <div className="space-y-5">
      {parties.map((p) => {
        const open = plan.rows.filter((r) => !isTopic(r) && r.party === p.id && r.status !== "Completed").sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));
        const text = [
          `Outstanding deliverables — ${plan.vehicle}`,
          `Requested from: ${p.contact} (${p.name}) · As of ${longDate(PLAN_TODAY)}`,
          "",
          "The items below are outstanding and required to move the private placement forward. Please deliver by the deadlines shown.",
          "",
          ...open.map((r) => `${r.id}  ${r.title}${r.deliverable ? ` — ${r.deliverable}` : ""}${r.deadline ? ` — due ${longDate(r.deadline)}` : ""}`),
        ].join("\n");
        return (
          <div key={p.id} className="overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-card">
            <div className="flex items-start justify-between gap-4 px-6 py-5" style={{ borderTop: `4px solid ${p.color}` }}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Outstanding deliverables</div>
                <div className="mt-0.5 text-[17px] font-semibold text-ink-900">Requested from {p.contact === p.name ? p.name : `${p.contact} · ${p.name}`}</div>
                <p className="mt-1 max-w-[680px] text-[12.5px] text-stone-600">
                  The items below are outstanding and required to move the private placement forward. Please deliver by the deadlines shown.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(text).catch(() => {});
                    flash("Request copied");
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-[10px] border border-stone-300 bg-white px-3 text-[12.5px] font-semibold text-ink-900 hover:border-ink-900"
                >
                  <Copy size={13} /> Copy
                </button>
                <button
                  disabled={!open.length}
                  onClick={() => flash(`Request sent to ${p.name} in Chat Room`)}
                  className="flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[12.5px] font-semibold text-white disabled:opacity-40"
                  style={{ background: FIRM.communication }}
                >
                  <Send size={13} /> Send in Chat Room
                </button>
              </div>
            </div>
            {open.length ? (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-y border-stone-200 bg-stone-50 text-left text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-500">
                    <th className="px-6 py-2">ID</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Deliverable</th>
                    <th className="px-3 py-2">Deadline</th>
                    <th className="px-6 py-2 text-right">Days left</th>
                  </tr>
                </thead>
                <tbody>
                  {open.map((r) => {
                    const dl = daysLeft(r);
                    return (
                      <tr key={r.id} className="border-b border-stone-100 last:border-0">
                        <td className="num px-6 py-2.5 text-stone-500">{r.id}</td>
                        <td className="px-3 py-2.5 text-ink-900">{r.title}</td>
                        <td className="px-3 py-2.5 text-stone-600">{r.deliverable ?? "—"}</td>
                        <td className="px-3 py-2.5 text-stone-700">{r.deadline ? longDate(r.deadline) : "—"}</td>
                        <td className={cx("num px-6 py-2.5 text-right font-semibold", dl !== null && dl < 0 ? "text-[#C0392B]" : "text-stone-700")}>
                          {dl === null ? "—" : dl < 0 ? `${-dl} late` : dl}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="border-t border-stone-100 px-6 py-6 text-[12.5px] text-stone-500">Nothing outstanding from {p.name}.</div>
            )}
          </div>
        );
      })}
      {!parties.length && <p className="text-[12.5px] text-stone-500">Requests are for outside parties — pick one above, or All parties.</p>}
    </div>
  );
}

/* ───────────────────────── row panel ───────────────────────── */

function RowPanel({ plan, row, onClose, onUpdate }: { plan: Plan; row: PlanRow; onClose: () => void; onUpdate: (p: Partial<PlanRow>) => void }) {
  const [text, setText] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const wait = waitingOn(plan.rows, row);
  const holds = holdsUp(plan.rows, row.id);
  const party = plan.parties.find((p) => p.id === row.party);
  const facts = useMemo(
    () =>
      [
        ["Owner", row.owner ?? "—"],
        ["Party", party?.name ?? "—"],
        ["Priority", row.priority ?? "—"],
        ["Status", row.status ?? "—"],
        ["Start", row.start ? longDate(row.start) : "—"],
        ["Deadline", row.deadline ? longDate(row.deadline) : "—"],
        ["Deliverable", row.deliverable ?? "—"],
      ] as const,
    [row, party],
  );
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/20" onClick={onClose}>
      <aside className="flex h-full w-[520px] flex-col bg-white shadow-lift" onClick={(e) => e.stopPropagation()} aria-label={`Task ${row.id}`}>
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-5">
          <div>
            <div className="num text-[12px] font-semibold" style={{ color: C }}>
              {row.id} · {party?.name}
            </div>
            <h2 className="mt-0.5 text-[17px] font-semibold leading-snug text-ink-900">{row.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {(wait.length > 0 || holds.length > 0) && (
            <div className="space-y-1.5 rounded-[12px] bg-stone-50 p-3.5 text-[12.5px]">
              {wait.length > 0 && row.status !== "Completed" && (
                <div className="flex items-center gap-2 text-[#8A5A1E]">
                  <AlertTriangle size={14} /> Waiting on {wait.map((w) => `${w} ${plan.rows.find((r) => r.id === w)?.title}`).join("; ")}
                </div>
              )}
              {holds.length > 0 && <div className="text-stone-600">Holds up {holds.map((h) => `${h} ${plan.rows.find((r) => r.id === h)?.title}`).join("; ")}</div>}
            </div>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12.5px]">
            {facts.map(([k, v]) => (
              <div key={k} className={k === "Deliverable" ? "col-span-2" : ""}>
                <dt className="text-[11px] text-stone-500">{k}</dt>
                <dd className="font-medium text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Files</span>
              <input
                ref={file}
                type="file"
                multiple
                hidden
                onChange={(e) => (e.target.files && onUpdate({ files: [...(row.files ?? []), ...Array.from(e.target.files).map((f) => f.name)] }), (e.target.value = ""))}
              />
              <button onClick={() => file.current?.click()} className="flex items-center gap-1 text-[12px] font-semibold hover:underline" style={{ color: C }}>
                <Paperclip size={12} /> Attach evidence
              </button>
            </div>
            {row.files?.length ? (
              <ul className="space-y-1.5">
                {row.files.map((f) => (
                  <li key={f} className="flex items-center gap-2 rounded-[8px] border border-stone-200 px-3 py-2 text-[12.5px] text-ink-900">
                    <FileText size={14} className="text-[#B5542A]" /> {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-stone-400">No evidence attached yet.</p>
            )}
          </div>
          <div>
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Conversation</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                onUpdate({ comments: [{ by: "Luca Ott", at: new Date().toISOString(), text: text.trim() }, ...(row.comments ?? [])] });
                setText("");
              }}
              className="flex gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Comment on this task"
                className="h-9 flex-1 rounded-[9px] border border-stone-300 px-3 text-[13px] focus:border-ink-900 focus:outline-none"
              />
              <button className="h-9 rounded-[9px] px-3 text-[12.5px] font-semibold text-white" style={{ background: C }}>
                Post
              </button>
            </form>
            <ul className="mt-3 space-y-2.5">
              {(row.comments ?? []).map((c, i) => (
                <li key={i} className="rounded-[10px] border border-stone-200 p-3 text-[12.5px]">
                  <div className="text-[11px] text-stone-500">
                    <span className="font-semibold text-ink-900">{c.by}</span> · {fmtShort(c.at)}
                  </div>
                  <p className="mt-1 text-stone-700">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
