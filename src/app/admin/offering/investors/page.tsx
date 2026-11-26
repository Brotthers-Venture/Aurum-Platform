import type { Metadata } from "next";
import { Suspense } from "react";
import { InvestorRegister } from "@/components/offering/Investors";

export const metadata: Metadata = { title: "Investors" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InvestorRegister />
    </Suspense>
  );
}
