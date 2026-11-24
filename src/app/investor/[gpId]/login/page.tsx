import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BrandedLogin } from "@/components/portal/BrandedLogin";
import { gpById, gps } from "@/lib/gps";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  return { title: { absolute: gp ? `${gp.shortName} — Investor sign in` : "Investor sign in" } };
}

export default function Page({ params }: { params: Promise<{ gpId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  return <BrandedLogin gp={gp} />;
}
