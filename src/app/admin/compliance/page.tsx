import type { Metadata } from "next";
import { Suspense } from "react";
import { ModulePage } from "@/components/firm/ModulePage";
import { ComplianceWorkspace, type ComplianceTab } from "@/components/firm/ComplianceWorkspace";

export const metadata: Metadata = { title: "Compliance" };

const tabs: ComplianceTab[] = ["calendar", "policies", "training", "screening", "reviews", "audit"];

export default function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  return (
    <ModulePage context="Compliance">
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </ModulePage>
  );
}

async function Body({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const t = tabs.includes(tab as ComplianceTab) ? (tab as ComplianceTab) : "calendar";
  return <ComplianceWorkspace key={t} tab={t} />;
}
