import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { InvestorShell, type InvSearchItem } from "@/components/portal/InvestorShell";
import type { PortalNotice } from "@/components/portal/PortalShell";
import { gpById, gps } from "@/lib/gps";
import { fundsForGp } from "@/lib/gpData";
import { loadInvestorView } from "@/lib/investor-portal-server";
import { date, money } from "@/lib/format";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export default function InvestorPortalLayout({ children, params }: { children: ReactNode; params: Promise<{ gpId: string }> }) {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#e9e6e0]" />}>
      <Shell params={params}>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children, params }: { children: ReactNode; params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const { me, v } = await loadInvestorView(gp.id);
  const base = `/investor/${gp.id}`;
  const open = v.calls.filter((c) => c.status !== "Paid");
  const pending = v.subscriptions.filter((s) => s.status !== "Countersigned");

  const notices: PortalNotice[] = [
    ...open.map((c) => ({
      id: c.id,
      title: `${c.fund} — Capital call No. ${c.number}`,
      detail: `${money(c.amount - c.paid, c.currency)} ${c.status === "Overdue" ? "overdue since" : "due"} ${date(c.due)}`,
      href: `${base}/activity`,
    })),
    ...pending.map((s) => ({ id: s.id, title: `Subscription to ${s.fund}`, detail: `${Math.round(s.progress * 100)}% complete · ${s.status}`, href: `/subscribe/${s.fundId}` })),
  ];
  const pages: [string, string][] = [
    ["Overview", base],
    ["Investments", `${base}/investments`],
    ["Capital activity", `${base}/activity`],
    ["Documents", `${base}/documents`],
    ["Subscriptions", `${base}/subscriptions`],
    ["Messages", `${base}/messages`],
    ["Profile", `${base}/profile`],
  ];
  const search: InvSearchItem[] = [
    ...pages.map(([label, href]) => ({ id: `pg-${href}`, group: "Go to", label, href, keys: label, kind: "page" as const })),
    ...v.funds.map((f) => ({
      id: `f-${f.id}`,
      group: "Investments",
      label: f.name,
      detail: `${f.strategy} · ${f.domicile}`,
      href: `${base}/investments/${f.id}`,
      keys: `${f.name} ${f.shortName}`,
      kind: "fund" as const,
    })),
    ...v.calls.map((c) => ({
      id: `c-${c.id}`,
      group: "Capital calls",
      label: `${c.fund} — Call No. ${c.number}`,
      detail: `${c.status} · due ${date(c.due)}`,
      href: `${base}/activity`,
      keys: `${c.fund} call ${c.number}`,
      kind: "call" as const,
    })),
    ...v.documents.map((d) => ({
      id: `d-${d.id}`,
      group: "Documents",
      label: d.name,
      detail: `${d.fund} · ${date(d.date)}`,
      href: `${base}/documents`,
      keys: `${d.name} ${d.category}`,
      kind: "document" as const,
    })),
  ];
  return (
    <InvestorShell
      gp={gp}
      entity={me.name}
      person="Margaret Calloway"
      funds={v.funds.map((f) => ({ id: f.id, shortName: f.shortName }))}
      search={search}
      notices={notices}
      openCalls={open.length}
      openSubscriptions={pending.length}
      preview={gp.sample || fundsForGp(gp.id).some((f) => f.economicsPending)}
    >
      {children}
    </InvestorShell>
  );
}
