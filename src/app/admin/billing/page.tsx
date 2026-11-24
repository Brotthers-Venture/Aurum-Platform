import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { BillingWorkspace, type BillingTab } from "@/components/billing/BillingWorkspace";
import { reportingRate } from "@/lib/fx-server";

export const metadata: Metadata = { title: "Billing" };

const tabs: BillingTab[] = ["overview", "invoices", "new", "payments", "subscriptions", "fees"];

export default function BillingPage({ searchParams }: { searchParams: Promise<{ tab?: string; filter?: string }> }) {
  return (
    <div className="min-h-screen">
      <AdminTopBar context="Billing" />
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <Billing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Billing({ searchParams }: { searchParams: Promise<{ tab?: string; filter?: string }> }) {
  const [{ tab, filter }, fx] = await Promise.all([searchParams, reportingRate()]);
  const t = tabs.includes(tab as BillingTab) ? (tab as BillingTab) : "overview";
  return <BillingWorkspace key={`${t}-${filter ?? ""}`} tab={t} filter={filter} brlPerUsd={fx.rate} />;
}
