import type { Metadata } from "next";
import { OnboardingPipeline } from "@/components/fund/OnboardingPipeline";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return <OnboardingPipeline />;
}
