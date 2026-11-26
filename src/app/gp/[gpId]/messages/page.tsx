import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CommsWorkspace } from "@/components/comms/CommsWorkspace";
import { gpById, gps } from "@/lib/gps";
import { clients, people } from "@/lib/comms";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  return { title: { absolute: gp ? `${gp.shortName} — Corporate Chat` : "Corporate Chat" } };
}

export default function GpMessagesPage({ params }: { params: Promise<{ gpId: string }> }) {
  return (
    <Suspense fallback={<div className="h-[calc(100dvh-64px)]" />}>
      <Messages params={params} />
    </Suspense>
  );
}

async function Messages({ params }: { params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const client = clients.find((c) => c.gpId === gp.id);
  const person = client && people.find((p) => p.org === client.id && p.clientRole === "admin");
  if (!client || !person)
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="rounded-[12px] border border-dashed border-stone-300 bg-white px-8 py-16 text-center">
          <h1 className="text-[17px] font-semibold">Secure messages are being set up</h1>
          <p className="mx-auto mt-2 max-w-[440px] text-[13px] text-stone-600">Your administrator will open your workspace once your team is onboarded.</p>
        </div>
      </div>
    );
  return (
    <div className="mx-auto w-full max-w-[1640px] px-6 py-4 2xl:px-8">
      <CommsWorkspace
        mode="client"
        clientId={client.id}
        personId={person.id}
        accent={gp.brand.primary}
        accentInk={gp.brand.primaryInk}
        className="h-[calc(100dvh-64px-32px)] min-h-[560px]"
      />
    </div>
  );
}
