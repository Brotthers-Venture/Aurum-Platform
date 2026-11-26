"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ArrowLeft, ArrowRight, FolderLock } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { GpMark } from "@/components/brand/GpLogo";
import { gpById } from "@/lib/gps";
import { rooms, views } from "@/lib/dataroom";
import { AGREEMENTS, INTERACTIONS, type Offering, type Opportunity } from "@/lib/offering/data";
import { useOffering } from "@/lib/offering/store";
import { AgreementTable } from "./Agreements";
import { AddToPipeline, OfferingForm, btnPrimary, btnSecondary } from "./Forms";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { PipelineBoard } from "./Pipeline";
import { Empty, Illus, KV, Ladder, LadderLegend, Seg, StagePill, day, ladderRows, usd, usdShort } from "./ui";

const STATUS_TONE: Record<Offering["status"], string> = {
  Open: "border-d-text-3 text-d-text",
  "Subsequent close": "border-d-text-3 text-d-text",
  Preparing: "border-d-line text-d-text-3",
  Closed: "border-d-line text-d-text-2",
};
export function OfferingStatus({ s }: { s: Offering["status"] }) {
  return <span className={cx("inline-flex whitespace-nowrap rounded-[6px] border px-1.5 py-px text-[11.5px]", STATUS_TONE[s])}>{s}</span>;
}

function Mark({ o, size = 28 }: { o: Offering; size?: number }) {
  const gp = o.gpId ? gpById(o.gpId) : undefined;
  if (gp) return <GpMark gp={gp} size={size} />;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[7px] border border-d-line text-[11px] font-semibold text-d-text-2" style={{ width: size, height: size }}>
      {o.sponsor
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

/* ───────── register ───────── */

export function OfferingRegister() {
  const d = useOffering();
  const router = useRouter();
  const [show, setShow] = useState<"open" | "all">("open");
  const [creating, setCreating] = useState(false);
  const list = d.offerings.filter((o) => show === "all" || o.status === "Open" || o.status === "Subsequent close");
  const th = "px-3 py-2.5 text-left text-[11.5px] font-medium text-d-text-3 first:pl-4 last:pr-4 whitespace-nowrap";
  const td = "px-3 py-3 first:pl-4 last:pr-4 align-middle";
  return (
    <div>
      <PageHead
        eyebrow="Offering Solution"
        title="Offerings"
        meta="Every offering we coordinate, with what has been accepted and where the rest of the target stands. Amounts in USD."
        action={
          <div className="flex items-center gap-2">
            <Seg
              label="Show"
              value={show}
              onChange={setShow}
              options={[
                ["open", "Open"],
                ["all", "All"],
              ]}
            />
            <button onClick={() => setCreating(true)} className={btnPrimary}>
              <Plus size={15} /> New offering
            </button>
          </div>
        }
      />
      {creating && <OfferingForm onClose={() => setCreating(false)} onSaved={(id) => router.push(`/admin/offering/offerings/${id}`)} />}
      <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
        <table className="w-full min-w-[980px] text-[13px]">
          <thead className="border-b border-d-line">
            <tr>
              <th className={th}>Offering</th>
              <th className={th}>Type</th>
              <th className={th}>Status</th>
              <th className={cx(th, "text-right")}>Target</th>
              <th className={cx(th, "text-right")}>Accepted</th>
              <th className={cx(th, "w-[220px]")}>Progress</th>
              <th className={cx(th, "text-right")}>In subscription</th>
              <th className={th}>Next closing</th>
              <th className={th}>Lead</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const f = d.figures([o.id]);
              return (
                <tr key={o.id} className="border-b border-d-line-soft last:border-0 hover:bg-d-raise">
                  <td className={td}>
                    <Link href={`/admin/offering/offerings/${o.id}`} className="flex items-center gap-3">
                      <Mark o={o} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-d-text hover:underline">{o.name}</span>
                        <span className="block truncate text-[12px] text-d-text-3">
                          {o.sponsor} · {o.jurisdiction}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className={cx(td, "text-d-text-2")}>{o.type}</td>
                  <td className={td}>
                    <OfferingStatus s={o.status} />
                  </td>
                  <td className={cx(td, "tnum text-right text-d-text")}>
                    {o.target ? usdShort(o.target) : <span className="text-d-text-3">Pending terms</span>}
                    {o.illustrative.includes("target") && (
                      <span className="ml-1.5">
                        <Illus short />
                      </span>
                    )}
                  </td>
                  <td className={cx(td, "tnum text-right text-d-text")}>{usdShort(f.accepted)}</td>
                  <td className={td}>
                    <Ladder target={o.target} rows={ladderRows(f)} height={5} />
                    <div className="tnum mt-1 text-[11.5px] text-d-text-3">{o.target ? `${Math.round((f.accepted / o.target) * 100)}% accepted` : "—"}</div>
                  </td>
                  <td className={cx(td, "tnum text-right text-d-text-2")}>{f.subscribed ? usdShort(f.subscribed) : "—"}</td>
                  <td className={cx(td, "whitespace-nowrap text-d-text-2")}>
                    {o.nextClose ? (
                      <span className="inline-flex items-center gap-1.5">
                        {day(o.nextClose.date)} {o.illustrative.includes("nextClose") && <Illus short />}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={cx(td, "whitespace-nowrap text-d-text-2")}>{o.lead}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 px-1 text-[12px] leading-relaxed text-d-text-3">
        Accepted commitments come from the fund books or a countersigned subscription. Progress shows accepted, subscribed, soft, indicated and potential amounts as separate
        segments against the target line; each investor counts once, at their most advanced amount.
      </p>
    </div>
  );
}

/* ───────── detail ───────── */

type Tab = "overview" | "pipeline" | "commitments" | "documents" | "distribution" | "activity";

export function OfferingDetail({ id }: { id: string }) {
  const d = useOffering();
  const opps = d.opps;
  const [tab, setTab] = useState<Tab>("overview");
  const [open, setOpen] = useState<Opportunity | null>(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const o = d.offering(id);
  if (!o)
    return (
      <div className="py-16">
        <Empty>
          This offering doesn’t exist.{" "}
          <Link href="/admin/offering/offerings" className="underline">
            Back to offerings
          </Link>
        </Empty>
      </div>
    );
  const f = d.figures([o.id]);
  const mine = opps.filter((x) => x.offeringId === o.id);
  const committed = mine.filter((x) => x.amounts.accepted !== undefined).sort((a, b) => (b.amounts.accepted ?? 0) - (a.amounts.accepted ?? 0));
  const agreements = AGREEMENTS.filter((a) => a.offeringId === o.id);
  const activity = INTERACTIONS.filter((x) => x.offeringId === o.id);
  const room = o.roomId ? rooms.find((r) => r.id === o.roomId) : undefined;
  const roomViews = room ? views.filter((v) => v.roomId === room.id) : [];
  const tabs: [Tab, string, number?][] = [
    ["overview", "Overview"],
    ["pipeline", "Pipeline", mine.length],
    ["commitments", "Commitments", committed.length],
    ["documents", "Agreements and documents", agreements.length],
    ["distribution", "Distribution"],
    ["activity", "Activity", activity.length],
  ];
  const rows = ladderRows(f);
  const td = "px-3 py-2.5 first:pl-4 last:pr-4";

  return (
    <div>
      <Link href="/admin/offering/offerings" className="mt-2 inline-flex items-center gap-1 px-2 text-[12.5px] text-d-text-3 hover:text-d-text">
        <ArrowLeft size={13} /> Offerings
      </Link>
      <header className="flex flex-wrap items-start gap-4 px-2 pb-4 pt-3">
        <Mark o={o} size={44} />
        <div className="min-w-0 flex-1 basis-[240px]">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-d-text">{o.name}</h1>
            <OfferingStatus s={o.status} />
          </div>
          <div className="mt-1 text-[13px] text-d-text-2">
            {o.sponsor} · {o.type} · {o.jurisdiction} · Lead {o.lead}
          </div>
        </div>
        <dl className="flex gap-8 max-sm:w-full sm:text-right">
          <div>
            <dt className="text-[12px] text-d-text-3">Accepted</dt>
            <dd className="tnum mt-0.5 text-[22px] leading-none text-d-text">{usdShort(f.accepted)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-d-text-3">Target</dt>
            <dd className="tnum mt-0.5 inline-flex items-center gap-1.5 text-[22px] leading-none text-d-text">
              {o.target ? usdShort(o.target) : "—"}
              {o.illustrative.includes("target") && <Illus short />}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-d-text-3">{o.nextClose?.label ?? "Next closing"}</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1.5 text-[15px] leading-[22px] text-d-text">
              {o.nextClose ? day(o.nextClose.date) : "Not set"}
              {o.illustrative.includes("nextClose") && <Illus short />}
            </dd>
          </div>
        </dl>
      </header>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-d-line px-1" role="tablist">
        {tabs.map(([k, l, n]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cx("relative h-10 shrink-0 px-3 text-[13px] font-medium", tab === k ? "text-d-text" : "text-d-text-3 hover:text-d-text")}
          >
            {l}
            {n !== undefined && <span className="tnum ml-1.5 text-[11.5px] text-d-text-3">{n}</span>}
            {tab === k && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-d-text" />}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <section className="rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[13px] font-semibold text-d-text">Fundraising progress</h2>
                <span className="tnum text-[12px] text-d-text-3">Remaining {usdShort(f.remaining)}</span>
              </div>
              <Ladder target={o.target} rows={rows} height={12} />
              <LadderLegend
                rows={rows}
                extra={
                  <>
                    <div>
                      <dt className="text-d-text-3">Called</dt>
                      <dd className="tnum mt-0.5 text-[13.5px] text-d-text">{usdShort(f.called)}</dd>
                    </div>
                    <div>
                      <dt className="text-d-text-3">Received</dt>
                      <dd className="tnum mt-0.5 text-[13.5px] text-d-text">{usdShort(f.received)}</dd>
                    </div>
                  </>
                }
              />
              <p className="mt-3 text-[11.5px] leading-relaxed text-d-text-3">
                Called and received come only from the fund’s books.
                {f.acceptedNotInBooks > 0 && ` ${usd(f.acceptedNotInBooks)} is countersigned and enters the books at the next closing.`}
              </p>
            </section>
            <section className="mt-6">
              <h2 className="mb-2 px-1 text-[13px] font-semibold text-d-text">Next actions</h2>
              <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
                {mine
                  .filter((x) => x.next)
                  .slice(0, 6)
                  .map((x) => (
                    <li key={x.id}>
                      <button onClick={() => setOpen(x)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-d-raise">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-d-text">{x.next!.action}</span>
                          <span className="block truncate text-[12px] text-d-text-3">{d.party(x.partyId)?.name}</span>
                        </span>
                        <StagePill stage={x.stage} />
                        {(x.illustrative || x.next!.illustrative) && <Illus short />}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          </div>
          <aside className="space-y-6">
            <section className="rounded-[12px] border border-d-line bg-d-surface px-4 py-3">
              <div className="mb-1 flex items-center">
                <h2 className="flex-1 text-[13px] font-semibold text-d-text">Terms of the offering</h2>
                <button onClick={() => setEditing(true)} className="text-[12px] font-semibold text-d-text-2 hover:text-d-text">
                  Edit
                </button>
              </div>
              <KV
                rows={[
                  ["Vehicle", o.fundId ? <Link href={`/admin/fund/funds`}>{o.name}</Link> : "Not yet set up in Fund Solution"],
                  ["Manager", o.manager],
                  ["Strategy", o.strategy],
                  ["Currency", o.currency],
                  ["Minimum", o.minimum ?? <span className="text-d-text-3">Not recorded</span>],
                  ["Opened", o.opened ? day(o.opened) : <span className="text-d-text-3">Not open</span>],
                  ["Exemption", o.exemption ?? <span className="text-d-text-3">Not recorded · set by counsel</span>],
                  ["Eligibility", o.eligibility ?? <span className="text-d-text-3">Not recorded</span>],
                ]}
              />
            </section>
            {room && (
              <section className="rounded-[12px] border border-d-line bg-d-surface px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <FolderLock size={14} className="text-d-text-3" />
                  <h2 className="flex-1 text-[13px] font-semibold text-d-text">Data room</h2>
                  <Link href="/admin/dataroom" className="inline-flex items-center gap-1 text-[12px] text-d-text-3 hover:text-d-text">
                    Open <ArrowRight size={12} />
                  </Link>
                </div>
                <KV
                  rows={[
                    ["Room", room.name],
                    ["NDA before access", room.nda ? "Required" : "Not required"],
                    ["Access ends", day(room.expires)],
                    ["Views and downloads", `${roomViews.length} recorded`],
                  ]}
                />
                <p className="mt-2 text-[11.5px] text-d-text-3">Documents stay in Data Rooms; this offering links to them.</p>
              </section>
            )}
          </aside>
        </div>
      )}

      {tab === "pipeline" && (
        <>
          <div className="mb-3 flex justify-end">
            <button onClick={() => setAdding(true)} className={btnSecondary}>
              <Plus size={14} /> Add investor
            </button>
          </div>
          <PipelineBoard opps={mine} onOpen={setOpen} />
        </>
      )}

      {tab === "commitments" && (
        <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="border-b border-d-line text-[11.5px] text-d-text-3">
              <tr>
                <th className="px-3 py-2.5 pl-4 text-left font-medium">Investor</th>
                <th className="px-3 py-2.5 text-left font-medium">Stage</th>
                <th className="px-3 py-2.5 text-right font-medium">Accepted</th>
                <th className="px-3 py-2.5 text-right font-medium">Called</th>
                <th className="px-3 py-2.5 text-right font-medium">Received</th>
                <th className="px-3 py-2.5 pr-4 text-left font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {committed.map((x) => (
                <tr key={x.id} className="border-b border-d-line-soft last:border-0 hover:bg-d-raise">
                  <td className={td}>
                    <button onClick={() => setOpen(x)} className="text-left font-medium text-d-text hover:underline">
                      {d.party(x.partyId)?.name}
                    </button>
                  </td>
                  <td className={td}>
                    <StagePill stage={x.stage} />
                  </td>
                  <td className={cx(td, "tnum text-right")}>{usd(x.amounts.accepted)}</td>
                  <td className={cx(td, "tnum text-right text-d-text-2")}>{x.amounts.called === undefined ? "—" : usd(x.amounts.called)}</td>
                  <td className={cx(td, "tnum text-right text-d-text-2")}>{x.amounts.received === undefined ? "—" : usd(x.amounts.received)}</td>
                  <td className={cx(td, "text-[12px] text-d-text-3")}>{x.source === "Fund ledger" ? "Fund books" : "Countersigned subscription"}</td>
                </tr>
              ))}
              {!committed.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-d-text-3">
                    No accepted commitments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "documents" && <AgreementTable list={agreements} />}

      {tab === "distribution" && (
        <div className="max-w-[720px] rounded-[12px] border border-d-line bg-d-surface px-5 py-4">
          <h2 className="text-[13px] font-semibold text-d-text">Who distributes this offering</h2>
          <ul className="mt-2 divide-y divide-d-line-soft">
            {o.distributors.map((d) => (
              <li key={d.name} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 text-[13px] text-d-text">{d.name}</span>
                <span className="text-[12px] text-d-text-2">{d.kind}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-relaxed text-d-text-3">
            The administrator coordinates records, documents and closings; it doesn’t solicit investors. Placement agents, their agreements and attribution are managed here in
            phase 4, each limited to the offerings they are authorized for.
          </p>
        </div>
      )}

      {tab === "activity" && (
        <ul className="max-w-[860px] divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
          {activity.map((x) => (
            <li key={x.id} className="flex gap-4 px-4 py-3">
              <span className="tnum w-[88px] shrink-0 text-[12px] text-d-text-3">{day(x.at)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-d-text">
                  <Link href={`/admin/offering/investors/${x.partyId}`} className="font-medium hover:underline">
                    {d.party(x.partyId)?.name}
                  </Link>{" "}
                  · {x.text}
                </span>
                <span className="block text-[12px] text-d-text-3">
                  {x.kind} · {x.source} · {x.by}
                </span>
              </span>
              {x.illustrative && <Illus short />}
            </li>
          ))}
        </ul>
      )}
      {open && opps.some((x) => x.id === open.id) && <OpportunityDrawer opp={opps.find((x) => x.id === open.id)!} onClose={() => setOpen(null)} />}
      {editing && <OfferingForm initial={o} onClose={() => setEditing(false)} />}
      {adding && <AddToPipeline offeringId={o.id} onClose={() => setAdding(false)} onAdded={(oppId) => setOpen({ id: oppId } as Opportunity)} />}
    </div>
  );
}
