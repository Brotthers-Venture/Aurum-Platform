import type { Metadata } from "next";
import { Suspense } from "react";
import { ModulePage } from "@/components/firm/ModulePage";
import { PmoWorkspace, type PmoTab } from "@/components/firm/PmoWorkspace";

export const metadata: Metadata = { title: "Project management office" };

const tabs: PmoTab[] = ["overview", "tasks", "reports", "plan"];
// Links from before the PMO ran on plans alone.
const legacy: Record<string, PmoTab> = { portfolio: "overview", timeline: "overview", capacity: "overview", risks: "tasks" };

export default function Page({ searchParams }: { searchParams: Promise<{ tab?: string; show?: string }> }) {
  return (
    <ModulePage context="Project management office" wide>
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </ModulePage>
  );
}

async function Body({ searchParams }: { searchParams: Promise<{ tab?: string; show?: string }> }) {
  const { tab, show } = await searchParams;
  // ?tab=new starts a blank plan, the way "New plan" does on the overview.
  if (tab === "new") return <PmoWorkspace key="new" tab="overview" startNew />;
  const t = tabs.includes(tab as PmoTab) ? (tab as PmoTab) : (legacy[tab ?? ""] ?? "overview");
  return <PmoWorkspace key={`${t}-${show ?? ""}`} tab={t} show={show === "week" || show === "waiting" ? show : "all"} />;
}
