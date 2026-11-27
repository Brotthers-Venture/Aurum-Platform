import type { Metadata } from "next";
import { Suspense } from "react";
import { PayeesList } from "@/components/banking/Payees";

export const metadata: Metadata = { title: "Payees" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PayeesList />
    </Suspense>
  );
}
