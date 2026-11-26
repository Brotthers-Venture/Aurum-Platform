import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FundDetail } from "@/components/portal/InvestorPages";
import { Frame } from "@/components/portal/InvestorKit";
import { gpById, gps } from "@/lib/gps";
import { loadInvestorView } from "@/lib/investor-portal-server";
import { PORTAL_INVESTOR_ID } from "@/lib/data";
import { buildBooks } from "@/lib/accounting/engine";
import { fundsForGp } from "@/lib/gpData";

export function generateStaticParams() {
  return gps.flatMap((g) =>
    fundsForGp(g.id)
      .filter((f) => buildBooks(f.id).partners.some((p) => p.investorId === PORTAL_INVESTOR_ID))
      .map((f) => ({ gpId: g.id, fundId: f.id })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ gpId: string; fundId: string }> }) {
  const gp = gpById((await params).gpId);
  return { title: { absolute: gp ? `${gp.shortName} — Investment` : "Investment" } };
}

export default function Page({ params }: { params: Promise<{ gpId: string; fundId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ gpId: string; fundId: string }> }) {
  const { gpId, fundId } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const { v } = await loadInvestorView(gp.id);
  const base = `/investor/${gp.id}`;
  if (!v.funds.some((f) => f.id === fundId)) notFound();
  return (
    <Frame>
      <FundDetail v={v} base={base} fundId={fundId} />
    </Frame>
  );
}
