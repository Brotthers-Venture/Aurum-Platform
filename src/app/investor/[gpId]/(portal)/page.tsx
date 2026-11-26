import { Suspense } from "react";
import { notFound } from "next/navigation";
import { InvestorWorkspace } from "@/components/portal/InvestorWorkspace";
import { Frame } from "@/components/portal/InvestorKit";
import { gpById, gps } from "@/lib/gps";
import { loadInvestorView } from "@/lib/investor-portal-server";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ gpId: string }> }) {
  const gp = gpById((await params).gpId);
  return { title: { absolute: gp ? `${gp.shortName} — Investor portal` : "Investor portal" } };
}

export default function Page({ params }: { params: Promise<{ gpId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const { me, v } = await loadInvestorView(gp.id);
  return (
    <Frame>
      <InvestorWorkspace gp={{ id: gp.id, shortName: gp.shortName }} entity={me.name} v={v} />
    </Frame>
  );
}
