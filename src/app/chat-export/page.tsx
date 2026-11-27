import type { Metadata } from "next";
import { Suspense } from "react";
import { MatterExport } from "@/components/chat/MatterExport";

export const metadata: Metadata = { title: "Correspondence record" };

export default function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#E9E6E0]" />}>
      <Body searchParams={searchParams} />
    </Suspense>
  );
}

async function Body({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  return <MatterExport id={m ?? ""} />;
}
