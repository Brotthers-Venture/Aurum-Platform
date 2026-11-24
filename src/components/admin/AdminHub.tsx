"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cx } from "@/components/ui";
import { ChevronRight } from "lucide-react";
import { Band, BrandCenter, FRAME, DarkCenter, MarkCenter, R, hexPoints, offset, ringOrder, type Slot } from "./HexNav";
import { GpLogo } from "@/components/brand/GpLogo";
import { GoldField } from "@/components/admin/GoldField";
import { AurumMark } from "@/components/brand/Logo";
import { spaceUnreadCount, totalUnread } from "@/lib/comms";
import { BILLING, billingCounts } from "@/lib/billing";
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
  | { kind: "comm"; from: Pt }
  | { kind: "billing"; from: Pt };

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
const TEAL = "#1F8A84";
const unreadAll = totalUnread();
const bc = billingCounts();

const billingModules: { id: string; label: [string, string?]; sub: string; tone: "accent" | "muted"; href: string }[] = [
  { id: "invoices", label: ["Invoices"], sub: `${bc.open} OPEN`, tone: "accent", href: "/admin/billing?tab=invoices" },
  { id: "new", label: ["New", "invoice"], sub: `${bc.drafts} IN DRAFT`, tone: "muted", href: "/admin/billing?tab=new" },
  { id: "payments", label: ["Payments"], sub: `${bc.payments} THIS MONTH`, tone: "muted", href: "/admin/billing?tab=payments" },
  { id: "subscriptions", label: ["Subscriptions"], sub: `${bc.subscriptions} ACTIVE`, tone: "muted", href: "/admin/billing?tab=subscriptions" },
  { id: "fees", label: ["Administration", "fees"], sub: `${bc.schedules} SCHEDULES`, tone: "muted", href: "/admin/billing?tab=fees" },
  { id: "overdue", label: ["Overdue"], sub: bc.overdue ? `${bc.overdue} TO CHASE` : "NONE", tone: bc.overdue ? "accent" : "muted", href: "/admin/billing?tab=invoices&filter=overdue" },
];
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
  const goldRef = useRef<HTMLAnchorElement>(null);
  const commRef = useRef<HTMLAnchorElement>(null);
  const billRef = useRef<HTMLAnchorElement>(null);

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
  } else if (level.kind === "comm") {
    centerFrom = level.from;
    accent = TEAL;
    outlineColor = CREAM;
    bandOn = CREAM;
    nodes = solutions.map((s) => {
      const u = spaceUnreadCount(s.id);
      return {
        id: s.id,
        slot: s.slot,
        label: s.lines,
        sub: u ? `${u} UNREAD` : "ALL READ",
        subTone: u ? "accent" : "muted",
        subColor: TEAL,
        href: `/admin/communication?space=${s.id}`,
      };
    });
    center = <MarkCenter color={TEAL} />;
  } else if (level.kind === "billing") {
    centerFrom = level.from;
    accent = BILLING;
    outlineColor = CREAM;
    bandOn = CREAM;
    nodes = billingModules.map((m, i) => ({ id: m.id, slot: ringOrder[i], label: m.label, sub: m.sub, subTone: m.tone, subColor: BILLING, href: m.href }));
    center = <MarkCenter color={BILLING} />;
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
      : level.kind === "comm"
        ? [{ label: "Aurum", target: "root" }, { label: "Communication" }]
        : level.kind === "billing"
          ? [{ label: "Aurum", target: "root" }, { label: "Billing" }]
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

  /** Where a dock mark sits, in honeycomb units relative to the centre — the mark glides in from there. */
  const fromDock = (el: HTMLElement | null): Pt => {
    const svg = svgRef.current;
    if (!el || !svg) return { x: 0, y: 300 };
    const a = svg.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const k = size / a.width;
    return { x: (b.x + b.width / 2 - (a.x + a.width / 2)) * k, y: (b.y + b.height / 2 - (a.y + a.height / 2)) * k };
  };
  const dockNode = (id: string, open: () => void): Node => ({ id, slot: "ne", label: [""], sub: "", open });
  const dock: { id: string; color: string; label: string; href: string; badge?: number; ref: React.RefObject<HTMLAnchorElement | null>; on: boolean; open: () => void }[] = [
    { id: "aurum", color: "#F8C618", label: "Aurum solutions", href: "/admin", ref: goldRef, on: false, open: toRoot },
    {
      id: "comm",
      color: TEAL,
      label: `Communication — ${unreadAll} unread`,
      href: "/admin/communication",
      badge: unreadAll,
      ref: commRef,
      on: level.kind === "comm",
      open: () => go({ kind: "comm", from: fromDock(commRef.current) }),
    },
    {
      id: "billing",
      color: BILLING,
      label: `Billing — ${bc.overdue} overdue`,
      href: "/admin/billing",
      badge: bc.overdue,
      ref: billRef,
      on: level.kind === "billing",
      open: () => go({ kind: "billing", from: fromDock(billRef.current) }),
    },
  ];

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
      </svg>

      <div className="relative -mt-2 flex items-center gap-10" onPointerMove={onMove} aria-label="More">
        {dock.map((d) => (
          <Link
            key={d.id}
            ref={d.ref}
            href={d.href}
            aria-label={d.label}
            title={d.label}
            className={cx(
              "group flex flex-col items-center transition-opacity duration-300",
              d.id === "aurum" ? "absolute right-full top-0 mr-10" : "relative",
              d.id === "aurum" && level.kind === "root" && "pointer-events-none opacity-0",
            )}
            tabIndex={d.id === "aurum" && level.kind === "root" ? -1 : undefined}
            onMouseEnter={() => {
              if (d.on) return;
              hoverNode.current = dockNode(d.id, d.open);
              restartDwell();
            }}
            onMouseLeave={() => {
              if (hoverNode.current?.id === d.id) hoverNode.current = null;
              clearDwell();
            }}
            onClick={(e) => {
              if (d.id === "aurum") {
                e.preventDefault();
                toRoot();
              }
            }}
          >
            <span className={cx("block transition-transform duration-300 group-hover:scale-110", d.on && "scale-110")}>
              <AurumMark size={d.id === "aurum" ? 34 : 40} color={d.color} />
            </span>
            {!!d.badge && (
              <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-[#F1EDE4]" style={{ background: d.color }}>
                {d.badge}
              </span>
            )}
            <span className={cx("mt-2 h-1 w-1 rounded-full transition-opacity", d.on ? "opacity-100" : "opacity-0")} style={{ background: d.color }} />
          </Link>
        ))}
      </div>
    </main>
  );
}
