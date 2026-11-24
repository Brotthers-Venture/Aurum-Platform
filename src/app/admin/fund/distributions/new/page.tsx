import type { Metadata } from "next";
import { DistributionWizard } from "@/components/fund/DistributionWizard";

export const metadata: Metadata = { title: "New distribution" };

export default function NewDistribution() {
  return <DistributionWizard />;
}
