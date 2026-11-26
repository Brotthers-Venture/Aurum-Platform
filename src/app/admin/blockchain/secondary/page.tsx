import type { Metadata } from "next";
import { Suspense } from "react";
import { SecondarySales } from "@/components/blockchain/Secondary";

export const metadata: Metadata = { title: "Secondary sales" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SecondarySales />
    </Suspense>
  );
}
