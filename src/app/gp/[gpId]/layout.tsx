import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { GpShell, type GpApproval, type GpSearchItem } from "@/components/gp/GpShell";
import { gpById, gps } from "@/lib/gps";
import { users } from "@/lib/access";
import { callsForGp, documentsForGp, fundsForGp, investorsForGp } from "@/lib/gpData";
import { fundById, INDICATIVE_BRL_USD } from "@/lib/data";
import { clients as commClients, people as commPeople } from "@/lib/comms";
import { date, moneyShort } from "@/lib/format";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export default function GpPortalLayout({ children, params }: { children: ReactNode; params: Promise<{ gpId: string }> }) {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#e9e6e0]" />}>
      <BrandedShell params={params}>{children}</BrandedShell>
    </Suspense>
  );
}

async function BrandedShell({ children, params }: { children: ReactNode; params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const principal = users.find((u) => u.role === "gp_principal" && u.scope.toLowerCase().includes(gp.shortName.split(" ")[0].toLowerCase()));
  const base = `/gp/${gp.id}`;
  const client = commClients.find((c) => c.gpId === gp.id);
  const lead = client && commPeople.find((p) => p.org === client.id && p.clientRole === "admin");
  const fs = fundsForGp(gp.id);
  const calls = callsForGp(gp.id);

  const approvals: GpApproval[] = calls
    .filter((c) => c.status === "Draft")
    .map((c) => {
      const f = fundById(c.fundId)!;
      return {
        id: c.id,
        title: `${f.shortName} — Call No. ${c.number}`,
        detail: `${moneyShort(c.amount, f.currency)} · due ${date(c.dueDate)} · prepared by your administrator`,
        href: `${base}/activity`,
      };
    });

  const pages: [string, string][] = [
    ["Overview", base],
    ["Funds", `${base}/funds`],
    ["Investors", `${base}/investors`],
    ["Capital activity", `${base}/activity`],
    ["Reports", `${base}/reports`],
    ["Corporate Chat", `${base}/messages`],
  ];
  const search: GpSearchItem[] = [
    ...pages.map(([label, href]) => ({ id: `pg-${href}`, group: "Go to", label, href, keys: label, kind: "page" as const })),
    ...fs.map((f) => ({
      id: `f-${f.id}`,
      group: "Funds",
      label: f.name,
      detail: `${f.strategy.split(" — ")[0]} · ${f.domicile}`,
      href: `${base}/funds/${f.id}`,
      keys: `${f.name} ${f.shortName}`,
      kind: "fund" as const,
    })),
    ...investorsForGp(gp.id, INDICATIVE_BRL_USD).map((r) => ({
      id: `i-${r.investor.id}`,
      group: "Investors",
      label: r.investor.name,
      detail: r.funds.join(", "),
      href: `${base}/investors?q=${encodeURIComponent(r.investor.name)}`,
      keys: `${r.investor.name} ${r.investor.type} ${r.investor.jurisdiction}`,
      kind: "investor" as const,
    })),
    ...calls.map((c) => {
      const f = fundById(c.fundId)!;
      return {
        id: `c-${c.id}`,
        group: "Capital calls",
        label: `${f.shortName} — Call No. ${c.number}`,
        detail: `${c.status} · due ${date(c.dueDate)}`,
        href: `${base}/activity`,
        keys: `${f.shortName} call ${c.number} ${c.purpose}`,
        kind: "call" as const,
      };
    }),
    ...documentsForGp(gp.id)
      .filter((d) => d.visibility !== "Internal")
      .map((d) => ({
        id: `d-${d.id}`,
        group: "Documents",
        label: d.name,
        detail: `${fundById(d.fundId)!.shortName} · ${date(d.date)}`,
        href: `${base}/reports`,
        keys: d.name,
        kind: "document" as const,
      })),
  ];

  return (
    <GpShell
      gp={gp}
      user={{ name: principal?.name ?? lead?.name ?? gp.shortName, title: `${gp.shortName} · ${lead && !principal ? lead.title : "GP principal"}` }}
      funds={fs.map((f) => ({ id: f.id, shortName: f.shortName }))}
      search={search}
      approvals={approvals}
      preview={gp.sample || fs.some((f) => f.economicsPending)}
    >
      {children}
    </GpShell>
  );
}
