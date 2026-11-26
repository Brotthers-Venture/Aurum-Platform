import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ScopedMessages } from "@/components/comms/ScopedMessages";
import { Frame, InvHead } from "@/components/portal/InvestorKit";
import { gpById, gps } from "@/lib/gps";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

/** Limited partners' Corporate Chat: their own conversations with the administrator, inside the investor portal. */
export default function Page({ params }: { params: Promise<{ gpId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  return (
    <Frame>
      <InvHead
        eyebrow="Calloway Family Trust"
        title="Messages"
        meta="Your conversations with the administrator and the fund team. Never send bank details by message; use your profile."
      />
      <ScopedMessages asIfStaff="margaret" accent={gp.brand.primary} accentInk={gp.brand.primaryInk} className="h-[calc(100dvh-230px)] min-h-[520px]" />
    </Frame>
  );
}
