"use client";

import { useBrand } from "@/components/brand/BrandProvider";
import { HEXAS } from "@/lib/hexa";
import { moduleName } from "@/lib/brand";
import type { FirmId } from "@/lib/firm-colors";

export type Home = { id: string; name: string; color: string; href: string };

/**
 * The places a channel can belong to: every Hexa room and solution except Concourse itself. Channels are filed
 * under their room in the sidebar, carry its colour, and open from the room ("Team channel").
 */
export function useHomes(): Home[] {
  const { brand } = useBrand();
  return HEXAS.filter((h) => h.id !== "communication").map((h) => ({
    id: h.id,
    name: h.firm ? moduleName(brand, h.firm as FirmId) : h.name,
    color: h.color,
    href: h.href,
  }));
}

/** A small hexagon outline in the room's colour, the same mark the Hexa Room sidebar uses. */
export function HexDot({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden className="shrink-0">
      <path d="M6 1 10.33 3.5v5L6 11 1.67 8.5v-5Z" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}
