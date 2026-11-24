import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Download, Plus } from "lucide-react";
import { Button, ButtonLink, PageHeader, Panel, Stat, StatRow } from "@/components/ui";
import { FlowsChart } from "@/components/fund/FlowsChart";
import { TODAY } from "@/lib/accounting/engine";
import { fxLabel, ptaxTable, rateOn } from "@/lib/fx-server";
import { FundsTable } from "@/components/fund/FundsTable";
import { activity, capitalCalls, fundById, funds, fundTotals, investors, onboarding, quarterlyFlowsUSD, toUSD, type OnboardingStatus } from "@/lib/data";
import { date, dateTime, moneyShort, pct } from "@/lib/format";

export const metadata: Metadata = { title: "Fund Solution" };

const stages: OnboardingStatus[] = ["Invited", "In progress", "Submitted", "Changes requested", "Approved", "Countersigned"];

export default async function FundOverview() {
  const table = await ptaxTable();
  const fx = rateOn(table, TODAY);
  const flows = quarterlyFlowsUSD((d) => rateOn(table, d).rate);
  const agg = funds.reduce(
    (a, f) => {
      const t = fundTotals(f.id);
      a.nav += toUSD(t.nav, f.currency, fx.rate);
      a.commitment += toUSD(t.commitment, f.currency, fx.rate);
      a.contributed += toUSD(t.contributed, f.currency, fx.rate);
      a.unfunded += toUSD(t.unfunded, f.currency, fx.rate);
      a.distributed += toUSD(t.distributed, f.currency, fx.rate);
      return a;
    },
    { nav: 0, commitment: 0, contributed: 0, unfunded: 0, distributed: 0 },
  );

  const openCall = capitalCalls.find((c) => c.status === "Partially funded")!;
  const draftCall = capitalCalls.find((c) => c.status === "Draft")!;
  const submitted = onboarding.filter((o) => o.status === "Submitted");
  const flagged = onboarding.find((o) => o.kyc === "Potential match")!;
  const expiring = investors.find((i) => i.kyc === "Expiring")!;

  const attention = [
    {
      tag: "Capital call",
      title: `${fundById(openCall.fundId)!.shortName} — Call No. ${openCall.number}`,
      detail: `${pct(openCall.received / openCall.amount, 0)} received · due ${date(openCall.dueDate)}`,
      href: "/admin/fund/capital-calls",
    },
    {
      tag: "Review",
      title: `${submitted.length} subscriptions awaiting review`,
      detail: submitted.map((s) => s.investorName).join(", "),
      href: "/admin/fund/onboarding",
    },
    {
      tag: "AML",
      title: `Screening match — ${flagged.investorName}`,
      detail: "Potential PEP match requires analyst disposition",
      href: `/admin/fund/onboarding/${flagged.id}`,
    },
    {
      tag: "Approval",
      title: `${fundById(draftCall.fundId)!.shortName} — draft Call No. ${draftCall.number}`,
      detail: `${moneyShort(draftCall.amount)} · pending GP sign-off`,
      href: "/admin/fund/capital-calls",
    },
    {
      tag: "KYC",
      title: `KYC refresh — ${expiring.name}`,
      detail: "Identity documents expire Dec 31, 2026",
      href: "/admin/fund/investors",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fund Solution"
        title="Overview"
        description={`Consolidated across ${funds.length} vehicles · as of November 24, 2026`}
        actions={
          <>
            <Button variant="secondary">
              <Download size={14} strokeWidth={1.8} /> Export
            </Button>
            <ButtonLink href="/admin/fund/capital-calls">
              <Plus size={14} strokeWidth={2} /> New capital call
            </ButtonLink>
          </>
        }
      />

      <StatRow>
        <Stat label="Net asset value" value={moneyShort(agg.nav)} sub="+3.1% QoQ" />
        <Stat label="Commitments" value={moneyShort(agg.commitment)} sub={`${funds.length} vehicles`} />
        <Stat label="Contributed" value={moneyShort(agg.contributed)} sub={`${pct(agg.contributed / agg.commitment, 0)} of commitments`} />
        <Stat label="Unfunded" value={moneyShort(agg.unfunded)} sub="Callable capital" />
        <Stat label="Distributed" value={moneyShort(agg.distributed)} sub={`DPI ${(agg.distributed / agg.contributed).toFixed(2)}x`} />
        <Stat label="Investors" value={investors.length} sub="Across all vehicles" />
      </StatRow>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Capital flows by quarter">
          <FlowsChart flows={flows} note={`USD millions · ${table ? "BRL at PTAX on each flow date" : fxLabel(fx)}`} />
        </Panel>
        <Panel title="Requires attention" actions={<span className="num text-stone-500">{attention.length} items</span>} flush>
          <ul className="divide-y divide-stone-100">
            {attention.map((a) => (
              <li key={a.title}>
                <Link href={a.href} className="group flex gap-3 px-5 py-3.5 hover:bg-stone-50">
                  <span className="mt-[3px] w-[72px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                    {a.tag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink-900">{a.title}</span>
                    <span className="block truncate text-[12px] text-stone-500">{a.detail}</span>
                  </span>
                  <ArrowRight size={14} strokeWidth={1.8} className="mt-1 shrink-0 text-stone-300 group-hover:text-ink-900" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Vehicles"
        actions={
          <Link href="/admin/fund/funds" className="font-medium text-stone-600 hover:text-ink-900">
            View all
          </Link>
        }
        flush
      >
        <FundsTable />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Onboarding — Atlântico Venture Partners II, second close"
          actions={
            <Link href="/admin/fund/onboarding" className="font-medium text-stone-600 hover:text-ink-900">
              Open pipeline
            </Link>
          }
        >
          <div className="space-y-3">
            {stages.map((s) => {
              const rows = onboarding.filter((o) => o.fundId === "atlantico-vp-ii" && o.status === s);
              const amt = rows.reduce((a, r) => a + r.commitment, 0);
              return (
                <div key={s} className="grid grid-cols-[140px_minmax(0,1fr)_90px_28px] items-center gap-4 text-[13px]">
                  <span className="text-stone-600">{s}</span>
                  <div className="h-2 bg-stone-100">
                    <div className="h-full bg-ink-900" style={{ width: `${(amt / 15_000_000) * 100}%` }} />
                  </div>
                  <span className="num text-right text-ink-900">{moneyShort(amt)}</span>
                  <span className="num text-right text-stone-500">{rows.length}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-[12px] text-stone-500">
            <span>Second close target: Dec 18, 2026</span>
            <span className="num">
              Soft-circled {moneyShort(onboarding.filter((o) => o.fundId === "atlantico-vp-ii").reduce((a, r) => a + r.commitment, 0))}
            </span>
          </div>
        </Panel>

        <Panel title="Recent activity" flush>
          <ul className="divide-y divide-stone-100">
            {activity.slice(0, 6).map((a) => (
              <li key={a.at} className="flex gap-4 px-5 py-3 text-[13px]">
                <span className="num w-[150px] shrink-0 text-[12px] text-stone-500">{dateTime(a.at)}</span>
                <span className="min-w-0 text-stone-700">
                  <span className="font-semibold text-ink-900">{a.actor}</span> {a.text}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <p className="pb-2 text-[11px] text-stone-400">
        Figures are unaudited and presented in USD; BRL vehicles translated at the reporting rate. Preview data.
      </p>
    </div>
  );
}
