import { notFound } from "next/navigation";
import { EconomicsEditor } from "@/components/fund/EconomicsEditor";
import { fundById, funds } from "@/lib/data";

export function generateStaticParams() {
  return funds.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Economics — ${fundById(id)?.shortName ?? "Fund"}` };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = fundById(id);
  if (!f) notFound();
  return <EconomicsEditor fund={f} />;
}
