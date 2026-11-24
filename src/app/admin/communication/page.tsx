import type { Metadata } from "next";
import { Suspense } from "react";
import { CommsWorkspace } from "@/components/comms/CommsWorkspace";

export const metadata: Metadata = { title: "Chat Room" };

export default function CommunicationPage({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  return (
    <Suspense fallback={<div className="h-screen" />}>
      <Workspace searchParams={searchParams} />
    </Suspense>
  );
}

async function Workspace({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const { space } = await searchParams;
  return <CommsWorkspace key={space ?? "fund"} mode="aurum" space={space} />;
}
