import type { Metadata } from "next";
import { IncorporationFlow } from "@/components/corporate/IncorporationFlow";

export const metadata: Metadata = { title: "Form a company — Aurum" };

export default function Page() {
  return <IncorporationFlow />;
}
