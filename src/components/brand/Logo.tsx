"use client";

import Image from "next/image";
import { useBrand } from "./BrandProvider";
import type { MarkShape } from "@/lib/brand";

/**
 * The tenant's mark and logo. Aurum's hexagon is the default; a white-label client picks a mark shape and
 * uploads its own logo. Names stay "Aurum…" in code because they are the platform's components, not its brand.
 */
function hexPoints(r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`);
  }
  return pts;
}
const hexPath = (r: number) => `M${hexPoints(r).join("L")}Z`;
const circle = (r: number) => `M0,${-r}A${r},${r} 0 1,1 0,${r}A${r},${r} 0 1,1 0,${-r}Z`;
const square = (r: number) => `M${-r * 0.87},${-r * 0.87}H${r * 0.87}V${r * 0.87}H${-r * 0.87}Z`;
const diamond = (r: number) => `M0,${-r}L${r * 0.87},0L0,${r}L${-r * 0.87},0Z`;
const arch = (r: number) => {
  const w = r * 0.82;
  return `M${-w},${r * 0.9}V${-r * 0.1}A${w},${w} 0 0,1 ${w},${-r * 0.1}V${r * 0.9}Z`;
};
const SHAPES: Record<MarkShape, (r: number) => string> = { hexagon: hexPath, circle, square, diamond, arch };

/** The four concentric bands of the mark, in the tenant's chosen shape. */
export function markPath(shape: MarkShape = "hexagon") {
  const f = SHAPES[shape];
  return [f(174), f(142), f(117), f(86)].join(" ");
}

export function AurumMark({ size = 28, className, color = "var(--tenant-accent)", shape }: { size?: number; className?: string; color?: string; shape?: MarkShape }) {
  const { brand } = useBrand();
  return (
    <svg width={size} height={size * (348 / 302)} viewBox="-151 -174 302 348" className={className} aria-hidden="true">
      <path d={markPath(shape ?? brand.mark)} fill={color} fillRule="evenodd" />
    </svg>
  );
}

export function AurumLogo({ variant = "dark", height = 32, className, priority }: { variant?: "dark" | "white"; height?: number; className?: string; priority?: boolean }) {
  const { brand } = useBrand();
  const src = variant === "dark" ? brand.logo : (brand.logoLight ?? brand.logo);
  if (src) {
    if (src.startsWith("/")) {
      const ratio = src.includes("aurum-logo-dark") ? 1276 / 405 : src.includes("aurum-logo-white") ? 1404 / 408 : 3;
      return <Image src={src} alt={brand.legalName} width={Math.round(height * ratio)} height={height} className={className} priority={priority} />;
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={brand.legalName} style={{ height, width: "auto" }} className={className} />;
  }
  // No logo uploaded: compose one from the mark and the name.
  return (
    <span className={`inline-flex items-center gap-[0.3em] ${className ?? ""}`} style={{ fontSize: height }} aria-label={brand.legalName}>
      <AurumMark size={height * 0.78} />
      <span className="flex flex-col leading-none">
        <span className="font-serif uppercase" style={{ fontSize: height * 0.5, letterSpacing: "0.04em", color: variant === "dark" ? "var(--tenant-ink)" : "#fff" }}>
          {brand.name}
        </span>
        <span
          className="mt-[0.18em] font-serif uppercase"
          style={{ fontSize: height * 0.16, letterSpacing: "0.22em", color: variant === "dark" ? "var(--tenant-ink)" : "rgba(255,255,255,.8)" }}
        >
          {brand.tagline}
        </span>
      </span>
    </span>
  );
}

/** Compact lockup for app chrome: vector mark + set wordmark. */
export function AurumWordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { brand } = useBrand();
  return (
    <span className="inline-flex items-center gap-2.5">
      <AurumMark size={20} />
      <span className={`font-serif text-[17px] font-semibold uppercase tracking-[0.16em] ${tone === "light" ? "text-white" : "text-ink-900"}`}>{brand.name}</span>
    </span>
  );
}
