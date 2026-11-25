import type { Metadata } from "next";
import { ModulePage } from "@/components/firm/ModulePage";
import { OnboardingDesk } from "@/components/mfo/FamilyWealth";

export const metadata: Metadata = { title: "Client onboarding" };

export default function Page() {
  return (
    <ModulePage context="Multi-Family Office" wide>
      <OnboardingDesk />
    </ModulePage>
  );
}
