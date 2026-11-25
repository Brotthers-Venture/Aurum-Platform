import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ScopedMessages } from "@/components/comms/ScopedMessages";
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
    <div className="mx-auto max-w-[1200px] px-8 py-8">
      <ScopedMessages asIfStaff="margaret" accent={gp.brand.primary} accentInk={gp.brand.primaryInk} className="h-[calc(100vh-220px)] min-h-[520px]" />
    </div>
  );
}
