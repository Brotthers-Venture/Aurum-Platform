"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Hash, X } from "lucide-react";
import { BankingMark, ChainMark, CorporateMark, FamilyMark, FundMark, OfferingMark } from "./SolutionIcons";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { AurumLogo, markPath } from "@/components/brand/Logo";
import { useTheme } from "@/components/shell/ThemeProvider";
import { moduleName } from "@/lib/brand";
import { FAMILIES } from "@/lib/wealth";
import { hexaHref, hexaOf, type Hexa, type HexaId, type HexaPage } from "@/lib/hexa";
import { TEAM_CHANNEL } from "@/lib/chat";
import { useHexas } from "./useHexas";

const KEY = "aurum-hexa-collapsed";
const LAST_KEY = "aurum-solution-last";
export const HEXA_STATE_EVENT = "aurum-hexa-state";
export const HEXA_DRAWER_EVENT = "aurum-hexa-drawer";

/**
 * Solutions: the firm's client-facing applications, grouped under one hexagon in the tenant's colour.
 * Navigation only — each keeps its own routes, records and permissions. Later solutions (Offering, Blockchain,
 * Banking) are added here when they exist; nothing unfinished is listed.
 */
const SOLUTIONS: { id: HexaId; about: string; Icon: typeof FundMark }[] = [
  { id: "fund", about: "Fund administration and investment vehicles.", Icon: FundMark },
  { id: "corporate", about: "Corporate entities and administration.", Icon: CorporateMark },
  { id: "multi-family", about: "Private wealth and family office services.", Icon: FamilyMark },
  { id: "offering", about: "Capital formation, investor pipeline and agreements.", Icon: OfferingMark },
  { id: "blockchain", about: "Tokenized share registers and owner wallets.", Icon: ChainMark },
  { id: "banking", about: "Accounts, cash and payments for administered entities.", Icon: BankingMark },
];
const isSolution = (id?: string) => SOLUTIONS.some((s) => s.id === id);

/** The brand mark (two concentric bands, open centre) in a workspace's colour. */
export function HexGlyph({ color, size = 16, active }: { color: string; size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size * (348 / 302)} viewBox="-151 -174 302 348" aria-hidden className="shrink-0" style={{ opacity: active ? 1 : 0.92 }}>
      <path d={markPath("hexagon")} fill={color} fillRule="evenodd" />
    </svg>
  );
}

/** Whether the Hexa Room is a rail (collapsed). Shared with the header so the logo can follow it. */
export function readHexaCollapsed() {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

/**
 * The Hexa Room: one Solutions hexagon (Fund, Corporate, Multi-Family Office) and the firm's workspaces.
 * Expanded, the active solution's pages are shown; collapsed, a rail of hexagons with a Solutions selector.
 * On phones it is a drawer, opened from the header.
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
  const { theme } = useTheme();
  const { list, member } = useHexas();
  const here = hexaOf(path);
  const [collapsed, setCollapsed] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(true);
  const [openPages, setOpenPages] = useState<string | null>(here?.id ?? null);
  const [last, setLast] = useState<Record<string, string>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the rail is the default; a pinned room is remembered
    setCollapsed(defaultCollapsed || readHexaCollapsed());
    try {
      setLast(JSON.parse(window.localStorage.getItem(LAST_KEY) ?? "{}"));
    } catch {}
    const open = () => setDrawer(true);
    window.addEventListener(HEXA_DRAWER_EVENT, open);
    return () => window.removeEventListener(HEXA_DRAWER_EVENT, open);
  }, [defaultCollapsed]);

  // Remember the last page visited inside each solution, so switching between them keeps your place.
  const search = params.toString();
  useEffect(() => {
    if (!here || !isSolution(here.id)) return;
    const href = path + (search ? `?${search}` : "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- record the visit; the current solution's pages become the open tree
    setLast((m) => {
      if (m[here.id] === href) return m;
      const next = { ...m, [here.id]: href };
      try {
        window.localStorage.setItem(LAST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setOpenPages(here.id);
    setDrawer(false);
  }, [path, search, here]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(KEY, next ? "1" : "0");
    } catch {}
    window.dispatchEvent(new CustomEvent(HEXA_STATE_EVENT, { detail: { collapsed: next } }));
  };

  const outsider = member.party !== "employee";
  const pagesOf = (h: Hexa): HexaPage[] => {
    if (outsider && (h.id === "pmo" || h.id === "communication")) return [];
    if (h.id === "multi-family" && member.party === "tenant")
      return h.pages.filter((p) => !p.group || FAMILIES.some((f) => f.tenantId === member.org && p.href.endsWith(`/${f.id}`)));
    return h.pages;
  };
  // a room opens to its pages, and for people at the firm also to its team channel
  const hasTree = (h: Hexa) => pagesOf(h).length > 0 || (!outsider && !!TEAM_CHANNEL[h.id]);
  const badgeOf = (h: Hexa) => (outsider ? 0 : (h.badge ?? 0));
  const name = (h: Hexa) => (h.firm ? moduleName(brand, h.firm) : h.name);
  const hrefOf = (h: Hexa) => (isSolution(h.id) && last[h.id]) || hexaHref(h, member);
  const solutions = SOLUTIONS.map((s) => ({ ...s, h: list.find((h) => h.id === s.id) })).filter((s): s is (typeof SOLUTIONS)[number] & { h: Hexa } => !!s.h);
  const workspaces = list.filter((h) => !isSolution(h.id));
  const solutionBadge = solutions.reduce((n, s) => n + badgeOf(s.h), 0); // distinct sources, so a plain sum does not double count
  const inSolution = isSolution(here?.id);

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

  /* ───────── pieces ───────── */
  const PageTree = ({ h }: { h: Hexa }) => {
    const pages = pagesOf(h);
    let lastGroup: string | undefined;
    return (
      <ul className="mb-1.5 ml-[30px] mt-0.5 border-l border-d-line-soft pl-1.5">
        {pages.map((p, i) => {
          const on = here?.id === h.id && isPage(h, p, i);
          const head = p.group && p.group !== lastGroup ? p.group : undefined;
          lastGroup = p.group;
          return (
            <li key={p.href}>
              {head && (
                <div role="presentation" className={cx("flex items-center gap-2 px-2 pb-1 text-[12px] font-semibold text-d-text", i === 0 ? "pt-1.5" : "pt-4")}>
                  <span className="shrink-0">{head}</span>
                  <span aria-hidden className="h-px flex-1 bg-d-line-soft" />
                </div>
              )}
              <Link
                href={p.href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "relative flex h-[27px] items-center rounded-[5px] pr-2 text-[12.5px] transition-colors",
                  p.group ? "pl-4" : "pl-2",
                  on ? "bg-d-raise font-medium text-d-text" : "text-d-text-2 hover:bg-d-raise hover:text-d-text",
                )}
              >
                {on && (
                  <span
                    aria-hidden
                    className="absolute -left-[7px] bottom-1.5 top-1.5 w-[2px] rounded-full"
                    style={{ background: isSolution(h.id) ? "var(--tenant-accent)" : h.color }}
                  />
                )}
                <span className="flex-1 truncate">{p.label}</span>
                {!!p.badge && !outsider && <span className="tnum text-[11px] text-d-text-3">{p.badge}</span>}
              </Link>
            </li>
          );
        })}
        {!outsider && TEAM_CHANNEL[h.id] && (
          // the room's own channel in Concourse, for people at the firm
          <li>
            <Link
              href={`/admin/communication?c=${TEAM_CHANNEL[h.id]}`}
              className="flex h-[27px] items-center gap-1.5 rounded-[5px] pl-2 pr-2 text-[12.5px] text-d-text-2 transition-colors hover:bg-d-raise hover:text-d-text"
            >
              <Hash size={12} className="shrink-0 text-d-text-3" />
              <span className="flex-1 truncate">Team channel</span>
            </Link>
          </li>
        )}
      </ul>
    );
  };

  const Row = ({
    active,
    href,
    icon,
    label,
    badge,
    toggle,
    expanded,
    accent,
    indent,
  }: {
    active: boolean;
    href: string;
    icon: ReactNode;
    label: string;
    badge?: number;
    toggle?: () => void;
    expanded?: boolean;
    accent?: string;
    indent?: boolean;
  }) => (
    <div
      className={cx(
        "group relative flex h-9 items-center rounded-[6px] transition-colors",
        active ? "bg-d-raise" : "hover:bg-[color-mix(in_oklab,var(--d-raise)_70%,transparent)]",
        indent && "ml-3",
      )}
    >
      {active && accent && <span aria-hidden className="absolute -left-2 bottom-2 top-2 w-[2px] rounded-full" style={{ background: accent }} />}
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-expanded={toggle ? expanded : undefined}
        onClick={(e) => {
          // The whole row opens and closes its pages: a click on the open, current entry folds it instead of reloading it.
          if (!toggle) return;
          if (expanded && active) e.preventDefault();
          if (expanded ? active : true) toggle();
        }}
        className="flex h-full min-w-0 flex-1 items-center gap-2.5 pl-2.5 pr-1"
      >
        {icon}
        <span className={cx("truncate", active ? "font-semibold text-d-text" : "font-medium text-d-text-2 group-hover:text-d-text")}>{label}</span>
      </Link>
      {!!badge && <span className="tnum mr-1 text-[11.5px] text-d-text-3">{badge}</span>}
      {toggle && (
        <button
          onClick={toggle}
          aria-label={expanded ? `Hide ${label}` : `Show ${label}`}
          aria-expanded={expanded}
          className="mr-1 flex h-6 w-6 items-center justify-center rounded-[5px] text-d-text-3 hover:bg-d-line-soft hover:text-d-text"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
    </div>
  );

  const full = (mode: "inline" | "drawer") => (
    <nav
      aria-label="Hexa Room"
      data-shell="room"
      data-overlay={mode === "drawer" || undefined}
      className={cx("flex w-[248px] shrink-0 flex-col border-r border-d-line bg-d-chrome text-[13px]", mode === "drawer" ? "h-full" : "")}
    >
      {mode === "drawer" && (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-d-line-soft px-4">
          <Link href="/admin" aria-label={`${brand.name} home`}>
            <AurumLogo variant={theme === "dark" ? "white" : "dark"} height={30} />
          </Link>
          <button onClick={() => setDrawer(false)} aria-label="Close navigation" className="flex h-8 w-8 items-center justify-center rounded-[6px] text-d-text-2 hover:bg-d-raise">
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex h-11 items-center gap-2 px-4">
        <span className="text-[12px] font-semibold text-d-text">Hexa Room</span>
        {mode === "inline" && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse the Hexa Room to hexagons"
            title="Collapse"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-[6px] text-d-text-3 hover:bg-d-raise hover:text-d-text"
          >
            <ChevronsLeft size={15} />
          </button>
        )}
      </div>

      <div className="scroll-quiet flex-1 overflow-y-auto px-2 pb-3">
        {solutions.length > 0 && (
          <div className="mb-1">
            <div
              className={cx(
                "group relative flex h-9 items-center rounded-[6px] transition-colors",
                inSolution ? "bg-[color-mix(in_oklab,var(--d-raise)_55%,transparent)]" : "hover:bg-[color-mix(in_oklab,var(--d-raise)_70%,transparent)]",
              )}
            >
              <button onClick={() => setSolutionsOpen((o) => !o)} aria-expanded={solutionsOpen} className="flex min-w-0 flex-1 items-center gap-2.5 pl-2.5 pr-1 text-left">
                <HexGlyph color="var(--tenant-accent)" size={17} active />
                <span className={cx("truncate", inSolution ? "font-semibold text-d-text" : "font-medium text-d-text-2 group-hover:text-d-text")}>Solutions</span>
              </button>
              {!!solutionBadge && <span className="tnum mr-1 text-[11.5px] text-d-text-3">{solutionBadge}</span>}
              <span aria-hidden className="mr-2 text-d-text-3">
                {solutionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </div>
            {solutionsOpen &&
              solutions.map(({ h, Icon }) => {
                const active = here?.id === h.id;
                const tree = openPages === h.id && hasTree(h);
                return (
                  <div key={h.id}>
                    <Row
                      indent
                      active={active}
                      accent="var(--tenant-accent)"
                      href={hrefOf(h)}
                      icon={<Icon size={20} className={active ? "text-d-text" : "text-d-text-2"} />}
                      label={name(h)}
                      badge={badgeOf(h)}
                      toggle={hasTree(h) ? () => setOpenPages((o) => (o === h.id ? null : h.id)) : undefined}
                      expanded={tree}
                    />
                    {tree && <PageTree h={h} />}
                  </div>
                );
              })}
          </div>
        )}
        {workspaces.map((h) => {
          const active = here?.id === h.id;
          const tree = openPages === h.id && hasTree(h);
          return (
            <div key={h.id} className="mb-0.5">
              <Row
                active={active}
                accent={h.color}
                href={hrefOf(h)}
                icon={<HexGlyph color={h.color} size={17} active={active} />}
                label={name(h)}
                badge={badgeOf(h)}
                toggle={hasTree(h) ? () => setOpenPages((o) => (o === h.id ? null : h.id)) : undefined}
                expanded={tree}
              />
              {tree && <PageTree h={h} />}
            </div>
          );
        })}
        {list.length === 0 && <p className="px-3 py-6 text-[12px] leading-relaxed text-d-text-3">No workspaces are open to this role yet. Ask an administrator for access.</p>}
      </div>
    </nav>
  );

  return (
    <>
      {collapsed ? (
        <nav aria-label="Hexa Room" data-shell="room" className="relative hidden w-[56px] shrink-0 flex-col items-center border-r border-d-line bg-d-chrome py-3 md:flex">
          <button
            onClick={toggleCollapsed}
            aria-label="Expand the Hexa Room"
            title="Expand"
            className="mb-2 flex h-8 w-8 items-center justify-center rounded-[6px] text-d-text-3 hover:bg-d-raise hover:text-d-text"
          >
            <ChevronsRight size={15} />
          </button>
          <div className="flex flex-1 flex-col items-center gap-1">
            {solutions.length > 0 && (
              <button
                onClick={() => {
                  setSolutionsOpen(true);
                  toggleCollapsed();
                }}
                aria-label={`Solutions${solutionBadge ? `, ${solutionBadge} to act on` : ""}: open the Hexa Room`}
                title="Solutions"
                aria-current={inSolution ? "page" : undefined}
                className={cx("relative flex h-10 w-10 items-center justify-center rounded-[7px] transition-colors", inSolution ? "bg-d-raise" : "hover:bg-d-raise")}
              >
                {inSolution && <span aria-hidden className="absolute -left-2 bottom-2.5 top-2.5 w-[2px] rounded-full bg-[var(--tenant-accent)]" />}
                <HexGlyph color="var(--tenant-accent)" size={20} active />
                {!!solutionBadge && !inSolution && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--tenant-accent)]" />}
              </button>
            )}
            {solutions.length > 0 && workspaces.length > 0 && <span aria-hidden className="my-1 h-px w-6 bg-d-line" />}
            {workspaces.map((h) => {
              const active = here?.id === h.id;
              return (
                <Link
                  key={h.id}
                  href={hrefOf(h)}
                  title={name(h)}
                  aria-label={`${name(h)}${badgeOf(h) ? `, ${badgeOf(h)} to act on` : ""}`}
                  aria-current={active ? "page" : undefined}
                  className={cx("relative flex h-10 w-10 items-center justify-center rounded-[7px] transition-colors", active ? "bg-d-raise" : "hover:bg-d-raise")}
                >
                  {active && <span aria-hidden className="absolute -left-2 bottom-2.5 top-2.5 w-[2px] rounded-full" style={{ background: h.color }} />}
                  <HexGlyph color={h.color} size={20} active={active} />
                  {!!badgeOf(h) && !active && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: h.color }} />}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : (
        <div className="hidden md:flex">{full("inline")}</div>
      )}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Close navigation" onClick={() => setDrawer(false)} className="absolute inset-0 bg-black/40" />
          <div className="drawer-left absolute inset-y-0 left-0 flex max-w-[86vw]">{full("drawer")}</div>
        </div>
      )}
    </>
  );
}
