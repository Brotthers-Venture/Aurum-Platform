import type { Metadata } from "next";
import { Suspense } from "react";
import { TransfersDesk } from "@/components/blockchain/Transfers";

export const metadata: Metadata = { title: "Transfers" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TransfersDesk />
    </Suspense>
  );
}
