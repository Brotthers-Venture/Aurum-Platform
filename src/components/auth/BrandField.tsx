"use client";

import { useEffect, useState } from "react";
import { markPath } from "@/components/brand/Logo";
import type { MarkShape } from "@/lib/brand";

/**
 * The shared sign-in background for every entrance (Aurum, tenants, GP portals): a matte field derived from the
 * brand's ink, a very large and faint lattice of the brand mark's outline, one broad light in the brand's accent,
 * and a slow band of light that crosses it about every 30 seconds. Nothing floats or spins; the band is a
 * transform-only animation, off with reduced motion, when the page is hidden, or when motion is turned off.
 */
export function BrandField({
  ink,
  accent,
  shape = "hexagon",
  tone = "dark",
  still = false,
}: {
  ink: string;
  accent: string;
  shape?: MarkShape;
  tone?: "dark" | "light";
  still?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const light = tone === "light";
  const base = light ? `color-mix(in oklab, ${ink} 6%, #eeebe5)` : `color-mix(in oklab, ${ink} 42%, #14181c)`;
  const base2 = light ? `color-mix(in oklab, ${accent} 10%, #f7f5f0)` : `color-mix(in oklab, ${ink} 60%, #1f2428)`;
  const glow = light ? `color-mix(in oklab, ${accent} 22%, transparent)` : `color-mix(in oklab, color-mix(in oklab, ${accent} 45%, #7a6e55) 32%, transparent)`;
  const line = light ? `color-mix(in oklab, ${ink} 5%, transparent)` : `color-mix(in oklab, ${accent} 6.5%, transparent)`;
  // the mark outline, scaled to a large cell; viewBox of markPath is about 302 × 348
  const cell = 302;
  return (
    <div
      className={`brand-field absolute inset-0 overflow-hidden ${hidden || still ? "is-still" : ""}`}
      aria-hidden
      style={{ background: `radial-gradient(140% 110% at 30% 30%, ${base2} 0%, ${base} 70%)` }}
    >
      <div className="absolute inset-0" style={{ background: `radial-gradient(70% 60% at 28% 38%, ${glow} 0%, transparent 72%)` }} />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1600 1000">
        <defs>
          <pattern id="bf-lattice" width={cell * 1.04} height={348 * 1.56} patternUnits="userSpaceOnUse" patternTransform="translate(-80 -120) scale(1.15)">
            <g transform={`translate(${cell * 0.52} ${348 * 0.5})`}>
              <path d={markPath(shape)} fill="none" stroke={line} strokeWidth={2.2} />
            </g>
            <g transform={`translate(${cell * 1.04} ${348 * 1.28})`}>
              <path d={markPath(shape)} fill="none" stroke={line} strokeWidth={2.2} />
            </g>
            <g transform={`translate(0 ${348 * 1.28})`}>
              <path d={markPath(shape)} fill="none" stroke={line} strokeWidth={2.2} />
            </g>
          </pattern>
          <radialGradient id="bf-fade" cx="0.32" cy="0.4" r="0.75">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
          </radialGradient>
          <mask id="bf-mask">
            <rect width="1600" height="1000" fill="url(#bf-fade)" />
          </mask>
        </defs>
        <rect width="1600" height="1000" fill="url(#bf-lattice)" mask="url(#bf-mask)" />
      </svg>
      {/* the band of light: broad, soft, crossing slowly */}
      <div
        className="brand-field-band absolute inset-y-0 left-0 w-[55%]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, color-mix(in oklab, ${accent} ${light ? 6 : 5}%, transparent) 30%, color-mix(in oklab, ${accent} ${light ? 12 : 10}%, transparent) 50%, color-mix(in oklab, ${accent} ${light ? 6 : 5}%, transparent) 70%, transparent 100%)`,
        }}
      />
      {/* grain dithers the gradients */}
      <div className="brand-field-grain absolute inset-0" />
    </div>
  );
}
