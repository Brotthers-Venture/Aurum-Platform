import type { Metadata } from "next";
import { Suspense } from "react";
import { PmoReport, type ReportParams } from "@/components/firm/PmoReport";

export const metadata: Metadata = { title: "PMO report" };

type Search = { plan?: string; party?: string; scope?: string; head?: string };

export default function Page({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#E9E6E0]" />}>
      <Body searchParams={searchParams} />
    </Suspense>
  );
}

async function Body({ searchParams }: { searchParams: Promise<Search> }) {
  const q = await searchParams;
  const initial: ReportParams = {
    plan: q.plan ?? "all",
    party: q.party ?? "all",
    scope: q.scope === "open" ? "open" : "all",
    head: q.head === "sponsor" ? "sponsor" : "firm",
  };
  return <PmoReport initial={initial} />;
}
