import type { Metadata } from "next";
import { Suspense } from "react";
import { TokenizeFlow } from "@/components/blockchain/Tokenize";

export const metadata: Metadata = { title: "Tokenize a company" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TokenizeFlow />
    </Suspense>
  );
}
