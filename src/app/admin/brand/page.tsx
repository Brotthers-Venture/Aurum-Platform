import type { Metadata } from "next";
import { ModulePage } from "@/components/firm/ModulePage";
import { BrandStudio } from "@/components/brand/BrandStudio";

export const metadata: Metadata = { title: "Brand & white label" };

export default function Page() {
  return (
    <ModulePage context="Brand & white label">
      <BrandStudio />
    </ModulePage>
  );
}
