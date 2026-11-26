import type { Metadata } from "next";
import { Suspense } from "react";
import { InvestorProfile } from "@/components/offering/Investors";

export const metadata: Metadata = { title: "Investor" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvestorProfile id={id} />;
}
