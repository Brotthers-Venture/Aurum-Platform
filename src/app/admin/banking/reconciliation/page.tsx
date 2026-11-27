import type { Metadata } from "next";
import { Suspense } from "react";
import { Reconciliation } from "@/components/banking/Reconciliation";

export const metadata: Metadata = { title: "Reconciliation" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Reconciliation />
    </Suspense>
  );
}
