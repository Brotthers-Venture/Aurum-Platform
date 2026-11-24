import type { Metadata } from "next";
import { Suspense } from "react";
import { ModulePage } from "@/components/firm/ModulePage";
import { SalesWorkspace, type SalesTab } from "@/components/firm/SalesWorkspace";

export const metadata: Metadata = { title: "Sales" };

const tabs: SalesTab[] = ["pipeline", "leads", "proposals", "forecast", "activities", "new"];

export default function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  return (
    <ModulePage context="Sales">
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </ModulePage>
  );
}

async function Body({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const t = tabs.includes(tab as SalesTab) ? (tab as SalesTab) : "pipeline";
  return <SalesWorkspace key={t} tab={t} />;
}
