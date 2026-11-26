import type { Metadata } from "next";
import { Suspense } from "react";
import { ChainCompanies } from "@/components/blockchain/Companies";

export const metadata: Metadata = { title: "Tokenized companies" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ChainCompanies />
    </Suspense>
  );
}
