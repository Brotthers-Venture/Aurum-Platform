import type { Metadata } from "next";
import { CapitalCallWizard } from "@/components/fund/CapitalCallWizard";

export const metadata: Metadata = { title: "New capital call" };

export default function NewCapitalCall() {
  return <CapitalCallWizard />;
}
