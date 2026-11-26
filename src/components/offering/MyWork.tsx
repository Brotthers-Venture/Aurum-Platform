"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHead } from "@/components/gp/GpKit";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { useOffering, type FollowUp } from "@/lib/offering/store";
import type { Opportunity } from "@/lib/offering/data";
import { FollowUpRow, TODAY } from "./Forms";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { Empty, Illus, Seg, StagePill } from "./ui";

const days = (iso: string) => Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${TODAY}T12:00:00Z`)) / 864e5);

/** Follow-ups by when they are due, then what the pipeline is waiting on for this person’s investors. */
export function MyWork() {
  const d = useOffering();
  const router = useRouter();
  const me = usePreviewRole().member.name;
  const [whose, setWhose] = useState<"mine" | "all">("mine");
  const [open, setOpen] = useState<Opportunity | null>(null);
  const mineOnly = (f: FollowUp) => whose === "all" || f.owner === me;
  const openList = d.openFollowUps(mineOnly);
  const groups: [string, FollowUp[]][] = [
    ["Overdue", openList.filter((f) => days(f.due) < 0)],
    ["Today", openList.filter((f) => days(f.due) === 0)],
    ["Next 7 days", openList.filter((f) => days(f.due) > 0 && days(f.due) <= 7)],
    ["Later", openList.filter((f) => days(f.due) > 7)],
  ];
  const done = d.followUps
    .filter((f) => f.done && mineOnly(f))
    .sort((a, b) => b.done!.at.localeCompare(a.done!.at))
    .slice(0, 8);
  const waiting = d.opps.filter((o) => o.next && (whose === "all" || o.owner === me)).sort((a, b) => (a.next!.date ?? "9999").localeCompare(b.next!.date ?? "9999"));
  const goTo = (f: FollowUp) => {
    const o = f.oppId ? d.opps.find((x) => x.id === f.oppId) : undefined;
    if (o) setOpen(o);
    else router.push(`/admin/offering/investors/${f.partyId}`);
  };

  return (
    <div>
      <PageHead
        eyebrow="Offering Solution"
        title="My work"
        meta={`${openList.length} open follow-ups${whose === "mine" ? ` for ${me}` : ""} · as of ${TODAY.slice(5).replace("-", "/")}`}
        action={
          <Seg
            label="Whose"
            value={whose}
            onChange={setWhose}
            options={[
              ["mine", "Mine"],
              ["all", "Everyone"],
            ]}
          />
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section>
          {openList.length === 0 && done.length === 0 ? (
            <Empty>No follow-ups yet. Schedule one from an investor’s record or from the pipeline.</Empty>
          ) : (
            groups
              .filter(([, l]) => l.length)
              .map(([g, l]) => (
                <div key={g} className="mb-5">
                  <h2 className="mb-1.5 px-1 text-[12.5px] font-semibold text-d-text-2">
                    {g} <span className="tnum font-normal text-d-text-3">{l.length}</span>
                  </h2>
                  <ul className="divide-y divide-d-line-soft rounded-[12px] border border-d-line bg-d-surface px-4">
                    {l.map((f) => (
                      <FollowUpRow key={f.id} f={f} d={d} showContext onOpen={() => goTo(f)} />
                    ))}
                  </ul>
                </div>
              ))
          )}
          {done.length > 0 && (
            <div>
              <h2 className="mb-1.5 px-1 text-[12.5px] font-semibold text-d-text-3">Done recently</h2>
              <ul className="divide-y divide-d-line-soft rounded-[12px] border border-d-line px-4">
                {done.map((f) => (
                  <FollowUpRow key={f.id} f={f} d={d} showContext onOpen={() => goTo(f)} />
                ))}
              </ul>
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-1.5 px-1 text-[12.5px] font-semibold text-d-text-2">
            The pipeline is waiting on <span className="tnum font-normal text-d-text-3">{waiting.length}</span>
          </h2>
          <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
            {waiting.slice(0, 14).map((o) => (
              <li key={o.id}>
                <button onClick={() => setOpen(o)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-d-raise">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-d-text">{o.next!.action}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-d-text-3">
                      {d.party(o.partyId)?.name} · {d.offering(o.offeringId)?.short} <StagePill stage={o.stage} />
                      {(o.illustrative || o.next!.illustrative) && <Illus short />}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {!waiting.length && <li className="px-4 py-3 text-[12.5px] text-d-text-3">Nothing waiting.</li>}
          </ul>
          <p className="mt-2 px-1 text-[11.5px] text-d-text-3">Steps that depend on an investor, compliance or the manager. Schedule a follow-up to chase one.</p>
        </section>
      </div>
      {open && d.opps.some((x) => x.id === open.id) && <OpportunityDrawer opp={d.opps.find((x) => x.id === open.id)!} onClose={() => setOpen(null)} />}
    </div>
  );
}
