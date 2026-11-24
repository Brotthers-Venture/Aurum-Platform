import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { Panel, Progress, Status } from "@/components/ui";
import { ApproveButton } from "@/components/gp/ApproveButton";
import { gps, gpById } from "@/lib/gps";
import { callsForGp, distributionsForGp, documentsForGp, fundsForGp, gpTotals, investorsForGp, onboardingForGp } from "@/lib/gpData";
import { fundById, fundTotals } from "@/lib/data";
import { date, money, moneyShort, multiple, pct } from "@/lib/format";

const sections = ["", "investors", "activity", "reports"];

export function generateStaticParams() {
  return gps.flatMap((g) => sections.map((s) => ({ gpId: g.id, section: s ? [s] : [] })));
}

export async function generateMetadata({ params }: { params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  return { title: { absolute: gp ? `${gp.shortName} — Manager portal` : "Manager portal" } };
}

export default function GpPortalPage({ params }: { params: Promise<{ gpId: string; section?: string[] }> }) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-[1200px] px-8 py-10" />}>
      <GpPortal params={params} />
    </Suspense>
  );
}

async function GpPortal({ params }: { params: Promise<{ gpId: string; section?: string[] }> }) {
  const { gpId, section } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const current = section?.[0] ?? "";
  if (!sections.includes(current)) notFound();
  const t = gpTotals(gp.id);
  const fs = fundsForGp(gp.id);
  const calls = callsForGp(gp.id);
  const pendingCalls = calls.filter((c) => c.status === "Draft");

  const title = { "": "Overview", investors: "Investors", activity: "Capital activity", reports: "Reports" }[current]!;

  const noFunds = (
    <div className="rounded-[4px] border border-dashed border-stone-300 bg-white px-8 py-16 text-center">
      <h2 className="text-[17px] font-semibold">Your portal is being set up</h2>
      <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-relaxed text-stone-600">
        Your administrator is configuring your first fund. Fund performance, investors and capital activity will appear here once the
        fund’s documents are reviewed and approved.
      </p>
    </div>
  );

  const content = () => {
    if (!fs.length) return noFunds;
    if (current === "investors") {
      const rows = investorsForGp(gp.id);
      const ob = onboardingForGp(gp.id);
      return (
        <div className="space-y-6">
          <Panel flush title={`Limited partners · ${rows.length}`}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Type</th>
                  <th>Jurisdiction</th>
                  <th>Funds</th>
                  <th className="r">Commitments</th>
                  <th className="r">NAV</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.investor.id}>
                    <td className="font-semibold">{r.investor.name}</td>
                    <td className="text-stone-600">{r.investor.type}</td>
                    <td className="text-stone-600">{r.investor.jurisdiction}</td>
                    <td className="text-[12px] text-stone-600">{r.funds.join(", ")}</td>
                    <td className="num r">{money(r.commitment)}</td>
                    <td className="num r">{money(r.nav)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          {ob.length > 0 && (
            <Panel flush title="Subscriptions in progress">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Investor</th>
                    <th>Fund</th>
                    <th className="r">Commitment</th>
                    <th className="w-[140px]">Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ob.map((o) => (
                    <tr key={o.id}>
                      <td className="font-semibold">{o.investorName}</td>
                      <td className="text-stone-600">{fundById(o.fundId)!.shortName}</td>
                      <td className="num r">{money(o.commitment)}</td>
                      <td>
                        <Progress value={o.progress} />
                      </td>
                      <td>
                        <Status value={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      );
    }
    if (current === "activity") {
      const dists = distributionsForGp(gp.id);
      return (
        <div className="space-y-6">
          <Panel flush title="Capital calls">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th>Call</th>
                  <th>Purpose</th>
                  <th>Due</th>
                  <th className="r">Amount</th>
                  <th className="w-[130px]">Received</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => {
                  const f = fundById(c.fundId)!;
                  return (
                    <tr key={c.id}>
                      <td className="font-semibold">{f.shortName}</td>
                      <td className="num">No. {c.number}</td>
                      <td className="max-w-[260px] truncate text-stone-600">{c.purpose}</td>
                      <td className="num text-stone-600">{date(c.dueDate)}</td>
                      <td className="num r">{money(c.amount, f.currency)}</td>
                      <td>
                        <Progress value={c.received / c.amount} />
                      </td>
                      <td className="r">{c.status === "Draft" ? <ApproveButton /> : <Status value={c.status} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
          <Panel flush title="Distributions">
            {dists.length ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fund</th>
                    <th>Date</th>
                    <th>Source</th>
                    <th className="r">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dists.map((d) => (
                    <tr key={d.id}>
                      <td className="font-semibold">{fundById(d.fundId)!.shortName}</td>
                      <td className="num text-stone-600">{date(d.date)}</td>
                      <td className="text-stone-600">{d.source}</td>
                      <td className="num r">{money(d.amount, fundById(d.fundId)!.currency)}</td>
                      <td>
                        <Status value={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-8 text-center text-[13px] text-stone-500">No distributions yet.</p>
            )}
          </Panel>
        </div>
      );
    }
    if (current === "reports") {
      const docs = documentsForGp(gp.id).filter((d) => d.visibility !== "Internal");
      return (
        <Panel flush>
          <ul className="divide-y divide-stone-100">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-4 px-5 py-3 text-[13px]">
                <FileText size={15} strokeWidth={1.5} className="text-stone-400" />
                <span className="flex-1 font-medium">{d.name}</span>
                <span className="w-[240px] text-stone-500">{fundById(d.fundId)!.shortName}</span>
                <span className="num w-[110px] text-stone-500">{date(d.date)}</span>
                <Download size={15} strokeWidth={1.6} className="text-stone-400" />
              </li>
            ))}
          </ul>
        </Panel>
      );
    }
    // Overview
    return (
      <div className="space-y-8">
        <dl className="grid grid-cols-2 gap-y-6 border-y border-stone-200 py-6 md:grid-cols-5">
          {[
            ["Commitments", moneyShort(t.commitment)],
            ["Contributed", moneyShort(t.contributed)],
            ["Distributed", moneyShort(t.distributed)],
            ["Net asset value", moneyShort(t.nav)],
            ["Investors", String(t.investors)],
          ].map(([k, v], i) => (
            <div key={k} className={i > 0 ? "md:border-l md:border-stone-200 md:pl-6" : ""}>
              <dt className="eyebrow">{k}</dt>
              <dd className="num mt-2 text-[24px] font-medium tracking-[-0.015em]">{v}</dd>
            </div>
          ))}
        </dl>

        {pendingCalls.length > 0 && (
          <div className="rounded-[4px] border border-stone-200 bg-white">
            <div className="flex items-center gap-2 border-b border-stone-200 px-5 py-3">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <span className="text-[13px] font-semibold">Awaiting your approval</span>
            </div>
            <ul className="divide-y divide-stone-100">
              {pendingCalls.map((c) => {
                const f = fundById(c.fundId)!;
                return (
                  <li key={c.id} className="flex items-center gap-6 px-5 py-4">
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold">
                        {f.name} — Capital Call No. {c.number}
                      </div>
                      <div className="mt-0.5 text-[12px] text-stone-500">
                        Prepared by your administrator · due {date(c.dueDate)} · {c.allocations.length} limited partners
                      </div>
                    </div>
                    <div className="num text-[16px] font-medium">{money(c.amount, f.currency)}</div>
                    <ApproveButton label="Review & approve" />
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Panel flush title="Funds">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fund</th>
                <th>Vintage</th>
                <th className="r">Commitments</th>
                <th className="w-[130px]">Called</th>
                <th className="r">Distributed</th>
                <th className="r">NAV</th>
                <th className="r">DPI</th>
                <th className="r">TVPI</th>
              </tr>
            </thead>
            <tbody>
              {fs.map((f) => {
                const ft = fundTotals(f.id);
                return (
                  <tr key={f.id}>
                    <td>
                      <div className="font-semibold">{f.name}</div>
                      <div className="text-[12px] text-stone-500">
                        {f.strategy} · {f.domicile}
                        {f.economicsPending ? " · terms pending LPA review" : ""}
                      </div>
                    </td>
                    <td className="num text-stone-600">{f.vintage}</td>
                    <td className="num r">{moneyShort(ft.commitment, f.currency)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Progress value={ft.called / ft.commitment} />
                        <span className="num text-[12px] text-stone-500">{pct(ft.called / ft.commitment, 0)}</span>
                      </div>
                    </td>
                    <td className="num r">{moneyShort(ft.distributed, f.currency)}</td>
                    <td className="num r">{moneyShort(ft.nav, f.currency)}</td>
                    <td className="num r">{multiple(ft.dpi)}</td>
                    <td className="num r">{multiple(ft.tvpi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="eyebrow">Manager portal</div>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">{title}</h1>
      <div className="mt-8">{content()}</div>
    </main>
  );
}
