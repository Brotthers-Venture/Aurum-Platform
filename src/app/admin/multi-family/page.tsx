import type { Metadata } from "next";
import { ModulePage } from "@/components/firm/ModulePage";
import { MultiFamilyWorkspace } from "@/components/mfo/MultiFamilyWorkspace";

export const metadata: Metadata = { title: "Multi-Family Office" };

export default function Page() {
  return (
    <ModulePage context="Multi-Family Office">
      <MultiFamilyWorkspace />
    </ModulePage>
  );
}
