import type { Metadata } from "next";
import { Suspense } from "react";
import { StudioHome } from "@/components/studio/Studio";

export const metadata: Metadata = { title: "Report Studio" };

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <StudioHome />
    </Suspense>
  );
}
