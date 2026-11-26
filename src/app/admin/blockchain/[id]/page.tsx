import type { Metadata } from "next";
import { Suspense } from "react";
import { TokenDetail } from "@/components/blockchain/TokenDetail";

export const metadata: Metadata = { title: "Token" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TokenDetail id={id} />;
}
