import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountDetail } from "@/components/banking/Accounts";
import { ACCOUNTS } from "@/lib/banking/data";

export const metadata: Metadata = { title: "Account" };

export function generateStaticParams() {
  return ACCOUNTS.map((a) => ({ id: a.id }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountDetail id={id} />;
}
