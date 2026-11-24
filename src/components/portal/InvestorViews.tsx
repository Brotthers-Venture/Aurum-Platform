import Link from "next/link";
import { ArrowRight, Download, FileText } from "lucide-react";
import { ButtonLink, Panel, Progress, Status } from "@/components/ui";
import { PORTAL_INVESTOR_ID, capitalAccounts, capitalCalls, documents, fundById, investorById, onboarding } from "@/lib/data";
import { date, money, multiple, pct } from "@/lib/format";
import type { GpClient } from "@/lib/gps";

const inv = () => investorById(PORTAL_INVESTOR_ID)!;
const inGp = (gpId: string) => (fundId: string) => fundById(fundId)?.gpId === gpId;

export function InvestorOverview({ gp }: { gp: GpClient }) {
  const me = inv();
  const ofGp = inGp(gp.id);
  const accts = capitalAccounts.filter((c) => c.investorId === me.id && ofGp(c.fundId));
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
  const pending = onboarding.find((o) => o.investorName === me.name && ofGp(o.fundId) && o.status !== "Countersigned");
  const openCalls = capitalCalls
    .filter((c) => ofGp(c.fundId) && c.status !== "Draft")
    .map((c) => ({ c, a: c.allocations.find((x) => x.investorId === me.id) }))
    .filter(({ a }) => a && a.paid < a.amount);
  const fundIds = new Set(accts.map((a) => a.fundId));
  const docs = documents.filter((d) => fundIds.has(d.fundId) && d.visibility !== "Internal").slice(0, 5);

  return (
    <main className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="eyebrow">Account overview · reported as of September 30, 2026</div>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">{me.name}</h1>

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

      {(pending || openCalls.length > 0) && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {pending && (
            <div className="flex flex-col justify-between rounded-[4px] bg-brand p-6 text-brand-ink">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">Action required · Subscription</div>
                <h2 className="mt-3 text-[18px] font-semibold">{fundById(pending.fundId)!.name}</h2>
                <p className="num mt-1 text-[13px] opacity-70">{money(pending.commitment)} commitment</p>
              </div>
              <div className="mt-6 flex items-center gap-5">
                <div className="flex-1">
                  <div className="h-1 bg-white/20">
                    <div className="h-full bg-white" style={{ width: `${pending.progress * 100}%` }} />
                  </div>
                  <div className="num mt-2 text-[12px] opacity-70">{Math.round(pending.progress * 100)}% complete</div>
                </div>
                <Link
                  href={`/subscribe/${pending.fundId}`}
                  className="inline-flex h-9 items-center gap-2 rounded-[3px] bg-white px-4 text-[13px] font-semibold text-ink-900 hover:bg-stone-100"
                >
                  Continue <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          )}
          {openCalls.map(({ c, a }) => (
            <div key={c.id} className="rounded-[8px] border border-stone-200/70 bg-white shadow-card p-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-caution">Capital call · due {date(c.dueDate)}</span>
                <Status value="Issued" />
              </div>
              <h2 className="mt-3 text-[18px] font-semibold">
                {fundById(c.fundId)!.name} — Call No. {c.number}
              </h2>
              <p className="num mt-1 text-[13px] text-stone-500">Your share: {money(a!.amount, fundById(c.fundId)!.currency, { decimals: 2 })}</p>
              <div className="mt-6">
                <ButtonLink href={`/investor/${gp.id}/documents`} variant="secondary">
                  <Download size={14} strokeWidth={1.8} /> Notice & wire instructions
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      )}

      <Panel title="Investments" className="mt-8" flush>
        {accts.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fund</th>
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
                        <Progress value={a.called / a.commitment} />
                        <span className="num text-[12px] text-stone-500">{pct(a.called / a.commitment, 0)}</span>
                      </div>
                    </td>
                    <td className="num r">{money(a.unfunded, f.currency)}</td>
                    <td className="num r">{money(a.distributed, f.currency)}</td>
                    <td className="num r">{money(a.nav, f.currency)}</td>
                    <td className="num r">{multiple(a.contributed ? (a.distributed + a.nav - a.receivable) / a.contributed : 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-10 text-center text-[13px] text-stone-500">No funded investments yet with {gp.shortName}.</p>
        )}
      </Panel>

      {docs.length > 0 && (
        <Panel
          title="Recent documents"
          className="mt-6"
          actions={
            <Link href={`/investor/${gp.id}/documents`} className="font-medium text-stone-600 hover:text-ink-900">
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
                <span className="w-[260px] text-stone-500">{fundById(d.fundId)!.shortName}</span>
                <span className="num w-[110px] text-stone-500">{date(d.date)}</span>
                <Download size={15} strokeWidth={1.6} className="text-stone-400" />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </main>
  );
}

export function InvestorDocuments({ gp }: { gp: GpClient }) {
  const me = inv();
  const ofGp = inGp(gp.id);
  const fundIds = new Set(capitalAccounts.filter((c) => c.investorId === me.id && ofGp(c.fundId)).map((c) => c.fundId));
  onboarding.filter((o) => o.investorName === me.name && ofGp(o.fundId)).forEach((o) => fundIds.add(o.fundId));
  const docs = documents.filter((d) => fundIds.has(d.fundId) && d.visibility !== "Internal");
  return (
    <main className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="eyebrow">{me.name}</div>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">Documents</h1>
      <p className="mt-1.5 text-[14px] text-stone-600">Notices, statements, reports and tax documents for your investments with {gp.shortName}.</p>
      <Panel className="mt-8" flush>
        {docs.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Fund</th>
                <th>Category</th>
                <th>Date</th>
                <th className="r">Size</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="row-link">
                  <td>
                    <span className="flex items-center gap-2.5 font-semibold">
                      <FileText size={15} strokeWidth={1.5} className="text-stone-400" />
                      {d.name}
                    </span>
                  </td>
                  <td className="text-stone-600">{fundById(d.fundId)!.shortName}</td>
                  <td className="text-stone-600">{d.category}</td>
                  <td className="num text-stone-600">{date(d.date)}</td>
                  <td className="num r text-stone-500">{d.size}</td>
                  <td className="r">
                    <Download size={15} strokeWidth={1.6} className="inline text-stone-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-10 text-center text-[13px] text-stone-500">No documents yet.</p>
        )}
      </Panel>
    </main>
  );
}

export function InvestorSubscriptions({ gp }: { gp: GpClient }) {
  const me = inv();
  const ofGp = inGp(gp.id);
  const mine = onboarding.filter((o) => o.investorName === me.name && ofGp(o.fundId));
  const completed = capitalAccounts.filter((c) => c.investorId === me.id && ofGp(c.fundId));
  return (
    <main className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="eyebrow">{me.name}</div>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">Subscriptions</h1>
      <p className="mt-1.5 text-[14px] text-stone-600">
        Your investor profile is saved once and reused for every subscription — you only confirm what has changed.
      </p>
      {mine.length > 0 && (
        <>
          <h2 className="eyebrow mb-3 mt-10">In progress</h2>
          {mine.map((o) => (
            <Link key={o.id} href={`/subscribe/${o.fundId}`} className="group flex items-center gap-8 rounded-[8px] border border-stone-200/70 bg-white shadow-card p-6 hover:border-brand">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[17px] font-semibold">{fundById(o.fundId)!.name}</span>
                  <Status value={o.status} />
                </div>
                <div className="num mt-1 text-[13px] text-stone-500">
                  {money(o.commitment)} commitment · invited {date(o.invitedOn)}
                </div>
              </div>
              <div className="w-[220px]">
                <Progress value={o.progress} />
                <div className="num mt-2 text-[12px] text-stone-500">{Math.round(o.progress * 100)}% complete</div>
              </div>
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                Continue <ArrowRight size={14} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </>
      )}
      <h2 className="eyebrow mb-3 mt-10">Completed</h2>
      <Panel flush>
        {completed.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fund</th>
                <th className="r">Commitment</th>
                <th>Accepted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((c) => (
                <tr key={c.fundId}>
                  <td className="font-semibold">{fundById(c.fundId)!.name}</td>
                  <td className="num r">{money(c.commitment, fundById(c.fundId)!.currency)}</td>
                  <td className="num text-stone-600">{date(c.closeDate)}</td>
                  <td>
                    <Status value="Countersigned" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-8 text-center text-[13px] text-stone-500">None yet.</p>
        )}
      </Panel>
    </main>
  );
}
