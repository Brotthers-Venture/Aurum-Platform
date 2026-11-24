"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export const R = 96;
const GAP = 10;
const STEP = Math.sqrt(3) * R + GAP;

export type Slot = "ne" | "e" | "se" | "sw" | "w" | "nw";
const slotAngle: Record<Slot, number> = { e: 0, se: 60, sw: 120, w: 180, nw: 240, ne: 300 };
export const ringOrder: Slot[] = ["nw", "ne", "e", "se", "sw", "w"];

export function hexPoints(r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

export function offset(slot: Slot) {
  const a = (Math.PI / 180) * slotAngle[slot];
  return { x: Math.round(STEP * Math.cos(a) * 100) / 100, y: Math.round(STEP * Math.sin(a) * 100) / 100 };
}

export type Cell = {
  id: string;
  slot: Slot;
  lines: [string, string?];
  sub: string;
  subTone?: "accent" | "muted";
  href?: string;
  onSelect?: () => void;
  outline?: boolean;
  /** hover fill for this cell (e.g. a GP's brand colour) */
  accent?: string;
  /** custom artwork (e.g. a GP logo) shown instead of the text label */
  art?: (active: boolean) => ReactNode;
};

export function HexNav({
  cells,
  center,
  centerLabel,
  revealOnHover = false,
  accent = "#0B1519",
  outlineColor = "#F8C618",
  onHover,
  onCenterClick,
}: {
  cells: Cell[];
  center: ReactNode | ((open: boolean) => ReactNode);
  centerLabel: string;
  revealOnHover?: boolean;
  accent?: string;
  outlineColor?: string;
  onHover?: (id: string | null) => void;
  onCenterClick?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!revealOnHover);
  const [active, setActive] = useState<string | null>(null);
  const shown = open || !revealOnHover;

  const hover = (id: string | null) => {
    setActive(id);
    onHover?.(id);
  };
  const go = (c: Cell) => (c.onSelect ? c.onSelect() : c.href && router.push(c.href));

  const size = Math.round(STEP * 2 + Math.sqrt(3) * R + 40);
  const h = Math.round(STEP * Math.sqrt(3) + 2 * R + 40);

  return (
    <svg
      viewBox={`${-size / 2} ${-h / 2} ${size} ${h}`}
      className="h-auto w-full max-w-[600px] select-none"
      onMouseLeave={() => {
        if (revealOnHover) setOpen(false);
        hover(null);
      }}
      role="group"
      aria-label={centerLabel}
    >
      {cells.map((c, i) => {
        const { x, y } = offset(c.slot);
        const isActive = active === c.id;
        const style = revealOnHover
          ? {
              transform: shown ? `translate(${x}px, ${y}px) scale(1)` : `translate(${(x * 0.35).toFixed(2)}px, ${(y * 0.35).toFixed(2)}px) scale(0.6)`,
              opacity: shown ? 1 : 0,
              transitionDelay: shown ? `${i * 45}ms` : "0ms",
              pointerEvents: shown ? ("auto" as const) : ("none" as const),
            }
          : ({ "--tx": `${x}px`, "--ty": `${y}px`, animationDelay: `${i * 45}ms`, transform: `translate(${x}px, ${y}px)` } as React.CSSProperties);
        return (
          <g
            key={c.id}
            className={revealOnHover ? "hex-cell" : "hex-enter"}
            style={{ ...style, cursor: "pointer" }}
            onMouseEnter={() => hover(c.id)}
            onFocus={() => hover(c.id)}
            onClick={() => go(c)}
            onKeyDown={(e) => e.key === "Enter" && go(c)}
            tabIndex={shown ? 0 : -1}
            role="link"
            aria-label={`${c.lines.filter(Boolean).join(" ")} — ${c.sub}`}
          >
            <polygon
              points={hexPoints(R)}
              fill={isActive ? c.accent ?? accent : "#FFFFFF"}
              stroke={isActive ? c.accent ?? accent : "#CFCFC7"}
              strokeWidth={1}
              style={{ transition: "fill 200ms, stroke 200ms" }}
            />
            {c.outline && <polygon points={hexPoints(R - 7)} fill="none" stroke={outlineColor} strokeWidth={1.5} />}
            {c.art && (
              <foreignObject x={-66} y={-46} width={132} height={70} style={{ pointerEvents: "none" }}>
                <div className="flex h-full w-full items-center justify-center">{c.art(isActive)}</div>
              </foreignObject>
            )}
            <text textAnchor="middle" fill={isActive ? "#FFFFFF" : "#0B1519"} style={{ transition: "fill 200ms" }}>
              {!c.art && (
                <tspan x={0} y={c.lines[1] ? -4 : 6} fontSize={16} fontWeight={600} letterSpacing="-0.01em">
                  {c.lines[0]}
                </tspan>
              )}
              {!c.art && c.lines[1] && (
                <tspan x={0} y={16} fontSize={16} fontWeight={600} letterSpacing="-0.01em">
                  {c.lines[1]}
                </tspan>
              )}
              <tspan
                x={0}
                y={44}
                fontSize={9.5}
                fontWeight={600}
                letterSpacing="0.16em"
                fill={c.subTone === "accent" ? (isActive ? outlineColor : "#8A6A00") : isActive ? "rgba(255,255,255,0.65)" : "#A3A39B"}
              >
                {c.sub}
              </tspan>
            </text>
          </g>
        );
      })}

      <g
        onMouseEnter={() => revealOnHover && setOpen(true)}
        onClick={() => (revealOnHover ? setOpen((o) => !o) : onCenterClick?.())}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-expanded={shown}
        aria-label={centerLabel}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (revealOnHover ? setOpen((o) => !o) : onCenterClick?.())}
      >
        {typeof center === "function" ? center(shown) : center}
      </g>
    </svg>
  );
}

/** Dark centre cell with a gold inner ring and a two-line serif label. */
export function DarkCenter({ lines, expanded = true }: { lines: [string, string]; expanded?: boolean }) {
  return (
    <>
      <polygon points={hexPoints(R)} fill="#0B1519" className="hex-cell" style={{ transform: `scale(${expanded ? 1 : 1.16})` }} />
      <polygon
        points={hexPoints(R - 9)}
        fill="none"
        stroke="#F8C618"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className="hex-cell"
        style={{ transform: `scale(${expanded ? 1 : 1.2})` }}
      />
      <text textAnchor="middle" fill="#FFFFFF">
        <tspan x={0} y={-6} fontSize={22} className="font-serif">
          {lines[0]}
        </tspan>
        <tspan x={0} y={20} fontSize={22} className="font-serif">
          {lines[1]}
        </tspan>
      </text>
    </>
  );
}

/** White centre cell carrying a GP's own logo, bordered in its brand colour. */
export function BrandCenter({ color, secondary, children }: { color: string; secondary: string; children: ReactNode }) {
  return (
    <>
      <polygon points={hexPoints(R)} fill="#FFFFFF" stroke={color} strokeWidth={2} />
      <polygon points={hexPoints(R - 9)} fill="none" stroke={secondary} strokeWidth={1.5} />
      <foreignObject x={-74} y={-44} width={148} height={88}>
        <div className="flex h-full w-full items-center justify-center">{children}</div>
      </foreignObject>
    </>
  );
}

/** The Aurum hexagon mark as the centre: outer band, gap, inner band, open centre. */
export function MarkCenter({ expanded = true }: { expanded?: boolean }) {
  const k = R / 174; // mark geometry measured on a 174-unit outer radius
  const d = [174, 142, 117, 86]
    .map((r) => {
      const p = hexPoints(r * k).split(" ");
      return `M${p.join("L")}Z`;
    })
    .join(" ");
  return (
    <>
      <polygon points={hexPoints(R)} fill="transparent" />
      <path d={d} fill="#F8C618" fillRule="evenodd" className="hex-cell" style={{ transform: `scale(${expanded ? 1 : 1.12})` }} />
    </>
  );
}
