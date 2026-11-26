import type { Metadata } from "next";
import { Suspense } from "react";
import { OwnerPreview } from "@/components/blockchain/OwnerPreview";

export const metadata: Metadata = { title: "Owner’s view" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OwnerPreview id={id} />;
}
