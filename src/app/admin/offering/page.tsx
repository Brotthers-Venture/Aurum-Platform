import type { Metadata } from "next";
import { Suspense } from "react";
import { OfferingOverview } from "@/components/offering/Overview";

export const metadata: Metadata = { title: "Capital formation" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OfferingOverview />
    </Suspense>
  );
}
