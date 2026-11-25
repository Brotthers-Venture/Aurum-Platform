"use client";

import { useBrand } from "./BrandProvider";
import { moduleName } from "@/lib/brand";
import type { FirmId } from "@/lib/firm-colors";

/** A firm workspace's name as the tenant calls it (Brand & white label → Module names). */
export function ModuleName({ id }: { id: FirmId }) {
  const { brand } = useBrand();
  return <>{moduleName(brand, id)}</>;
}
