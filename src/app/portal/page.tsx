import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Download, FileText } from "lucide-react";
import { ButtonLink, Panel, Progress, Status } from "@/components/ui";
import {
  PORTAL_INVESTOR_ID,
  capitalAccounts,
  capitalCalls,
  documents,
  fundById,
  investorById,
  onboarding,
} from "@/lib/data";
import { date, money, multiple } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default function PortalOverview() {
  const inv = investorById(PORTAL_INVESTOR_ID)!;
  const accts = capitalAccounts.filter((c) => c.investorId === inv.id);
  const total = accts.reduce(
    (a, c) => ({
      commitment: a.commitment + c.commitment,
      contributed: a.contributed + c.contributed,
      unfunded: a.unfunded + c.unfunded,
      distributed: a.distributed + c.distributed,
      nav: a.nav + c.nav,
    }),
    { commitment: 0, contributed: 0, unfunded: 0, distributed: 0, nav: 0 },
  );
  const pending = onboarding.find((o) => o.investorName === inv.name && o.status === "In progress");
  const call = capitalCalls.find((c) => c.status === "Partially funded")!;
  const callFund = fundById(call.fundId)!;
  const myCallShare = call.allocations.find((a) => a.investorId === inv.id)?.amount ?? 0;
  const fundIds = new Set(accts.map((a) => a.fundId));
  const docs = documents.filter((d) => fundIds.has(d.fundId) && d.visibility !== "Internal").slice(0, 5);

  return (
    <main className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="eyebrow">Account overview · reported as of September 30, 2026</div>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">{inv.name}</h1>

      <dl className="mt-8 grid grid-cols-2 gap-y-6 border-y border-stone-200 py-6 md:grid-cols-5">
        {[
          ["Total commitments", money(total.commitment)],
          ["Contributed", money(total.contributed)],
          ["Unfunded", money(total.unfunded)],
          ["Distributions", money(total.distributed)],
          ["Net asset value", money(total.nav)],
        ].map(([k, v], i) => (
          <div key={k} className={i > 0 ? "md:border-l md:border-stone-200 md:pl-6" : ""}>
            <dt className="eyebrow">{k}</dt>
            <dd className="num mt-2 text-[22px] font-medium tracking-[-0.015em]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {pending && (
          <div className="flex flex-col justify-between rounded-[4px] border border-ink-900 bg-ink-900 p-6 text-white">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-400">Action required · Subscription</div>
              <h2 className="mt-3 text-[18px] font-semibold">{fundById(pending.fundId)!.name}</h2>
              <p className="num mt-1 text-[13px] text-white/60">
                {money(pending.commitment)} commitment · second close Dec 18, 2026
              </p>
            </div>
            <div className="mt-6 flex items-center gap-5">
              <div className="flex-1">
                <div className="h-1 bg-white/15">
                  <div className="h-full bg-gold-400" style={{ width: `${pending.progress * 100}%` }} />
                </div>
                <div className="num mt-2 text-[12px] text-white/60">{Math.round(pending.progress * 100)}% complete · 4 of 8 steps</div>
              </div>
              <ButtonLink href="/subscribe/atlantico-vp-ii" variant="gold">
                Continue <ArrowRight size={14} strokeWidth={2} />
              </ButtonLink>
            </div>
          </div>
        )}
        <div className="rounded-[4px] border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-caution">Capital call · due {date(call.dueDate)}</span>
            <Status value="Issued" />
          </div>
          <h2 className="mt-3 text-[18px] font-semibold">
            {callFund.name} — Call No. {call.number}
          </h2>
          <p className="num mt-1 text-[13px] text-stone-500">Your share: {money(myCallShare)}</p>
          <div className="mt-6 flex gap-2">
            <ButtonLink href="/portal/documents" variant="secondary">
              <Download size={14} strokeWidth={1.8} /> Notice & wire instructions
            </ButtonLink>
          </div>
        </div>
      </div>

      <Panel title="Investments" className="mt-8" flush>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th className="r">Commitment</th>
              <th className="r">Contributed</th>
              <th className="w-[120px]">Called</th>
              <th className="r">Unfunded</th>
              <th className="r">Distributions</th>
              <th className="r">NAV</th>
              <th className="r">TVPI</th>
            </tr>
          </thead>
          <tbody>
            {accts.map((a) => {
              const f = fundById(a.fundId)!;
              return (
                <tr key={a.fundId}>
                  <td>
                    <div className="font-semibold">{f.name}</div>
                    <div className="text-[12px] text-stone-500">
                      {f.strategy} · {f.domicile}
                    </div>
                  </td>
                  <td className="num r">{money(a.commitment, f.currency)}</td>
                  <td className="num r">{money(a.contributed, f.currency)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={a.contributed / a.commitment} />
                      <span className="num text-[12px] text-stone-500">{Math.round((a.contributed / a.commitment) * 100)}%</span>
                    </div>
                  </td>
                  <td className="num r">{money(a.unfunded, f.currency)}</td>
                  <td className="num r">{money(a.distributed, f.currency)}</td>
                  <td className="num r">{money(a.nav, f.currency)}</td>
                  <td className="num r">{multiple((a.distributed + a.nav) / a.contributed)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel
        title="Recent documents"
        className="mt-6"
        actions={
          <Link href="/portal/documents" className="font-medium text-stone-600 hover:text-ink-900">
            All documents
          </Link>
        }
        flush
      >
        <ul className="divide-y divide-stone-100">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-4 px-5 py-3 text-[13px]">
              <FileText size={15} strokeWidth={1.5} className="text-stone-400" />
              <span className="flex-1 font-medium">{d.name}</span>
              <span className="w-[220px] text-stone-500">{fundById(d.fundId)!.shortName}</span>
              <span className="num w-[110px] text-stone-500">{date(d.date)}</span>
              <Download size={15} strokeWidth={1.6} className="text-stone-400" />
            </li>
          ))}
        </ul>
      </Panel>
      <p className="mt-4 text-[11px] text-stone-400">All of this entity’s holdings are USD-denominated.</p>
    </main>
  );
}
