import type { Metadata } from "next";
import { Suspense } from "react";
import { PrintView } from "@/components/studio/PrintView";

export const metadata: Metadata = { title: "Report" };

export default function Page({ params }: { params: Promise<{ reportId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#e9e7e3]" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <PrintView id={reportId} />;
}
