import type { Metadata } from "next";
import { Suspense } from "react";
import { Policies } from "@/components/banking/Reconciliation";

export const metadata: Metadata = { title: "Approval policies" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Policies />
    </Suspense>
  );
}
