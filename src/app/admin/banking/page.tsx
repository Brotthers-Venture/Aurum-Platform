import type { Metadata } from "next";
import { Suspense } from "react";
import { CashPosition } from "@/components/banking/Overview";

export const metadata: Metadata = { title: "Cash position" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CashPosition />
    </Suspense>
  );
}
