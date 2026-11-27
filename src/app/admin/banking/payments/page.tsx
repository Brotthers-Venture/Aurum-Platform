import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentsDesk } from "@/components/banking/Payments";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentsDesk />
    </Suspense>
  );
}
