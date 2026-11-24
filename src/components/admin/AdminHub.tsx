"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Band, BrandCenter, FRAME, DarkCenter, MarkCenter, R, hexPoints, offset, ringOrder, type Slot } from "./HexNav";
import { GpLogo } from "@/components/brand/GpLogo";
import { GoldField } from "@/components/admin/GoldField";
import { firmById, firmModules } from "@/lib/firm";
import { solutions } from "@/lib/solutions";
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
type Level =
  | { kind: "root" }
  | { kind: "fund"; from: Slot }
  | { kind: "gp"; gpId: string; from: Slot }
  | { kind: "module"; id: string; from: Pt };

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

const CREAM = "#FBF3DC";
/** The Aurum mark at orbit size (outer band, gap, inner band — radii from the master logo). */
const ORBIT_MARK = [174, 142, 117, 86]
  .map((r) => {
    const p = hexPoints((r * 25) / 174).split(" ");
    return `M${p.join("L")}Z`;
  })
  .join(" ");
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
  const svgRef = useRef<SVGSVGElement>(null);

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
  let accent = "#FBF3DC"; // Aurum levels: cream; GP levels use the GP's own colour
  let outlineColor = "#F8C618";
  let bandOn = "#F8C618"; // frame colour on hover
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
    centerFrom = offset(level.from);
    nodes = orderedGps.slice(0, 5).map((g, i) => {
      const t = gpTotals(g.id, INDICATIVE_BRL_USD); // counts only; no amounts shown
      return {
        id: g.id,
        slot: ringOrder[i],
        label: [g.shortName],
        sub: t.funds ? `${t.funds} FUND${t.funds > 1 ? "S" : ""}` : "ONBOARDING",
        accent: g.brand.primary,
        band: g.brand.secondary,
        art: (on: boolean) => <GpLogo gp={g} height={tallLogo(g) ? 50 : 20} tone={on ? "dark" : "light"} compact />,
        open: () => go({ kind: "gp", gpId: g.id, from: ringOrder[i] }),
      };
    });
    nodes.push({ id: "all", slot: ringOrder[5], label: ["All GPs"], sub: `${gps.length} CLIENTS`, subTone: "accent", outline: true, href: "/admin/fund/gps" });
    center = <DarkCenter lines={["Fund", "Solution"]} />;
  } else if (level.kind === "module") {
    const m = firmById(level.id)!;
    centerFrom = level.from;
    accent = m.color;
    outlineColor = CREAM;
    bandOn = CREAM;
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
    outlineColor = gp.brand.secondary;
    bandOn = gp.brand.secondary;
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
      : level.kind === "module"
        ? [{ label: "Aurum", target: "root" }, { label: firmById(level.id)!.name }]
        : level.kind === "fund"
        ? [{ label: "Aurum", target: "root" }, { label: "Fund Solution" }]
        : [{ label: "Aurum", target: "root" }, { label: "Fund Solution", target: "fund" }, { label: gpById(level.gpId)!.shortName }];
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
  const ORBIT_IN = 182;
  const ORBIT_OUT = 238;
  const orbitShown = level.kind === "root" || level.kind === "module";
  const orbitR = level.kind === "root" && !revealed ? ORBIT_IN : ORBIT_OUT;
  const orbit = firmModules.map((m, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    const here = level.kind === "module" && level.id === m.id;
    return {
      id: here ? "aurum" : m.id,
      color: here ? "#F8C618" : m.color,
      label: here ? "Aurum solutions" : `${m.name}${m.badge ? ` — ${m.badge} ${m.badgeLabel}` : ""}`,
      href: here ? "/admin" : m.href,
      badge: here ? 0 : m.badge,
      x: Math.round(orbitR * Math.cos(a) * 100) / 100,
      y: Math.round(orbitR * Math.sin(a) * 100) / 100,
    };
  });
  const orbitNode = (o: (typeof orbit)[number]): Node => ({
    id: `orbit-${o.id}`,
    slot: "ne",
    label: [""],
    sub: "",
    open: () => (o.id === "aurum" ? toRoot() : go({ kind: "module", id: o.id, from: { x: o.x, y: o.y } })),
  });
  const orbitGo = (o: (typeof orbit)[number]) => (o.id === "aurum" ? toRoot() : router.push(o.href));

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
        className="h-auto w-full max-w-[640px] select-none overflow-visible"
        role="group"
        aria-label="Aurum navigation"
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
                <polygon points={hexPoints(R)} fill={on ? n.accent ?? accent : "#FFFFFF"} style={{ transition: "fill 220ms" }} />
                <Band w={FRAME.outer} color={on ? n.band ?? bandOn : n.outline ? outlineColor : "#E3DCCD"} style={{ transition: "fill 220ms" }} />
                <Band
                  r={R - FRAME.outer - FRAME.gap}
                  w={FRAME.inner}
                  color={n.band ?? bandOn}
                  style={{ opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 0.94})`, transition: "opacity 220ms, transform 260ms cubic-bezier(.2,.8,.2,1)" }}
                />
                {n.art && (
                  <foreignObject x={-66} y={-46} width={132} height={70} style={{ pointerEvents: "none" }}>
                    <div className="flex h-full w-full items-center justify-center">{n.art(on)}</div>
                  </foreignObject>
                )}
                <text textAnchor="middle" fill={on && (n.accent ?? accent) !== CREAM ? "#FFFFFF" : "#0F2340"} style={{ transition: "fill 200ms" }}>
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
                    fill={n.subTone === "accent" ? (on && (n.accent ?? accent) !== CREAM ? outlineColor : n.subColor ?? "#8A6A00") : on && (n.accent ?? accent) !== CREAM ? "rgba(255,255,255,0.65)" : "#A39B8A"}
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
                ? ({ "--fx": `${centerFrom.x}px`, "--fy": `${centerFrom.y}px`, cursor: "pointer" } as CSSProperties)
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

        {orbit.map((o) => (
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
            <circle r={34} fill="transparent" />
            <g className="orbit-inner">
              <path d={ORBIT_MARK} fill={o.color} fillRule="evenodd" />
            </g>
            {o.badge > 0 && (
              <g transform="translate(21 -24)">
                <circle r={10} fill={o.color} stroke="#F1EDE4" strokeWidth={2.5} />
                <text textAnchor="middle" y={3.6} fontSize={10.5} fontWeight={700} fill="#FFFFFF">
                  {o.badge}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

    </main>
  );
}
