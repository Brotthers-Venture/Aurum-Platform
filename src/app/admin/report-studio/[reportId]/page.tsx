import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportEditor } from "@/components/studio/Editor";

export const metadata: Metadata = { title: "Report Studio" };

export default function Page({ params }: { params: Promise<{ reportId: string }> }) {
  return (
    <Suspense fallback={<div className="h-[calc(100dvh-64px)]" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <ReportEditor id={reportId} />;
}
