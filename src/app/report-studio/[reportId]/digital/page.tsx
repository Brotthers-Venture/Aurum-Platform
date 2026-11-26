import type { Metadata } from "next";
import { Suspense } from "react";
import { DigitalPreview } from "@/components/studio/Digital";

export const metadata: Metadata = { title: "Report" };

export default function Page({ params }: { params: Promise<{ reportId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f6f4f0]" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <DigitalPreview id={reportId} />;
}
