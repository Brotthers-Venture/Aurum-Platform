import type { Metadata } from "next";
import { ptaxTable, rateOn } from "@/lib/fx-server";
import { capitalCalls, distributions, fundById, investors, onboarding } from "@/lib/data";
import { analyticsData } from "@/lib/analytics";
import { LegendWorkspace, type WorkspaceCall, type WorkspaceEvent } from "@/components/workspace/LegendWorkspace";
import { date, moneyShort, pct } from "@/lib/format";

export const metadata: Metadata = { title: "Fund Solution" };

export default async function FundOverview() {
  const table = await ptaxTable();
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

  const calls: WorkspaceCall[] = [...capitalCalls]
    .sort((x, y) => y.dueDate.localeCompare(x.dueDate))
    .slice(0, 12)
    .map((c) => {
      const f = fundById(c.fundId)!;
      return { id: c.id, fund: f.shortName, fundId: f.id, number: c.number, notice: c.noticeDate, due: date(c.dueDate), amount: c.amount, received: c.received, status: c.status, currency: f.currency };
    });
  const events: WorkspaceEvent[] = [
    ...capitalCalls.map((c) => ({ id: c.id, at: c.noticeDate, title: `${fundById(c.fundId)!.shortName} · Call ${c.number}`, status: c.status, side: "Call", type: "Capital call", href: "/admin/fund/capital-calls" })),
    ...distributions.map((d) => ({ id: d.id, at: d.date, title: `${fundById(d.fundId)!.shortName} · ${d.type}`, status: d.status, side: "Distribution", type: d.type, href: "/admin/fund/distributions" })),
  ]
    .sort((x, y) => y.at.localeCompare(x.at))
    .slice(0, 12)
    .map((e) => ({ id: e.id, title: e.title, status: e.status, side: e.side, type: e.type, href: e.href }));

  return <LegendWorkspace data={analyticsData((d) => rateOn(table, d))} calls={calls} events={events} attention={attention} />;
}
