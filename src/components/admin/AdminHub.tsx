"use client";

import { OFFERINGS } from "@/lib/offering/data";
import { TOKENS } from "@/lib/blockchain/data";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BrandCenter, FRAME, DarkCenter, MarkCenter, R, hexPoints, offset, ringOrder, type Slot } from "./HexNav";
import { GpLogo } from "@/components/brand/GpLogo";
import { markPath } from "@/components/brand/Logo";
import { useBrand } from "@/components/brand/BrandProvider";
import { moduleName } from "@/lib/brand";
import { AmbientBackdrop, usePageHidden, useTransmission } from "@/components/admin/ecosystem/Ambient";
import type { AmbientMotion } from "@/lib/brand";
import { cx } from "@/components/ui";
import { firmById, firmModules } from "@/lib/firm";
import { formations } from "@/lib/formation";
import { solutions } from "@/lib/solutions";
import { allows } from "@/lib/hexa";
import { useHexas } from "@/components/shell/useHexas";
import { gps, gpById, type GpClient } from "@/lib/gps";
import { gpTotals } from "@/lib/gpData";
import { INDICATIVE_BRL_USD } from "@/lib/data";

/**
 * Hub navigation as a single honeycomb that travels:
 *   Aurum mark → (hover) six solutions → (rest on Fund Solution) GP logos →
 *   (rest on a GP) that GP's modules.
 * The chosen hexagon glides to the centre and everything else is replaced by
 * its children. A level opens only after the pointer has moved and rested on
 * a hexagon (dwell), so a hexagon appearing under the cursor never opens by
 * itself. Click works everywhere for touch devices.
 */

type Pt = { x: number; y: number };
type Level = { kind: "root" } | { kind: "fund"; from: Slot } | { kind: "gp"; gpId: string; from: Slot } | { kind: "module"; id: string; from: Pt };

type Node = {
  id: string;
  slot: Slot;
  label: [string, string?];
  sub: string;
  subTone?: "accent" | "muted";
  /** colour of an accent sub-label at rest */
  subColor?: string;
  outline?: boolean;
  accent?: string;
  /** frame colour when hovered (defaults to the level's) */
  band?: string;
  art?: (active: boolean) => ReactNode;
  /** opens the next level on dwell or click */
  open?: () => void;
  /** navigates on click */
  href?: string;
};

/** Theme token for the light hover fill of Aurum-level cells (also used as a sentinel below). */
const CREAM = "var(--eco-cell-hover)";
const DWELL_MS = 420;
const MOVE_PX = 6;

const orderedGps = [...gps].sort((a, b) => Number(!!a.sample) - Number(!!b.sample) || gpTotals(b.id, INDICATIVE_BRL_USD).nav - gpTotals(a.id, INDICATIVE_BRL_USD).nav);
const tallLogo = (g: GpClient) => !!g.logo && g.logo.width / g.logo.height < 3;

const gpModules: { id: string; label: [string, string?]; path: string }[] = [
  { id: "funds", label: ["Funds"], path: "funds" },
  { id: "investors", label: ["Investors"], path: "investors" },
  { id: "onboarding", label: ["Onboarding"], path: "onboarding" },
  { id: "capital", label: ["Capital calls &", "Distributions"], path: "capital" },
  { id: "reports", label: ["Reports"], path: "reports" },
  { id: "portal", label: ["Portal &", "Brand"], path: "portal" },
];

export function AdminHub({ variation = "ambient", animate = false, quiet = false }: { variation?: AmbientMotion; animate?: boolean; quiet?: boolean }) {
  const router = useRouter();
  const { brand } = useBrand();
  const { allow, member } = useHexas();
  const [level, setLevel] = useState<Level>({ kind: "root" });
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const armed = useRef(true);
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverNode = useRef<Node | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hidden = usePageHidden();

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
  let centerFrom: Pt | null = null;
  let accent = CREAM; // Aurum levels: the theme's light cell; GP levels use the GP's own colour
  let bandOn = "var(--eco-mark)"; // frame colour on hover
  let tint: string | undefined; // the background light leans toward the selected application
  let ringShown = true;

  if (level.kind === "root") {
    ringShown = revealed;
    nodes = solutions
      .filter((s) => allows(allow, s.id, s.live))
      .map((s) => ({
        id: s.id,
        slot: s.slot,
        label: s.lines,
        sub: s.prototype
          ? "Prototype"
          : !s.live
            ? "Coming soon"
            : s.id === "fund"
              ? `${gps.length} GPs`
              : s.id === "blockchain"
                ? `${TOKENS.filter((t) => t.status === "Live").length} companies live`
                : s.id === "offering"
                  ? `${OFFERINGS.filter((o) => o.status !== "Preparing" && o.status !== "Closed").length} open offerings`
                  : `${formations.filter((f) => f.stage !== "Post-formation").length} in progress`,
        subTone: s.live ? "accent" : "muted",
        outline: s.live,
        // The six solutions are the deepest the hub opens: a click goes to the solution's page.
        href: s.href,
      }));
    center = <MarkCenter expanded={revealed} />;
  } else if (level.kind === "fund") {
    centerFrom = offset(level.from);
    nodes = orderedGps.slice(0, 5).map((g, i) => {
      const t = gpTotals(g.id, INDICATIVE_BRL_USD); // counts only; no amounts shown
      return {
        id: g.id,
        slot: ringOrder[i],
        label: [g.shortName],
        sub: t.funds ? `${t.funds} fund${t.funds > 1 ? "s" : ""}` : "Onboarding",
        accent: g.brand.primary,
        band: g.brand.secondary,
        art: (on: boolean) => <GpLogo gp={g} height={tallLogo(g) ? 50 : 20} tone={on ? "dark" : "auto"} compact />,
        open: () => go({ kind: "gp", gpId: g.id, from: ringOrder[i] }),
      };
    });
    nodes.push({ id: "all", slot: ringOrder[5], label: ["All GPs"], sub: `${gps.length} clients`, subTone: "accent", outline: true, href: "/admin/fund/gps" });
    center = <DarkCenter lines={["Fund", "Solution"]} />;
  } else if (level.kind === "module") {
    const m = firmById(level.id)!;
    centerFrom = level.from;
    accent = m.color;
    bandOn = "var(--eco-cell-hover)";
    tint = m.color;
    nodes = m.ring.map((r, i) => ({
      id: r.id,
      slot: m.id === "communication" ? solutions[i].slot : ringOrder[i],
      label: r.label,
      sub: r.sub,
      subTone: r.alert ? "accent" : "muted",
      subColor: m.color,
      href: r.href,
    }));
    center = <MarkCenter color={m.color} />;
  } else {
    const gp = gpById(level.gpId)!;
    const t = gpTotals(gp.id, INDICATIVE_BRL_USD); // counts only; no amounts shown
    centerFrom = offset(level.from);
    accent = gp.brand.primary;
    bandOn = gp.brand.secondary;
    tint = gp.brand.secondary;
    const subs: Record<string, string> = {
      funds: `${t.funds} vehicle${t.funds === 1 ? "" : "s"}`,
      investors: `${t.investors} investors`,
      onboarding: `${t.onboarding} open`,
      capital: `${t.openCalls} open`,
      reports: "Documents",
      portal: gp.status === "Live" ? "Live" : "Setting up",
    };
    nodes = gpModules.map((m, i) => ({ id: m.id, slot: ringOrder[i], label: m.label, sub: subs[m.id], href: `/admin/fund/gps/${gp.id}/${m.path}` }));
    center = (
      <BrandCenter color={gp.brand.primary} secondary={gp.brand.secondary}>
        <GpLogo gp={gp} height={tallLogo(gp) ? 52 : 26} compact tone="light" />
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
      : level.kind === "module"
        ? [{ label: brand.name, target: "root" }, { label: firmById(level.id)!.name }]
        : level.kind === "fund"
          ? [{ label: brand.name, target: "root" }, { label: "Fund Solution" }]
          : [{ label: brand.name, target: "root" }, { label: "Fund Solution", target: "fund" }, { label: gpById(level.gpId)!.shortName }];
  const crumbTo = (t: "root" | "fund") => (t === "root" ? toRoot() : go({ kind: "fund", from: "ne" }));

  const step = Math.sqrt(3) * R + 10;
  const size = Math.round(step * 2 + Math.sqrt(3) * R + 40);
  const h = Math.round(step * Math.sqrt(3) + 2 * R + 40);
  const onMove = (e: React.PointerEvent) => {
    if (!armed.current) {
      if (!anchor.current) anchor.current = { x: e.clientX, y: e.clientY };
      else if (Math.hypot(e.clientX - anchor.current.x, e.clientY - anchor.current.y) > MOVE_PX) armed.current = true;
    }
    restartDwell(); // every movement resets the rest timer
  };

  /**
   * The six firm workspaces orbit the hub, one at each corner of the Aurum mark. At rest they sit close;
   * when a ring opens they move out into the notches between its cells, so they stay reachable.
   * Resting on one opens its ring (it glides to the centre); clicking goes straight in.
   */
  // At rest the workspaces sit on the mark's vertex lines; open, they move to the notches of the ring, clear of every cell.
  const ORBIT_IN = 184;
  const ORBIT_OUT = 262;
  const orbitShown = level.kind === "root" || level.kind === "module";
  const orbitR = level.kind === "root" && !revealed ? ORBIT_IN : ORBIT_OUT;
  const orbit = firmModules.flatMap((m, i) => {
    if (!allows(allow, m.id)) return []; // hexagons this person cannot open are not shown; the others keep their places
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    const here = level.kind === "module" && level.id === m.id;
    return [
      {
        id: here ? "aurum" : m.id,
        color: here ? "var(--tenant-accent)" : m.color,
        name: here ? brand.name : moduleName(brand, m.id),
        label: here ? `${brand.name} solutions` : `${moduleName(brand, m.id)}${m.badge ? ` — ${m.badge} ${m.badgeLabel}` : ""}`,
        href: here ? "/admin" : m.id === "communication" && member.party !== "employee" ? "/admin/messages" : m.href,
        badge: here || member.party !== "employee" ? 0 : m.badge,
        x: Math.round(orbitR * Math.cos(a) * 100) / 100,
        y: Math.round(orbitR * Math.sin(a) * 100) / 100,
        // the name sits on the outer side of the mark, so it never runs into the solution cells
        lx: Math.abs(Math.cos(a)) < 0.3 ? 0 : Math.sign(Math.cos(a)) * 44,
        ly: Math.abs(Math.cos(a)) < 0.3 ? (Math.sin(a) < 0 ? -46 : 56) : Math.round(Math.sin(a) * 30 + 4),
        anchor: (Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end") as "middle" | "start" | "end",
      },
    ];
  });
  // Resting on a workspace opens nothing. A click opens its ring of sections in the hub, the way the centre opens the
  // solutions; a section then goes to its page. The firm's mark, in the workspace's old place, leads back to the solutions.
  const orbitNode = (o: (typeof orbit)[number]): Node => ({ id: `orbit-${o.id}`, slot: "ne", label: [""], sub: "" });
  const orbitGo = (o: (typeof orbit)[number]) =>
    o.id === "aurum"
      ? toRoot()
      : // people outside the firm see only their own conversations, so the chat opens directly for them
        o.id === "communication" && member.party !== "employee"
        ? router.push(o.href)
        : go({ kind: "module", id: o.id, from: { x: o.x, y: o.y } });

  // Pulse: quiet while anything is open, hovered or in use.
  const transmission = useTransmission(variation === "pulse" && animate && !hidden, orbit.length, quiet || level.kind !== "root" || active !== null || !orbitShown);

  const levelKey = level.kind === "gp" ? `gp-${level.gpId}` : level.kind === "module" ? `module-${level.id}` : level.kind;
  const animateRing = level.kind !== "root";

  const activate = (n: Node) => (n.open ? n.open() : n.href && router.push(n.href));

  return (
    <main
      className={cx("relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-8 sm:py-10", hidden && "eco-paused")}
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
      <AmbientBackdrop variation={variation} animate={animate && !hidden} accent2={tint} />
      {crumbs.length > 0 && (
        <nav className="absolute left-8 top-6 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-d-text-3" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-d-text-3" />}
              {c.target ? (
                <button onClick={() => crumbTo(c.target!)} className="uppercase hover:text-d-text">
                  {c.label}
                </button>
              ) : (
                <span className="text-d-text">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <svg
        viewBox={`${-size / 2} ${-h / 2} ${size} ${h}`}
        className={cx("h-auto w-full select-none overflow-visible", (revealed || level.kind !== "root") && "eco-expanded")}
        // fits the screen's height too: the open ring and the workspace names (≈ 660 units tall) always stay in view
        style={{ maxWidth: "min(640px, calc((100dvh - 150px) * 0.97))" }}
        role="group"
        aria-label={`${brand.name} navigation`}
        ref={svgRef}
        onPointerMove={onMove}
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
                {/* matte surface; on hover a lit layer fades in (opacity only) */}
                <polygon className="eco-cell" points={hexPoints(R)} fill="var(--eco-cell)" />
                <polygon
                  points={hexPoints(R)}
                  fill={(n.accent ?? accent) === CREAM ? "url(#eco-cell-lit)" : (n.accent ?? accent)}
                  className="eco-fade"
                  style={{ opacity: on ? 1 : 0 }}
                />
                {/* hairline frame: live cells carry the champagne line, others the neutral one; hover brings the accent */}
                <polygon
                  points={hexPoints(R - 0.75)}
                  fill="none"
                  stroke={n.outline ? "var(--eco-cell-live)" : "var(--eco-cell-line)"}
                  strokeWidth={1.25}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="miter"
                />
                <polygon
                  points={hexPoints(R - 0.75)}
                  fill="none"
                  stroke={n.band ?? bandOn}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="miter"
                  className="eco-fade"
                  style={{ opacity: on ? 1 : 0 }}
                />
                {/* the mark's inner line, echoed faintly on hover */}
                <polygon
                  points={hexPoints(R - FRAME.outer - FRAME.gap)}
                  fill="none"
                  stroke={n.band ?? bandOn}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  className="eco-fade eco-echo"
                  style={{ opacity: on ? 0.45 : 0 }}
                />
                {n.art && (
                  <foreignObject x={-66} y={-46} width={132} height={70} style={{ pointerEvents: "none" }}>
                    <div className="flex h-full w-full items-center justify-center">{n.art(on)}</div>
                  </foreignObject>
                )}
                <text textAnchor="middle" fill={on && (n.accent ?? accent) !== CREAM ? "#FFFFFF" : "var(--eco-label)"} style={{ transition: "fill 200ms" }}>
                  {!n.art && (
                    <tspan x={0} y={n.label[1] ? -5 : 5} fontSize={17} fontWeight={500} letterSpacing="-0.012em" className="eco-t-label">
                      {n.label[0]}
                    </tspan>
                  )}
                  {!n.art && n.label[1] && (
                    <tspan x={0} y={16} fontSize={17} fontWeight={500} letterSpacing="-0.012em" className="eco-t-label">
                      {n.label[1]}
                    </tspan>
                  )}
                  <tspan
                    x={0}
                    y={42}
                    fontSize={11.5}
                    fontWeight={500}
                    letterSpacing="0.01em"
                    className="eco-t-sub tabular-nums"
                    opacity={n.sub === "Coming soon" ? 0.8 : 1}
                    fill={
                      on && (n.accent ?? accent) !== CREAM
                        ? "rgba(255,255,255,0.72)"
                        : n.subColor && n.subTone === "accent"
                          ? `color-mix(in oklab, ${n.subColor} 70%, var(--eco-label))`
                          : "var(--eco-sub)"
                    }
                  >
                    {n.sub}
                  </tspan>
                </text>
              </g>
            );
          })}

          <g
            className={centerFrom ? "hex-glide" : undefined}
            style={centerFrom ? ({ "--fx": `${centerFrom.x}px`, "--fy": `${centerFrom.y}px`, cursor: "pointer" } as CSSProperties) : { cursor: "pointer" }}
            role="button"
            tabIndex={0}
            aria-label={level.kind === "root" ? `${brand.name} — show solutions` : "Back"}
            aria-expanded={level.kind === "root" ? revealed : undefined}
            onPointerEnter={(e) => e.pointerType === "mouse" && level.kind === "root" && setRevealed(true)}
            onClick={() => (level.kind === "root" ? setRevealed((r) => !r) : back())}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (level.kind === "root" ? setRevealed((r) => !r) : back())}
          >
            <g className="eco-enter-center">{center}</g>
          </g>
        </g>

        <defs>
          {orbit.map((o) => (
            <radialGradient key={o.id} id={`orbit-glow-${o.id}`}>
              <stop offset="0%" stopColor={o.color} stopOpacity="0.22" />
              <stop offset="55%" stopColor={o.color} stopOpacity="0.06" />
              <stop offset="100%" stopColor={o.color} stopOpacity="0" />
            </radialGradient>
          ))}
          <linearGradient id="eco-cell-lit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--eco-cell-hover-top)" />
            <stop offset="100%" stopColor="var(--eco-cell-hover)" />
          </linearGradient>
          <radialGradient id="eco-tx">
            <stop offset="0%" stopColor="var(--eco-mark)" stopOpacity="0.9" />
            <stop offset="45%" stopColor="var(--eco-mark)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--eco-mark)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {transmission && orbitShown && (
          <g key={transmission.key} aria-hidden style={{ pointerEvents: "none" }}>
            <g className="eco-transmit" style={{ "--tx": `${orbit[transmission.i].x * 0.86}px`, "--ty": `${orbit[transmission.i].y * 0.86}px` } as CSSProperties}>
              <circle r={16} fill="url(#eco-tx)" />
            </g>
          </g>
        )}

        {orbit.map((o, oi) => (
          <g
            key={o.id === "aurum" ? `aurum-${o.x}-${o.y}` : o.id}
            className="orbit-mark"
            role="link"
            tabIndex={orbitShown ? 0 : -1}
            aria-label={o.label}
            style={{
              transform: `translate(${o.x}px, ${o.y}px) scale(${orbitShown ? 1 : 0.4})`,
              opacity: orbitShown ? 1 : 0,
              pointerEvents: orbitShown ? "auto" : "none",
              cursor: "pointer",
            }}
            onMouseEnter={() => {
              hoverNode.current = orbitNode(o);
              restartDwell();
            }}
            onMouseLeave={() => {
              if (hoverNode.current?.id === `orbit-${o.id}`) hoverNode.current = null;
              clearDwell();
            }}
            onClick={() => orbitGo(o)}
            onKeyDown={(e) => e.key === "Enter" && orbitGo(o)}
          >
            <title>{o.label}</title>
            <g className="eco-enter-item" style={{ "--i": oi } as CSSProperties}>
              <circle className="orbit-glow" r={58} fill={`url(#orbit-glow-${o.id})`} style={{ pointerEvents: "none" }} />
              {transmission?.i === oi && <circle key={transmission.key} className="eco-arrive" r={52} fill={`url(#orbit-glow-${o.id})`} style={{ pointerEvents: "none" }} />}
              <circle r={34} fill="transparent" />
              <polygon
                className="orbit-ring"
                points={hexPoints(36)}
                fill="none"
                stroke={`color-mix(in oklab, ${o.color} 70%, var(--eco-label))`}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <g className="orbit-inner">
                {/* resting: a desaturated derivative of the workspace colour; hover or focus restores it */}
                <path
                  className="orbit-rest"
                  d={markPath(brand.mark)}
                  transform="scale(0.14368)"
                  style={{ fill: `color-mix(in oklab, ${o.color} var(--eco-pigment, 50%), var(--eco-desat))` }}
                  fillRule="evenodd"
                />
                <path
                  className="orbit-full"
                  d={markPath(brand.mark)}
                  transform="scale(0.14368)"
                  style={{ fill: `color-mix(in oklab, ${o.color} var(--eco-pigment-on, 80%), var(--eco-desat))` }}
                  fillRule="evenodd"
                />
              </g>
              <text
                className="orbit-label eco-t-orbit"
                textAnchor={o.anchor}
                x={o.lx}
                y={o.ly}
                fontSize={12}
                fontWeight={500}
                letterSpacing="0.005em"
                fill="var(--eco-label)"
                style={{ pointerEvents: "none" }}
              >
                {o.name}
              </text>
              {o.badge > 0 && (
                <g transform="translate(23 -21)" className="orbit-badge">
                  <rect
                    x={o.badge > 9 ? -9 : -6.5}
                    y={-6.5}
                    width={o.badge > 9 ? 18 : 13}
                    height={13}
                    rx={6.5}
                    fill="var(--eco-badge)"
                    stroke="var(--eco-cell-line)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                  <text textAnchor="middle" y={3.1} fontSize={8.5} fontWeight={600} fill="var(--eco-sub)" className="tabular-nums">
                    {o.badge}
                  </text>
                </g>
              )}
            </g>
          </g>
        ))}
      </svg>
    </main>
  );
}
