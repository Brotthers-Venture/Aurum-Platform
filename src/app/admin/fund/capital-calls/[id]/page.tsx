import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BellRing, Check, Download, Landmark } from "lucide-react";
import { Button, PageHeader, Panel, Progress, Stat, StatRow, Status } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { JournalTable } from "@/components/fund/JournalTable";
import { SecondReview } from "@/components/spine/SecondReview";
import { buildBooks, TODAY } from "@/lib/accounting/engine";
import { bankAccounts, capitalCalls, fundById, investorById } from "@/lib/data";
import { date, money, pct } from "@/lib/format";

export function generateStaticParams() {
  return capitalCalls.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = capitalCalls.find((x) => x.id === id);
  return { title: c ? `Capital Call No. ${c.number}` : "Capital call" };
}

export default async function CapitalCallDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const call = capitalCalls.find((c) => c.id === id);
  if (!call) notFound();
  const f = fundById(call.fundId)!;
  const books = buildBooks(f.id);
  const m = (v: number) => money(v, f.currency);
  const bank = bankAccounts.find((b) => b.fundId === f.id);
  const entries = books.journal.filter((je) => je.ref === call.id);
  const commitments = new Map(books.partners.map((p) => [p.investorId, p.commitment]));
  const paidCount = call.allocations.filter((a) => a.paid > 0).length;
  const overdueFlag = call.dueDate < TODAY;

  const approvals = [
    ["Prepared", "L. Andrade · Fund Services", call.noticeDate, true],
    ["Reviewed", "R. Mendes · Fund Accounting", call.noticeDate, call.status !== "Draft"],
    ["Approved", `${f.gp}`, call.noticeDate, call.status !== "Draft"],
    ["Notices published", `${call.allocations.length} investor portals · email`, call.noticeDate, call.status !== "Draft"],
  ] as const;

  const allocation = (
    <Panel flush>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Limited partner</th>
              <th className="r">Commitment</th>
              <th className="r">Share</th>
              <th className="r">Called</th>
              <th className="r">Received</th>
              <th>Received on</th>
              <th>Bank match</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {call.allocations.map((a) => {
              const commit = commitments.get(a.investorId) ?? 0;
              const total = call.allocations.reduce((s, x) => s + (commitments.get(x.investorId) ?? 0), 0);
              const paid = a.paid > 0;
              return (
                <tr key={a.investorId}>
                  <td className="font-semibold">{investorById(a.investorId)?.name}</td>
                  <td className="num r">{m(commit)}</td>
                  <td className="num r text-stone-600">{pct(commit / total, 2)}</td>
                  <td className="num r">{money(a.amount, f.currency, { decimals: 2 })}</td>
                  <td className="num r">{paid ? money(a.paid, f.currency, { decimals: 2 }) : "—"}</td>
                  <td className="num text-stone-600">{a.paidDate ? date(a.paidDate) : "—"}</td>
                  <td className="whitespace-nowrap text-[12px] text-stone-500">{paid ? `Statement ••${bank?.mask}` : "—"}</td>
                  <td>
                    <Status value={call.status === "Draft" ? "Draft" : paid ? "Funded" : overdueFlag ? "Overdue" : "Outstanding"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>Total · {call.allocations.length} partners</td>
              <td className="num r">{m(call.allocations.reduce((s, x) => s + (commitments.get(x.investorId) ?? 0), 0))}</td>
              <td className="num r">100.00%</td>
              <td className="num r">{money(call.amount, f.currency, { decimals: 2 })}</td>
              <td className="num r">{money(call.received, f.currency, { decimals: 2 })}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/fund/capital-calls" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> Capital calls
      </Link>
      <PageHeader
        eyebrow={f.name}
        title={
          <span className="flex items-center gap-3">
            Capital Call No. {call.number} <Status value={call.status} />
          </span>
        }
        description={call.purpose}
        actions={
          <>
            <Button variant="secondary">
              <Download size={14} strokeWidth={1.8} /> Notices (PDF)
            </Button>
            {call.status === "Partially funded" || call.status === "Issued" ? (
              <Button>
                <BellRing size={14} strokeWidth={1.8} /> Remind outstanding
              </Button>
            ) : null}
          </>
        }
      />
      <StatRow cols={4}>
        <Stat label="Call amount" value={m(call.amount)} sub={`${pct(call.amount / books.partners.reduce((s, p) => s + p.commitment, 0))} of commitments`} />
        <Stat label="Received" value={m(call.received)} sub={`${paidCount} of ${call.allocations.length} partners`} />
        <Stat label="Outstanding" value={m(call.amount - call.received)} />
        <Stat label="Due date" value={date(call.dueDate)} sub={`Notice ${date(call.noticeDate)}`} />
      </StatRow>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Tabs
            tabs={[
              { id: "alloc", label: "Partner allocation", count: call.allocations.length, content: allocation },
              {
                id: "je",
                label: "Journal entries",
                count: entries.length,
                content: (
                  <Panel flush>
                    {entries.length ? (
                      <JournalTable entries={entries} currency={f.currency} />
                    ) : (
                      <p className="px-5 py-10 text-center text-[13px] text-stone-500">Entries post when the call is issued.</p>
                    )}
                  </Panel>
                ),
              },
            ]}
          />
        </div>
        <aside className="space-y-4">
          <Panel title="Use of proceeds">
            <dl className="space-y-2 text-[13px]">
              {call.investments.map((i) => (
                <div key={i.name} className="flex justify-between gap-4">
                  <dt className="text-stone-600">{i.name}</dt>
                  <dd className="num font-medium">{m(i.amount)}</dd>
                </div>
              ))}
              {call.fees > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone-600">Management fee</dt>
                  <dd className="num font-medium">{m(call.fees)}</dd>
                </div>
              )}
              {call.expenses + call.organizational > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone-600">{call.organizational ? "Organizational expenses" : "Fund expenses"}</dt>
                  <dd className="num font-medium">{m(call.expenses + call.organizational)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="num">{m(call.amount)}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Collection">
            <Progress value={call.received / call.amount} />
            <div className="num mt-2 text-[12px] text-stone-500">{pct(call.received / call.amount, 0)} received</div>
            <div className="mt-4 flex gap-3 border-t border-stone-100 pt-4 text-[12px] text-stone-600">
              <Landmark size={15} strokeWidth={1.6} className="mt-px shrink-0" />
              <span>Receipts are matched from {bank?.institution} statements. With Plaid connected, incoming wires match automatically by amount, sender and reference.</span>
            </div>
          </Panel>
          <Panel title="Approval trail">
            <ol className="space-y-3">
              {approvals.map(([step, who, when, done]) => (
                <li key={step} className="flex gap-3 text-[13px]">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${done ? "bg-ink-900 text-white" : "border border-stone-300"}`}>
                    {done && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block font-semibold">{step}</span>
                    <span className="block text-[12px] text-stone-500">
                      {who}
                      {done ? ` · ${date(when)}` : " · pending"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <SecondReview refTo={{ kind: "call", id: call.id }} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
