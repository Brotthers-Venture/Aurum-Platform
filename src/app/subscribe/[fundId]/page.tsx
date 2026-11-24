import { notFound } from "next/navigation";
import { SubscriptionFlow } from "@/components/subscribe/SubscriptionFlow";
import { fundById, onboarding } from "@/lib/data";

export function generateStaticParams() {
  return Array.from(new Set(onboarding.map((o) => o.fundId))).map((fundId) => ({ fundId }));
}

export async function generateMetadata({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  return { title: `Subscribe — ${fundById(fundId)?.shortName ?? "Fund"}` };
}

export default async function SubscribePage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const f = fundById(fundId);
  if (!f) notFound();
  return <SubscriptionFlow fundName={f.name} gp={f.gp} />;
}
