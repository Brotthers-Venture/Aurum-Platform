import type { Metadata } from "next";
import { Suspense } from "react";
import { OfferingDetail } from "@/components/offering/Offerings";

export const metadata: Metadata = { title: "Offering" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OfferingDetail id={id} />;
}
