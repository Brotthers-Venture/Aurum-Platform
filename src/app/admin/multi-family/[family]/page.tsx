import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModulePage } from "@/components/firm/ModulePage";
import { FamilyWealth } from "@/components/mfo/FamilyWealth";
import { FAMILIES } from "@/lib/wealth";

export const metadata: Metadata = { title: "Family wealth" };

export function generateStaticParams() {
  return FAMILIES.map((f) => ({ family: f.id }));
}

export default function Page({ params }: { params: Promise<{ family: string }> }) {
  return (
    <ModulePage context="Multi-Family Office">
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <View params={params} />
      </Suspense>
    </ModulePage>
  );
}

async function View({ params }: { params: Promise<{ family: string }> }) {
  const { family } = await params;
  if (!FAMILIES.some((f) => f.id === family)) notFound();
  return <FamilyWealth id={family} />;
}
