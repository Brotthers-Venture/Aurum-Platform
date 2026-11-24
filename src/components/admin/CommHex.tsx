"use client";

import Link from "next/link";
import { useState } from "react";
import { Band, FRAME, R, hexPoints } from "./HexNav";
import { totalUnread } from "@/lib/comms";

const TEAL = "#1F8A84";
const unread = totalUnread();

/** The Communication entry on the hub: same logo-style frame as the honeycomb, in deep turquoise. */
export function CommHex() {
  const [on, setOn] = useState(false);
  const w = Math.sqrt(3) * R + 24;
  const h = 2 * R + 24;
  return (
    <Link
      href="/admin/communication"
      className="absolute right-8 top-8 z-10 block w-[132px] focus:outline-none"
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      aria-label={`Communication — ${unread} unread`}
    >
      <svg viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} className="h-auto w-full drop-shadow-[0_10px_18px_rgba(31,138,132,0.18)]">
        <polygon points={hexPoints(R)} fill={on ? TEAL : "#FFFFFF"} style={{ transition: "fill 220ms" }} />
        <Band w={FRAME.outer + 2} color={TEAL} />
        <Band r={R - FRAME.outer - 2 - FRAME.gap} w={FRAME.inner + 1} color={on ? "#FBF3DC" : TEAL} style={{ transition: "fill 220ms" }} />
        <text textAnchor="middle" fill={on ? "#FFFFFF" : "#0F2340"} style={{ transition: "fill 200ms" }}>
          <tspan x={0} y={6} fontSize={17} fontWeight={600} letterSpacing="-0.01em">
            Communication
          </tspan>
          <tspan x={0} y={36} fontSize={10} fontWeight={700} letterSpacing="0.16em" fill={on ? "rgba(255,255,255,0.75)" : TEAL}>
            {unread ? `${unread} UNREAD` : "SECURE"}
          </tspan>
        </text>
      </svg>
    </Link>
  );
}
