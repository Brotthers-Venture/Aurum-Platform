import type { Metadata } from "next";
import { AnalyticsWorkspace } from "@/components/analytics/AnalyticsWorkspace";
import { analyticsData } from "@/lib/analytics";
import { ptaxTable, rateOn } from "@/lib/fx-server";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const table = await ptaxTable();
  return <AnalyticsWorkspace data={analyticsData((d) => rateOn(table, d))} />;
}
