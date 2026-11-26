import type { Metadata } from "next";
import { Suspense } from "react";
import { PipelinePage } from "@/components/offering/Pipeline";

export const metadata: Metadata = { title: "Investor pipeline" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PipelinePage />
    </Suspense>
  );
}
