import { ModuleName } from "@/components/brand/ModuleName";
import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { BrandedHeader } from "@/components/gp/BrandedHeader";
import { BrandedFooter } from "@/components/gp/BrandedFooter";
import { brandStyle, gpById, gps } from "@/lib/gps";
import { users } from "@/lib/access";
import { fundsForGp } from "@/lib/gpData";
import { FIRM } from "@/lib/firm-colors";
import { clients as commClients, people as commPeople } from "@/lib/comms";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export default function GpPortalLayout({ children, params }: { children: ReactNode; params: Promise<{ gpId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
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
  return (
    <div className="min-h-screen" style={brandStyle(gp.brand)}>
      <BrandedHeader
        gp={gp}
        nav={[
          { href: base, label: "Overview", exact: true },
          { href: `${base}/investors`, label: "Investors" },
          { href: `${base}/activity`, label: "Capital activity" },
          { href: `${base}/reports`, label: "Reports" },
          { href: `${base}/messages`, label: <ModuleName id="communication" />, mark: FIRM.communication },
        ]}
        userName={principal?.name ?? lead?.name ?? gp.shortName}
        userTitle={`${gp.shortName} · ${lead && !principal ? lead.title : "GP principal"}`}
      />
      {children}
      <BrandedFooter gp={gp} preview={gp.sample || fundsForGp(gp.id).some((f) => f.economicsPending)} />
    </div>
  );
}
