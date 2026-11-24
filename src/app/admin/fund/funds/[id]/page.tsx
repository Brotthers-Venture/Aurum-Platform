import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Plus, Scale } from "lucide-react";
import { Button, ButtonLink, KeyValue, PageHeader, Panel, Stat, StatRow, Status } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { FundCorporateRecords } from "@/components/fund/FundCorporateRecords";
import { corporateRecords } from "@/lib/corporateDocs";
import {
  capitalAccounts,
  capitalCalls,
  distributions,
  documents,
  fundById,
  funds,
  fundTotals,
  investorById,
  onboarding,
} from "@/lib/data";
import { date, money, moneyShort, multiple, pct } from "@/lib/format";

export function generateStaticParams() {
  return funds.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: fundById(id)?.shortName ?? "Fund" };
}

export default async function FundDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = fundById(id);
  if (!f) notFound();
  const t = fundTotals(f.id);
  const accounts = capitalAccounts.filter((c) => c.fundId === f.id).sort((a, b) => b.commitment - a.commitment);
  const calls = capitalCalls.filter((c) => c.fundId === f.id);
  const dists = distributions.filter((d) => d.fundId === f.id);
  const docs = documents.filter((d) => d.fundId === f.id);
  const pipeline = onboarding.filter((o) => o.fundId === f.id);
  const m = (v: number) => money(v, f.currency);

  const overview = (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel title="Terms">
        <KeyValue
          items={[
            ["Legal form", f.legalForm],
            ["Domicile", f.domicile],
            ["General partner", f.gp],
            ["Investment manager", f.manager],
            ["Strategy", f.strategy],
            ["Base currency", f.currency],
            ["Management fee", f.managementFee],
            ["Carried interest", f.carry],
            ["Hurdle", f.hurdle],
            ["Term", f.term],
            ["First close", date(f.firstClose)],
            ["Final close", f.finalClose ? date(f.finalClose) : "Open"],
            ["Auditor", f.auditor],
            ["Custodian bank", f.bank],
            ...(f.coAdministrator ? ([["Local administrator", f.coAdministrator]] as [string, string][]) : []),
          ]}
        />
      </Panel>
      <div className="space-y-6">
        <Panel title="Fundraising">
          <div className="num text-[22px] font-medium tracking-[-0.01em]">{moneyShort(t.commitment, f.currency)}</div>
          <div className="mt-1 text-[12px] text-stone-500">{f.targetSize ? `of ${moneyShort(f.targetSize, f.currency)} target` : "Target pending LPA review"}</div>
          <div className="mt-4 h-1.5 bg-stone-100">
            <div className="h-full bg-gold-400" style={{ width: `${f.targetSize ? Math.min(100, (t.commitment / f.targetSize) * 100) : 0}%` }} />
          </div>
          <div className="num mt-2 text-right text-[12px] text-stone-500">{pct(t.commitment / f.targetSize, 0)}</div>
        </Panel>
        <Panel title="Performance (unaudited)">
          <KeyValue
            items={[
              ["DPI", multiple(t.dpi)],
              ["RVPI", multiple(t.rvpi)],
              ["TVPI", multiple(t.tvpi)],
              ["Called to date", pct(t.contributed / t.commitment, 0)],
            ]}
          />
        </Panel>
      </div>
    </div>
  );

  const capital = (
    <Panel flush>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Limited partner</th>
              <th>Type</th>
              <th>Close</th>
              <th className="r">Commitment</th>
              <th className="r">% of fund</th>
              <th className="r">Contributed</th>
              <th className="r">Unfunded</th>
              <th className="r">Distributed</th>
              <th className="r">NAV</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const inv = investorById(a.investorId)!;
              return (
                <tr key={a.investorId} className="row-link">
                  <td className="font-semibold">{inv.name}</td>
                  <td className="text-stone-600">{inv.type}</td>
                  <td className="num text-stone-600">{date(a.closeDate)}</td>
                  <td className="num r">{m(a.commitment)}</td>
                  <td className="num r text-stone-600">{pct(a.commitment / t.commitment)}</td>
                  <td className="num r">{m(a.contributed)}</td>
                  <td className="num r">{m(a.unfunded)}</td>
                  <td className="num r">{m(a.distributed)}</td>
                  <td className="num r">{m(a.nav)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total · {accounts.length} partners</td>
              <td className="num r">{m(t.commitment)}</td>
              <td className="num r">100.0%</td>
              <td className="num r">{m(t.contributed)}</td>
              <td className="num r">{m(t.unfunded)}</td>
              <td className="num r">{m(t.distributed)}</td>
              <td className="num r">{m(t.nav)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );

  const callsTab = (
    <Panel flush>
      <table className="data-table">
        <thead>
          <tr>
            <th>Call</th>
            <th>Purpose</th>
            <th>Notice</th>
            <th>Due</th>
            <th className="r">Amount</th>
            <th className="r">Received</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {calls.length === 0 && (
            <tr>
              <td colSpan={7} className="py-10 text-center text-stone-500">No capital calls issued for this vehicle.</td>
            </tr>
          )}
          {calls.map((c) => (
            <tr key={c.id}>
              <td className="num font-semibold">No. {c.number}</td>
              <td className="max-w-[320px] text-stone-600">{c.purpose}</td>
              <td className="num text-stone-600">{date(c.noticeDate)}</td>
              <td className="num text-stone-600">{date(c.dueDate)}</td>
              <td className="num r">{m(c.amount)}</td>
              <td className="num r">{m(c.received)}</td>
              <td>
                <Status value={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  const distTab = (
    <Panel flush>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Source</th>
            <th>Type</th>
            <th className="r">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {dists.length === 0 && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-stone-500">No distributions to date.</td>
            </tr>
          )}
          {dists.map((d) => (
            <tr key={d.id}>
              <td className="num">{date(d.date)}</td>
              <td className="text-stone-600">{d.source}</td>
              <td className="text-stone-600">{d.type}</td>
              <td className="num r">{m(d.amount)}</td>
              <td>
                <Status value={d.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  const docsTab = (
    <Panel flush>
      <ul className="divide-y divide-stone-100">
        {docs.map((d) => (
          <li key={d.id} className="flex items-center gap-4 px-5 py-3 text-[13px]">
            <FileText size={16} strokeWidth={1.5} className="text-stone-400" />
            <span className="flex-1 font-medium text-ink-900">{d.name}</span>
            <span className="w-[160px] text-stone-500">{d.category}</span>
            <span className="num w-[110px] text-stone-500">{date(d.date)}</span>
            <span className="w-[130px]">
              <span className="text-[12px] text-stone-500">{d.visibility}</span>
            </span>
            <Download size={15} strokeWidth={1.6} className="text-stone-400" />
          </li>
        ))}
        {docs.length === 0 && <li className="px-5 py-10 text-center text-[13px] text-stone-500">No documents.</li>}
      </ul>
    </Panel>
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/fund/funds" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> Funds
      </Link>
      <PageHeader
        eyebrow={`${f.strategy} · ${f.domicile} · Vintage ${f.vintage}`}
        title={
          <span className="flex items-center gap-3">
            {f.name} <Status value={f.status} />
          </span>
        }
        actions={
          <>
            <ButtonLink href={`/admin/fund/funds/${f.id}/economics`} variant="secondary">
              <Scale size={14} strokeWidth={1.8} /> LPA &amp; economics
            </ButtonLink>
            <Button variant="secondary">
              <Download size={14} strokeWidth={1.8} /> Statements
            </Button>
            <Button>
              <Plus size={14} strokeWidth={2} /> Capital call
            </Button>
          </>
        }
      />
      <StatRow>
        <Stat label="Commitments" value={moneyShort(t.commitment, f.currency)} sub={`${t.investors} partners`} />
        <Stat label="Contributed" value={moneyShort(t.contributed, f.currency)} sub={`${pct(t.contributed / t.commitment, 0)} called`} />
        <Stat label="Unfunded" value={moneyShort(t.unfunded, f.currency)} />
        <Stat label="Distributed" value={moneyShort(t.distributed, f.currency)} />
        <Stat label="NAV" value={moneyShort(t.nav, f.currency)} sub="As of Sep 30, 2026" />
        <Stat label="TVPI" value={multiple(t.tvpi)} sub={`DPI ${multiple(t.dpi)}`} />
      </StatRow>
      <Tabs
        tabs={[
          { id: "overview", label: "Overview", content: overview },
          { id: "capital", label: "Capital accounts", count: accounts.length, content: capital },
          { id: "calls", label: "Capital calls", count: calls.length, content: callsTab },
          { id: "dist", label: "Distributions", count: dists.length, content: distTab },
          { id: "docs", label: "Documents", count: docs.length, content: docsTab },
          {
            id: "records",
            label: "Data room",
            count: (corporateRecords[f.id] ?? []).length + (f.lei ? 1 : 0),
            content: <FundCorporateRecords lei={f.lei} initial={corporateRecords[f.id] ?? []} />,
          },
          ...(pipeline.length
            ? [
                {
                  id: "onb",
                  label: "Onboarding",
                  count: pipeline.length,
                  content: (
                    <Panel flush>
                      <ul className="divide-y divide-stone-100">
                        {pipeline.map((o) => (
                          <li key={o.id}>
                            <Link href={`/admin/fund/onboarding/${o.id}`} className="flex items-center gap-4 px-5 py-3 text-[13px] hover:bg-stone-50">
                              <span className="flex-1 font-semibold">{o.investorName}</span>
                              <span className="num w-[120px] text-right">{m(o.commitment)}</span>
                              <span className="w-[140px] text-right">
                                <Status value={o.status} />
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
