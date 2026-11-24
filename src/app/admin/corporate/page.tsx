import type { Metadata } from "next";
import { ModulePage } from "@/components/firm/ModulePage";
import { CorporateWorkspace } from "@/components/corporate/CorporateWorkspace";

export const metadata: Metadata = { title: "Corporate Solution" };

export default function Page() {
  return (
    <ModulePage context="Corporate Solution">
      <CorporateWorkspace />
    </ModulePage>
  );
}
