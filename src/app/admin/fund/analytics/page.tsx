import type { Metadata } from "next";
import { AnalyticsWorkspace } from "@/components/analytics/AnalyticsWorkspace";
import { analyticsData } from "@/lib/analytics";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <AnalyticsWorkspace data={analyticsData()} />;
}
