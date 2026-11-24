import { Suspense } from "react";
import { notFound } from "next/navigation";
import { InvestorSubscriptions } from "@/components/portal/InvestorViews";
import { gpById, gps } from "@/lib/gps";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
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
  return <InvestorSubscriptions gp={gp} />;
}
