"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BrandCenter, DarkCenter, MarkCenter, R, hexPoints, offset, ringOrder, type Slot } from "./HexNav";
import { GpLogo } from "@/components/brand/GpLogo";
import { GoldField } from "@/components/admin/GoldField";
import { solutions } from "@/lib/solutions";
import { gps, gpById, type GpClient } from "@/lib/gps";
import { gpTotals } from "@/lib/gpData";

/**
 * Hub navigation as a single honeycomb that travels:
 *   Aurum mark → (hover) six solutions → (rest on Fund Solution) GP logos →
 *   (rest on a GP) that GP's modules.
 * The chosen hexagon glides to the centre and everything else is replaced by
 * its children. A level opens only after the pointer has moved and rested on
 * a hexagon (dwell), so a hexagon appearing under the cursor never opens by
 * itself. Click works everywhere for touch devices.
 */

type Level = { kind: "root" } | { kind: "fund"; from: Slot } | { kind: "gp"; gpId: string; from: Slot };

type Node = {
  id: string;
  slot: Slot;
  label: [string, string?];
  sub: string;
  subTone?: "accent" | "muted";
  outline?: boolean;
  accent?: string;
  art?: (active: boolean) => ReactNode;
  /** opens the next level on dwell or click */
  open?: () => void;
  /** navigates on click */
  href?: string;
};

const DWELL_MS = 420;
const MOVE_PX = 6;

const orderedGps = [...gps].sort((a, b) => Number(!!a.sample) - Number(!!b.sample) || gpTotals(b.id).nav - gpTotals(a.id).nav);
const tallLogo = (g: GpClient) => !!g.logo && g.logo.width / g.logo.height < 3;

const gpModules: { id: string; label: [string, string?]; path: string }[] = [
  { id: "funds", label: ["Funds"], path: "funds" },
  { id: "investors", label: ["Investors"], path: "investors" },
  { id: "onboarding", label: ["Onboarding"], path: "onboarding" },
  { id: "capital", label: ["Capital calls &", "Distributions"], path: "capital" },
  { id: "reports", label: ["Reports"], path: "reports" },
  { id: "portal", label: ["Portal &", "Brand"], path: "portal" },
];

export function AdminHub() {
  const router = useRouter();
  const [level, setLevel] = useState<Level>({ kind: "root" });
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const armed = useRef(true);
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverNode = useRef<Node | null>(null);

  const clearDwell = () => {
    if (dwell.current) clearTimeout(dwell.current);
    dwell.current = null;
  };

  /** Open the hovered node only once the pointer has rested on it for DWELL_MS. */
  const restartDwell = () => {
    clearDwell();
    const n = hoverNode.current;
    if (!n?.open || !armed.current) return;
    dwell.current = setTimeout(() => {
      if (armed.current && hoverNode.current === n) n.open!();
    }, DWELL_MS);
  };

  const go = (l: Level) => {
    clearDwell();
    hoverNode.current = null;
    setActive(null);
    armed.current = false; // wait for the pointer to move before the next dwell can fire
    anchor.current = null;
    setLevel(l);
  };

  useEffect(
    () => () => {
      if (dwell.current) clearTimeout(dwell.current);
      if (leave.current) clearTimeout(leave.current);
    },
    [],
  );

  // ---- build the current ring ----
  let nodes: Node[] = [];
  let center: ReactNode;
  let centerFrom: Slot | null = null;
  let accent = "#0B1519";
  let outlineColor = "#F8C618";
  let ringShown = true;

  if (level.kind === "root") {
    ringShown = revealed;
    nodes = solutions.map((s) => ({
      id: s.id,
      slot: s.slot,
      label: s.lines,
      sub: s.live ? `${gps.length} GPS` : "COMING SOON",
      subTone: s.live ? "accent" : "muted",
      outline: s.live,
      ...(s.id === "fund" ? { open: () => go({ kind: "fund", from: s.slot }) } : { href: s.href }),
    }));
    center = <MarkCenter expanded={revealed} />;
  } else if (level.kind === "fund") {
    centerFrom = level.from;
    nodes = orderedGps.slice(0, 5).map((g, i) => {
      const t = gpTotals(g.id);
      return {
        id: g.id,
        slot: ringOrder[i],
        label: [g.shortName],
        sub: t.funds ? `${t.funds} FUND${t.funds > 1 ? "S" : ""}` : "ONBOARDING",
        accent: g.brand.primary,
        art: (on: boolean) => <GpLogo gp={g} height={tallLogo(g) ? 50 : 20} tone={on ? "dark" : "light"} compact />,
        open: () => go({ kind: "gp", gpId: g.id, from: ringOrder[i] }),
      };
    });
    nodes.push({ id: "all", slot: ringOrder[5], label: ["All GPs"], sub: `${gps.length} CLIENTS`, subTone: "accent", outline: true, href: "/admin/fund/gps" });
    center = <DarkCenter lines={["Fund", "Solution"]} />;
  } else {
    const gp = gpById(level.gpId)!;
    const t = gpTotals(gp.id);
    centerFrom = level.from;
    accent = gp.brand.primary;
    outlineColor = gp.brand.secondary;
    const subs: Record<string, string> = {
      funds: `${t.funds} VEHICLE${t.funds === 1 ? "" : "S"}`,
      investors: `${t.investors} INVESTORS`,
      onboarding: `${t.onboarding} OPEN`,
      capital: `${t.openCalls} OPEN`,
      reports: "DOCUMENTS",
      portal: gp.status === "Live" ? "LIVE" : "SETTING UP",
    };
    nodes = gpModules.map((m, i) => ({ id: m.id, slot: ringOrder[i], label: m.label, sub: subs[m.id], href: `/admin/fund/gps/${gp.id}/${m.path}` }));
    center = (
      <BrandCenter color={gp.brand.primary} secondary={gp.brand.secondary}>
        <GpLogo gp={gp} height={tallLogo(gp) ? 52 : 26} compact />
      </BrandCenter>
    );
  }

  const toRoot = () => {
    go({ kind: "root" });
    setRevealed(true);
  };
  const back = () => (level.kind === "gp" ? go({ kind: "fund", from: "ne" }) : toRoot());

  const crumbs: { label: string; target?: "root" | "fund" }[] =
    level.kind === "root"
      ? []
      : level.kind === "fund"
        ? [{ label: "Aurum", target: "root" }, { label: "Fund Solution" }]
        : [{ label: "Aurum", target: "root" }, { label: "Fund Solution", target: "fund" }, { label: gpById(level.gpId)!.shortName }];
  const crumbTo = (t: "root" | "fund") => (t === "root" ? toRoot() : go({ kind: "fund", from: "ne" }));

  const step = Math.sqrt(3) * R + 10;
  const size = Math.round(step * 2 + Math.sqrt(3) * R + 40);
  const h = Math.round(step * Math.sqrt(3) + 2 * R + 40);
  const levelKey = level.kind === "gp" ? `gp-${level.gpId}` : level.kind;
  const animateRing = level.kind !== "root";

  const activate = (n: Node) => (n.open ? n.open() : n.href && router.push(n.href));

  return (
    <main
      className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-8 py-10"
      onMouseEnter={() => leave.current && clearTimeout(leave.current)}
      onMouseLeave={() => {
        clearDwell();
        leave.current = setTimeout(() => {
          setLevel({ kind: "root" });
          setRevealed(false);
          setActive(null);
        }, 900);
      }}
    >
      <GoldField className="pointer-events-none absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(ellipse_75%_70%_at_50%_50%,#000_45%,transparent_100%)]" />
      {crumbs.length > 0 && (
        <nav className="absolute left-8 top-8 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-stone-300" />}
              {c.target ? (
                <button onClick={() => crumbTo(c.target!)} className="uppercase hover:text-ink-900">
                  {c.label}
                </button>
              ) : (
                <span className="text-ink-900">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <svg
        viewBox={`${-size / 2} ${-h / 2} ${size} ${h}`}
        className="h-auto w-full max-w-[640px] select-none"
        role="group"
        aria-label="Aurum navigation"
        onPointerMove={(e) => {
          if (!armed.current) {
            if (!anchor.current) anchor.current = { x: e.clientX, y: e.clientY };
            else if (Math.hypot(e.clientX - anchor.current.x, e.clientY - anchor.current.y) > MOVE_PX) armed.current = true;
          }
          restartDwell(); // every movement resets the rest timer
        }}
      >
        <g key={levelKey}>
          {nodes.map((n, i) => {
            const { x, y } = offset(n.slot);
            const on = active === n.id;
            const style: CSSProperties = animateRing
              ? ({ "--tx": `${x}px`, "--ty": `${y}px`, animationDelay: `${260 + i * 45}ms`, transform: `translate(${x}px, ${y}px)` } as CSSProperties)
              : {
                  transform: ringShown ? `translate(${x}px, ${y}px) scale(1)` : `translate(${(x * 0.35).toFixed(2)}px, ${(y * 0.35).toFixed(2)}px) scale(0.6)`,
                  opacity: ringShown ? 1 : 0,
                  transitionDelay: ringShown ? `${i * 45}ms` : "0ms",
                  pointerEvents: ringShown ? "auto" : "none",
                };
            return (
              <g
                key={n.id}
                className={animateRing ? "hex-enter-late" : "hex-cell"}
                style={{ ...style, cursor: "pointer" }}
                role="link"
                tabIndex={ringShown ? 0 : -1}
                aria-label={`${n.label.filter(Boolean).join(" ")} — ${n.sub}`}
                onMouseEnter={() => {
                  setActive(n.id);
                  hoverNode.current = n;
                  restartDwell();
                }}
                onMouseLeave={() => {
                  setActive((a) => (a === n.id ? null : a));
                  if (hoverNode.current?.id === n.id) hoverNode.current = null;
                  clearDwell();
                }}
                onClick={() => activate(n)}
                onKeyDown={(e) => e.key === "Enter" && activate(n)}
              >
                <polygon
                  points={hexPoints(R)}
                  fill={on ? n.accent ?? accent : "#FFFFFF"}
                  stroke={on ? n.accent ?? accent : "#CFCFC7"}
                  strokeWidth={1}
                  style={{ transition: "fill 200ms, stroke 200ms" }}
                />
                {n.outline && <polygon points={hexPoints(R - 7)} fill="none" stroke={outlineColor} strokeWidth={1.5} />}
                {n.art && (
                  <foreignObject x={-66} y={-46} width={132} height={70} style={{ pointerEvents: "none" }}>
                    <div className="flex h-full w-full items-center justify-center">{n.art(on)}</div>
                  </foreignObject>
                )}
                <text textAnchor="middle" fill={on ? "#FFFFFF" : "#0B1519"} style={{ transition: "fill 200ms" }}>
                  {!n.art && (
                    <tspan x={0} y={n.label[1] ? -4 : 6} fontSize={16} fontWeight={600} letterSpacing="-0.01em">
                      {n.label[0]}
                    </tspan>
                  )}
                  {!n.art && n.label[1] && (
                    <tspan x={0} y={16} fontSize={16} fontWeight={600} letterSpacing="-0.01em">
                      {n.label[1]}
                    </tspan>
                  )}
                  <tspan
                    x={0}
                    y={44}
                    fontSize={9.5}
                    fontWeight={600}
                    letterSpacing="0.16em"
                    fill={n.subTone === "accent" ? (on ? outlineColor : "#8A6A00") : on ? "rgba(255,255,255,0.65)" : "#A3A39B"}
                  >
                    {n.sub}
                  </tspan>
                </text>
              </g>
            );
          })}

          <g
            className={centerFrom ? "hex-glide" : undefined}
            style={
              centerFrom
                ? ({ "--fx": `${offset(centerFrom).x}px`, "--fy": `${offset(centerFrom).y}px`, cursor: "pointer" } as CSSProperties)
                : { cursor: "pointer" }
            }
            role="button"
            tabIndex={0}
            aria-label={level.kind === "root" ? "Aurum — show solutions" : "Back"}
            aria-expanded={level.kind === "root" ? revealed : undefined}
            onMouseEnter={() => level.kind === "root" && setRevealed(true)}
            onClick={() => (level.kind === "root" ? setRevealed((r) => !r) : back())}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (level.kind === "root" ? setRevealed((r) => !r) : back())}
          >
            {center}
          </g>
        </g>
      </svg>
    </main>
  );
}
