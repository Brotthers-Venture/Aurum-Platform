import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuarterlyReport } from "@/components/analytics/QuarterlyReport";
import { analyticsData } from "@/lib/analytics";
import { fundById, funds } from "@/lib/data";
import { gpById } from "@/lib/gps";

export function generateStaticParams() {
  return funds.map((f) => ({ fundId: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ fundId: string }> }): Promise<Metadata> {
  const { fundId } = await params;
  return { title: `${fundById(fundId)?.shortName ?? "Fund"} · Quarterly report` };
}

export default async function ReportPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const f = fundById(fundId);
  const gp = f && gpById(f.gpId);
  if (!f || !gp) notFound();
  const fund = {
    id: f.id,
    name: f.name,
    currency: f.currency,
    domicile: f.domicile,
    legalForm: f.legalForm,
    vintage: f.vintage,
    strategy: f.strategy,
    managementFee: f.managementFee,
    carry: f.carry,
    hurdle: f.hurdle,
    term: f.term,
    auditor: f.auditor,
    economicsPending: Boolean(f.economicsPending),
  };
  return (
    <Suspense>
      <QuarterlyReport data={analyticsData()} fund={fund} gp={gp} />
    </Suspense>
  );
}
