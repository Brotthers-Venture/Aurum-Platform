"use client";

import { FAMILIES } from "@/lib/wealth";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Pin } from "lucide-react";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { moduleName } from "@/lib/brand";
import { hexaHref, hexaOf, type Hexa, type HexaPage } from "@/lib/hexa";
import { useHexas } from "./useHexas";
import { markPath } from "@/components/brand/Logo";

const KEY = "aurum-hexa-collapsed";

/** The brand mark (two concentric bands, open centre) in the hexagon's own colour. */
export function HexGlyph({ color, size = 16, active }: { color: string; size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size * (348 / 302)} viewBox="-151 -174 302 348" aria-hidden className="shrink-0" style={{ opacity: active ? 1 : 0.92 }}>
      <path d={markPath("hexagon")} fill={color} fillRule="evenodd" />
    </svg>
  );
}

/**
 * The Hexa Room: the side drawer listing the hexagons this person can open. The current hexagon is expanded
 * to its pages; any other can be opened in place. Collapses to a rail of hexagons for more room.
 */
export function HexaRoom({ defaultCollapsed = false }: { defaultCollapsed?: boolean }) {
  return (
    <Suspense fallback={<div className={cx("hidden shrink-0 border-r border-d-line bg-d-chrome md:block", defaultCollapsed ? "w-[56px]" : "w-[248px]")} />}>
      <Room defaultCollapsed={defaultCollapsed} />
    </Suspense>
  );
}

function Room({ defaultCollapsed }: { defaultCollapsed: boolean }) {
  const path = usePathname();
  const params = useSearchParams();
  const { brand } = useBrand();
  const { list, member } = useHexas();
  const here = hexaOf(path);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [peek, setPeek] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  // Hovering the rail opens the full room over the page after a short pause; leaving closes it.
  const enter = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPeek(true), 140);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPeek(false), 220);
  };
  const [open, setOpen] = useState<Set<string>>(() => new Set(here ? [here.id] : []));

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY);
      // The rail of hexagons is the default; the full room opens on hover and can be kept open.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!defaultCollapsed) setCollapsed(v === null ? true : v === "1");
    } catch {
      /* no storage */
    }
  }, [defaultCollapsed]);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(KEY, c ? "0" : "1");
      } catch {
        /* no storage */
      }
      return !c;
    });
    setPeek(false);
  };

  const name = (h: Hexa) => (h.firm ? moduleName(brand, h.firm) : h.name);
  const tab = params.get("tab");
  const filter = params.get("filter");
  const isPage = (h: Hexa, p: HexaPage, i: number) => {
    const [p0, q] = p.href.split("?");
    const tabbed = h.pages.some((x) => x.href.includes("?tab="));
    if (q) {
      const want = new URLSearchParams(q);
      const firstTabbed = h.pages.findIndex((x) => x.href.includes("?")) === i && !h.pages.some((x) => x.href === h.base);
      return path === p0 && want.get("filter") === filter && (tab === want.get("tab") || (!tab && firstTabbed));
    }
    if (p0 === h.base) return path === p0 && (!tabbed || !tab);
    return path === p0 || path.startsWith(`${p0}/`);
  };

  if (collapsed)
    return (
      <div
        className="relative hidden w-[56px] shrink-0 md:block"
        onPointerEnter={enter}
        onPointerLeave={leave}
        onFocus={() => setPeek(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setPeek(false)}
      >
        {peek && <div className="absolute inset-y-0 left-0 z-40 flex">{full(true)}</div>}
        <nav aria-label="Hexa Room" data-shell="room" className="flex h-full w-[56px] flex-col items-center border-r border-d-line bg-d-chrome py-3">
          <button
            onClick={toggleCollapsed}
            aria-label="Keep the Hexa Room open"
            title="Keep open"
            className="mb-2 flex h-8 w-8 items-center justify-center rounded-[6px] text-d-text-3 hover:bg-d-raise hover:text-d-text"
          >
            <ChevronsRight size={15} />
          </button>
          <div className="flex flex-1 flex-col items-center gap-1">
            {list.map((h) => {
              const active = here?.id === h.id;
              return (
                <Link
                  key={h.id}
                  href={hexaHref(h, member)}
                  title={name(h)}
                  aria-label={name(h)}
                  aria-current={active ? "page" : undefined}
                  className={cx("relative flex h-10 w-10 items-center justify-center rounded-[8px] transition-colors", active ? "bg-d-raise" : "hover:bg-d-raise")}
                >
                  <HexGlyph color={h.color} size={20} active={active} />
                  {!!h.badge && !active && member.party === "employee" && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: h.color }} />}
                </Link>
              );
            })}
          </div>
          <Link
            href="/admin"
            title="Ecosystem"
            aria-label="Ecosystem"
            className="flex h-9 w-9 items-center justify-center rounded-[6px] text-d-text-3 hover:bg-d-raise hover:text-d-text"
          >
            <HexGlyph color="var(--d-text-3)" size={16} />
          </Link>
        </nav>
      </div>
    );

  return full(false);

  function full(overlay: boolean) {
    return (
      <nav
        aria-label="Hexa Room"
        data-shell="room"
        data-overlay={overlay || undefined}
        className={cx(
          "w-[248px] shrink-0 flex-col border-r border-d-line bg-d-chrome text-[13px]",
          overlay ? "hexa-peek flex shadow-[12px_0_32px_rgba(0,0,0,0.28)]" : "hidden md:flex",
        )}
      >
        <div className="flex h-11 items-center gap-2 px-4">
          <span className="text-[12px] font-semibold tracking-[0.02em] text-d-text">Hexa Room</span>
          <span className="tnum text-[11.5px] text-d-text-3">{list.length}</span>
          <button
            onClick={toggleCollapsed}
            aria-label={overlay ? "Keep the Hexa Room open" : "Collapse the Hexa Room to hexagons"}
            title={overlay ? "Keep open" : "Collapse to hexagons"}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-[6px] text-d-text-3 hover:bg-d-raise hover:text-d-text"
          >
            {overlay ? <Pin size={14} /> : <ChevronsLeft size={15} />}
          </button>
        </div>

        <div className="scroll-quiet flex-1 overflow-y-auto px-2 pb-3">
          {list.map((h0) => {
            const outsider = member.party !== "employee";
            const pages =
              h0.id === "multi-family" && member.party === "tenant"
                ? h0.pages.filter((p) => !p.group || FAMILIES.some((f) => f.tenantId === member.org && p.href.endsWith(`/${f.id}`)))
                : h0.pages;
            const h = outsider ? { ...h0, badge: undefined, pages: h0.id === "pmo" || h0.id === "communication" ? [] : pages } : h0;
            const active = here?.id === h.id;
            const expanded = h.pages.length > 0 && open.has(h.id);
            let lastGroup: string | undefined;
            return (
              <div key={h.id} className="mb-0.5">
                <div className={cx("group relative flex h-9 items-center rounded-[7px] transition-colors", active ? "bg-d-raise" : "hover:bg-d-raise")}>
                  {active && <span aria-hidden className="absolute -left-2 bottom-2 top-2 w-[2px] rounded-full" style={{ background: h.color }} />}
                  <Link href={hexaHref(h, member)} aria-current={active ? "page" : undefined} className="flex min-w-0 flex-1 items-center gap-2.5 pl-2.5 pr-1">
                    <HexGlyph color={h.color} size={17} active={active} />
                    <span className={cx("truncate", active ? "font-semibold text-d-text" : "font-medium text-d-text-2 group-hover:text-d-text")}>{name(h)}</span>
                  </Link>
                  {!!h.badge && <span className="tnum mr-1 text-[11.5px] text-d-text-3">{h.badge}</span>}
                  {h.pages.length > 0 && (
                    <button
                      onClick={() =>
                        setOpen((s) => {
                          const n = new Set(s);
                          if (n.has(h.id)) n.delete(h.id);
                          else n.add(h.id);
                          return n;
                        })
                      }
                      aria-label={expanded ? `Hide ${name(h)} pages` : `Show ${name(h)} pages`}
                      aria-expanded={expanded}
                      className="mr-1 flex h-6 w-6 items-center justify-center rounded-[5px] text-d-text-3 hover:bg-d-line-soft hover:text-d-text"
                    >
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {expanded && (
                  <ul className="relative mb-2 ml-[18px] mt-0.5 border-l border-d-line pl-2">
                    {h.pages.map((p, i) => {
                      const on = active && isPage(h, p, i);
                      const head = p.group && p.group !== lastGroup ? p.group : undefined;
                      lastGroup = p.group;
                      return (
                        <li key={p.href}>
                          {head && <div className="px-2 pb-0.5 pt-2.5 text-[10.5px] font-medium text-d-text-3">{head}</div>}
                          <Link
                            href={p.href}
                            aria-current={on ? "page" : undefined}
                            className={cx(
                              "relative flex h-[28px] items-center rounded-[5px] px-2 text-[12.5px] transition-colors",
                              on ? "bg-d-raise font-medium text-d-text" : "text-d-text-2 hover:bg-d-raise hover:text-d-text",
                            )}
                          >
                            {on && <span aria-hidden className="absolute -left-[9px] bottom-1.5 top-1.5 w-[2px] rounded-full" style={{ background: h.color }} />}
                            <span className="flex-1 truncate">{p.label}</span>
                            {!!p.badge && <span className="tnum text-[11px] text-d-text-3">{p.badge}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
          {list.length === 0 && <p className="px-3 py-6 text-[12px] leading-relaxed text-d-text-3">No hexagons are open to this role yet. Ask an administrator for access.</p>}
        </div>

        <div className="border-t border-d-line p-2">
          <Link href="/admin" className="flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 text-d-text-2 hover:bg-d-raise hover:text-d-text">
            <HexGlyph color="var(--d-text-3)" size={15} /> Ecosystem
          </Link>
        </div>
      </nav>
    );
  }
}
