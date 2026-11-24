import type { Metadata } from "next";
import { Suspense } from "react";
import { ModulePage } from "@/components/firm/ModulePage";
import { PmoWorkspace, type PmoTab } from "@/components/firm/PmoWorkspace";

export const metadata: Metadata = { title: "Project management office" };

const tabs: PmoTab[] = ["portfolio", "timeline", "tasks", "risks", "capacity", "new"];

export default function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  return (
    <ModulePage context="Project management office" wide>
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </ModulePage>
  );
}

async function Body({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const t = tabs.includes(tab as PmoTab) ? (tab as PmoTab) : "portfolio";
  return <PmoWorkspace key={t} tab={t} />;
}
