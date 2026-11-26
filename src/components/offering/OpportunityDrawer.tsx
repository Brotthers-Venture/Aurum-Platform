"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { cx } from "@/components/ui";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { AGREEMENTS, INTERACTIONS, PHASES, STAGES, offeringById, partyById, stageOf, type Opportunity, type StageId } from "@/lib/offering/data";
import { gateBlock, movesFor, offering, useOfferingState } from "@/lib/offering/store";
import { Drawer, Illus, KV, Section, StagePill, StageTrack, amountRows, day, usd } from "./ui";

export function OpportunityDrawer({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  const s = useOfferingState();
  const { member } = usePreviewRole();
  const party = partyById(opp.partyId)!;
  const o = offeringById(opp.offeringId)!;
  const [picking, setPicking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const agreements = AGREEMENTS.filter((a) => a.offeringId === opp.offeringId && a.partyId === opp.partyId);
  const engagement = INTERACTIONS.filter((x) => x.partyId === opp.partyId && x.offeringId === opp.offeringId).slice(0, 6);
  const history = movesFor(s, opp.id);
  const amounts = amountRows(opp.amounts).filter(([, v]) => v !== undefined);
  const derived = opp.source !== "Recorded by hand";

  const move = (to: StageId) => {
    const err = offering.move(opp, to, member.name);
    setMsg(err);
    if (!err) setPicking(false);
  };

  return (
    <Drawer
      onClose={onClose}
      kicker={
        <Link href={`/admin/offering/offerings/${o.id}`} className="hover:text-d-text hover:underline">
          {o.short}
        </Link>
      }
      title={
        <span className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/offering/investors/${party.id}`} className="hover:underline">
            {party.name}
          </Link>
          {(opp.illustrative || party.illustrative) && <Illus />}
        </span>
      }
    >
      <Section>
        <StageTrack stage={opp.stage} />
      </Section>

      <Section
        title="Stage"
        aside={
          <button onClick={() => setPicking((p) => !p)} className="text-[12px] font-semibold text-d-text-2 hover:text-d-text">
            {picking ? "Done" : "Change"}
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <StagePill stage={opp.stage} />
          <span className="text-[12px] text-d-text-3">
            {derived ? `From the ${opp.source.toLowerCase()}` : "Recorded by hand"}
            {opp.lastInteraction ? ` · last activity ${day(opp.lastInteraction)}` : ""}
          </span>
        </div>
        {picking && (
          <div className="mt-3 rounded-[10px] border border-d-line p-2">
            {PHASES.map((ph) => (
              <div key={ph.id} className="mb-1.5">
                <div className="px-1.5 pb-0.5 text-[11px] text-d-text-3">{ph.label}</div>
                <div className="flex flex-wrap gap-1">
                  {STAGES.filter((x) => x.phase === ph.id).map((x) => {
                    const block = x.gate ? gateBlock(opp, x.id) : null;
                    return (
                      <button
                        key={x.id}
                        onClick={() => move(x.id)}
                        title={x.gate ? `Needs: ${x.gate}` : undefined}
                        className={cx(
                          "inline-flex h-7 items-center gap-1 rounded-[6px] border px-2 text-[12px]",
                          opp.stage === x.id ? "border-d-text bg-d-raise font-semibold text-d-text" : "border-d-line text-d-text-2 hover:bg-d-raise hover:text-d-text",
                          block && "opacity-60",
                        )}
                      >
                        {x.gate && <Lock size={11} />}
                        {x.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-1 border-t border-d-line-soft px-1.5 pt-2">
              {STAGES.filter((x) => !x.phase).map((x) => (
                <button key={x.id} onClick={() => move(x.id)} className="h-7 rounded-[6px] border border-d-line px-2 text-[12px] text-d-text-3 hover:text-d-text">
                  {x.label}
                </button>
              ))}
            </div>
            <p className="mt-2 px-1.5 text-[11.5px] leading-relaxed text-d-text-3">
              Stages with a lock need evidence: an executed NDA, the manager’s countersignature with a cleared compliance file, or a receipt in the books. Every change is in the
              audit log.
            </p>
          </div>
        )}
        {msg && <p className="mt-2 rounded-[8px] border border-attn-line px-3 py-2 text-[12px] text-gold-700">{msg}</p>}
      </Section>

      <Section title="Amounts" aside={opp.amountsIllustrative ? <Illus title="The stage is on record; the potential ticket is an estimate" /> : undefined}>
        <KV
          rows={amounts.map(([k, v]) => [
            k,
            <span key={k} className="tnum">
              {usd(v)}
            </span>,
          ])}
        />
        <p className="mt-2 text-[11.5px] leading-relaxed text-d-text-3">
          Each kind is kept separate: only an accepted commitment binds the investor, and only the fund’s books show capital as received.
        </p>
      </Section>

      {opp.next && (
        <Section title="Next action" aside={opp.next.illustrative ? <Illus short /> : undefined}>
          <div className="flex items-start gap-3 rounded-[10px] border border-d-line px-3 py-2.5">
            <span className="flex-1 text-[13px] text-d-text">{opp.next.action}</span>
            {opp.next.date && <span className="tnum shrink-0 text-[12px] text-d-text-3">{day(opp.next.date)}</span>}
          </div>
        </Section>
      )}

      <Section title="Agreements">
        {agreements.length ? (
          <ul className="divide-y divide-d-line-soft">
            {agreements.map((a) => (
              <li key={a.id} className="flex items-center gap-2 py-1.5">
                <span className="flex-1 text-d-text">{a.kind}</span>
                <span className={cx("text-[12px]", a.status === "Fully executed" ? "text-up-ink" : "text-d-text-2")}>{a.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-d-text-3">None yet.</p>
        )}
        <Link href={`/admin/offering/agreements?offering=${o.id}`} className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-d-text-2 hover:text-d-text">
          All agreements for {o.short} <ArrowRight size={12} />
        </Link>
      </Section>

      {engagement.length > 0 && (
        <Section title="Recent activity">
          <ul className="space-y-2">
            {engagement.map((x) => (
              <li key={x.id} className="text-[12.5px]">
                <div className="text-d-text">{x.text}</div>
                <div className="mt-0.5 text-[11.5px] text-d-text-3">
                  {x.kind} · {day(x.at)} · {x.source}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] text-d-text-3">Document views and downloads are signals, not intent to invest.</p>
        </Section>
      )}

      {(history.length > 0 || opp.note) && (
        <Section title="History">
          <ul className="space-y-1.5 text-[12px] text-d-text-2">
            {history
              .slice()
              .reverse()
              .map((m, i) => (
                <li key={i}>
                  {stageOf(m.from).label} → {stageOf(m.to).label} · {m.by} · {day(m.at)}
                </li>
              ))}
            {opp.note && <li className="text-d-text-3">{opp.note}</li>}
          </ul>
        </Section>
      )}

      <Section title="Owner">
        <KV
          rows={[
            ["Relationship owner", opp.owner],
            ["Distributed by", opp.distributor ?? o.distributors[0]?.name ?? "—"],
            ["Introduced", party.source],
          ]}
        />
      </Section>
      <div className="flex flex-wrap gap-2 pb-2">
        <Link
          href={`/admin/offering/investors/${party.id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise"
        >
          Investor profile
        </Link>
        {o.roomId && (
          <Link
            href="/admin/dataroom"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise"
          >
            Data room
          </Link>
        )}
        {opp.source === "Subscription" && (
          <Link
            href="/admin/fund/onboarding"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-d-line px-3 text-[12.5px] font-semibold text-d-text hover:bg-d-raise"
          >
            Subscription in Fund Solution
          </Link>
        )}
      </div>
    </Drawer>
  );
}

export { StagePill };
