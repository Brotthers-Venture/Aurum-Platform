"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Search, ShieldCheck } from "lucide-react";
import { cx } from "@/components/ui";
import { PageHead } from "@/components/gp/GpKit";
import { capitalAccounts, fundById, onboarding } from "@/lib/data";
import { AGREEMENTS, INTERACTIONS, PARTIES, headline, offeringById, partyById, type Opportunity, type Party } from "@/lib/offering/data";
import { applyMoves, useOfferingState } from "@/lib/offering/store";
import { AgreementTable } from "./Agreements";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { Empty, Illus, KV, Seg, StagePill, StageTrack, day, dayShort, usd, usdShort } from "./ui";

const KYC_TONE: Record<string, string> = {
  Clear: "border-up-line text-up-ink",
  Expiring: "border-attn-line text-gold-700",
  "Under review": "border-attn-line text-gold-700",
  Pending: "border-attn-line text-gold-700",
  "Potential match": "border-neg-line text-negative",
  "Not started": "border-d-line text-d-text-3",
};
function Kyc({ v }: { v?: string }) {
  if (!v) return <span className="text-d-text-3">Not started</span>;
  return (
    <span className={cx("inline-flex whitespace-nowrap rounded-[6px] border px-1.5 py-px text-[11.5px]", KYC_TONE[v] ?? "border-d-line text-d-text-2")}>KYC {v.toLowerCase()}</span>
  );
}

/* ───────── register ───────── */

export function InvestorRegister() {
  const s = useOfferingState();
  const opps = useMemo(() => applyMoves(s), [s]);
  const [show, setShow] = useState<"all" | "record" | "prospects">("all");
  const [q, setQ] = useState("");
  const list = PARTIES.filter(
    (p) => (show === "all" || (show === "record" ? !!p.investor : !p.investor)) && `${p.name} ${p.contact} ${p.jurisdiction}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const td = "px-3 py-2.5 first:pl-4 last:pr-4 align-top";
  return (
    <div>
      <PageHead
        eyebrow="Offering Solution"
        title="Investors"
        meta="One record per investor, shared with Fund Solution. A prospect becomes the same record when it subscribes; opportunities are tracked per offering."
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex h-8 w-full max-w-[280px] items-center gap-2 rounded-[8px] border border-d-line px-2.5 text-d-text-3">
          <Search size={13} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search investors"
            aria-label="Search investors"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-d-text placeholder:text-d-text-3 focus:outline-none"
          />
        </label>
        <Seg
          label="Show"
          value={show}
          onChange={setShow}
          options={[
            ["all", "All"],
            ["record", "Investors on record"],
            ["prospects", "Prospects"],
          ]}
        />
        <span className="tnum ml-auto text-[12.5px] text-d-text-3">{list.length} investors</span>
      </div>
      <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
        <table className="w-full min-w-[960px] text-[13px]">
          <thead className="border-b border-d-line text-[11.5px] text-d-text-3">
            <tr>
              {["Investor", "Jurisdiction", "Relationship owner", "Offerings", "Accepted", "Compliance", "Last activity"].map((h, i) => (
                <th key={h} className={cx("px-3 py-2.5 text-left font-medium first:pl-4 last:pr-4", i === 4 && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const mine = opps.filter((o) => o.partyId === p.id);
              const accepted = mine.reduce((a, o) => a + (o.amounts.accepted ?? 0), 0);
              const last = INTERACTIONS.find((x) => x.partyId === p.id && !x.upcoming);
              return (
                <tr key={p.id} className="border-b border-d-line-soft last:border-0 hover:bg-d-raise">
                  <td className={td}>
                    <Link href={`/admin/offering/investors/${p.id}`} className="flex items-center gap-2 font-medium text-d-text hover:underline">
                      {p.name} {p.illustrative && <Illus short />}
                    </Link>
                    <div className="text-[12px] text-d-text-3">
                      {p.type} · {p.investor ? "Investor on record" : "Prospect"}
                    </div>
                  </td>
                  <td className={cx(td, "text-d-text-2")}>{p.jurisdiction}</td>
                  <td className={cx(td, "whitespace-nowrap text-d-text-2")}>{p.owner}</td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1">
                      {mine.map((o) => (
                        <span key={o.id} title={offeringById(o.offeringId)?.name} className="inline-flex items-center gap-1 text-[11.5px] text-d-text-2">
                          <span className="text-d-text-3">{offeringById(o.offeringId)?.short}</span>
                          <StagePill stage={o.stage} />
                        </span>
                      ))}
                      {!mine.length && <span className="text-d-text-3">—</span>}
                    </div>
                  </td>
                  <td className={cx(td, "tnum text-right text-d-text")}>{accepted ? usdShort(accepted) : "—"}</td>
                  <td className={td}>
                    <Kyc v={p.kyc} />
                  </td>
                  <td className={cx(td, "tnum whitespace-nowrap text-d-text-3")}>{last ? dayShort(last.at) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────── 360° profile ───────── */

type Tab = "overview" | "opportunities" | "timeline" | "agreements" | "compliance" | "investments";

export function InvestorProfile({ id }: { id: string }) {
  const s = useOfferingState();
  const opps = useMemo(() => applyMoves(s), [s]);
  const [tab, setTab] = useState<Tab>("overview");
  const [open, setOpen] = useState<Opportunity | null>(null);
  const p = partyById(id);
  if (!p)
    return (
      <div className="py-16">
        <Empty>
          No investor with this id.{" "}
          <Link href="/admin/offering/investors" className="underline">
            Back to investors
          </Link>
        </Empty>
      </div>
    );
  const mine = opps.filter((o) => o.partyId === p.id);
  const timeline = INTERACTIONS.filter((x) => x.partyId === p.id);
  const agreements = AGREEMENTS.filter((a) => a.partyId === p.id);
  const holdings = capitalAccounts.filter((c) => c.investorId === p.id);
  const subs = onboarding.filter((o) => o.investorName === p.name);
  const accepted = holdings.reduce((a, c) => a + c.commitment, 0);
  const open_ = mine.filter((o) => o.stage !== "funded" && o.stage !== "accepted" && o.stage !== "declined" && o.stage !== "withdrawn" && o.stage !== "not_eligible");
  const tabs: [Tab, string, number?][] = [
    ["overview", "Overview"],
    ["opportunities", "Opportunities", mine.length],
    ["timeline", "Relationship timeline", timeline.length],
    ["agreements", "Agreements", agreements.length],
    ["compliance", "Compliance"],
    ["investments", "Investments", holdings.length],
  ];

  return (
    <div>
      <Link href="/admin/offering/investors" className="mt-2 inline-flex items-center gap-1 px-2 text-[12.5px] text-d-text-3 hover:text-d-text">
        <ArrowLeft size={13} /> Investors
      </Link>
      <header className="flex flex-wrap items-start gap-4 px-2 pb-4 pt-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-d-line text-[14px] font-semibold text-d-text-2">
          {p.name
            .replace(/[^A-Za-zÀ-ÿ ]/g, "")
            .split(" ")
            .filter(Boolean)
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div className="min-w-0 flex-1 basis-[240px]">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-d-text">{p.name}</h1>
            {p.illustrative && <Illus />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-d-text-2">
            {p.type} · {p.jurisdiction} · {p.investor ? "Investor on record" : "Prospect"} · Owner {p.owner}
            <Kyc v={p.kyc} />
          </div>
        </div>
        <dl className="flex gap-8 max-sm:w-full sm:text-right">
          <div>
            <dt className="text-[12px] text-d-text-3">Committed with us</dt>
            <dd className="tnum mt-0.5 text-[22px] leading-none text-d-text">{accepted ? usdShort(accepted) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-d-text-3">Open opportunities</dt>
            <dd className="tnum mt-0.5 text-[22px] leading-none text-d-text">{open_.length}</dd>
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
          <div className="space-y-6">
            <section>
              <h2 className="mb-2 px-1 text-[13px] font-semibold text-d-text">Opportunities</h2>
              <OppList list={mine} onOpen={setOpen} />
            </section>
            <section>
              <h2 className="mb-2 px-1 text-[13px] font-semibold text-d-text">Next actions</h2>
              <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
                {mine
                  .filter((o) => o.next)
                  .map((o) => (
                    <li key={o.id}>
                      <button onClick={() => setOpen(o)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-d-raise">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] text-d-text">{o.next!.action}</span>
                          <span className="block text-[12px] text-d-text-3">{offeringById(o.offeringId)?.short}</span>
                        </span>
                        {o.next!.illustrative && <Illus short />}
                        <span className="tnum text-[12px] text-d-text-3">{o.next!.date ? dayShort(o.next!.date) : "Waiting"}</span>
                      </button>
                    </li>
                  ))}
                {timeline
                  .filter((x) => x.upcoming)
                  .map((x) => (
                    <li key={x.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-d-text">
                          {x.kind}: {x.text}
                        </span>
                        <span className="block text-[12px] text-d-text-3">{x.by}</span>
                      </span>
                      <Illus short />
                      <span className="tnum text-[12px] text-d-text-3">{dayShort(x.at)}</span>
                    </li>
                  ))}
                {!mine.some((o) => o.next) && !timeline.some((x) => x.upcoming) && <li className="px-4 py-3 text-[12.5px] text-d-text-3">Nothing scheduled.</li>}
              </ul>
            </section>
          </div>
          <aside className="space-y-6">
            <section className="rounded-[12px] border border-d-line bg-d-surface px-4 py-3">
              <h2 className="mb-1 text-[13px] font-semibold text-d-text">Identity</h2>
              <KV
                rows={[
                  ["Legal name", p.name],
                  ["Classification", p.type],
                  ["Jurisdiction", p.jurisdiction],
                  ["Representative", p.contact],
                  ["Email", p.email ?? <span className="text-d-text-3">Not recorded</span>],
                  ["Relationship owner", p.owner],
                  ["Introduced", p.source],
                ]}
              />
            </section>
            <section className="rounded-[12px] border border-d-line bg-d-surface px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="flex-1 text-[13px] font-semibold text-d-text">Stated preferences</h2>
                {p.preferences && <Illus short />}
              </div>
              {p.preferences ? (
                <KV
                  rows={[
                    ["Asset classes", p.preferences.assetClasses.join(", ")],
                    ["Regions", p.preferences.regions.join(", ")],
                    ["Typical ticket", p.preferences.ticket],
                    ["Horizon", p.preferences.horizon],
                    ["Restrictions", p.preferences.restrictions],
                  ]}
                />
              ) : (
                <p className="py-1 text-[12.5px] text-d-text-3">
                  Not recorded. Preferences are what the investor has told us; they’re never a judgment of eligibility or suitability.
                </p>
              )}
            </section>
          </aside>
        </div>
      )}

      {tab === "opportunities" && <OppList list={mine} onOpen={setOpen} />}

      {tab === "timeline" && (
        <ol className="max-w-[860px] border-l border-d-line pl-5">
          {timeline.map((x) => (
            <li key={x.id} className="relative pb-5">
              <span className={cx("absolute -left-[25px] top-1.5 h-2 w-2 rounded-full", x.upcoming ? "border border-d-text-3 bg-d-surface" : "bg-d-text-3")} />
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-d-text-3">
                <span className="tnum">{day(x.at)}</span>· {x.kind}
                {x.offeringId && <>· {offeringById(x.offeringId)?.short}</>}
                {x.upcoming && <span className="text-d-text-2">· upcoming</span>}
                {x.illustrative && <Illus short />}
              </div>
              <div className="mt-0.5 text-[13px] text-d-text">{x.text}</div>
              <div className="text-[12px] text-d-text-3">
                {x.by} · {x.source}
              </div>
            </li>
          ))}
          {!timeline.length && <li className="text-d-text-3">No recorded interactions yet.</li>}
        </ol>
      )}

      {tab === "agreements" && <AgreementTable list={agreements} />}

      {tab === "compliance" && (
        <div className="max-w-[760px] space-y-4">
          <section className="rounded-[12px] border border-d-line bg-d-surface px-4 py-3">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck size={15} className="text-d-text-3" />
              <h2 className="flex-1 text-[13px] font-semibold text-d-text">From the compliance record</h2>
              <Link href="/admin/compliance" className="inline-flex items-center gap-1 text-[12px] text-d-text-3 hover:text-d-text">
                Compliance <ArrowRight size={12} />
              </Link>
            </div>
            <KV
              rows={[
                ["Identity and KYC", <Kyc key="k" v={p.kyc} />],
                ["Tax form", p.investor?.taxForm ?? <span className="text-d-text-3">Collected at subscription</span>],
                ...subs.map((o): [string, string] => [`Eligibility · ${fundById(o.fundId)?.shortName}`, o.accreditation]),
              ]}
            />
          </section>
          <p className="px-1 text-[12px] leading-relaxed text-d-text-3">
            KYC, AML, beneficial ownership and screening stay in Compliance and are shown here only to people with access. What a private placement requires depends on the
            offering, its exemption and jurisdiction, as set with counsel; a preference match is never an eligibility decision.
          </p>
        </div>
      )}

      {tab === "investments" &&
        (holdings.length ? (
          <div className="overflow-x-auto rounded-[12px] border border-d-line bg-d-surface">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead className="border-b border-d-line text-[11.5px] text-d-text-3">
                <tr>
                  {["Fund", "Admitted", "Commitment", "Called", "Received", "NAV"].map((h, i) => (
                    <th key={h} className={cx("px-3 py-2.5 text-left font-medium first:pl-4 last:pr-4", i > 1 && "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((c) => {
                  const f = fundById(c.fundId)!;
                  return (
                    <tr key={c.fundId} className="border-b border-d-line-soft last:border-0">
                      <td className="px-3 py-2.5 pl-4 text-d-text">{f.name}</td>
                      <td className="tnum px-3 py-2.5 text-d-text-2">{day(c.closeDate)}</td>
                      <td className="tnum px-3 py-2.5 text-right">{usd(c.commitment)}</td>
                      <td className="tnum px-3 py-2.5 text-right text-d-text-2">{usd(c.called)}</td>
                      <td className="tnum px-3 py-2.5 text-right text-d-text-2">{usd(c.contributed)}</td>
                      <td className="tnum px-3 py-2.5 pr-4 text-right text-d-text-2">{usd(c.nav)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-d-line-soft px-4 py-2.5 text-[11.5px] text-d-text-3">
              From the capital accounts in Fund Solution, in each fund’s currency. All shown funds report in USD.
            </p>
          </div>
        ) : (
          <Empty>No investments with us yet.</Empty>
        ))}
      {open && <OpportunityDrawer opp={opps.find((x) => x.id === open.id) ?? open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function OppList({ list, onOpen }: { list: Opportunity[]; onOpen: (o: Opportunity) => void }) {
  if (!list.length) return <Empty>No opportunities yet.</Empty>;
  return (
    <ul className="divide-y divide-d-line-soft overflow-hidden rounded-[12px] border border-d-line bg-d-surface">
      {list.map((o) => {
        const of = offeringById(o.offeringId)!;
        const h = headline(o);
        return (
          <li key={o.id}>
            <button
              onClick={() => onOpen(o)}
              className="grid w-full grid-cols-1 gap-3 px-4 py-3 text-left hover:bg-d-raise sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)_110px] sm:items-center"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[13px] font-medium text-d-text">
                  {of.name} {o.illustrative && <Illus short />}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[12px] text-d-text-3">
                  <StagePill stage={o.stage} /> {o.source}
                </span>
              </span>
              <StageTrack stage={o.stage} compact />
              <span className="tnum text-right">
                <span className="block text-[13px] text-d-text">{usdShort(h.value)}</span>
                <span className="block text-[11.5px] text-d-text-3">
                  {h.label.toLowerCase()}
                  {o.amountsIllustrative && " · est."}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export type { Party };
