"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Bell, ChevronDown, ChevronsLeft, ChevronsRight, LogOut, Menu as MenuIcon, Search, X, type LucideIcon } from "lucide-react";
import { cx } from "@/components/ui";
import { GpLogo, GpMark } from "@/components/brand/GpLogo";
import { useTheme } from "@/components/shell/ThemeProvider";
import { GlobalSearch, type Hit } from "@/components/shell/GlobalSearch";
import { Menu, Segmented, menuHead, menuItem, useDismiss } from "@/components/shell/WorkstationTopBar";
import { readableOn } from "@/lib/brand";
import { inkFor, type GpClient } from "@/lib/gps";
import type { ThemePref } from "@/lib/theme";

export type PortalNav = { href: string; label: string; Icon: LucideIcon; exact?: boolean; badge?: number; children?: { href: string; label: string }[] };
export type PortalNotice = { id: string; title: string; detail: string; href: string };

/**
 * A sponsor-branded portal on the operator's workstation: a 64px header, a side room that collapses to a rail,
 * the matte finish and the Light / Dark preference — in the sponsor's own logo and colours.
 * Used by the manager (GP) portal and the investor (LP) portal.
 */
export function PortalShell({
  gp,
  storageKey,
  room,
  user,
  nav,
  search,
  searchLabel,
  searchPlaceholder,
  notices,
  noticesTitle,
  noticesEmpty,
  accountLinks,
  signOut,
  preview,
  children,
}: {
  gp: GpClient;
  storageKey: string;
  /** the side room's heading, e.g. "Manager portal" or the investing entity */
  room: { title: string; detail?: string };
  user: { name: string; title: string };
  nav: PortalNav[];
  search: Hit[];
  searchLabel: string;
  searchPlaceholder: string;
  notices: PortalNotice[];
  noticesTitle: string;
  noticesEmpty: string;
  accountLinks: { href: string; label: string; Icon: LucideIcon }[];
  signOut: string;
  preview?: boolean;
  children: ReactNode;
}) {
  const path = usePathname();
  const { theme, pref, setPref, motion, setMotion } = useTheme();
  const dark = theme === "dark";
  const wide = !gp.logo || gp.logo.width / gp.logo.height >= 3;
  const home = nav[0].href;
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [open, setOpen] = useState<null | "bell" | "account">(null);
  const close = () => setOpen(null);
  const ref = useDismiss(open !== null, close);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a collapsed room is remembered per browser
      setCollapsed(window.localStorage.getItem(storageKey) === "1");
    } catch {}
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [storageKey]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a page change closes the phone drawer
    setDrawer(false);
  }, [path]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {}
  };

  // The sponsor's colours, made readable for the current theme: the deep primary on porcelain, the lighter secondary on graphite.
  const style = useMemo(() => {
    const { primary, secondary, primaryInk } = gp.brand;
    const v: Record<string, string> = dark
      ? {
          "--tenant-accent": secondary,
          "--d-accent": readableOn(secondary, "#1a2027"),
          "--d-accent-fill": secondary,
          "--d-accent-soft": `color-mix(in srgb, ${secondary} 16%, transparent)`,
          "--brand": secondary,
          "--brand-ink": inkFor(secondary),
        }
      : {
          "--tenant-accent": secondary,
          "--d-accent": readableOn(primary, "#f4f2ee"),
          "--d-accent-fill": primary,
          "--d-accent-soft": `color-mix(in srgb, ${primary} 10%, transparent)`,
          "--brand": primary,
          "--brand-ink": primaryInk,
        };
    return v as CSSProperties;
  }, [gp.brand, dark]);

  const isOn = (n: PortalNav) => (n.exact ? path === n.href : path === n.href || path.startsWith(`${n.href}/`));
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roomNav = (mode: "inline" | "drawer") => (
    <nav
      aria-label={`${gp.shortName} portal`}
      data-shell="room"
      data-overlay={mode === "drawer" || undefined}
      className={cx("flex w-[248px] shrink-0 flex-col border-r border-d-line bg-d-chrome text-[13px]", mode === "drawer" && "h-full")}
    >
      {mode === "drawer" && (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-d-line-soft px-4">
          <GpLogo gp={gp} height={24} tone={dark ? "dark" : "light"} />
          <button onClick={() => setDrawer(false)} aria-label="Close navigation" className="flex h-8 w-8 items-center justify-center rounded-[6px] text-d-text-2 hover:bg-d-raise">
            <X size={16} />
          </button>
        </div>
      )}
      <div className={cx("flex items-center gap-2 px-4", room.detail ? "h-[52px]" : "h-11")}>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[12px] font-semibold text-d-text">{room.title}</span>
          {room.detail && <span className="block truncate text-[11.5px] text-d-text-3">{room.detail}</span>}
        </span>
        {mode === "inline" && (
          <button
            onClick={toggle}
            aria-label="Collapse the navigation"
            title="Collapse"
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-d-text-3 hover:bg-d-raise hover:text-d-text"
          >
            <ChevronsLeft size={15} />
          </button>
        )}
      </div>
      <div className="scroll-quiet flex-1 overflow-y-auto px-2 pb-3">
        {nav.map((n) => {
          const on = isOn(n);
          return (
            <div key={n.href}>
              <Link
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "group relative mb-0.5 flex h-9 items-center gap-2.5 rounded-[6px] px-2.5 transition-colors",
                  on ? "bg-d-raise" : "hover:bg-[color-mix(in_oklab,var(--d-raise)_70%,transparent)]",
                )}
              >
                {on && <span aria-hidden className="absolute -left-2 bottom-2 top-2 w-[2px] rounded-full bg-[var(--d-accent-fill)]" />}
                <n.Icon size={16} strokeWidth={1.7} className={on ? "text-d-text" : "text-d-text-3 group-hover:text-d-text-2"} />
                <span className={cx("flex-1 truncate", on ? "font-semibold text-d-text" : "font-medium text-d-text-2 group-hover:text-d-text")}>{n.label}</span>
                {!!n.badge && <span className="tnum rounded-full bg-d-accent-soft px-1.5 text-[11px] font-semibold text-[var(--d-accent)]">{n.badge}</span>}
              </Link>
              {n.children && n.children.length > 0 && (
                <ul className="mb-1.5 ml-[30px] mt-0.5 border-l border-d-line-soft pl-1.5">
                  {n.children.map((c) => {
                    const here = path === c.href;
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={here ? "page" : undefined}
                          className={cx(
                            "relative flex h-[27px] items-center rounded-[5px] px-2 text-[12.5px] transition-colors",
                            here ? "bg-d-raise font-medium text-d-text" : "text-d-text-2 hover:bg-d-raise hover:text-d-text",
                          )}
                        >
                          {here && <span aria-hidden className="absolute -left-[7px] bottom-1.5 top-1.5 w-[2px] rounded-full bg-[var(--d-accent-fill)]" />}
                          <span className="truncate">{c.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-d-line-soft px-4 py-3">
        <p className="text-[11px] leading-snug text-d-text-3">
          Administered by <span className="font-serif font-semibold tracking-[0.12em] text-d-text-2">AURUM</span> Asset Management
        </p>
        {preview && <div className="mt-1 text-[11px] text-d-text-3">Preview data</div>}
      </div>
    </nav>
  );

  return (
    <div className="ws ws-bridge relative flex h-dvh flex-col bg-d-bg" data-finish="arch" style={style}>
      <div aria-hidden className="ws-light-layer" />
      <div className="ws-stage flex min-h-0 flex-1 flex-col">
        <header ref={ref} data-shell="header" className="relative z-40 flex h-[64px] shrink-0 items-center gap-3 border-b border-d-line bg-d-chrome pl-4 pr-4 text-[13.5px]">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-[6px] text-d-text-2 hover:bg-d-raise md:hidden"
          >
            <MenuIcon size={18} />
          </button>
          <Link
            href={home}
            aria-label={`${gp.shortName} home`}
            className={cx("flex h-10 shrink-0 items-center rounded-[4px] outline-offset-2", collapsed ? "md:-ml-4 md:w-[56px] md:justify-center" : "md:w-[232px] md:pl-1")}
          >
            {collapsed ? (
              <>
                <span className="max-md:hidden">
                  <GpMark gp={gp} size={28} tone={dark ? "dark" : "light"} />
                </span>
                <span className="md:hidden">
                  <GpLogo gp={gp} height={26} tone={dark ? "dark" : "light"} />
                </span>
              </>
            ) : (
              <GpLogo gp={gp} height={wide ? 30 : 40} tone={dark ? "dark" : "light"} />
            )}
          </Link>

          <div className="flex-1" />
          <button
            onClick={() => setSearchOpen(true)}
            data-shell="search"
            className="flex h-10 w-full min-w-0 max-w-[600px] items-center gap-2.5 rounded-full border border-d-line bg-[color-mix(in_oklab,var(--d-surface)_70%,transparent)] px-4 text-left text-d-text-3 hover:border-d-line-strong max-sm:hidden"
            aria-label={searchLabel}
          >
            <Search size={16} className="shrink-0" />
            <span className="truncate text-[14px]">{searchLabel}</span>
            <kbd className="ml-auto hidden shrink-0 whitespace-nowrap rounded-[4px] border border-d-line px-1.5 font-sans text-[11px] text-d-text-3 sm:inline">Ctrl K</kbd>
          </button>
          <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} index={search} placeholder={searchPlaceholder} />
          <div className="flex-1" />

          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-[6px] text-d-text-2 hover:bg-d-raise hover:text-d-text sm:hidden"
          >
            <Search size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setOpen((o) => (o === "bell" ? null : "bell"))}
              aria-label={`${noticesTitle}, ${notices.length}`}
              aria-expanded={open === "bell"}
              className="relative flex h-10 items-center gap-2 rounded-[8px] px-2.5 text-d-text-2 hover:bg-d-raise hover:text-d-text"
            >
              <Bell size={19} />
              {notices.length > 0 && (
                <>
                  <span className="tnum whitespace-nowrap rounded-[6px] bg-d-raise px-1.5 py-0.5 text-[11.5px] font-semibold text-d-text max-md:hidden">{notices.length} new</span>
                  <span className="tnum absolute right-0.5 top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-d-text px-1 text-[9.5px] font-semibold text-d-bg md:hidden">
                    {notices.length}
                  </span>
                </>
              )}
            </button>
            {open === "bell" && (
              <Menu className="right-0 top-10 w-[340px] max-w-[calc(100vw-24px)]">
                <div className={menuHead}>{noticesTitle}</div>
                {notices.length === 0 && <div className="px-2.5 py-6 text-center text-d-text-3">{noticesEmpty}</div>}
                {notices.map((a) => (
                  <Link key={a.id} href={a.href} onClick={close} className="block rounded-[4px] px-2.5 py-2 hover:bg-d-raise">
                    <div className="font-medium text-d-text">{a.title}</div>
                    <div className="mt-0.5 text-[11.5px] text-d-text-3">{a.detail}</div>
                  </Link>
                ))}
              </Menu>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpen((o) => (o === "account" ? null : "account"))}
              aria-label={`Account: ${user.name}`}
              aria-expanded={open === "account"}
              className="flex items-center gap-2 rounded-full p-0.5 pr-1.5 hover:bg-d-raise"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-d-line-strong bg-d-raise text-[12.5px] font-semibold">{initials}</span>
              <span className="hidden max-w-[180px] text-left leading-tight xl:block">
                <span className="block truncate text-[12.5px] font-semibold text-d-text">{user.name}</span>
                <span className="block truncate text-[11px] text-d-text-3">{user.title}</span>
              </span>
              <ChevronDown size={13} className="text-d-text-3" />
            </button>
            {open === "account" && (
              <Menu className="right-0 top-10 w-[270px]">
                <div className="flex items-center gap-2.5 px-2.5 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-d-line-strong bg-d-raise text-[11.5px] font-semibold">{initials}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{user.name}</span>
                    <span className="block truncate text-[11.5px] text-d-text-3">{user.title}</span>
                  </span>
                </div>
                <div className="mx-1 my-1 h-px bg-d-line-soft" />
                <div className={menuHead}>Appearance</div>
                <div className="px-2 pb-2">
                  <Segmented<ThemePref>
                    label="Appearance"
                    value={pref}
                    onChange={setPref}
                    options={[
                      { v: "light", label: "Light" },
                      { v: "dark", label: "Dark" },
                      { v: "system", label: "System" },
                    ]}
                  />
                </div>
                <div className={menuHead}>Motion</div>
                <div className="px-2 pb-2">
                  <Segmented<"auto" | "off">
                    label="Motion"
                    value={motion}
                    onChange={setMotion}
                    options={[
                      { v: "auto", label: "On" },
                      { v: "off", label: "Off" },
                    ]}
                  />
                </div>
                <div className="mx-1 my-1 h-px bg-d-line-soft" />
                {accountLinks.map((l) => (
                  <Link key={l.href} href={l.href} onClick={close} className={menuItem}>
                    <l.Icon size={15} className="text-d-text-2" /> {l.label}
                  </Link>
                ))}
                <Link href={signOut} onClick={close} className={menuItem}>
                  <LogOut size={15} className="text-d-text-2" /> Sign out
                </Link>
              </Menu>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {collapsed ? (
            <nav aria-label={`${gp.shortName} portal`} data-shell="room" className="hidden w-[56px] shrink-0 flex-col items-center border-r border-d-line bg-d-chrome py-3 md:flex">
              <button
                onClick={toggle}
                aria-label="Expand the navigation"
                title="Expand"
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-[6px] text-d-text-3 hover:bg-d-raise hover:text-d-text"
              >
                <ChevronsRight size={15} />
              </button>
              <div className="flex flex-col items-center gap-1">
                {nav.map((n) => {
                  const on = isOn(n);
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      title={n.label}
                      aria-label={`${n.label}${n.badge ? `, ${n.badge} waiting` : ""}`}
                      aria-current={on ? "page" : undefined}
                      className={cx(
                        "relative flex h-10 w-10 items-center justify-center rounded-[7px] transition-colors",
                        on ? "bg-d-raise text-d-text" : "text-d-text-3 hover:bg-d-raise hover:text-d-text",
                      )}
                    >
                      {on && <span aria-hidden className="absolute -left-2 bottom-2.5 top-2.5 w-[2px] rounded-full bg-[var(--d-accent-fill)]" />}
                      <n.Icon size={18} strokeWidth={1.7} />
                      {!!n.badge && !on && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--d-accent-fill)]" />}
                    </Link>
                  );
                })}
              </div>
            </nav>
          ) : (
            <div className="hidden md:flex">{roomNav("inline")}</div>
          )}
          {drawer && (
            <div className="fixed inset-0 z-50 md:hidden">
              <button aria-label="Close navigation" onClick={() => setDrawer(false)} className="absolute inset-0 bg-black/40" />
              <div className="drawer-left absolute inset-y-0 left-0 flex max-w-[86vw]">{roomNav("drawer")}</div>
            </div>
          )}
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
