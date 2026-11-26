import type { Metadata } from "next";
import { Suspense } from "react";
import { AgreementsPage } from "@/components/offering/Agreements";

export const metadata: Metadata = { title: "Agreements" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AgreementsPage />
    </Suspense>
  );
}
