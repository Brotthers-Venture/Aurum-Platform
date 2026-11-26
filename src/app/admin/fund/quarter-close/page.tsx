import type { Metadata } from "next";
import { Suspense } from "react";
import { QuarterBoard } from "@/components/reporting/AdminClose";

export const metadata: Metadata = { title: "Quarter close" };

export default function QuarterClosePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <QuarterBoard />
    </Suspense>
  );
}
