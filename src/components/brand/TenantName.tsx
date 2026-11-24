"use client";

import { useBrand } from "./BrandProvider";

/** The operating firm’s name as set in white label — use wherever the interface names the platform owner. */
export function TenantName({ legal }: { legal?: boolean }) {
  const { brand } = useBrand();
  return <>{legal ? brand.legalName : brand.name}</>;
}
