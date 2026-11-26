"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, FileSignature, MessageSquare, Users } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { AGREEMENTS, INTERACTIONS, OFFERINGS, commitmentSeries, figures, offeringById, partyById, type Opportunity } from "@/lib/offering/data";
import { applyMoves, useOfferingState } from "@/lib/offering/store";
import { questions } from "@/lib/dataroom";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { Illus, Ladder, LadderLegend, Seg, StagePill, day, dayShort, daysFrom, ladderRows, usd, usdShort } from "./ui";

export function OfferingOverview() {
  const s = useOfferingState();
  const opps = useMemo(() => applyMoves(s), [s]);
  const [scope, setScope] = useState("all");
  const [hero, setHero] = useState<"accepted" | "received">("accepted");
  const [open, setOpen] = useState<Opportunity | null>(null);
  const active = OFFERINGS.filter((o) => o.status !== "Preparing" && o.status !== "Closed");
  const ids = scope === "all" ? active.map((o) => o.id) : [scope];
  const f = figures(ids, opps);
  const rows = ladderRows(f);
  const inScope = opps.filter((o) => ids.includes(o.offeringId));

  // attention: things with a person waiting on us, earliest first
  const attention = [
    ...inScope
      .filter((o) => o.next && (o.stage === "pending_approval" || o.stage === "subscription" || o.stage === "accepted" || (o.next.date && daysFrom(o.next.date) <= 3)))
      .map((o) => ({ o, text: o.next!.action, date: o.next!.date, illustrative: o.next!.illustrative || o.illustrative })),
  ]
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .slice(0, 7);
  const ndasOut = AGREEMENTS.filter((a) => a.kind === "NDA" && ids.includes(a.offeringId) && ["Required", "Draft", "Sent", "Viewed", "Partially signed"].includes(a.status));
  const subsPending = inScope.filter((o) => o.stage === "pending_approval" || o.stage === "subscription");
  const openQs = questions.filter((q) => q.status !== "Answered" && OFFERINGS.some((o) => ids.includes(o.id) && o.roomId === q.roomId));
  const upcoming = INTERACTIONS.filter((x) => x.upcoming && (!x.offeringId || ids.includes(x.offeringId))).sort((a, b) => a.at.localeCompare(b.at));
  const closings = OFFERINGS.filter((o) => ids.includes(o.id) && o.nextClose).sort((a, b) => a.nextClose!.date.localeCompare(b.nextClose!.date));
  const recent = INTERACTIONS.filter((x) => !x.upcoming && (!x.offeringId || ids.includes(x.offeringId))).slice(0, 7);

  const heroValue = hero === "accepted" ? f.accepted : f.received;
  const pctOf = f.target ? heroValue / f.target : null;

  return (
    <div>
      <PageHead
        eyebrow="Offering Solution"
        title="Capital formation"
        meta={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>As of {day("2026-11-24")} · all amounts in USD</span>
            <span className="text-d-text-3">Prototype for review: early prospects, potential tickets and meetings are illustrative.</span>
          </span>
        }
        action={
          <label className="inline-flex items-center gap-2 text-[12.5px] text-d-text-3">
            <span className="sr-only">Offering</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="h-8 rounded-[8px] border border-d-line bg-transparent px-2 text-[12.5px] font-medium text-d-text focus:outline-none"
            >
              <option value="all">All open offerings ({active.length})</option>
              {active.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.short}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {/* hero: how much has been raised */}
      <section className="rounded-[14px] border border-d-line bg-d-surface px-6 py-5">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div>
            <Seg
              label="Headline figure"
              value={hero}
              onChange={setHero}
              options={[
                ["accepted", "Accepted commitments"],
                ["received", "Capital received"],
              ]}
            />
            <div className="font-display tnum mt-4 text-[44px] font-light leading-none tracking-[-0.025em] text-d-text">{usdShort(heroValue)}</div>
            <div className="mt-2 text-[13px] text-d-text-2">
              {pctOf !== null ? (
                <>
                  {Math.round(pctOf * 100)}% of {usdShort(f.target)} targeted
                </>
              ) : (
                "No target recorded"
              )}
              {hero === "accepted" && f.acceptedNotInBooks > 0 && (
                <span className="text-d-text-3"> · {usdShort(f.acceptedNotInBooks)} countersigned, admitted at the next closing</span>
              )}
              {hero === "received" && <span className="text-d-text-3"> · {usdShort(f.called)} called to date, from the fund books</span>}
            </div>
            {f.targetIllustrative.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-d-text-3">
                <Illus short /> Target for {f.targetIllustrative.join(", ")} not yet set by the sponsor
              </div>
            )}
          </div>
          <RaisedChart ids={ids} target={f.target} />
        </div>
        <div className="mt-5 border-t border-d-line-soft pt-4">
          <div className="mb-2 flex items-baseline justify-between text-[12px] text-d-text-3">
            <span>Where the rest of the target comes from</span>
            <span className="tnum">Remaining {usdShort(f.remaining)}</span>
          </div>
          <Ladder target={f.target || null} rows={rows} />
          <LadderLegend
            rows={rows}
            extra={
              <div>
                <dt className="text-d-text-3">Weighted pipeline</dt>
                <dd className="mt-0.5 text-[12.5px] text-d-text-3" title="Weighting needs a closing probability per stage, set by an authorized user">
                  Not configured
                </dd>
              </div>
            }
          />
        </div>
      </section>

      {/* what needs attention */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-d-text">Needs attention</h2>
          <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 px-1 text-[12.5px] text-d-text-2">
            <Link href="/admin/offering/pipeline?phase=subscription" className="inline-flex items-center gap-1.5 hover:text-d-text">
              <Users size={13} className="text-d-text-3" /> {subsPending.length} subscriptions open
            </Link>
            <Link href="/admin/offering/agreements?status=outstanding" className="inline-flex items-center gap-1.5 hover:text-d-text">
              <FileSignature size={13} className="text-d-text-3" /> {ndasOut.length} NDAs outstanding
            </Link>
            <Link href="/admin/dataroom" className="inline-flex items-center gap-1.5 hover:text-d-text">
              <MessageSquare size={13} className="text-d-text-3" /> {openQs.length} investor questions open
            </Link>
          </div>
          <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
            {attention.map(({ o, text, date, illustrative }) => {
              const p = partyById(o.partyId)!;
              const due = date ? daysFrom(date) : null;
              return (
                <li key={o.id}>
                  <button onClick={() => setOpen(o)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-d-raise">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-d-text">{text}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-d-text-3">
                        <span className="text-d-text-2">{p.name}</span>· {offeringById(o.offeringId)!.short} · <StagePill stage={o.stage} />
                        {illustrative && <Illus short />}
                      </div>
                    </div>
                    <span className={cx("tnum shrink-0 text-[12px]", due !== null && due < 0 ? "text-negative" : due !== null && due <= 1 ? "text-gold-700" : "text-d-text-3")}>
                      {due === null ? "Waiting" : due < 0 ? `${-due}d overdue` : due === 0 ? "Today" : due === 1 ? "Tomorrow" : dayShort(date)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-d-text">Coming up</h2>
          <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
            {closings.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                <CalendarDays size={14} className="shrink-0 text-d-text-3" />
                <Link href={`/admin/offering/offerings/${o.id}`} className="min-w-0 flex-1 text-[13px] text-d-text hover:underline">
                  {o.nextClose!.label} · {o.short}
                </Link>
                {o.illustrative.includes("nextClose") && <Illus short />}
                <span className="tnum text-[12px] text-d-text-3">{dayShort(o.nextClose!.date)}</span>
              </li>
            ))}
            {upcoming.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-4 py-3">
                <Users size={14} className="shrink-0 text-d-text-3" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-d-text">
                    {x.kind} with {partyById(x.partyId)?.name}
                  </div>
                  <div className="truncate text-[12px] text-d-text-3">{x.text}</div>
                </div>
                <Illus short />
                <span className="tnum text-[12px] text-d-text-3">{dayShort(x.at)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-1 text-[11.5px] text-d-text-3">Meetings come from calendars once a calendar is connected; the ones shown are illustrative.</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-2 flex items-center px-1">
            <h2 className="flex-1 text-[13px] font-semibold text-d-text">Open offerings</h2>
            <Link href="/admin/offering/offerings" className="inline-flex items-center gap-1 text-[12px] text-d-text-3 hover:text-d-text">
              Register <ArrowRight size={12} />
            </Link>
          </div>
          <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
            {active.map((o) => {
              const fo = figures([o.id], opps);
              return (
                <li key={o.id}>
                  <Link href={`/admin/offering/offerings/${o.id}`} className="block px-4 py-3 hover:bg-d-raise">
                    <div className="flex items-baseline gap-3">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-d-text">{o.name}</span>
                      <span className="tnum text-[12.5px] text-d-text">{usdShort(fo.accepted)}</span>
                      <span className="tnum w-[92px] text-right text-[12px] text-d-text-3">
                        of {usdShort(o.target)} {o.illustrative.includes("target") && "*"}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Ladder target={o.target} rows={ladderRows(fo)} height={5} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 px-1 text-[11.5px] text-d-text-3">* Target illustrative until the sponsor sets it.</p>
        </section>
        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-d-text">Recent investor activity</h2>
          <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
            {recent.map((x) => (
              <li key={x.id} className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/offering/investors/${x.partyId}`} className="min-w-0 flex-1 truncate text-[13px] text-d-text hover:underline">
                    {partyById(x.partyId)?.name}
                  </Link>
                  {x.illustrative && <Illus short />}
                  <span className="tnum text-[11.5px] text-d-text-3">{dayShort(x.at)}</span>
                </div>
                <div className="mt-0.5 truncate text-[12px] text-d-text-3">
                  {x.kind} · {x.text}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {open && <OpportunityDrawer opp={opps.find((x) => x.id === open.id) ?? open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Accepted commitments in the books, cumulative by closing, against the target: the only capital formation line there is evidence for. */
function RaisedChart({ ids, target }: { ids: string[]; target: number }) {
  const pts = useMemo(() => {
    const ev = ids.flatMap((id) => {
      const s = commitmentSeries(id);
      return s.map((p, i) => ({ date: p.date, add: p.total - (i ? s[i - 1].total : 0) }));
    });
    ev.sort((a, b) => a.date.localeCompare(b.date));
    const out: { date: string; total: number }[] = [];
    for (const e of ev) {
      const last = out[out.length - 1];
      if (last && last.date === e.date) last.total += e.add;
      else out.push({ date: e.date, total: (last?.total ?? 0) + e.add });
    }
    return out;
  }, [ids]);
  if (pts.length === 0)
    return (
      <div className="flex items-center justify-center rounded-[10px] border border-dashed border-d-line text-[12.5px] text-d-text-3">
        No accepted commitments in the books yet.
      </div>
    );
  const W = 900;
  const H = 230;
  const L = 8;
  const R = 104;
  const T = 12;
  const B = 22;
  const t0 = Date.parse(pts[0].date) - 60 * 864e5;
  const t1 = Date.parse("2026-11-24");
  const max = Math.max(target, pts[pts.length - 1].total) * 1.04;
  const x = (d: string | number) => L + ((Number(typeof d === "string" ? Date.parse(d) : d) - t0) / (t1 - t0)) * (W - L - R);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  let d = `M${x(t0)},${y(0)}`;
  for (const p of pts) d += `H${x(p.date).toFixed(1)}V${y(p.total).toFixed(1)}`;
  d += `H${x(t1)}`;
  const last = pts[pts.length - 1];
  const years = [];
  for (let yr = new Date(t0).getUTCFullYear() + 1; yr <= 2026; yr++) years.push(yr);
  return (
    <figure className="m-0 min-w-0">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Accepted commitments over time against the target" className="text-d-text">
        {target > 0 && (
          <>
            <line x1={L} x2={W - R} y1={y(target)} y2={y(target)} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="3 4" />
            <text x={W - R + 6} y={y(target) + 3.5} fontSize={10.5} fill="currentColor" fillOpacity={0.55}>
              Target {usdShort(target)}
            </text>
          </>
        )}
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.15} />
        <path d={`${d}V${y(0)}H${x(t0)}Z`} fill="currentColor" fillOpacity={0.05} />
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" />
        <circle cx={x(t1)} cy={y(last.total)} r={3} fill="currentColor" />
        <text x={x(t1) + 6} y={y(last.total) + 3.5} fontSize={10.5} fontWeight={600} fill="currentColor">
          {usdShort(last.total)}
        </text>
        {years.map((yr) => (
          <text key={yr} x={x(`${yr}-01-01`)} y={H - 6} fontSize={10} textAnchor="middle" fill="currentColor" fillOpacity={0.5}>
            {yr}
          </text>
        ))}
      </svg>
      <figcaption className="mt-1 text-[11.5px] text-d-text-3">
        Accepted commitments in the fund books, by closing date. Source: Fund Solution capital accounts. {usd(last.total)}.
      </figcaption>
    </figure>
  );
}
