"use client";

import { useMemo, useState, type DragEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { OFFERINGS, PHASES, STAGES, headline, offeringById, partyById, stageOf, type Opportunity, type PhaseId, type StageId } from "@/lib/offering/data";
import { applyMoves, offering, useOfferingState } from "@/lib/offering/store";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { Illus, Seg, StagePill, dayShort, daysFrom, usd, usdShort } from "./ui";

const initials = (n: string) =>
  n
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

function Card({ o, showOffering, onOpen, onDrag }: { o: Opportunity; showOffering: boolean; onOpen: () => void; onDrag: (e: DragEvent) => void }) {
  const p = partyById(o.partyId)!;
  const h = headline(o);
  const due = o.next?.date ? daysFrom(o.next.date) : null;
  return (
    <button
      draggable
      onDragStart={onDrag}
      onClick={onOpen}
      className="block w-full cursor-grab rounded-[9px] border border-d-line bg-d-surface px-3 py-2.5 text-left transition-colors hover:border-d-text-3 active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-d-text">{p.name}</span>
        {(o.illustrative || p.illustrative) && <Illus short />}
      </div>
      {showOffering && <div className="mt-0.5 truncate text-[11.5px] text-d-text-3">{offeringById(o.offeringId)?.short}</div>}
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="tnum text-[13px] text-d-text">{usdShort(h.value)}</span>
        <span className="text-[11px] text-d-text-3">{h.label.toLowerCase()}</span>
        {o.amountsIllustrative && <span className="text-[11px] text-d-text-3">· est.</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 border-t border-d-line-soft pt-1.5 text-[11.5px] text-d-text-2">
        <span title={o.owner} className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-d-line text-[9px] font-semibold text-d-text-3">
          {initials(o.owner)}
        </span>
        <span className="min-w-0 flex-1 truncate">{o.next?.action ?? (o.source === "Fund ledger" ? "In the fund books" : "No next action")}</span>
        {due !== null && <span className={cx("tnum shrink-0", due < 0 ? "text-negative" : due <= 1 ? "text-gold-700" : "text-d-text-3")}>{dayShort(o.next!.date)}</span>}
      </div>
    </button>
  );
}

/** The four-phase board. Gated stages accept a drop only when their evidence exists; otherwise they say what’s missing. */
export function PipelineBoard({ opps, onOpen }: { opps: Opportunity[]; onOpen: (o: Opportunity) => void }) {
  const { member } = usePreviewRole();
  const [over, setOver] = useState<StageId | null>(null);
  const [notice, setNotice] = useState<{ o: Opportunity; text: string } | null>(null);
  const [showFunded, setShowFunded] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const multi = new Set(opps.map((o) => o.offeringId)).size > 1;
  const byStage = (s: StageId) => opps.filter((o) => o.stage === s);

  const drop = (e: DragEvent, to: StageId) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const o = opps.find((x) => x.id === id);
    if (!o || o.stage === to) return;
    if (stageOf(to).gate) {
      // a gated stage is never set by dragging: confirm with the evidence in the drawer
      setNotice({ o, text: `${stageOf(to).label} needs evidence: ${stageOf(to).gate} Open the record to confirm it.` });
      return;
    }
    const err = offering.move(o, to, member.name);
    setNotice(err ? { o, text: err } : null);
  };

  const stageProps = (st: (typeof STAGES)[number]) => ({
    s: st,
    list: byStage(st.id),
    over: over === st.id,
    onOver: () => setOver(st.id),
    onLeave: () => setOver((v) => (v === st.id ? null : v)),
    onDrop: (e: DragEvent) => drop(e, st.id),
    collapsed: st.id === "funded" && !showFunded && byStage(st.id).length > 3,
    onExpand: () => setShowFunded(true),
    multi,
    onOpen,
  });

  const out = STAGES.filter((s) => !s.phase);
  const outCount = out.reduce((n, s) => n + byStage(s.id).length, 0);
  return (
    <div>
      {notice && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[10px] border border-attn-line px-4 py-2.5 text-[12.5px] text-gold-700">
          <Lock size={13} />
          <span className="min-w-0 flex-1">
            <b className="font-semibold">{partyById(notice.o.partyId)?.name}:</b> {notice.text}
          </span>
          <button
            onClick={() => {
              onOpen(notice.o);
              setNotice(null);
            }}
            className="font-semibold underline underline-offset-2"
          >
            Open the record
          </button>
          <button onClick={() => setNotice(null)} className="text-d-text-3 hover:text-d-text">
            Dismiss
          </button>
        </div>
      )}
      <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-4">
        {PHASES.map((ph) => {
          const stages = STAGES.filter((s) => s.phase === ph.id);
          const list = opps.filter((o) => stageOf(o.stage).phase === ph.id);
          return (
            <section key={ph.id} className="min-w-[260px] rounded-[12px] border border-d-line bg-d-raise/40 p-1.5" aria-label={ph.label}>
              <header className="flex items-baseline gap-2 px-2 pb-1 pt-1.5">
                <h2 className="text-[13px] font-semibold text-d-text">{ph.label}</h2>
                <span className="tnum text-[12px] text-d-text-3">{list.length}</span>
              </header>
              <div className="space-y-1">
                {stages.map((s) => (
                  <StageBox key={s.id} {...stageProps(s)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="mt-3">
        <button onClick={() => setShowOut((v) => !v)} className="inline-flex items-center gap-1.5 px-1 text-[12.5px] text-d-text-3 hover:text-d-text" aria-expanded={showOut}>
          <ChevronDown size={14} className={cx("transition-transform", !showOut && "-rotate-90")} /> Outside the pipeline · {outCount}
        </button>
        {showOut && (
          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {out.map((s) => (
              <StageBox key={s.id} {...stageProps(s)} />
            ))}
          </div>
        )}
      </div>
      <p className="mt-3 px-1 text-[11.5px] leading-relaxed text-d-text-3">
        Drag a card to another stage. Stages with a lock need evidence and are confirmed on the record, not by dragging. Each investor is tracked per offering: the same investor
        can be in diligence for one offering and funded in another.
      </p>
    </div>
  );
}

function StageBox({
  s,
  list,
  over,
  onOver,
  onLeave,
  onDrop,
  collapsed,
  onExpand,
  multi,
  onOpen,
}: {
  s: (typeof STAGES)[number];
  list: Opportunity[];
  over: boolean;
  onOver: () => void;
  onLeave: () => void;
  onDrop: (e: DragEvent) => void;
  collapsed: boolean;
  onExpand: () => void;
  multi: boolean;
  onOpen: (o: Opportunity) => void;
}) {
  const total = list.reduce((a, o) => a + (headline(o).value ?? 0), 0);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onOver();
      }}
      onDragLeave={onLeave}
      onDrop={onDrop}
      className={cx("rounded-[10px] p-1.5 transition-colors", over && (s.gate ? "bg-[color-mix(in_oklab,var(--color-gold-500)_10%,transparent)]" : "bg-d-raise"))}
    >
      <div className="flex items-center gap-1.5 px-1 pb-1.5 text-[11.5px]">
        {s.gate && <Lock size={10.5} className="text-d-text-3" />}
        <span className="font-semibold text-d-text-2">{s.label}</span>
        <span className="tnum text-d-text-3">{list.length}</span>
        <span className="tnum ml-auto text-d-text-3">{list.length ? usdShort(total) : ""}</span>
      </div>
      {collapsed ? (
        <button onClick={onExpand} className="w-full rounded-[9px] border border-dashed border-d-line px-3 py-2 text-left text-[12px] text-d-text-3 hover:text-d-text">
          {list.length} investors funded · show
        </button>
      ) : (
        <div className="space-y-1.5">
          {list.map((o) => (
            <Card
              key={o.id}
              o={o}
              showOffering={multi}
              onOpen={() => onOpen(o)}
              onDrag={(e) => {
                e.dataTransfer.setData("text/plain", o.id);
                e.dataTransfer.effectAllowed = "move";
              }}
            />
          ))}
          {!list.length && <div className="h-6 rounded-[8px] border border-dashed border-d-line-soft" />}
        </div>
      )}
    </div>
  );
}

/* ───────── page ───────── */

export function PipelinePage() {
  const s = useOfferingState();
  const opps = useMemo(() => applyMoves(s), [s]);
  const params = useSearchParams();
  const [view, setView] = useState<"board" | "table" | "analytics">("board");
  const [scope, setScope] = useState("all");
  const [open, setOpen] = useState<Opportunity | null>(null);
  const phase = params.get("phase") as PhaseId | null;
  const list = opps.filter((o) => (scope === "all" || o.offeringId === scope) && (!phase || stageOf(o.stage).phase === phase));
  const live = OFFERINGS.filter((o) => opps.some((x) => x.offeringId === o.id));

  return (
    <div>
      <PageHead
        eyebrow="Offering Solution"
        title="Investor pipeline"
        meta={
          phase ? `Showing the ${phase} phase · ${list.length} investors` : `${list.length} investor opportunities across ${new Set(list.map((o) => o.offeringId)).size} offerings`
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              aria-label="Offering"
              className="h-8 rounded-[8px] border border-d-line bg-transparent px-2 text-[12.5px] font-medium text-d-text focus:outline-none"
            >
              <option value="all">All offerings</option>
              {live.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.short}
                </option>
              ))}
            </select>
            <Seg
              label="View"
              value={view}
              onChange={setView}
              options={[
                ["board", "Board"],
                ["table", "Table"],
                ["analytics", "Analytics"],
              ]}
            />
          </div>
        }
      />
      {view === "board" && <PipelineBoard opps={list} onOpen={setOpen} />}
      {view === "table" && <PipelineTable opps={list} onOpen={setOpen} />}
      {view === "analytics" && <PipelineAnalytics opps={list} />}
      {open && <OpportunityDrawer opp={opps.find((x) => x.id === open.id) ?? open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PipelineTable({ opps, onOpen }: { opps: Opportunity[]; onOpen: (o: Opportunity) => void }) {
  const sorted = [...opps].sort((a, b) => STAGES.findIndex((s) => s.id === b.stage) - STAGES.findIndex((s) => s.id === a.stage));
  const td = "px-3 py-2.5 first:pl-4 last:pr-4 align-top";
  return (
    <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
      <table className="w-full min-w-[1040px] text-[13px]">
        <thead className="border-b border-d-line text-[11.5px] text-d-text-3">
          <tr>
            {["Investor", "Offering", "Stage", "Amount", "Owner", "Distributed by", "Last activity", "Next action"].map((h, i) => (
              <th key={h} className={cx("px-3 py-2.5 text-left font-medium first:pl-4 last:pr-4", i === 3 && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => {
            const p = partyById(o.partyId)!;
            const h = headline(o);
            return (
              <tr key={o.id} onClick={() => onOpen(o)} className="cursor-pointer border-b border-d-line-soft last:border-0 hover:bg-d-raise">
                <td className={td}>
                  <span className="flex items-center gap-2 font-medium text-d-text">
                    {p.name} {(o.illustrative || p.illustrative) && <Illus short />}
                  </span>
                  <span className="text-[12px] text-d-text-3">{p.type}</span>
                </td>
                <td className={cx(td, "text-d-text-2")}>{offeringById(o.offeringId)?.short}</td>
                <td className={td}>
                  <StagePill stage={o.stage} />
                </td>
                <td className={cx(td, "tnum text-right")}>
                  <div className="text-d-text">{usd(h.value)}</div>
                  <div className="text-[11.5px] text-d-text-3">
                    {h.label}
                    {o.amountsIllustrative && " · est."}
                  </div>
                </td>
                <td className={cx(td, "whitespace-nowrap text-d-text-2")}>{o.owner}</td>
                <td className={cx(td, "text-d-text-2")}>{o.distributor ?? offeringById(o.offeringId)?.distributors[0]?.name}</td>
                <td className={cx(td, "tnum whitespace-nowrap text-d-text-3")}>{dayShort(o.lastInteraction)}</td>
                <td className={cx(td, "max-w-[260px] text-d-text-2")}>
                  {o.next?.action ?? "—"}
                  {o.next?.date && <span className="tnum ml-1.5 text-d-text-3">{dayShort(o.next.date)}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PipelineAnalytics({ opps }: { opps: Opportunity[] }) {
  const rows = STAGES.map((s) => {
    const list = opps.filter((o) => o.stage === s.id);
    return { s, n: list.length, amount: list.reduce((a, o) => a + (headline(o).value ?? 0), 0) };
  });
  const maxN = Math.max(1, ...rows.map((r) => r.n));
  const byType = new Map<string, number>();
  for (const o of opps.filter((x) => x.amounts.accepted !== undefined)) {
    const t = partyById(o.partyId)!.type;
    byType.set(t, (byType.get(t) ?? 0) + (o.amounts.accepted ?? 0));
  }
  const types = [...byType.entries()].sort((a, b) => b[1] - a[1]);
  const maxT = Math.max(1, ...types.map((t) => t[1]));
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
        <h2 className="text-[13px] font-semibold text-d-text">Investors by stage</h2>
        <p className="mt-0.5 text-[12px] text-d-text-3">Count and the most advanced amount per investor, never added across kinds.</p>
        <ul className="mt-3 space-y-1.5">
          {rows.map(({ s, n, amount }) => (
            <li key={s.id} className="grid grid-cols-[150px_minmax(0,1fr)_70px] items-center gap-3 text-[12.5px]">
              <span className={cx("truncate", s.phase ? "text-d-text-2" : "text-d-text-3")}>{s.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-d-line-soft">
                <span className="block h-full rounded-full bg-d-text-3" style={{ width: `${(n / maxN) * 100}%` }} />
              </span>
              <span className="tnum text-right text-d-text">
                {n} <span className="text-d-text-3">{n ? `· ${usdShort(amount)}` : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="space-y-6">
        <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <h2 className="text-[13px] font-semibold text-d-text">Accepted commitments by investor type</h2>
          <ul className="mt-3 space-y-1.5">
            {types.map(([t, v]) => (
              <li key={t} className="grid grid-cols-[150px_minmax(0,1fr)_70px] items-center gap-3 text-[12.5px]">
                <span className="truncate text-d-text-2">{t}</span>
                <span className="h-2 overflow-hidden rounded-full bg-d-line-soft">
                  <span className="block h-full rounded-full" style={{ width: `${(v / maxT) * 100}%`, background: "var(--color-up)" }} />
                </span>
                <span className="tnum text-right text-d-text">{usdShort(v)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[12px] border border-dashed border-d-line px-5 py-4 text-[12.5px] leading-relaxed text-d-text-3">
          <h2 className="mb-1 text-[13px] font-semibold text-d-text-2">Conversion and time in stage</h2>
          Conversion rates and average time per stage need the dated history of stage changes. It is recorded from now on, with every move in the audit log; the figures appear once
          there is enough of it to be meaningful.
        </section>
      </div>
    </div>
  );
}
