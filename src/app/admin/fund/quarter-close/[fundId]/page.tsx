import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CloseWorkspace } from "@/components/reporting/AdminClose";
import { fundById, funds } from "@/lib/data";

export function generateStaticParams() {
  return funds.map((f) => ({ fundId: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ fundId: string }> }): Promise<Metadata> {
  const { fundId } = await params;
  return { title: `${fundById(fundId)?.shortName ?? "Fund"} — Quarter close` };
}

export default function FundClosePage({ params }: { params: Promise<{ fundId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  if (!fundById(fundId)) notFound();
  return <CloseWorkspace fundId={fundId} />;
}
