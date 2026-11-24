"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { solutions, type Solution } from "@/lib/solutions";

const R = 96; // circumradius of each cell (pointy-top)
const GAP = 10;
const STEP = Math.sqrt(3) * R + GAP; // centre-to-centre distance

const slotAngle: Record<Solution["slot"], number> = { e: 0, se: 60, sw: 120, w: 180, nw: 240, ne: 300 };

function hexPoints(r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function offset(slot: Solution["slot"]) {
  const a = (Math.PI / 180) * slotAngle[slot];
  return { x: Math.round(STEP * Math.cos(a) * 100) / 100, y: Math.round(STEP * Math.sin(a) * 100) / 100 };
}

export function Honeycomb({
  onActiveChange,
}: {
  onActiveChange?: (s: Solution | null, open: boolean) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const update = (nextOpen: boolean, id: string | null) => {
    setOpen(nextOpen);
    setActive(id);
    onActiveChange?.(id ? solutions.find((s) => s.id === id) ?? null : null, nextOpen);
  };

  const size = Math.round(STEP * 2 + Math.sqrt(3) * R + 40);
  const h = Math.round(STEP * Math.sqrt(3) + 2 * R + 40);

  return (
    <svg
      viewBox={`${-size / 2} ${-h / 2} ${size} ${h}`}
      className="h-auto w-full max-w-[600px] select-none"
      onMouseLeave={() => update(false, null)}
      role="group"
      aria-label="Aurum solutions"
    >
      {/* ring cells */}
      {solutions.map((s, i) => {
        const { x, y } = offset(s.slot);
        const isActive = active === s.id;
        return (
          <g
            key={s.id}
            className="hex-cell"
            style={{
              transform: open ? `translate(${x}px, ${y}px) scale(1)` : `translate(${(x * 0.35).toFixed(2)}px, ${(y * 0.35).toFixed(2)}px) scale(0.6)`,
              opacity: open ? 1 : 0,
              transitionDelay: open ? `${i * 45}ms` : "0ms",
              pointerEvents: open ? "auto" : "none",
              cursor: "pointer",
            }}
            onMouseEnter={() => update(true, s.id)}
            onFocus={() => update(true, s.id)}
            onClick={() => router.push(s.href)}
            onKeyDown={(e) => e.key === "Enter" && router.push(s.href)}
            tabIndex={open ? 0 : -1}
            role="link"
            aria-label={`${s.name}${s.live ? "" : " — coming soon"}`}
          >
            <polygon
              points={hexPoints(R)}
              fill={isActive ? "#0B1519" : "#FFFFFF"}
              stroke={isActive ? "#0B1519" : "#CFCFC7"}
              strokeWidth={1}
              style={{ transition: "fill 200ms, stroke 200ms" }}
            />
            {s.live && (
              <polygon points={hexPoints(R - 7)} fill="none" stroke="#F8C618" strokeWidth={1.5} opacity={isActive ? 1 : 0.9} />
            )}
            <text
              textAnchor="middle"
              className="font-sans"
              fill={isActive ? "#FFFFFF" : "#0B1519"}
              style={{ transition: "fill 200ms" }}
            >
              <tspan x={0} y={-4} fontSize={16} fontWeight={600} letterSpacing="-0.01em">
                {s.lines[0]}
              </tspan>
              <tspan x={0} y={16} fontSize={16} fontWeight={600} letterSpacing="-0.01em">
                {s.lines[1]}
              </tspan>
              <tspan
                x={0}
                y={44}
                fontSize={9.5}
                fontWeight={600}
                letterSpacing="0.16em"
                fill={s.live ? (isActive ? "#F8C618" : "#8A6A00") : isActive ? "#A3A39B" : "#A3A39B"}
              >
                {s.live ? "LIVE" : "COMING SOON"}
              </tspan>
            </text>
          </g>
        );
      })}

      {/* centre cell — Client Portal */}
      <g
        onMouseEnter={() => update(true, active)}
        onClick={() => update(!open, null)}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label="Client Portal — show solutions"
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && update(!open, null)}
      >
        <polygon
          points={hexPoints(R)}
          fill="#0B1519"
          className="hex-cell"
          style={{ transform: `scale(${open ? 1 : 1.16})` }}
        />
        <polygon
          points={hexPoints(R - 9)}
          fill="none"
          stroke="#F8C618"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          className="hex-cell"
          style={{ transform: `scale(${open ? 1 : 1.2})` }}
        />
        <text textAnchor="middle" fill="#FFFFFF">
          <tspan x={0} y={-6} fontSize={22} className="font-serif" letterSpacing="0.01em">
            Client
          </tspan>
          <tspan x={0} y={20} fontSize={22} className="font-serif" letterSpacing="0.01em">
            Portal
          </tspan>
        </text>
      </g>
    </svg>
  );
}
