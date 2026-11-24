"use client";

import { useState } from "react";
import { CalendarClock, Mail, MessageSquareText, Phone, Plus, Users, X } from "lucide-react";
import { cx } from "@/components/ui";
import { money } from "@/lib/format";
import { FIRM } from "@/lib/firm-colors";
import { solutions } from "@/lib/solutions";
import { PROBABILITY, STAGES, activities as seedActivities, deals as seedDeals, isOpenDeal, weighted, type Activity, type Deal, type Stage } from "@/lib/sales";
import { ActionButton, Card, GhostButton, Initials, Kpi, ModuleHeader, ModuleTabs, Pill, Toast, daysUntil, field, fieldLabel, fmtDate, fmtShort, td, th, useTab, useToast } from "./kit";

const C = FIRM.sales;
export type SalesTab = "pipeline" | "leads" | "proposals" | "forecast" | "activities" | "new";
const usd = (n: number) => money(n, "USD");
const solName = (id: string) => solutions.find((s) => s.id === id)?.name.replace(" Solution", "").replace("Multi-Family Office", "Multi-Family") ?? id;
const OPEN_STAGES: Stage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Won"];
const kindIcon = { Call: Phone, Meeting: Users, Email: Mail, Proposal: MessageSquareText, Note: MessageSquareText };

export function SalesWorkspace({ tab: initial }: { tab: SalesTab }) {
  const [tab, setTab] = useTab<Exclude<SalesTab, "new">>(initial === "new" ? "pipeline" : initial);
  const [deals, setDeals] = useState<Deal[]>(seedDeals);
  const [acts, setActs] = useState<Activity[]>(seedActivities);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(initial === "new");
  const [drag, setDrag] = useState<string | null>(null);
  const [toast, flash] = useToast();

  const move = (id: string, stage: Stage) => {
    const d = deals.find((x) => x.id === id);
    if (!d || d.stage === stage) return;
    setDeals((all) => all.map((x) => (x.id === id ? { ...x, stage, close: stage === "Won" ? "2026-11-24" : x.close } : x)));
    setActs((a) => [{ id: `a${Date.now()}`, dealId: id, kind: "Note", at: new Date().toISOString(), by: "Managing Partner", note: `Moved from ${d.stage} to ${stage}.` }, ...a]);
    flash(stage === "Won" ? `${d.account} won — onboarding project opened in PMO` : `${d.account} moved to ${stage}`);
  };

  const open = deals.filter(isOpenDeal);
  const pipeline = open.reduce((s, d) => s + d.arr, 0);
  const wtd = open.reduce((s, d) => s + weighted(d), 0);
  const wonQ = deals.filter((d) => d.stage === "Won" && d.close >= "2026-10-01");
  const closed = deals.filter((d) => d.stage === "Won" || d.stage === "Lost");
  const winRate = closed.length ? deals.filter((d) => d.stage === "Won").length / closed.length : 0;
  const deal = deals.find((d) => d.id === openId);

  return (
    <>
      <ModuleHeader
        color={C}
        title="Sales"
        action={
          <ActionButton color={C} onClick={() => setCreating(true)}>
            <Plus size={15} /> New deal
          </ActionButton>
        }
      />
      <ModuleTabs
        color={C}
        tab={tab}
        setTab={setTab}
        tabs={[
          { id: "pipeline", label: "Pipeline", count: open.length },
          { id: "leads", label: "Leads", count: deals.filter((d) => d.stage === "Lead").length },
          { id: "proposals", label: "Proposals", count: deals.filter((d) => d.stage === "Proposal" || d.stage === "Negotiation").length },
          { id: "forecast", label: "Forecast" },
          { id: "activities", label: "Activities" },
        ]}
      />

      <div className="mt-6 space-y-5">
        {tab === "pipeline" && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <Kpi label="Open pipeline" value={usd(pipeline)} note={`${open.length} deals · annual fees`} />
              <Kpi label="Weighted" value={usd(wtd)} note="by stage probability" />
              <Kpi label="Won this quarter" value={usd(wonQ.reduce((s, d) => s + d.arr, 0))} note={`${wonQ.length} new clients`} />
              <Kpi label="Win rate" value={`${Math.round(winRate * 100)}%`} note={`${closed.length} decided deals`} />
            </div>
            <div className="grid grid-cols-5 gap-3">
              {OPEN_STAGES.map((s) => {
                const col = deals.filter((d) => d.stage === s);
                return (
                  <div
                    key={s}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => drag && move(drag, s)}
                    className={cx("flex min-h-[420px] flex-col rounded-[16px] border border-stone-200/80 bg-cream p-2.5", drag && "outline-dashed outline-1 outline-stone-300")}
                  >
                    <div className="flex items-baseline justify-between px-1.5 pb-2 pt-1">
                      <span className="text-[12px] font-bold text-ink-900">{s}</span>
                      <span className="num text-[11px] text-stone-500">
                        {col.length} · {usd(col.reduce((t, d) => t + d.arr, 0))}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {col.map((d) => (
                        <button
                          key={d.id}
                          draggable
                          onDragStart={() => setDrag(d.id)}
                          onDragEnd={() => setDrag(null)}
                          onClick={() => setOpenId(d.id)}
                          className="block w-full rounded-[12px] border border-stone-200 bg-white p-3 text-left shadow-card transition-shadow hover:shadow-lift"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[13px] font-semibold leading-snug text-ink-900">{d.account}</span>
                            <Initials name={d.owner} size={22} />
                          </div>
                          <div className="mt-0.5 text-[11px] text-stone-500">{solName(d.solution)}</div>
                          <div className="num mt-2 text-[14px] font-semibold text-ink-900">
                            {usd(d.arr)}
                            <span className="text-[11px] font-normal text-stone-400"> / yr</span>
                          </div>
                          {d.nextStep && s !== "Won" && (
                            <div className={cx("mt-2 flex items-center gap-1 text-[11px]", d.nextDate && daysUntil(d.nextDate) <= 2 ? "font-semibold" : "text-stone-500")} style={d.nextDate && daysUntil(d.nextDate) <= 2 ? { color: C } : undefined}>
                              <CalendarClock size={11} /> {d.nextStep} · {d.nextDate && fmtShort(d.nextDate)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11.5px] text-stone-500">Drag a deal to move it between stages.</p>
          </>
        )}

        {tab === "leads" && (
          <DealTable
            rows={deals.filter((d) => d.stage === "Lead")}
            onOpen={setOpenId}
            extra={{ head: "", cell: (d) => <button onClick={(e) => (e.stopPropagation(), move(d.id, "Qualified"))} className="text-[12px] font-semibold hover:underline" style={{ color: C }}>Qualify</button> }}
          />
        )}

        {tab === "proposals" && (
          <DealTable
            rows={deals.filter((d) => d.stage === "Proposal" || d.stage === "Negotiation")}
            onOpen={setOpenId}
            extra={{ head: "Proposed terms", cell: (d) => <span className="text-stone-600">{d.terms ?? "—"}</span> }}
          />
        )}

        {tab === "forecast" && <Forecast deals={deals} />}

        {tab === "activities" && (
          <Card className="p-5">
            <ul className="space-y-4">
              {[...acts]
                .sort((a, b) => b.at.localeCompare(a.at))
                .map((a) => {
                  const Icon = kindIcon[a.kind];
                  const d = deals.find((x) => x.id === a.dealId);
                  return (
                    <li key={a.id} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-stone-100 text-stone-600">
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px]">
                          <button onClick={() => setOpenId(a.dealId)} className="font-semibold text-ink-900 hover:underline">
                            {d?.account}
                          </button>
                          <span className="text-stone-500">
                            {" "}
                            · {a.kind} · {a.by} · {fmtShort(a.at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-stone-700">{a.note}</p>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </Card>
        )}
      </div>

      {deal && (
        <DealDrawer
          deal={deal}
          acts={acts.filter((a) => a.dealId === deal.id)}
          onClose={() => setOpenId(null)}
          onMove={(s) => move(deal.id, s)}
          onLog={(kind, note) => setActs((a) => [{ id: `a${Date.now()}`, dealId: deal.id, kind, at: new Date().toISOString(), by: "Managing Partner", note }, ...a])}
        />
      )}
      {creating && (
        <NewDeal
          onClose={() => setCreating(false)}
          onSave={(d) => {
            setDeals((all) => [d, ...all]);
            setCreating(false);
            flash(`${d.account} added as a lead`);
          }}
        />
      )}
      <Toast text={toast} />
    </>
  );
}

function DealTable({ rows, onOpen, extra }: { rows: Deal[]; onOpen: (id: string) => void; extra: { head: string; cell: (d: Deal) => React.ReactNode } }) {
  return (
    <Card>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-stone-100">
            {["Account", "Solution", "Stage", "Annual fees", "Owner", "Source", "Next step", extra.head].map((h, i) => (
              <th key={i} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} onClick={() => onOpen(d.id)} className="cursor-pointer border-b border-stone-100 hover:bg-stone-50">
              <td className={td}>
                <div className="font-semibold text-ink-900">{d.account}</div>
                <div className="text-[11px] text-stone-500">
                  {d.contact} · {d.title}
                </div>
              </td>
              <td className={cx(td, "text-stone-600")}>{solName(d.solution)}</td>
              <td className={td}>
                <Pill tone={d.stage === "Negotiation" ? "warn" : "info"}>{d.stage}</Pill>
              </td>
              <td className={cx(td, "num font-semibold text-ink-900")}>{usd(d.arr)}</td>
              <td className={cx(td, "text-stone-600")}>{d.owner}</td>
              <td className={cx(td, "text-stone-600")}>{d.source}</td>
              <td className={cx(td, "text-stone-600")}>{d.nextStep ? `${d.nextStep} · ${fmtShort(d.nextDate!)}` : "—"}</td>
              <td className={td}>{extra.cell(d)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="py-10 text-center text-[13px] text-stone-400">
                Nothing here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function Forecast({ deals }: { deals: Deal[] }) {
  const open = deals.filter(isOpenDeal);
  const months = [...new Set(open.map((d) => d.close.slice(0, 7)))].sort();
  const label = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const bySol = solutions.map((s) => ({ s, w: open.filter((d) => d.solution === s.id).reduce((t, d) => t + weighted(d), 0), n: open.filter((d) => d.solution === s.id).length })).filter((x) => x.n);
  const max = Math.max(...bySol.map((x) => x.w), 1);
  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-5">
      <Card>
        <div className="px-5 pt-4 text-[14px] font-semibold text-ink-900">Expected close</div>
        <table className="mt-2 w-full text-[12.5px]">
          <thead>
            <tr className="border-y border-stone-100">
              {["Month", "Deals", "Annual fees", "Weighted"].map((h) => (
                <th key={h} className={cx(th, h !== "Month" && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m) => {
              const ds = open.filter((d) => d.close.startsWith(m));
              return (
                <tr key={m} className="border-b border-stone-100">
                  <td className={cx(td, "font-medium text-ink-900")}>{label(m)}</td>
                  <td className={cx(td, "num text-right text-stone-600")}>{ds.length}</td>
                  <td className={cx(td, "num text-right text-stone-600")}>{usd(ds.reduce((t, d) => t + d.arr, 0))}</td>
                  <td className={cx(td, "num text-right font-semibold text-ink-900")}>{usd(ds.reduce((t, d) => t + weighted(d), 0))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="px-5 py-3 text-[11px] text-stone-500">Weighted = annual fees × stage probability ({STAGES.slice(0, 4).map((s) => `${s} ${PROBABILITY[s] * 100}%`).join(", ")}).</p>
      </Card>
      <Card className="p-5">
        <div className="text-[14px] font-semibold text-ink-900">Weighted by solution</div>
        <ul className="mt-4 space-y-3">
          {bySol.map(({ s, w, n }) => (
            <li key={s.id}>
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-ink-900">{s.name}</span>
                <span className="num text-stone-600">
                  {usd(w)} · {n}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-stone-100">
                <div className="h-2 rounded-full" style={{ width: `${(w / max) * 100}%`, background: C }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function DealDrawer({ deal, acts, onClose, onMove, onLog }: { deal: Deal; acts: Activity[]; onClose: () => void; onMove: (s: Stage) => void; onLog: (k: Activity["kind"], note: string) => void }) {
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<Activity["kind"]>("Call");
  const i = STAGES.indexOf(deal.stage);
  const next = deal.stage === "Negotiation" ? "Won" : isOpenDeal(deal) ? STAGES[i + 1] : null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/25" onClick={onClose}>
      <aside className="flex h-full w-[520px] flex-col bg-white shadow-lift" onClick={(e) => e.stopPropagation()} aria-label={deal.account}>
        <div className="flex items-start justify-between border-b border-stone-100 px-6 py-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: C }}>
              {solName(deal.solution)}
            </div>
            <h2 className="mt-1 text-[20px] font-semibold text-ink-900">{deal.account}</h2>
            <div className="text-[12px] text-stone-500">
              {deal.contact} · {deal.title}
            </div>
          </div>
          <button onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex gap-1">
            {STAGES.slice(0, 5).map((s, j) => (
              <div key={s} className="flex-1">
                <div className="h-1.5 rounded-full" style={{ background: deal.stage === "Lost" ? "#E3DCCD" : j <= i ? C : "#E3DCCD" }} />
                <div className={cx("mt-1 text-[10px]", s === deal.stage ? "font-bold text-ink-900" : "text-stone-400")}>{s}</div>
              </div>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12.5px]">
            {[
              ["Annual fees", usd(deal.arr)],
              ["Weighted", usd(weighted(deal))],
              ["Owner", deal.owner],
              ["Source", deal.source],
              ["Expected close", fmtDate(deal.close)],
              ["Opened", fmtDate(deal.created)],
              ...(deal.terms ? [["Proposed terms", deal.terms] as [string, string]] : []),
              ...(deal.lostReason ? [["Lost because", deal.lostReason] as [string, string]] : []),
            ].map(([k, v]) => (
              <div key={k} className={k === "Proposed terms" || k === "Lost because" ? "col-span-2" : ""}>
                <dt className="text-[11px] text-stone-500">{k}</dt>
                <dd className="font-medium text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
          {isOpenDeal(deal) && (
            <div className="flex gap-2">
              {next && <ActionButton color={C} onClick={() => onMove(next)}>{next === "Won" ? "Mark won" : `Move to ${next}`}</ActionButton>}
              <GhostButton onClick={() => onMove("Lost")}>Mark lost</GhostButton>
            </div>
          )}
          <div>
            <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-stone-500">Log activity</div>
            <div className="flex gap-2">
              <select value={kind} onChange={(e) => setKind(e.target.value as Activity["kind"])} className={cx(field, "w-[120px]")} aria-label="Kind">
                {(["Call", "Meeting", "Email", "Note"] as const).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened?" className={field} />
              <ActionButton
                color={C}
                disabled={!note.trim()}
                onClick={() => {
                  onLog(kind, note.trim());
                  setNote("");
                }}
              >
                Log
              </ActionButton>
            </div>
          </div>
          <ul className="space-y-3">
            {[...acts]
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((a) => {
                const Icon = kindIcon[a.kind];
                return (
                  <li key={a.id} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-stone-100 text-stone-600">
                      <Icon size={13} />
                    </span>
                    <div>
                      <div className="text-[11px] text-stone-500">
                        {a.kind} · {a.by} · {fmtShort(a.at)}
                      </div>
                      <p className="text-[13px] text-stone-700">{a.note}</p>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function NewDeal({ onClose, onSave }: { onClose: () => void; onSave: (d: Deal) => void }) {
  const [f, setF] = useState({ account: "", contact: "", title: "", solution: "fund", arr: "", owner: "Managing Partner", source: "Referral" as Deal["source"], close: "2027-03-31" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 p-6" role="dialog" aria-modal aria-label="New deal">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: `d${Date.now()}`, account: f.account, contact: f.contact, title: f.title, solution: f.solution, stage: "Lead", arr: Number(f.arr) || 0, owner: f.owner, source: f.source, created: "2026-11-24", close: f.close, nextStep: "Intro call" });
        }}
        className="w-full max-w-[520px] space-y-4 rounded-[18px] bg-white p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-[17px] font-semibold text-ink-900">New deal</h2>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <label className="block">
          <span className={fieldLabel}>Company</span>
          <input required value={f.account} onChange={set("account")} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={fieldLabel}>Contact</span>
            <input required value={f.contact} onChange={set("contact")} className={field} />
          </label>
          <label>
            <span className={fieldLabel}>Title</span>
            <input value={f.title} onChange={set("title")} className={field} />
          </label>
          <label>
            <span className={fieldLabel}>Solution</span>
            <select value={f.solution} onChange={set("solution")} className={field}>
              {solutions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={fieldLabel}>Expected annual fees (USD)</span>
            <input required type="number" min={0} value={f.arr} onChange={set("arr")} className={cx(field, "num")} />
          </label>
          <label>
            <span className={fieldLabel}>Source</span>
            <select value={f.source} onChange={set("source")} className={field}>
              {["Referral", "Conference", "Inbound", "Existing client", "Outbound"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={fieldLabel}>Expected close</span>
            <input type="date" value={f.close} onChange={set("close")} className={field} />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <ActionButton color={C} type="submit">
            Add lead
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
