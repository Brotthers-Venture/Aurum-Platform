"use client";

import { useEffect, useState } from "react";
import { localAudit } from "@/lib/audit-local";
import type { AuditEvent } from "@/lib/access";
import { cx } from "@/components/ui";
import { FIRM } from "@/lib/firm-colors";
import { auditLog } from "@/lib/access";
import {
  C_TODAY,
  accessReviews as seedReviews,
  alerts as seedAlerts,
  courses,
  deadlines as seedDeadlines,
  isOverdueDeadline,
  policies,
  policyDue,
  training,
  type Alert,
  type Deadline,
} from "@/lib/compliance";
import { ActionButton, Card, GhostButton, Kpi, ModuleHeader, ModuleTabs, Pill, Toast, daysUntil, fmtDate, fmtShort, td, th, useTab, useToast } from "./kit";

const C = FIRM.compliance;
export type ComplianceTab = "calendar" | "policies" | "training" | "screening" | "reviews" | "audit";
const ME = "Managing Partner";

export function ComplianceWorkspace({ tab: initial }: { tab: ComplianceTab }) {
  const [tab, setTab] = useTab<ComplianceTab>(initial);
  const [deadlines, setDeadlines] = useState<Deadline[]>(seedDeadlines);
  // Changes made in this browser (e.g. Corporate Chat status and approval changes) join the append-only log.
  const [audit, setAudit] = useState<AuditEvent[]>(auditLog);
  useEffect(() => {
    const local = localAudit();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (local.length) setAudit([...local].reverse().concat(auditLog));
  }, []);
  const [alerts, setAlerts] = useState<Alert[]>(seedAlerts);
  const [reviews, setReviews] = useState(seedReviews);
  const [toast, flash] = useToast();

  const open = deadlines.filter((d) => d.status !== "Filed");
  const months = [...new Set(deadlines.map((d) => d.due.slice(0, 7)))].sort();
  const monthLabel = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const shownStatus = (d: Deadline) => (isOverdueDeadline(d) ? "Overdue" : d.status);

  return (
    <>
      <ModuleHeader color={C} title="Compliance" />
      <ModuleTabs
        color={C}
        tab={tab}
        setTab={setTab}
        tabs={[
          { id: "calendar", label: "Calendar", count: open.length },
          { id: "policies", label: "Policies" },
          { id: "training", label: "Training" },
          { id: "screening", label: "Screening", count: alerts.filter((a) => a.status === "Needs review").length },
          { id: "reviews", label: "Access reviews" },
          { id: "audit", label: "Audit log" },
        ]}
      />
      <div className="mt-6 space-y-5">
        {tab === "calendar" && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <Kpi label="Overdue" value={open.filter(isOverdueDeadline).length} tone={open.some(isOverdueDeadline) ? "warn" : undefined} />
              <Kpi label="Due in 30 days" value={open.filter((d) => daysUntil(d.due) >= 0 && daysUntil(d.due) <= 30).length} />
              <Kpi label="Later" value={open.filter((d) => daysUntil(d.due) > 30).length} />
              <Kpi label="Filed this quarter" value={deadlines.filter((d) => d.status === "Filed").length} />
            </div>
            {months.map((m) => (
              <div key={m}>
                <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">{monthLabel(m)}</div>
                <Card>
                  <ul className="divide-y divide-stone-100">
                    {deadlines
                      .filter((d) => d.due.startsWith(m))
                      .sort((a, b) => a.due.localeCompare(b.due))
                      .map((d) => {
                        const s = shownStatus(d);
                        return (
                          <li key={d.id} className="flex items-center gap-4 px-5 py-3">
                            <div className="w-12 text-center">
                              <div className="text-[10px] font-bold uppercase text-stone-400">{new Date(`${d.due}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}</div>
                              <div className="num text-[18px] font-semibold leading-none text-ink-900">{Number(d.due.slice(8))}</div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13.5px] font-semibold text-ink-900">{d.title}</div>
                              <div className="text-[11.5px] text-stone-500">
                                {d.entity} · {d.authority} · {d.recurrence} · {d.owner}
                              </div>
                            </div>
                            {s !== "Filed" && daysUntil(d.due) >= 0 && <span className="text-[12px] text-stone-500">in {daysUntil(d.due)} days</span>}
                            <Pill tone={s === "Overdue" ? "bad" : s === "Filed" ? "good" : s === "In progress" ? "gold" : "neutral"}>{s}</Pill>
                            {s !== "Filed" && (
                              <GhostButton
                                onClick={() => {
                                  setDeadlines((all) => all.map((x) => (x.id === d.id ? { ...x, status: "Filed" } : x)));
                                  flash(`${d.title} marked as filed`);
                                }}
                              >
                                Mark filed
                              </GhostButton>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </Card>
              </div>
            ))}
            <p className="text-[11.5px] text-stone-500">Sample deadlines. Real dates are confirmed with counsel before they go on the calendar.</p>
          </>
        )}

        {tab === "policies" && (
          <Card>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  {["Policy", "Version", "Owner", "Last reviewed", "Next review", "Staff attested", ""].map((h, i) => (
                    <th key={i} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => {
                  const due = policyDue(p);
                  const late = daysUntil(p.nextReview) < 0;
                  return (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className={cx(td, "font-semibold text-ink-900")}>{p.name}</td>
                      <td className={cx(td, "num text-stone-600")}>v{p.version}</td>
                      <td className={cx(td, "text-stone-600")}>{p.owner}</td>
                      <td className={cx(td, "text-stone-600")}>{fmtDate(p.lastReviewed)}</td>
                      <td className={td}>
                        <span className={cx(late ? "font-semibold text-[#9A4422]" : due ? "font-semibold text-[#8A5A1E]" : "text-stone-600")}>{fmtDate(p.nextReview)}</span>
                      </td>
                      <td className={cx(td, "w-[180px]")}>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-stone-100">
                            <div className="h-1.5 rounded-full" style={{ width: `${p.attested}%`, background: C }} />
                          </div>
                          <span className="num w-9 text-right text-[11px] text-stone-500">{p.attested}%</span>
                        </div>
                      </td>
                      <td className={td}>{late ? <Pill tone="bad">Review overdue</Pill> : due ? <Pill tone="warn">Review due</Pill> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "training" && (
          <Card>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Person</th>
                  {courses.map((c) => (
                    <th key={c.id} className={cx(th, "text-center")}>
                      {c.name}
                      <div className="mt-0.5 font-normal normal-case tracking-normal text-stone-400">due {fmtShort(c.due)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {training.map((r) => (
                  <tr key={r.person} className="border-b border-stone-100">
                    <td className={td}>
                      <div className="font-medium text-ink-900">{r.person}</div>
                      <div className="text-[11px] text-stone-500">{r.role}</div>
                    </td>
                    {courses.map((c) => {
                      const s = r.status[c.id];
                      return (
                        <td key={c.id} className={cx(td, "text-center")}>
                          <Pill tone={s === "Complete" ? "good" : s === "Overdue" ? "bad" : "neutral"}>{s}</Pill>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "screening" && (
          <div className="space-y-3">
            {[...alerts]
              .sort((a, b) => Number(a.status !== "Needs review") - Number(b.status !== "Needs review"))
              .map((a) => (
                <Card key={a.id} className="flex items-center gap-5 p-5">
                  <div className="w-14 text-center">
                    <div className="num text-[22px] font-semibold text-ink-900">{a.score}</div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-stone-400">match</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-ink-900">{a.subject}</span>
                      <Pill tone={a.kind === "Sanctions" ? "bad" : a.kind === "PEP" ? "warn" : "info"}>{a.kind}</Pill>
                    </div>
                    <div className="text-[12px] text-stone-500">
                      {a.context} · {a.list} · raised {fmtShort(a.raised)}
                    </div>
                    {a.note && <div className="mt-1 text-[12.5px] text-stone-700">{a.note}</div>}
                    {a.firstReviewer && a.status === "Needs review" && <div className="mt-1 text-[11.5px] text-stone-500">First review by {a.firstReviewer} · needs a second reviewer</div>}
                  </div>
                  {a.status === "Needs review" ? (
                    <div className="flex gap-2">
                      <GhostButton
                        onClick={() => {
                          setAlerts((all) => all.map((x) => (x.id === a.id ? { ...x, status: "Escalated" } : x)));
                          flash(`${a.subject} escalated`);
                        }}
                      >
                        Escalate
                      </GhostButton>
                      <ActionButton
                        color={C}
                        onClick={() => {
                          setAlerts((all) => all.map((x) => (x.id === a.id ? { ...x, status: "Cleared", note: `${x.note ? `${x.note} · ` : ""}cleared by ${ME}` } : x)));
                          flash(`${a.subject} cleared — false positive`);
                        }}
                      >
                        Clear
                      </ActionButton>
                    </div>
                  ) : (
                    <Pill tone={a.status === "Cleared" ? "good" : "bad"}>{a.status}</Pill>
                  )}
                </Card>
              ))}
          </div>
        )}

        {tab === "reviews" && (
          <Card>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  {["System", "Users", "Reviewer", "Due", "Findings", "Status", ""].map((h, i) => (
                    <th key={i} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-b border-stone-100">
                    <td className={cx(td, "font-semibold text-ink-900")}>{r.system}</td>
                    <td className={cx(td, "num text-stone-600")}>{r.users}</td>
                    <td className={cx(td, "text-stone-600")}>{r.reviewer}</td>
                    <td className={cx(td, "text-stone-600")}>{fmtDate(r.due)}</td>
                    <td className={cx(td, "num", r.findings ? "font-semibold text-[#9A4422]" : "text-stone-400")}>{r.findings || "—"}</td>
                    <td className={td}>
                      <Pill tone={r.status === "Complete" ? "good" : r.status === "In progress" ? "gold" : "neutral"}>{r.status}</Pill>
                    </td>
                    <td className={cx(td, "text-right")}>
                      {r.status !== "Complete" && r.reviewer === ME && (
                        <button
                          onClick={() => {
                            setReviews((all) => all.map((x) => (x.id === r.id ? { ...x, status: "Complete" } : x)));
                            flash(`${r.system} review signed off`);
                          }}
                          className="text-[12px] font-semibold hover:underline"
                          style={{ color: C }}
                        >
                          Sign off
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 py-3 text-[11px] text-stone-500">Quarterly review of who can access each system — a SOC 1 control. Due {fmtDate("2026-12-31")}.</p>
          </Card>
        )}

        {tab === "audit" && (
          <Card>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-stone-100">
                  {["When", "Who", "Action", "Object", "IP"].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audit.map((e, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className={cx(td, "whitespace-nowrap text-stone-600")}>{e.at.replace("T", " ").slice(0, 16)}</td>
                    <td className={cx(td, "font-medium text-ink-900")}>{e.user}</td>
                    <td className={cx(td, "text-stone-600")}>{e.action}</td>
                    <td className={cx(td, "text-stone-600")}>{e.object}</td>
                    <td className={cx(td, "font-mono text-[11.5px] text-stone-500")}>{e.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 py-3 text-[11px] text-stone-500">Append-only. Nothing here can be edited or deleted. As of {fmtDate(C_TODAY)}.</p>
          </Card>
        )}
      </div>
      <Toast text={toast} />
    </>
  );
}
