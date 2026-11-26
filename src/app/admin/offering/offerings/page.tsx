import type { Metadata } from "next";
import { Suspense } from "react";
import { OfferingRegister } from "@/components/offering/Offerings";

export const metadata: Metadata = { title: "Offerings" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OfferingRegister />
    </Suspense>
  );
}
