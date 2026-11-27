import type { Metadata } from "next";
import { NoticeBook } from "@/components/fund/NoticeBook";
import { capitalCalls } from "@/lib/data";

export const metadata: Metadata = { title: "Capital call notices" };

export function generateStaticParams() {
  return capitalCalls.map((c) => ({ callId: c.id }));
}

export default async function Page({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  return <NoticeBook callId={callId} />;
}
