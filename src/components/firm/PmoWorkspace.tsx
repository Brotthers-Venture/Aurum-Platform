"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import { solutions } from "@/lib/solutions";
import { PMO_TODAY, WEEKS, capacity, projects as seedProjects, risks, tasks as seedTasks, type Health, type Project, type Task } from "@/lib/pmo";
import { ActionButton, Card, GhostButton, Initials, Kpi, ModuleHeader, ModuleTabs, Pill, Toast, daysUntil, field, fieldLabel, fmtDate, fmtShort, td, th, useTab, useToast } from "./kit";

const C = FIRM.pmo;
export type PmoTab = "portfolio" | "timeline" | "tasks" | "risks" | "capacity" | "new";
const healthTone: Record<Health, "good" | "warn" | "bad"> = { "On track": "good", "At risk": "warn", "Off track": "bad" };
const solName = (id: string) => (id === "aurum" ? "Aurum" : solutions.find((s) => s.id === id)?.name.replace(" Solution", "").replace("Multi-Family Office", "Multi-Family") ?? id);
const ME = "Managing Partner";

export function PmoWorkspace({ tab: initial }: { tab: PmoTab }) {
  const [tab, setTab] = useTab<Exclude<PmoTab, "new">>(initial === "new" ? "portfolio" : initial);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [creating, setCreating] = useState(initial === "new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [mine, setMine] = useState(true);
  const [toast, flash] = useToast();
  const project = projects.find((p) => p.id === openId);

  const toggle = (id: string) => setTasks((all) => all.map((t) => (t.id === id ? { ...t, status: t.status === "Done" ? "To do" : "Done" } : t)));
  const openTasks = tasks.filter((t) => t.status !== "Done");

  return (
    <>
      <ModuleHeader
        color={C}
        title="Project management office"
        action={
          <ActionButton color={C} onClick={() => setCreating(true)}>
            <Plus size={15} /> New project
          </ActionButton>
        }
      />
      <ModuleTabs
        color={C}
        tab={tab}
        setTab={setTab}
        tabs={[
          { id: "portfolio", label: "Portfolio", count: projects.length },
          { id: "timeline", label: "Timeline" },
          { id: "tasks", label: "Tasks", count: openTasks.length },
          { id: "risks", label: "Risks", count: risks.filter((r) => r.status !== "Closed").length },
          { id: "capacity", label: "Capacity" },
        ]}
      />
      <div className="mt-6 space-y-5">
        {tab === "portfolio" && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <Kpi label="Active projects" value={projects.length} note={`${new Set(projects.map((p) => p.solution)).size} areas`} />
              <Kpi label="On track" value={projects.filter((p) => p.health === "On track").length} />
              <Kpi label="Need attention" value={projects.filter((p) => p.health !== "On track").length} note="at risk or off track" tone="warn" />
              <Kpi label="Overdue tasks" value={openTasks.filter((t) => t.due < PMO_TODAY).length} tone={openTasks.some((t) => t.due < PMO_TODAY) ? "warn" : undefined} />
            </div>
            <Card>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["Project", "Area", "Owner", "Phase", "Progress", "Next milestone", "Due", "Health"].map((h) => (
                      <th key={h} className={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...projects]
                    .sort((a, b) => ["Off track", "At risk", "On track"].indexOf(a.health) - ["Off track", "At risk", "On track"].indexOf(b.health) || a.due.localeCompare(b.due))
                    .map((p) => {
                      const next = p.milestones.find((m) => !m.done);
                      return (
                        <tr key={p.id} onClick={() => setOpenId(p.id)} className="cursor-pointer border-b border-stone-100 hover:bg-stone-50">
                          <td className={td}>
                            <div className="font-semibold text-ink-900">{p.name}</div>
                            {p.note && <div className="text-[11px] text-[#8A5A1E]">{p.note}</div>}
                          </td>
                          <td className={cx(td, "text-stone-600")}>{solName(p.solution)}</td>
                          <td className={td}>
                            <Initials name={p.owner} size={24} />
                          </td>
                          <td className={cx(td, "text-stone-600")}>{p.phase}</td>
                          <td className={cx(td, "w-[140px]")}>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-stone-100">
                                <div className="h-1.5 rounded-full" style={{ width: `${p.progress}%`, background: C }} />
                              </div>
                              <span className="num w-8 text-right text-[11px] text-stone-500">{p.progress}%</span>
                            </div>
                          </td>
                          <td className={cx(td, "text-stone-600")}>{next ? `${next.name} · ${fmtShort(next.date)}` : "—"}</td>
                          <td className={cx(td, "text-stone-600")}>{fmtShort(p.due)}</td>
                          <td className={td}>
                            <Pill tone={healthTone[p.health]}>{p.health}</Pill>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {tab === "timeline" && <Timeline projects={projects} onOpen={setOpenId} />}

        {tab === "tasks" && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-1.5">
              {[
                [true, "My tasks"],
                [false, "Everyone"],
              ].map(([v, l]) => (
                <button key={String(v)} onClick={() => setMine(v as boolean)} className={cx("h-7 rounded-full px-3 text-[12px] font-semibold", mine === v ? "bg-champagne text-ink-900" : "text-stone-500 hover:bg-stone-100")}>
                  {l as string}
                </button>
              ))}
            </div>
            {(
              [
                ["Overdue", (t: Task) => t.status !== "Done" && t.due < PMO_TODAY],
                ["This week", (t: Task) => t.status !== "Done" && t.due >= PMO_TODAY && daysUntil(t.due) <= 7],
                ["Later", (t: Task) => t.status !== "Done" && daysUntil(t.due) > 7],
                ["Done", (t: Task) => t.status === "Done"],
              ] as const
            ).map(([label, fn]) => {
              const list = tasks.filter((t) => (!mine || t.assignee === ME) && fn(t));
              if (!list.length) return null;
              return (
                <div key={label} className="mb-5 last:mb-0">
                  <div className={cx("mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]", label === "Overdue" ? "text-[#9A4422]" : "text-stone-500")}>
                    {label} · {list.length}
                  </div>
                  <ul className="divide-y divide-stone-100 rounded-[12px] border border-stone-200">
                    {list.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                        <button
                          onClick={() => toggle(t.id)}
                          className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border", t.status === "Done" ? "border-transparent text-white" : "border-stone-300 hover:border-ink-900")}
                          style={t.status === "Done" ? { background: C } : undefined}
                          aria-label={t.status === "Done" ? `Reopen ${t.title}` : `Complete ${t.title}`}
                        >
                          {t.status === "Done" && <Check size={13} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={cx("text-[13px] font-medium", t.status === "Done" ? "text-stone-400 line-through" : "text-ink-900")}>
                            {t.title}
                            {t.priority && t.status !== "Done" && <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9A4422]">High</span>}
                          </div>
                          <div className="text-[11px] text-stone-500">{projects.find((p) => p.id === t.projectId)?.name}</div>
                        </div>
                        {!mine && <Initials name={t.assignee} size={22} />}
                        <span className={cx("w-16 text-right text-[12px]", t.status !== "Done" && t.due < PMO_TODAY ? "font-semibold text-[#9A4422]" : "text-stone-500")}>{fmtShort(t.due)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </Card>
        )}

        {tab === "risks" && (
          <Card>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  {["Risk", "Project", "Impact", "Likelihood", "Owner", "Mitigation", "Status"].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr key={r.id} className="border-b border-stone-100 align-top">
                    <td className={cx(td, "font-medium text-ink-900")}>{r.title}</td>
                    <td className={cx(td, "text-stone-600")}>{projects.find((p) => p.id === r.projectId)?.name.split(" — ")[0]}</td>
                    <td className={td}>
                      <Pill tone={r.impact === "High" ? "bad" : r.impact === "Medium" ? "warn" : "neutral"}>{r.impact}</Pill>
                    </td>
                    <td className={cx(td, "text-stone-600")}>{r.likelihood}</td>
                    <td className={cx(td, "text-stone-600")}>{r.owner}</td>
                    <td className={cx(td, "text-stone-600")}>{r.mitigation}</td>
                    <td className={td}>
                      <Pill tone={r.status === "Open" ? "bad" : r.status === "Mitigating" ? "warn" : "good"}>{r.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "capacity" && <Capacity />}
      </div>

      {project && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/25" onClick={() => setOpenId(null)}>
          <aside className="flex h-full w-[520px] flex-col bg-white shadow-lift" onClick={(e) => e.stopPropagation()} aria-label={project.name}>
            <div className="flex items-start justify-between border-b border-stone-100 px-6 py-5">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: C }}>
                  {project.kind} · {solName(project.solution)}
                </div>
                <h2 className="mt-1 text-[19px] font-semibold text-ink-900">{project.name}</h2>
                <div className="mt-1 flex items-center gap-2 text-[12px] text-stone-500">
                  <Pill tone={healthTone[project.health]}>{project.health}</Pill> {project.owner} · {fmtDate(project.start)} → {fmtDate(project.due)}
                </div>
              </div>
              <button onClick={() => setOpenId(null)} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {project.note && <p className="rounded-[10px] bg-[#FBF1E4] px-3 py-2 text-[12.5px] text-[#8A5A1E]">{project.note}</p>}
              <div>
                <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Milestones</div>
                <ol className="space-y-2.5">
                  {project.milestones.map((m) => (
                    <li key={m.name} className="flex items-center gap-3 text-[13px]">
                      <span className={cx("h-2.5 w-2.5 rotate-45", m.done ? "" : "border-2")} style={m.done ? { background: C } : { borderColor: C }} />
                      <span className={cx("flex-1", m.done ? "text-stone-500" : "font-medium text-ink-900")}>{m.name}</span>
                      <span className="text-[12px] text-stone-500">{fmtShort(m.date)}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Tasks</div>
                <ul className="divide-y divide-stone-100 rounded-[12px] border border-stone-200">
                  {tasks
                    .filter((t) => t.projectId === project.id)
                    .map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-3 py-2.5 text-[13px]">
                        <button
                          onClick={() => toggle(t.id)}
                          className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border", t.status === "Done" ? "border-transparent text-white" : "border-stone-300")}
                          style={t.status === "Done" ? { background: C } : undefined}
                          aria-label={`Toggle ${t.title}`}
                        >
                          {t.status === "Done" && <Check size={13} />}
                        </button>
                        <span className={cx("flex-1", t.status === "Done" && "text-stone-400 line-through")}>{t.title}</span>
                        <Initials name={t.assignee} size={22} />
                        <span className="w-14 text-right text-[12px] text-stone-500">{fmtShort(t.due)}</span>
                      </li>
                    ))}
                </ul>
              </div>
              {risks.some((r) => r.projectId === project.id) && (
                <div>
                  <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Risks</div>
                  {risks
                    .filter((r) => r.projectId === project.id)
                    .map((r) => (
                      <p key={r.id} className="mb-2 text-[12.5px] text-stone-700">
                        <span className="font-semibold text-ink-900">{r.title}.</span> {r.mitigation}.
                      </p>
                    ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {creating && (
        <NewProject
          onClose={() => setCreating(false)}
          onSave={(p) => {
            setProjects((all) => [p, ...all]);
            setCreating(false);
            setTab("portfolio");
            flash(`${p.name} created`);
          }}
        />
      )}
      <Toast text={toast} />
    </>
  );
}

function Timeline({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  const start = Date.parse("2026-08-01T00:00:00Z");
  const end = Date.parse("2027-04-01T00:00:00Z");
  const pos = (iso: string) => ((Date.parse(`${iso}T12:00:00Z`) - start) / (end - start)) * 100;
  const months = Array.from({ length: 8 }, (_, i) => new Date(Date.UTC(2026, 7 + i, 1)));
  const today = pos(PMO_TODAY);
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-[300px_1fr]">
        <div className="border-b border-r border-stone-100 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">Project</div>
        <div className="relative grid grid-cols-8 border-b border-stone-100">
          {months.map((m) => (
            <div key={m.toISOString()} className="border-l border-stone-100 px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500 first:border-l-0">
              {m.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })}
            </div>
          ))}
        </div>
        {[...projects]
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((p) => (
            <div key={p.id} className="contents">
              <button onClick={() => onOpen(p.id)} className="truncate border-r border-stone-100 px-5 py-3 text-left text-[12.5px] font-medium text-ink-900 hover:underline">
                {p.name}
              </button>
              <div className="relative h-[46px]">
                <div className="absolute inset-0 grid grid-cols-8">
                  {months.map((m) => (
                    <div key={m.toISOString()} className="border-l border-stone-100 first:border-l-0" />
                  ))}
                </div>
                <div className="absolute top-1/2 h-3.5 -translate-y-1/2 overflow-hidden rounded-full" style={{ left: `${pos(p.start)}%`, width: `${pos(p.due) - pos(p.start)}%`, background: `${C}2E` }} title={`${p.progress}% complete`}>
                  <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: C }} />
                </div>
                {p.milestones.map((m) => (
                  <span
                    key={m.name}
                    title={`${m.name} · ${fmtShort(m.date)}`}
                    className={cx("absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 ring-2 ring-white", m.done ? "" : "bg-white")}
                    style={{ left: `${pos(m.date)}%`, background: m.done ? "#0F2340" : undefined, border: m.done ? undefined : "2px solid #0F2340" }}
                  />
                ))}
                <span className="absolute inset-y-0 w-px bg-[#9A4422]" style={{ left: `${today}%` }} />
              </div>
            </div>
          ))}
      </div>
      <div className="flex items-center gap-5 border-t border-stone-100 px-5 py-2.5 text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full" style={{ background: C }} /> Progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rotate-45 bg-ink-900" /> Milestone done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rotate-45 border-2 border-ink-900" /> Milestone ahead
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-[#9A4422]" /> Today
        </span>
      </div>
    </Card>
  );
}

function Capacity() {
  const shade = (v: number) => (v > 100 ? C : v >= 85 ? `${C}B3` : v >= 60 ? `${C}66` : `${C}26`);
  return (
    <Card>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-stone-100">
            <th className={th}>Person</th>
            {WEEKS.map((w) => (
              <th key={w} className={cx(th, "text-center")}>
                Wk of {fmtShort(w)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {capacity.map((c) => (
            <tr key={c.person} className="border-b border-stone-100">
              <td className={td}>
                <div className="font-medium text-ink-900">{c.person}</div>
                <div className="text-[11px] text-stone-500">{c.role}</div>
              </td>
              {c.load.map((v, i) => (
                <td key={i} className="px-1.5 py-1.5">
                  <div className={cx("num flex h-9 items-center justify-center rounded-[8px] text-[12px] font-semibold", v >= 85 ? "text-white" : "text-ink-900")} style={{ background: shade(v) }}>
                    {v}%
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-5 py-3 text-[11px] text-stone-500">Planned hours as a share of available hours. Above 100% means the plan needs moving or help.</p>
    </Card>
  );
}

function NewProject({ onClose, onSave }: { onClose: () => void; onSave: (p: Project) => void }) {
  const [f, setF] = useState({ name: "", kind: "Client onboarding" as Project["kind"], solution: "fund", owner: ME, start: PMO_TODAY, due: "2027-01-31" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 p-6" role="dialog" aria-modal aria-label="New project">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: `pj${Date.now()}`, ...f, progress: 0, health: "On track", phase: "Kick-off", milestones: [{ name: "Kick-off", date: f.start }, { name: "Complete", date: f.due }] });
        }}
        className="w-full max-w-[520px] space-y-4 rounded-[18px] bg-white p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-[17px] font-semibold text-ink-900">New project</h2>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <label className="block">
          <span className={fieldLabel}>Name</span>
          <input required value={f.name} onChange={set("name")} placeholder="e.g. Ridgeline Capital — client onboarding" className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={fieldLabel}>Type</span>
            <select value={f.kind} onChange={set("kind")} className={field}>
              {["Client onboarding", "Fund launch", "Quarter close", "Audit", "Regulatory", "Go-live", "Closing", "Restructuring", "Internal"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={fieldLabel}>Area</span>
            <select value={f.solution} onChange={set("solution")} className={field}>
              {solutions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="aurum">Aurum (internal)</option>
            </select>
          </label>
          <label>
            <span className={fieldLabel}>Start</span>
            <input type="date" value={f.start} onChange={set("start")} className={field} />
          </label>
          <label>
            <span className={fieldLabel}>Due</span>
            <input type="date" value={f.due} onChange={set("due")} className={field} />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <ActionButton color={C} type="submit">
            Create project
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
