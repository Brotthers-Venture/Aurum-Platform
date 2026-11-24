import type { Metadata } from "next";
import { Suspense } from "react";
import { ModulePage } from "@/components/firm/ModulePage";
import { DataRoomWorkspace, type DataRoomTab } from "@/components/firm/DataRoomWorkspace";

export const metadata: Metadata = { title: "Data rooms" };

const tabs: DataRoomTab[] = ["rooms", "qa", "activity", "access", "new"];

export default function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  return (
    <ModulePage context="Data rooms" wide>
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </ModulePage>
  );
}

async function Body({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const t = tabs.includes(tab as DataRoomTab) ? (tab as DataRoomTab) : "rooms";
  return <DataRoomWorkspace key={t} tab={t} />;
}
