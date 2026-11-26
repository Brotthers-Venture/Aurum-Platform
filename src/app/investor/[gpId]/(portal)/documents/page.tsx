import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DocumentsView } from "@/components/portal/InvestorPages";
import { InvestorPublished } from "@/components/reporting/InvestorClose";
import { Frame } from "@/components/portal/InvestorKit";
import { gpById, gps } from "@/lib/gps";
import { loadInvestorView } from "@/lib/investor-portal-server";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ gpId: string }> }) {
  const gp = gpById((await params).gpId);
  return { title: { absolute: gp ? `${gp.shortName} — Documents` : "Documents" } };
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
      <DocumentsView v={v} entity={me.name} gpName={gp.shortName} reports={<InvestorPublished gpId={gp.id} investorId={me.id} panel />} />
    </Frame>
  );
}
